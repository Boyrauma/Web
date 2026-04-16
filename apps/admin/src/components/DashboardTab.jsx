import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

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
  if (!value) return "Chưa có thời gian";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildCalendarMap(scheduleNotes = [], bookings = []) {
  const map = {};

  for (const note of scheduleNotes) {
    if (!note.tripDate) continue;
    const key = formatDayKey(new Date(note.tripDate));
    map[key] = [
      ...(map[key] ?? []),
      {
        id: `schedule-${note.id}`,
        kind: "schedule",
        tripDate: note.tripDate,
        title: note.title || "Lịch xe",
        subtitle: note.vehicle?.name ?? note.customerName ?? "Chưa gán xe",
        detail: note.customerName || note.phoneNumber || note.pickupLocation || "Lịch vận hành"
      }
    ];
  }

  for (const booking of bookings) {
    if (!booking.tripDate) continue;
    const key = formatDayKey(new Date(booking.tripDate));
    map[key] = [
      ...(map[key] ?? []),
      {
        id: `booking-${booking.id}`,
        kind: "booking",
        tripDate: booking.tripDate,
        title: booking.customerName || "Booking mới",
        subtitle: booking.phoneNumber || "Chưa có số điện thoại",
        detail: `${booking.pickupLocation || "Chưa có điểm đón"} - ${booking.dropoffLocation || "Chưa có điểm trả"}`,
        status: booking.status
      }
    ];
  }

  for (const key of Object.keys(map)) {
    map[key].sort(
      (left, right) => new Date(left.tripDate).getTime() - new Date(right.tripDate).getTime()
    );
  }

  return map;
}

function renderCalendarItem(item) {
  if (item.kind === "booking") {
    return (
      <div
        key={item.id}
        className="rounded-[0.85rem] border border-sky-100 bg-sky-50 px-2.5 py-2 text-xs text-sky-900"
      >
        <p className="font-bold">{item.title}</p>
        <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-sky-700">Booking từ web</p>
        <p className="mt-1 line-clamp-1 text-[11px]">{item.detail}</p>
        <p className="mt-1 text-[11px]">{formatDateTime(item.tripDate)}</p>
      </div>
    );
  }

  return (
    <div
      key={item.id}
      className="rounded-[0.85rem] border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-admin-steel"
    >
      <p className="font-bold text-admin-ink">{item.subtitle}</p>
      <p className="mt-1 line-clamp-1">{item.title}</p>
      <p className="mt-1 line-clamp-1 text-[11px]">{item.detail}</p>
      <p className="mt-1 text-[11px]">{formatDateTime(item.tripDate)}</p>
    </div>
  );
}

function formatRoute(booking) {
  return `${booking.pickupLocation || "Chưa có điểm đón"} - ${booking.dropoffLocation || "Chưa có điểm trả"}`;
}

function buildRecentRequests(bookings = []) {
  return bookings
    .map((booking) => ({
      id: `booking-${booking.id}`,
      title: booking.customerName || "Booking mới",
      time: booking.tripDate || booking.createdAt,
      updatedAt: booking.updatedAt || booking.createdAt,
      status: getBookingStatusLabel(booking.status),
      statusClass: getBookingStatusClass(booking.status),
      subtitle: booking.phoneNumber || "Chưa có số điện thoại",
      route: formatRoute(booking),
      note: booking.note || "",
      isPriorityBooking: booking.status === "new"
    }))
    .sort((left, right) => {
      if (left.isPriorityBooking !== right.isPriorityBooking) {
        return left.isPriorityBooking ? -1 : 1;
      }

      return new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime();
    })
    .slice(0, 5);
}

export default function DashboardTab({
  stats,
  bookings,
  scheduleNotes,
  handleOpenBookings,
  handleOpenScheduleNotes
}) {
  const today = new Date();
  const monthLabel = today.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric"
  });
  const calendarDays = buildCalendarDays(today);
  const currentMonth = today.getMonth();
  const calendarMap = buildCalendarMap(scheduleNotes, bookings);
  const recentRequests = buildRecentRequests(bookings);

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

      <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Lịch xe tháng này</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Hiển thị cả lịch xe đã tạo và booking từ website có ngày đi để điều phối nhanh hơn.
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold capitalize text-admin-ink">{monthLabel}</p>
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
              const dayItems = calendarMap[dayKey] ?? [];
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
                    {dayItems.length ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                        {dayItems.length} mục
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayItems.slice(0, 2).map((item) => renderCalendarItem(item))}
                    {dayItems.length > 2 ? (
                      <button
                        type="button"
                        onClick={handleOpenScheduleNotes}
                        className="text-xs font-bold text-admin-ink"
                      >
                        Xem thêm {dayItems.length - 2} mục
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
            <div className="flex items-center justify-between gap-4">
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Yêu cầu gần đây</h3>
              <button
                type="button"
                onClick={handleOpenBookings}
                className="text-sm font-bold text-admin-ink"
              >
                Xem tất cả
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {recentRequests.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-lg font-extrabold leading-8 text-admin-ink">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-admin-steel">
                        {item.time ? formatDateTime(item.time) : "Chưa có thời gian"}
                      </p>
                    </div>
                    <span className={`admin-pill shrink-0 self-start ${item.statusClass}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[0.9rem] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Điện thoại
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold text-admin-ink">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="rounded-[0.9rem] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Lộ trình
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold leading-6 text-admin-ink">
                        {item.route}
                      </p>
                    </div>

                    {item.note ? (
                      <div className="rounded-[0.9rem] bg-slate-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Ghi chú
                        </p>
                        <p className="mt-2 break-words text-sm leading-6 text-admin-steel">
                          {item.note}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
              {!recentRequests.length ? (
                <div className="rounded-[1rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
                  Chưa có dữ liệu gần đây.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
