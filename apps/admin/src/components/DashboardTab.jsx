import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";
import QuickActions from "./QuickActions";

const WEEKDAY_LABELS = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarStart(date) {
  const firstDay = startOfMonth(date);
  const weekday = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildCalendarDays(baseDate) {
  const start = getCalendarStart(baseDate);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function DashboardTab({
  stats,
  bookings,
  scheduleNotes,
  handleOpenVehicleCategories,
  handleOpenVehicles,
  handleOpenBookings,
  handleOpenScheduleNotes,
  handleOpenVehicleMaintenances
}) {
  const today = new Date();
  const monthLabel = today.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric"
  });
  const calendarDays = buildCalendarDays(today);
  const currentMonth = today.getMonth();
  const calendarMap = (scheduleNotes ?? []).reduce((accumulator, note) => {
    if (!note.tripDate) return accumulator;
    const key = formatDayKey(new Date(note.tripDate));
    accumulator[key] = [...(accumulator[key] ?? []), note].sort(
      (left, right) => new Date(left.tripDate).getTime() - new Date(right.tripDate).getTime()
    );
    return accumulator;
  }, {});

  return (
    <>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="admin-card admin-kpi rounded-[1.25rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
              {item.label}
            </p>
            <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{item.value}</p>
          </div>
        ))}
      </section>

      <QuickActions
        handleOpenVehicleCategories={handleOpenVehicleCategories}
        handleOpenVehicles={handleOpenVehicles}
        handleOpenBookings={handleOpenBookings}
        handleOpenScheduleNotes={handleOpenScheduleNotes}
        handleOpenVehicleMaintenances={handleOpenVehicleMaintenances}
      />

      <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Lịch xe tháng này</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Theo dõi nhanh xe đã đặt theo từng ngày để điều phối dễ hơn.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-admin-accent">
                Tháng hiện tại
              </p>
              <p className="mt-2 text-lg font-extrabold capitalize text-admin-ink">{monthLabel}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-[0.9rem] bg-slate-100 px-3 py-3 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((date) => {
              const dayKey = formatDayKey(date);
              const dayNotes = calendarMap[dayKey] ?? [];
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = formatDayKey(date) === formatDayKey(today);
              return (
                <div
                  key={dayKey}
                  className={`min-h-[148px] rounded-[1rem] border px-3 py-3 ${
                    isCurrentMonth
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50/70 text-slate-400"
                  } ${isToday ? "ring-2 ring-emerald-200" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-admin-ink">{date.getDate()}</span>
                    {dayNotes.length ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                        {dayNotes.length} lịch
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayNotes.slice(0, 2).map((note) => (
                      <div
                        key={note.id}
                        className="rounded-[0.85rem] bg-slate-50 px-2.5 py-2 text-xs text-admin-steel"
                      >
                        <p className="font-bold text-admin-ink">{note.vehicle?.name ?? "Chưa gán xe"}</p>
                        <p className="mt-1 line-clamp-1">{note.title}</p>
                        <p className="mt-1 text-[11px]">{formatDateTime(note.tripDate)}</p>
                      </div>
                    ))}
                    {dayNotes.length > 2 ? (
                      <button
                        type="button"
                        onClick={handleOpenScheduleNotes}
                        className="text-xs font-bold text-admin-accent"
                      >
                        Xem thêm {dayNotes.length - 2} lịch
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card rounded-[1.25rem] p-6">
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Yêu cầu gần đây</h3>
            <div className="mt-6 overflow-hidden rounded-[1rem] border border-slate-200">
              <div className="hidden grid-cols-[minmax(0,1fr)_180px_minmax(0,1.2fr)_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                <div>Khách</div>
                <div>Điện thoại</div>
                <div>Lộ trình</div>
                <div>Trạng thái</div>
              </div>
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-4 border-b border-slate-200 bg-white px-5 py-5 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1.2fr)_140px] lg:items-center"
                >
                  <div>
                    <p className="text-lg font-extrabold text-admin-ink">{booking.customerName}</p>
                  </div>
                  <div className="text-sm font-semibold text-admin-steel">{booking.phoneNumber}</div>
                  <div className="text-sm text-admin-steel">
                    {booking.pickupLocation} - {booking.dropoffLocation}
                  </div>
                  <span className={`admin-pill w-fit ${getBookingStatusClass(booking.status)}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                </div>
              ))}
              {!bookings.length ? (
                <div className="px-5 py-10 text-center text-sm text-admin-steel">
                  Chưa có booking nào.
                </div>
              ) : null}
            </div>
          </div>

          <div className="admin-card rounded-[1.25rem] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">
              Trạng thái hệ thống
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-admin-steel">Backend API</p>
                <p className="mt-2 text-2xl font-extrabold text-admin-ink">Sẵn sàng</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-admin-steel">Public site</p>
                <p className="mt-2 text-2xl font-extrabold text-admin-ink">Kết nối dữ liệu</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-admin-steel">Lịch xe</p>
                <button
                  type="button"
                  onClick={handleOpenScheduleNotes}
                  className="mt-2 text-left text-2xl font-extrabold text-admin-ink"
                >
                  Mở lịch vận hành
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
