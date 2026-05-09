import { useEffect, useMemo, useState } from "react";
import {
  BOOKING_STATUS_OPTIONS,
  getBookingStatusClass,
  getBookingStatusLabel
} from "../utils/bookingStatus";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const bookingSortOptions = [
  { value: "newest", label: "Ngày mới nhất" },
  { value: "oldest", label: "Ngày cũ nhất" }
];

const assignmentFilterOptions = [
  { value: "all", label: "Tất cả phân công" },
  { value: "unassigned", label: "Chưa phân công" },
  { value: "partial", label: "Thiếu phân công" },
  { value: "assigned", label: "Đã gán đủ" }
];

function formatDateTime(value) {
  if (!value) return "Chưa có thời gian";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toDateTimeInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function toDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function matchesAssignmentFilter(booking, filterValue) {
  if (filterValue === "all") return true;
  if (filterValue === "unassigned") return !booking.assignedVehicleId && !booking.assignedDriverId;
  if (filterValue === "partial") {
    return Boolean(booking.assignedVehicleId || booking.assignedDriverId) &&
      !(booking.assignedVehicleId && booking.assignedDriverId);
  }
  if (filterValue === "assigned") return Boolean(booking.assignedVehicleId && booking.assignedDriverId);
  return true;
}

function createInlineDraft(booking) {
  return {
    customerName: booking.customerName ?? "",
    phoneNumber: booking.phoneNumber ?? "",
    pickupLocation: booking.pickupLocation ?? "",
    dropoffLocation: booking.dropoffLocation ?? "",
    tripDate: toDateTimeInputValue(booking.tripDate),
    note: booking.note ?? "",
    internalNote: booking.internalNote ?? "",
    cancelReason: booking.cancelReason ?? "",
    status: booking.status ?? "new",
    assignedVehicleId: booking.assignedVehicleId ?? "",
    assignedDriverId: booking.assignedDriverId ?? ""
  };
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalizedValue}"`;
}

