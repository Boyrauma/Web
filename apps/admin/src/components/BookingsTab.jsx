import { useState } from "react";
import {
  BOOKING_STATUS_OPTIONS,
  getBookingStatusClass,
  getBookingStatusLabel
} from "../utils/bookingStatus";
import AdminPagination from "./AdminPagination";

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
    status: booking.status === "contacted" ? "called_back" : booking.status === "cancelled" ? "canceled" : booking.status ?? "new",
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
  bookingQuery,
  bookingPageData,
  bookingPageLoading,
  onBookingQueryChange,
  handleBookingStatusFilterChange,
  fetchAllFilteredBookings,
  handleBookingStatusChange,
  handleInlineUpdateBooking,
  handleDeleteBooking
}) {
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineDraft, setInlineDraft] = useState(null);
  const [savingInlineId, setSavingInlineId] = useState("");
  const visibleBookings = bookings;
  const paginatedBookings = bookings;
  const totalFilteredBookings = bookingPageData.total;

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

  async function handleExportCsv() {
    const exportBookings = await fetchAllFilteredBookings();
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
      ...exportBookings.map((booking) => [
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

    downloadCsv(`booking-${bookingQuery.tripDate || "all"}-${Date.now()}.csv`, rows);
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng đơn đặt xe
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{bookingPageData.allTotal}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang hiển thị
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{totalFilteredBookings}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đã gán đủ
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{bookingPageData.assignedCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Cần xử lý
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{bookingPageData.pendingCount}</p>
        </div>
      </div>

      <section className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Quản lý đơn đặt xe</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Lọc theo trạng thái, ngày đi, phân công xe và tài xế ngay trong một màn hình.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="admin-pill bg-slate-100 text-slate-700">{totalFilteredBookings} mục</span>
            <button type="button" className="admin-button-ghost" onClick={() => void handleExportCsv()} disabled={bookingPageLoading}>
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
                value={bookingQuery.search}
                onChange={(event) => onBookingQueryChange("search", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Sắp xếp</span>
              <select
                className="admin-select"
                value={bookingQuery.sort}
                onChange={(event) => onBookingQueryChange("sort", event.target.value)}
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
                value={bookingQuery.assignment}
                onChange={(event) => onBookingQueryChange("assignment", event.target.value)}
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
                value={bookingQuery.tripDate}
                onChange={(event) => onBookingQueryChange("tripDate", event.target.value)}
              />
            </label>

            {(bookingQuery.search || bookingStatusFilter !== "all" || bookingQuery.assignment !== "all" || bookingQuery.tripDate) ? (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button
                  type="button"
                  className="admin-button-ghost"
                  onClick={() => {
                    handleBookingStatusFilterChange("all");
                    onBookingQueryChange("reset");
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {bookingPageLoading ? <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải đơn đặt xe…</p> : null}
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
                        placeholder="Ghi chú đơn đặt xe"
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
                  {!isInlineEditing && (booking.status === "new" || booking.status === "contacted" || booking.status === "called_back") ? (
                    <button
                      type="button"
                      onClick={() => handleBookingStatusChange(booking.id, booking.status === "new" ? "called_back" : "confirmed")}
                      className="admin-button-primary"
                      disabled={savingInlineId === booking.id}
                    >
                      {booking.status === "new" ? "Đánh dấu đã liên hệ" : "Xác nhận đơn"}
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

          {!visibleBookings.length && !bookingPageLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Không có đơn đặt xe nào khớp với bộ lọc hiện tại.
            </div>
          ) : null}
        </div>

        <AdminPagination
          currentPage={bookingPageData.page}
          onPageChange={(page) => onBookingQueryChange("page", page)}
          totalItems={totalFilteredBookings}
          itemLabel="đơn đặt xe"
        />
      </section>
    </section>
  );
}
