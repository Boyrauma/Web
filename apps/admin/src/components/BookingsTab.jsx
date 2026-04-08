import {
  BOOKING_STATUS_OPTIONS,
  getBookingStatusClass,
  getBookingStatusLabel
} from "../utils/bookingStatus";

export default function BookingsTab({
  bookings,
  highlightedBookingIds,
  bookingStatusFilter,
  handleBookingStatusFilterChange,
  handleBookingStatusChange,
  handleDeleteBooking,
  handleCreateScheduleFromBooking
}) {
  const filteredBookings =
    bookingStatusFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === bookingStatusFilter);

  return (
    <section className="admin-card mt-8 rounded-[1.25rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Quản lý booking</h3>
          <p className="mt-2 text-sm text-admin-steel">
            Lọc theo trạng thái để theo dõi và xử lý yêu cầu khách hàng nhanh hơn.
          </p>
        </div>
        <select
          className="admin-select max-w-64"
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
      </div>

      <div className="mt-6 overflow-hidden rounded-[1rem] border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1.1fr)_180px_minmax(0,1.2fr)_360px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 xl:grid">
          <div>Khách hàng</div>
          <div>Điện thoại</div>
          <div>Lộ trình</div>
          <div>Xử lý</div>
        </div>
        <div className="space-y-0">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className={`border-b border-slate-200 px-5 py-5 last:border-b-0 ${
                highlightedBookingIds?.includes(booking.id)
                  ? "admin-booking-highlight bg-amber-50/80"
                  : "bg-white"
              }`}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_180px_minmax(0,1.2fr)_360px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-extrabold text-admin-ink">{booking.customerName}</p>
                    <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                  </div>
                  {booking.note ? (
                    <p className="mt-3 rounded-[0.9rem] bg-slate-50 px-4 py-3 text-sm text-admin-steel">
                      {booking.note}
                    </p>
                  ) : null}
                </div>

                <div className="text-sm font-semibold text-admin-steel">{booking.phoneNumber}</div>

                <div className="min-w-0">
                  <p className="mt-2 text-sm leading-7 text-admin-steel">
                    {booking.pickupLocation} - {booking.dropoffLocation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <select
                    className="admin-select min-w-48"
                    value={booking.status}
                    onChange={(event) => handleBookingStatusChange(booking.id, event.target.value)}
                  >
                    {BOOKING_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateScheduleFromBooking(booking)}
                    className="admin-button-secondary"
                  >
                    Tạo lịch xe
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="admin-button-danger"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!filteredBookings.length ? (
          <div className="px-5 py-10 text-center text-sm text-admin-steel">
            Không có booking nào trong trạng thái này.
          </div>
        ) : null}
      </div>
    </section>
  );
}