function downloadCsv(filename, rows) {
  const csvContent = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BookingsTab({
  bookings,
  vehicles,
  drivers,
  highlightedBookingIds,
  bookingStatusFilter,
  handleBookingStatusFilterChange,
  handleInlineUpdateBooking,
  handleDeleteBooking
}) {
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineDraft, setInlineDraft] = useState(null);
  const [savingInlineId, setSavingInlineId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [tripDateFilter, setTripDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (bookingStatusFilter !== "all" && booking.status !== bookingStatusFilter) {
        return false;
      }

      if (!matchesAssignmentFilter(booking, assignmentFilter)) {
        return false;
      }

      if (tripDateFilter && toDateKey(booking.tripDate) !== tripDateFilter) {
        return false;
      }

      return true;
    });
  }, [assignmentFilter, bookingStatusFilter, bookings, tripDateFilter]);

  const visibleBookings = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const matchedItems = filteredBookings.filter((booking) => {
      if (!search) return true;

      const content = [
        booking.customerName,
        booking.phoneNumber,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.note,
        booking.internalNote,
        booking.assignedVehicle?.name,
        booking.assignedDriver?.fullName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return content.includes(search);
    });

    return [...matchedItems].sort((left, right) => {
      const leftTime = new Date(left.tripDate ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.tripDate ?? right.createdAt ?? 0).getTime();
      return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [filteredBookings, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE));
  const paginatedBookings = useMemo(
    () => getPageSlice(visibleBookings, currentPage, PAGE_SIZE),
    [currentPage, visibleBookings]
  );

  const assignedCount = useMemo(
    () => bookings.filter((booking) => booking.assignedVehicleId && booking.assignedDriverId).length,
    [bookings]
  );
  const pendingCount = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !booking.assignedVehicleId ||
          !booking.assignedDriverId ||
          ["new", "contacted", "called_back", "confirmed"].includes(booking.status)
      ).length,
    [bookings]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [assignmentFilter, bookingStatusFilter, searchQuery, sortOrder, tripDateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleInlineFieldChange(event) {
    const { name, value } = event.target;
    setInlineDraft((current) => (current ? { ...current, [name]: value } : current));
  }

  function startInlineEdit(booking) {
    setInlineEditingId(booking.id);
    setInlineDraft(createInlineDraft(booking));
  }

  function cancelInlineEdit() {
    setInlineEditingId("");
    setInlineDraft(null);
  }

  async function saveInlineEdit(bookingId) {
    if (!inlineDraft) return;

    setSavingInlineId(bookingId);
    try {
      await handleInlineUpdateBooking(bookingId, inlineDraft);
      cancelInlineEdit();
    } finally {
      setSavingInlineId("");
    }
  }

  function handleExportCsv() {
    const rows = [
      [
        "Khach hang",
        "So dien thoai",
        "Ngay di",
        "Trang thai",
        "Phan cong",
        "Xe",
        "Tai xe",
        "Diem don",
        "Diem tra",
        "Ghi chu khach",
        "Ghi chu noi bo",
        "Ly do huy"
      ],
      ...visibleBookings.map((booking) => [
        booking.customerName,
        booking.phoneNumber,
        formatDateTime(booking.tripDate),
        getBookingStatusLabel(booking.status),
        matchesAssignmentFilter(booking, "assigned")
          ? "Da gan du"
          : matchesAssignmentFilter(booking, "partial")
            ? "Thieu phan cong"
            : "Chua phan cong",
        booking.assignedVehicle?.name,
        booking.assignedDriver?.fullName,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.note,
        booking.internalNote,
        booking.cancelReason
      ])
    ];

    downloadCsv(`booking-${tripDateFilter || "all"}-${Date.now()}.csv`, rows);
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng booking
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{bookings.length}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang hiển thị
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{visibleBookings.length}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đã gán đủ
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{assignedCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Cần xử lý
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{pendingCount}</p>
        </div>
      </div>

      <section className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Quản lý booking</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Lọc theo trạng thái, ngày đi, phân công xe và tài xế ngay trong một màn hình.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="admin-pill bg-slate-100 text-slate-700">{visibleBookings.length} mục</span>
            <button type="button" className="admin-button-ghost" onClick={handleExportCsv}>
              Xuất CSV
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_200px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Trạng thái</span>
              <select
                className="admin-select"
                value={bookingStatusFilter}
                onChange={(event) => handleBookingStatusFilterChange(event.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                {BOOKING_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tìm kiếm</span>
              <input
                className="admin-field"
                placeholder="Tên khách, số điện thoại, lộ trình, tài xế..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Sắp xếp</span>
              <select
                className="admin-select"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                {bookingSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[220px_220px_minmax(0,1fr)] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Phân công</span>
              <select
                className="admin-select"
                value={assignmentFilter}
                onChange={(event) => setAssignmentFilter(event.target.value)}
              >
                {assignmentFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ngày đi</span>
              <input
                className="admin-field"
                type="date"
                value={tripDateFilter}
                onChange={(event) => setTripDateFilter(event.target.value)}
              />
            </label>

            {(searchQuery || bookingStatusFilter !== "all" || assignmentFilter !== "all" || tripDateFilter) ? (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button
                  type="button"
                  className="admin-button-ghost"
                  onClick={() => {
                    handleBookingStatusFilterChange("all");
                    setSearchQuery("");
                    setSortOrder("newest");
                    setAssignmentFilter("all");
                    setTripDateFilter("");
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {paginatedBookings.map((booking) => {
            const isInlineEditing = inlineEditingId === booking.id && inlineDraft;

            return (
              <div
                key={booking.id}
                className={`rounded-[1.25rem] border p-5 ${
                  highlightedBookingIds?.includes(booking.id)
                    ? "admin-booking-highlight border-amber-200 bg-amber-50/80"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {isInlineEditing ? (
                        <input
                          className="admin-field min-w-[18rem] flex-1"
                          name="customerName"
                          value={inlineDraft.customerName}
                          onChange={handleInlineFieldChange}
                          placeholder="Tên khách"
                        />
                      ) : (
                        <p className="text-lg font-extrabold text-admin-ink">{booking.customerName}</p>
                      )}
                      {isInlineEditing ? (
                        <select
                          className="admin-select w-full sm:w-52"
                          name="status"
                          value={inlineDraft.status}
                          onChange={handleInlineFieldChange}
                        >
                          {BOOKING_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">
                      {formatDateTime(isInlineEditing ? inlineDraft.tripDate : booking.tripDate)}
                    </p>
                    {!isInlineEditing ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Tạo lúc: {formatDateTime(booking.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {isInlineEditing ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Liên hệ
                        </p>
                        <div className="mt-3 space-y-3">
                          <input
                            className="admin-field"
                            name="phoneNumber"
                            value={inlineDraft.phoneNumber}
                            onChange={handleInlineFieldChange}
                            placeholder="Số điện thoại"
                          />
                          <input
                            className="admin-field"
                            type="datetime-local"
                            name="tripDate"
                            value={inlineDraft.tripDate}
                            onChange={handleInlineFieldChange}
                          />
                        </div>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3 md:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Lộ trình
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input
                            className="admin-field"
                            name="pickupLocation"
                            value={inlineDraft.pickupLocation}
                            onChange={handleInlineFieldChange}
                            placeholder="Điểm đón"
                          />
                          <input
                            className="admin-field"
                            name="dropoffLocation"
                            value={inlineDraft.dropoffLocation}
                            onChange={handleInlineFieldChange}
                            placeholder="Điểm trả"
                          />
                        </div>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Gán điều phối
                        </p>
                        <div className="mt-3 space-y-3">
                          <select
                            className="admin-select"
                            name="assignedVehicleId"
                            value={inlineDraft.assignedVehicleId}
                            onChange={handleInlineFieldChange}
                          >
                            <option value="">Chưa gán xe</option>
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="admin-select"
                            name="assignedDriverId"
                            value={inlineDraft.assignedDriverId}
                            onChange={handleInlineFieldChange}
                          >
                            <option value="">Chưa gán tài xế</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      <textarea
                        className="admin-field admin-textarea"
                        name="note"
                        value={inlineDraft.note}
                        onChange={handleInlineFieldChange}
                        placeholder="Ghi chú booking"
                      />
                      <textarea
                        className="admin-field admin-textarea"
                        name="internalNote"
                        value={inlineDraft.internalNote}
                        onChange={handleInlineFieldChange}
                        placeholder="Ghi chú nội bộ điều hành"
                      />
                    </div>

                    {inlineDraft.status === "canceled" || inlineDraft.status === "cancelled" ? (
                      <textarea
                        className="admin-field admin-textarea mt-4"
                        name="cancelReason"
                        value={inlineDraft.cancelReason}
                        onChange={handleInlineFieldChange}
                        placeholder="Lý do hủy"
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Liên hệ
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">
                          {booking.phoneNumber || "Chưa ghi số điện thoại"}
                        </p>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3 md:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Lộ trình
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">
                          {booking.pickupLocation || "Chưa có điểm đón"}
                        </p>
                        <p className="mt-1 text-sm text-admin-steel">
                          {booking.dropoffLocation || "Chưa có điểm trả"}
                        </p>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Phân công
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">
                          {booking.assignedVehicle?.name || "Chưa gán xe"}
                        </p>
                        <p className="mt-1 text-sm text-admin-steel">
                          {booking.assignedDriver?.fullName || "Chưa gán tài xế"}
                        </p>
                      </div>
                    </div>

                    {booking.note ? (
                      <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">
                        {booking.note}
                      </p>
                    ) : null}

                    {booking.internalNote ? (
                      <p className="mt-3 rounded-[0.9rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {booking.internalNote}
                      </p>
                    ) : null}

                    {booking.cancelReason ? (
                      <p className="mt-3 rounded-[0.9rem] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        Lý do hủy: {booking.cancelReason}
                      </p>
                    ) : null}

                    {booking.statusHistory?.length ? (
                      <div className="mt-4 rounded-[1rem] bg-white px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Lịch sử trạng thái
                        </p>
                        <div className="mt-3 space-y-2">
                          {booking.statusHistory.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-b-0 last:pb-0"
                            >
                              <div>
                                <span className="font-semibold text-admin-ink">
                                  {item.fromStatus ? getBookingStatusLabel(item.fromStatus) : "Khởi tạo"}
                                </span>
                                <span className="mx-2 text-slate-300">→</span>
                                <span className="font-semibold text-admin-ink">
                                  {getBookingStatusLabel(item.toStatus)}
                                </span>
                                {item.note ? <p className="mt-1 text-admin-steel">{item.note}</p> : null}
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                <p>{formatDateTime(item.createdAt)}</p>
                                <p>{item.changedByAdmin?.fullName || "Hệ thống"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      isInlineEditing ? saveInlineEdit(booking.id) : startInlineEdit(booking)
                    }
                    className="admin-button-secondary"
                    disabled={savingInlineId === booking.id}
                  >
                    {isInlineEditing
                      ? savingInlineId === booking.id
                        ? "Đang lưu..."
                        : "Lưu"
                      : "Sửa"}
                  </button>
                  {isInlineEditing ? (
                    <button
                      type="button"
                      onClick={cancelInlineEdit}
                      className="admin-button-ghost"
                      disabled={savingInlineId === booking.id}
                    >
                      Hủy
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="admin-button-danger"
                    disabled={savingInlineId === booking.id}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}

          {!visibleBookings.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Không có booking nào khớp với bộ lọc hiện tại.
            </div>
          ) : null}
        </div>

        <AdminPagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={visibleBookings.length}
          itemLabel="booking"
        />
      </section>
    </section>
  );
}
