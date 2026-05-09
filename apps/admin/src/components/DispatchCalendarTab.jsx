import { useMemo, useState } from "react";
import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

const viewModeOptions = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" }
];

const tripStatusLabels = {
  draft: "Nháp",
  confirmed: "Đã chốt",
  in_progress: "Đang chạy",
  completed: "Hoàn thành",
  canceled: "Hủy"
};

const scheduleStatusLabels = {
  scheduled: "Lên lịch",
  completed: "Hoàn thành",
  cancelled: "Hủy"
};

const CONFLICT_WINDOW_MINUTES = 180;

function toDateInputValue(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return toDateInputValue(new Date());

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(value, { short = false } = {}) {
  if (!value) return "Chưa có ngày";

  return new Date(value).toLocaleDateString("vi-VN", {
    weekday: short ? "short" : "long",
    day: "2-digit",
    month: "2-digit"
  });
}

function formatTime(value) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getWeekStart(date) {
  const nextDate = new Date(date);
  const weekday = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - weekday);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getDateRange(baseDate, viewMode) {
  if (viewMode === "week") {
    const start = getWeekStart(baseDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  return [addDays(baseDate, 0)];
}

function getEventTone(event) {
  if (event.kind === "booking") {
    if (["canceled", "cancelled"].includes(event.status)) return "border-rose-200 bg-rose-50";
    if (event.status === "completed") return "border-sky-200 bg-sky-50";
    if (!event.vehicleId || !event.driverId) return "border-amber-200 bg-amber-50";
    return "border-emerald-200 bg-emerald-50";
  }

  if (event.kind === "trip") {
    if (event.status === "canceled") return "border-rose-200 bg-rose-50";
    if (event.status === "completed") return "border-sky-200 bg-sky-50";
    if (event.status === "in_progress") return "border-indigo-200 bg-indigo-50";
    return "border-violet-200 bg-violet-50";
  }

  if (event.status === "cancelled") return "border-rose-200 bg-rose-50";
  if (event.status === "completed") return "border-sky-200 bg-sky-50";
  return "border-slate-200 bg-white";
}

function getEventStatusLabel(event) {
  if (event.kind === "booking") return getBookingStatusLabel(event.status);
  if (event.kind === "trip") return tripStatusLabels[event.status] ?? event.status;
  return scheduleStatusLabels[event.status] ?? event.status;
}

function getEventStatusClass(event) {
  if (event.kind === "booking") return getBookingStatusClass(event.status);
  if (event.status === "completed") return "bg-sky-100 text-sky-700";
  if (["canceled", "cancelled"].includes(event.status)) return "bg-rose-100 text-rose-700";
  if (event.status === "in_progress") return "bg-indigo-100 text-indigo-700";
  if (event.kind === "trip") return "bg-violet-100 text-violet-700";
  return "bg-amber-100 text-amber-700";
}

function buildCalendarEvents({ bookings, trips, scheduleNotes }) {
  const bookingEvents = bookings
    .filter((booking) => booking.tripDate)
    .map((booking) => ({
      id: `booking-${booking.id}`,
      kind: "booking",
      sourceId: booking.id,
      bookingRequestId: booking.id,
      sourceLabel: "Booking",
      title: booking.customerName || "Booking",
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      date: booking.tripDate,
      dateKey: getDayKey(booking.tripDate),
      vehicleId: booking.assignedVehicleId ?? "",
      vehicleName: booking.assignedVehicle?.name ?? "Chưa gán xe",
      driverId: booking.assignedDriverId ?? "",
      driverName: booking.assignedDriver?.fullName ?? "Chưa gán tài xế",
      route: `${booking.pickupLocation || "Chưa có điểm đón"} - ${
        booking.dropoffLocation || "Chưa có điểm trả"
      }`,
      status: booking.status,
      note: booking.internalNote || booking.note || "",
      missingAssignment: !booking.assignedVehicleId || !booking.assignedDriverId
    }));

  const tripEvents = trips
    .filter((trip) => trip.tripDate)
    .map((trip) => ({
      id: `trip-${trip.id}`,
      kind: "trip",
      sourceId: trip.id,
      bookingRequestId: "",
      sourceLabel: "Chuyến",
      title: trip.title || "Chuyến đi",
      customerName: (trip.bookings ?? []).map((booking) => booking.customerName).filter(Boolean).join(", "),
      phoneNumber: "",
      date: trip.tripDate,
      dateKey: getDayKey(trip.tripDate),
      vehicleId: trip.vehicleId ?? "",
      vehicleName: trip.vehicle?.name ?? "Chưa gán xe",
      driverId: trip.driverId ?? "",
      driverName: trip.driver?.fullName ?? "Chưa gán tài xế",
      route: `${trip.pickupLocation || "Chưa có điểm đón"} - ${trip.dropoffLocation || "Chưa có điểm trả"}`,
      status: trip.status,
      note: trip.note || `${trip.bookings?.length ?? 0} booking`,
      missingAssignment: !trip.vehicleId || !trip.driverId
    }));

  const scheduleEvents = scheduleNotes
    .filter((note) => note.tripDate)
    .map((note) => ({
      id: `schedule-${note.id}`,
      kind: "schedule",
      sourceId: note.id,
      bookingRequestId: note.bookingRequestId ?? "",
      sourceLabel: "Lịch xe",
      title: note.title || note.customerName || note.bookingRequest?.customerName || "Lịch xe",
      customerName: note.customerName || note.bookingRequest?.customerName || "",
      phoneNumber: note.phoneNumber || note.bookingRequest?.phoneNumber || "",
      date: note.tripDate,
      dateKey: getDayKey(note.tripDate),
      vehicleId: note.vehicleId ?? "",
      vehicleName: note.vehicle?.name ?? "Chưa gán xe",
      driverId: "",
      driverName: "Chưa gán tài xế",
      route: `${note.pickupLocation || note.bookingRequest?.pickupLocation || "Chưa có điểm đón"} - ${
        note.dropoffLocation || note.bookingRequest?.dropoffLocation || "Chưa có điểm trả"
      }`,
      status: note.status,
      note: note.note || "",
      missingAssignment: !note.vehicleId
    }));

  return [...bookingEvents, ...tripEvents, ...scheduleEvents].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
}

function matchesResourceFilter(event, resourceFilter) {
  if (resourceFilter === "all") return true;
  if (resourceFilter === "unassigned") return event.missingAssignment;
  if (resourceFilter.startsWith("vehicle:")) {
    return event.vehicleId === resourceFilter.replace("vehicle:", "");
  }
  if (resourceFilter.startsWith("driver:")) {
    return event.driverId === resourceFilter.replace("driver:", "");
  }
  return true;
}

function getEventTimestamp(event) {
  const timestamp = new Date(event.date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isConflictRelevant(event) {
  return !["completed", "canceled", "cancelled"].includes(event.status);
}

function isSameWorkflowEvent(left, right) {
  return Boolean(left.bookingRequestId && left.bookingRequestId === right.bookingRequestId);
}

function buildConflicts(events, keyName, labelName) {
  const groups = new Map();

  for (const event of events.filter(isConflictRelevant)) {
    const key = event[keyName];
    if (!key) continue;
    const groupKey = `${event.dateKey}-${key}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), event]);
  }

  return [...groups.values()]
    .map((items) => {
      const sortedItems = [...items].sort(
        (left, right) => (getEventTimestamp(left) ?? 0) - (getEventTimestamp(right) ?? 0)
      );
      const conflictIds = new Set();

      for (let index = 0; index < sortedItems.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < sortedItems.length; nextIndex += 1) {
          const left = sortedItems[index];
          const right = sortedItems[nextIndex];
          const leftTimestamp = getEventTimestamp(left);
          const rightTimestamp = getEventTimestamp(right);
          if (leftTimestamp === null || rightTimestamp === null) continue;
          if (isSameWorkflowEvent(left, right)) continue;

          const diffMinutes = Math.abs(rightTimestamp - leftTimestamp) / 60000;
          if (diffMinutes <= CONFLICT_WINDOW_MINUTES) {
            conflictIds.add(left.id);
            conflictIds.add(right.id);
          }
        }
      }

      const conflictItems = sortedItems.filter((item) => conflictIds.has(item.id));
      if (conflictItems.length < 2) return null;

      return {
        id: `${items[0].dateKey}-${items[0][keyName]}`,
        label: items[0][labelName],
        dateKey: items[0].dateKey,
        count: conflictItems.length,
        items: conflictItems,
        windowMinutes: CONFLICT_WINDOW_MINUTES
      };
    })
    .filter(Boolean);
}

function CalendarEventCard({ event, compact = false }) {
  return (
    <article className={`rounded-[1rem] border px-4 py-3 ${getEventTone(event)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-admin-steel">
            {event.sourceLabel} · {formatTime(event.date)}
          </p>
          <h4 className="mt-1 line-clamp-2 text-sm font-extrabold text-admin-ink">
            {event.title}
          </h4>
        </div>
        <span className={`admin-pill ${getEventStatusClass(event)}`}>
          {getEventStatusLabel(event)}
        </span>
      </div>

      {!compact ? (
        <>
          <p className="mt-3 line-clamp-2 text-sm font-semibold text-admin-steel">
            {event.route}
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <span className="rounded-[0.75rem] bg-white/75 px-3 py-2 font-bold text-admin-ink">
              {event.vehicleName}
            </span>
            <span className="rounded-[0.75rem] bg-white/75 px-3 py-2 font-bold text-admin-ink">
              {event.driverName}
            </span>
          </div>
          {event.note ? (
            <p className="mt-3 line-clamp-2 rounded-[0.75rem] bg-white/70 px-3 py-2 text-xs text-admin-steel">
              {event.note}
            </p>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

export default function DispatchCalendarTab({
  bookings,
  trips,
  scheduleNotes,
  vehicles,
  drivers,
  handleOpenBookings,
  handleOpenScheduleNotes,
  handleOpenTrips
}) {
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [resourceFilter, setResourceFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const baseDate = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const visibleDates = useMemo(() => getDateRange(baseDate, viewMode), [baseDate, viewMode]);
  const visibleDateKeys = useMemo(() => new Set(visibleDates.map(getDayKey)), [visibleDates]);
  const allEvents = useMemo(
    () => buildCalendarEvents({ bookings, trips, scheduleNotes }),
    [bookings, scheduleNotes, trips]
  );

  const filteredEvents = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return allEvents.filter((event) => {
      if (!visibleDateKeys.has(event.dateKey)) return false;
      if (!matchesResourceFilter(event, resourceFilter)) return false;

      if (!search) return true;

      const haystack = [
        event.title,
        event.customerName,
        event.phoneNumber,
        event.route,
        event.vehicleName,
        event.driverName,
        event.note,
        event.sourceLabel
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [allEvents, resourceFilter, searchValue, visibleDateKeys]);

  const eventsByDay = useMemo(() => {
    const map = new Map(visibleDates.map((date) => [getDayKey(date), []]));
    for (const event of filteredEvents) {
      map.set(event.dateKey, [...(map.get(event.dateKey) ?? []), event]);
    }
    return map;
  }, [filteredEvents, visibleDates]);

  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((event) => event.dateKey === getDayKey(baseDate)),
    [baseDate, filteredEvents]
  );

  const vehicleConflicts = useMemo(
    () => buildConflicts(filteredEvents, "vehicleId", "vehicleName"),
    [filteredEvents]
  );
  const driverConflicts = useMemo(
    () => buildConflicts(filteredEvents, "driverId", "driverName"),
    [filteredEvents]
  );

  const busyVehicleCount = useMemo(
    () => new Set(filteredEvents.map((event) => event.vehicleId).filter(Boolean)).size,
    [filteredEvents]
  );
  const busyDriverCount = useMemo(
    () => new Set(filteredEvents.map((event) => event.driverId).filter(Boolean)).size,
    [filteredEvents]
  );
  const missingAssignmentCount = useMemo(
    () => filteredEvents.filter((event) => event.missingAssignment).length,
    [filteredEvents]
  );

  const resourceOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả nguồn lực" },
      { value: "unassigned", label: "Thiếu phân công" },
      ...vehicles.map((vehicle) => ({
        value: `vehicle:${vehicle.id}`,
        label: `Xe · ${vehicle.name}`
      })),
      ...drivers.map((driver) => ({
        value: `driver:${driver.id}`,
        label: `Tài xế · ${driver.fullName}`
      }))
    ],
    [drivers, vehicles]
  );

  function moveRange(direction) {
    const amount = viewMode === "week" ? 7 : 1;
    setSelectedDate(toDateInputValue(addDays(baseDate, direction * amount)));
  }

  function clearFilters() {
    setResourceFilter("all");
    setSearchValue("");
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Lịch trong khung xem
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {filteredEvents.length}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Xe có lịch
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {busyVehicleCount}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tài xế có lịch
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {busyDriverCount}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Thiếu phân công
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {missingAssignmentCount}
          </p>
        </div>
      </div>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-admin-gold">
              Lịch điều phối
            </p>
            <h3 className="admin-title mt-2 text-3xl font-extrabold text-admin-ink">
              Nhìn nhanh xe, tài xế và chuyến theo ngày/tuần
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Dữ liệu được gom từ Booking, Chuyến đi và Lịch xe để tránh trùng xe hoặc sót phân công.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="admin-button-ghost" onClick={handleOpenBookings}>
              Mở booking
            </button>
            <button type="button" className="admin-button-ghost" onClick={handleOpenTrips}>
              Mở chuyến đi
            </button>
            <button type="button" className="admin-button-ghost" onClick={handleOpenScheduleNotes}>
              Mở lịch xe
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[180px_180px_220px_minmax(0,1fr)_auto] xl:items-end">
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Kiểu xem</span>
            <select
              className="admin-select"
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value)}
            >
              {viewModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Ngày mốc</span>
            <input
              type="date"
              className="admin-field"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Lọc xe/tài xế</span>
            <select
              className="admin-select"
              value={resourceFilter}
              onChange={(event) => setResourceFilter(event.target.value)}
            >
              {resourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tìm lịch</span>
            <input
              className="admin-field"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tên khách, số điện thoại, tuyến đi, xe, tài xế..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-button-secondary !px-4" onClick={() => moveRange(-1)}>
              Trước
            </button>
            <button
              type="button"
              className="admin-button-secondary !px-4"
              onClick={() => setSelectedDate(toDateInputValue(new Date()))}
            >
              Hôm nay
            </button>
            <button type="button" className="admin-button-secondary !px-4" onClick={() => moveRange(1)}>
              Sau
            </button>
          </div>
        </div>

        {(resourceFilter !== "all" || searchValue) ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {resourceFilter !== "all" ? (
              <span className="admin-pill bg-slate-100 text-slate-700">
                {resourceOptions.find((option) => option.value === resourceFilter)?.label}
              </span>
            ) : null}
            {searchValue ? (
              <span className="admin-pill bg-slate-100 text-slate-700">Từ khóa: {searchValue}</span>
            ) : null}
            <button type="button" className="admin-button-ghost !px-4 !py-2" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        ) : null}
      </div>

      {viewMode === "week" ? (
        <div className="admin-card rounded-[1.25rem] p-4">
          <div className="admin-scrollbar overflow-x-auto pb-2">
            <div className="grid min-w-[1180px] grid-cols-7 gap-3">
              {visibleDates.map((date) => {
                const key = getDayKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];

                return (
                  <section key={key} className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3">
                    <div className="sticky top-0 z-10 rounded-[0.9rem] bg-white px-3 py-3 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-admin-steel">
                        {formatDayLabel(date, { short: true })}
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-admin-ink">
                        {dayEvents.length} lịch
                      </p>
                    </div>

                    <div className="mt-3 space-y-3">
                      {dayEvents.map((event) => (
                        <CalendarEventCard key={event.id} event={event} compact />
                      ))}
                      {!dayEvents.length ? (
                        <div className="rounded-[1rem] border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm font-semibold text-admin-steel">
                          Trống lịch
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="admin-card rounded-[1.25rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
                  {formatDayLabel(baseDate)}
                </h3>
                <p className="mt-2 text-sm text-admin-steel">
                  Danh sách lịch theo thứ tự giờ chạy trong ngày.
                </p>
              </div>
              <span className="admin-pill bg-slate-100 text-slate-700">
                {selectedDayEvents.length} lịch
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {selectedDayEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
              {!selectedDayEvents.length ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-sm font-semibold text-admin-steel">
                  Không có lịch nào trong ngày này.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="admin-card rounded-[1.25rem] p-6">
              <h3 className="admin-title text-xl font-extrabold text-admin-ink">
                Xe có lịch trong ngày
              </h3>
              <div className="mt-4 space-y-3">
                {vehicles.map((vehicle) => {
                  const vehicleEvents = selectedDayEvents.filter((event) => event.vehicleId === vehicle.id);
                  if (!vehicleEvents.length) return null;

                  return (
                    <div key={vehicle.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="font-extrabold text-admin-ink">{vehicle.name}</p>
                      <p className="mt-1 text-sm font-semibold text-admin-steel">
                        {vehicleEvents.length} lịch
                      </p>
                    </div>
                  );
                })}
                {!selectedDayEvents.some((event) => event.vehicleId) ? (
                  <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-admin-steel">
                    Chưa có xe nào được gán.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="admin-card rounded-[1.25rem] p-6">
              <h3 className="admin-title text-xl font-extrabold text-admin-ink">
                Cần kiểm tra
              </h3>
              <div className="mt-4 space-y-3">
                {[...vehicleConflicts, ...driverConflicts].map((conflict) => (
                  <div key={conflict.id} className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="font-extrabold text-admin-ink">{conflict.label}</p>
                    <p className="mt-1 text-sm font-semibold text-amber-800">
                      Có {conflict.count} lịch gần nhau trong {conflict.windowMinutes} phút ngày {conflict.dateKey}
                    </p>
                    <div className="mt-3 space-y-2">
                      {conflict.items.map((item) => (
                        <p
                          key={item.id}
                          className="rounded-[0.8rem] bg-white/75 px-3 py-2 text-xs font-bold text-admin-ink"
                        >
                          {formatTime(item.date)} · {item.sourceLabel} · {item.title}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {!vehicleConflicts.length && !driverConflicts.length ? (
                  <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-admin-steel">
                    Chưa phát hiện trùng xe hoặc tài xế trong khung xem.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      )}
    </section>
  );
}
