import { useMemo, useState } from "react";
import {
  BOOKING_STATUS_OPTIONS,
  getBookingStatusClass,
  getBookingStatusLabel
} from "../utils/bookingStatus";
import { useEffect } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const bookingSortOptions = [
  { value: "newest", label: "Ngày mới nhất" },
  { value: "oldest", label: "Ngày cũ nhất" }
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

function createInlineDraft(booking) {
  return {
    customerName: booking.customerName ?? "",
    phoneNumber: booking.phoneNumber ?? "",
    pickupLocation: booking.pickupLocation ?? "",
    dropoffLocation: booking.dropoffLocation ?? "",
    tripDate: toDateTimeInputValue(booking.tripDate),
    note: booking.note ?? "",
    status: booking.status ?? "new"
  };
}

export default function BookingsTab({
  bookings,
  highlightedBookingIds,
  bookingStatusFilter,
  handleBookingStatusFilterChange,
  handleInlineUpdateBooking,
  handleDeleteBooking,
  handleCreateScheduleFromBooking
}) {
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineDraft, setInlineDraft] = useState(null);
  const [savingInlineId, setSavingInlineId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBookings = useMemo(
    () =>
      bookingStatusFilter === "all"
        ? bookings
        : bookings.filter((booking) => booking.status === bookingStatusFilter),
    [bookingStatusFilter, bookings]
  );
  const visibleBookings = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const matchedItems = filteredBookings.filter((booking) => {
      if (!search) return true;

      const content = [
        booking.customerName,
        booking.phoneNumber,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.note
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

  useEffect(() => {
    setCurrentPage(1);
  }, [bookingStatusFilter, searchQuery, sortOrder]);

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

  return (
    <section className="admin-card mt-8 rounded-[1.25rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Quản lý booking</h3>
          <p className="mt-2 text-sm text-admin-steel">
            Lọc theo trạng thái để theo dõi và xử lý yêu cầu khách hàng nhanh hơn.
          </p>
        </div>
        <span className="admin-pill bg-slate-100 text-slate-700">{visibleBookings.length} mục</span>
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
              placeholder="Tên khách, số điện thoại, lộ trình..."
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
                        className="admin-select w-full sm:w-44"
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
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

                    <div className="rounded-[1rem] bg-white px-4 py-3 md:col-span-2 xl:col-span-2">
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
                  </div>

                  <textarea
                    className="admin-field admin-textarea mt-4"
                    name="note"
                    value={inlineDraft.note}
                    onChange={handleInlineFieldChange}
                    placeholder="Ghi chú booking"
                  />
                </>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1rem] bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Liên hệ
                      </p>
                      <p className="mt-2 text-sm font-semibold text-admin-ink">
                        {booking.phoneNumber || "Chưa ghi số điện thoại"}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white px-4 py-3">
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
                  </div>

                  {booking.note ? (
                    <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">
                      {booking.note}
                    </p>
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
            Không có booking nào trong trạng thái này.
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
  );
}
