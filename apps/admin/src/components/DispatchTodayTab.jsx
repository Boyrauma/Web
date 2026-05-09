import { useMemo, useState } from "react";
import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

function formatDateTime(value) {
  if (!value) return "Chưa có thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Chưa ghi tiền";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function renderAssignmentState(booking) {
  if (booking.assignedVehicleId && booking.assignedDriverId) return "Đã gán đủ";
  if (booking.assignedVehicleId || booking.assignedDriverId) return "Thiếu phân công";
  return "Chưa phân công";
}

function renderAssignmentClass(booking) {
  if (booking.assignedVehicleId && booking.assignedDriverId) return "bg-emerald-50 text-emerald-700";
  if (booking.assignedVehicleId || booking.assignedDriverId) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

const assignmentFilterOptions = [
  { value: "all", label: "Tất cả" },
  { value: "unassigned", label: "Chưa phân công" },
  { value: "partial", label: "Thiếu phân công" },
  { value: "assigned", label: "Đã gán đủ" }
];

function matchesAssignmentFilter(booking, filterValue) {
  if (filterValue === "all") return true;
  if (filterValue === "unassigned") return !booking.assignedVehicleId && !booking.assignedDriverId;
  if (filterValue === "partial") {
    return Boolean(booking.assignedVehicleId || booking.assignedDriverId) && !(booking.assignedVehicleId && booking.assignedDriverId);
  }
  if (filterValue === "assigned") return Boolean(booking.assignedVehicleId && booking.assignedDriverId);
  return true;
}

function ResourcePreview({ title, items, emptyText, tone }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-admin-ink">{title}</p>
        <span className={`admin-pill ${tone}`}>{items.length}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 4).map((item) => (
          <span key={item.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-admin-steel">
            {item.fullName || item.name}
          </span>
        ))}
        {items.length > 4 ? (
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-admin-steel">
            +{items.length - 4}
          </span>
        ) : null}
        {!items.length ? <span className="text-sm text-admin-steel">{emptyText}</span> : null}
      </div>
    </div>
  );
}

export default function DispatchTodayTab({
  todayBookings,
  pendingBookings,
  trips = [],
  reminders = [],
  payments = [],
  busyVehicles,
  readyVehicles,
  availableDrivers,
  assignedDrivers,
  handleOpenBookings,
  handleOpenScheduleNotes,
  handleOpenBookingVoucher
}) {
  const [searchValue, setSearchValue] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const todayKey = useMemo(() => getDayKey(new Date()), []);

  const todayTrips = useMemo(
    () =>
      trips
        .filter((trip) => {
          if (!trip.tripDate) return false;
          if (["completed", "canceled", "cancelled"].includes(trip.status)) return false;
          return getDayKey(trip.tripDate) === todayKey;
        })
        .sort((left, right) => new Date(left.tripDate).getTime() - new Date(right.tripDate).getTime()),
    [todayKey, trips]
  );

  const dueReminders = useMemo(() => {
    const now = Date.now();

    return reminders
      .filter((reminder) => {
        if (!["pending", "failed"].includes(reminder.status)) return false;
        const remindAt = new Date(reminder.remindAt).getTime();
        if (Number.isNaN(remindAt)) return false;
        return remindAt <= now || getDayKey(reminder.remindAt) === todayKey;
      })
      .sort((left, right) => new Date(left.remindAt).getTime() - new Date(right.remindAt).getTime())
      .slice(0, 6);
  }, [reminders, todayKey]);

  const unpaidPayments = useMemo(
    () =>
      payments
        .filter((payment) => payment.paymentStatus !== "paid")
        .sort(
          (left, right) =>
            new Date(left.tripDate ?? left.createdAt ?? 0).getTime() -
            new Date(right.tripDate ?? right.createdAt ?? 0).getTime()
        )
        .slice(0, 6),
    [payments]
  );

  const filteredTodayBookings = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return todayBookings.filter((booking) => {
      if (!matchesAssignmentFilter(booking, assignmentFilter)) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        booking.customerName,
        booking.phoneNumber,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.assignedVehicle?.name,
        booking.assignedDriver?.fullName,
        booking.internalNote
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [assignmentFilter, searchValue, todayBookings]);

  const workToDoCount = pendingBookings.length + dueReminders.length + unpaidPayments.length;
  const activeScheduleCount = todayBookings.length + todayTrips.length;

  const kpis = [
    {
      label: "Cần xử lý",
      value: workToDoCount,
      note: `${pendingBookings.length} phân công, ${dueReminders.length} nhắc việc`
    },
    {
      label: "Lịch chạy",
      value: activeScheduleCount,
      note: `${todayBookings.length} booking, ${todayTrips.length} chuyến`
    },
    {
      label: "Xe đang dùng",
      value: busyVehicles.length,
      note: `${readyVehicles.length} xe còn trống`
    },
    {
      label: "Chưa thu tiền",
      value: unpaidPayments.length,
      note: "Cần kiểm tra trong tab Tiền xe"
    }
  ];

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="admin-card rounded-[1.25rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
              {item.label}
            </p>
            <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
              {item.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-admin-steel">{item.note}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
                Lịch chạy hôm nay
              </h3>
              <p className="mt-2 text-sm text-admin-steel">
                Tập trung vào khách, giờ đi, lộ trình, xe và tài xế. Muốn xử lý sâu thì mở tab Booking.
              </p>
            </div>
            <button type="button" onClick={handleOpenBookings} className="admin-button-ghost">
              Mở Booking
            </button>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tìm nhanh</span>
              <input
                className="admin-field"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tên khách, số điện thoại, xe, tài xế"
              />
            </label>

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
          </div>

          <div className="mt-6 space-y-3">
            {filteredTodayBookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-admin-ink">{booking.customerName}</p>
                      <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                      <span className={`admin-pill ${renderAssignmentClass(booking)}`}>
                        {renderAssignmentState(booking)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-admin-steel">
                      {formatDateTime(booking.tripDate)} · {booking.phoneNumber || "Chưa có số điện thoại"}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-admin-ink">
                      {booking.pickupLocation || "Chưa có điểm đón"} →{" "}
                      {booking.dropoffLocation || "Chưa có điểm trả"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-admin-steel">
                      <span className="rounded-full bg-white px-3 py-1.5 font-semibold">
                        Xe: {booking.assignedVehicle?.name || "Chưa gán"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1.5 font-semibold">
                        Tài xế: {booking.assignedDriver?.fullName || "Chưa gán"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-button-ghost !px-4 !py-2"
                    onClick={() => handleOpenBookingVoucher(booking)}
                  >
                    Phiếu
                  </button>
                </div>
              </article>
            ))}

            {!filteredTodayBookings.length ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
                Không có booking nào khớp với bộ lọc hiện tại.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="admin-card rounded-[1.25rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="admin-title text-xl font-extrabold text-admin-ink">Việc cần làm</h3>
              <span className="admin-pill bg-amber-50 text-amber-700">{workToDoCount}</span>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold text-admin-ink">Chờ phân công</p>
                  <button type="button" onClick={handleOpenBookings} className="text-sm font-bold text-admin-ink">
                    Xử lý
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {pendingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="rounded-[0.9rem] bg-amber-50 px-3 py-3">
                      <p className="text-sm font-bold text-admin-ink">{booking.customerName}</p>
                      <p className="mt-1 text-xs font-semibold text-admin-steel">{formatDateTime(booking.tripDate)}</p>
                    </div>
                  ))}
                  {!pendingBookings.length ? <p className="text-sm text-admin-steel">Không có việc chờ phân công.</p> : null}
                </div>
              </div>

              <div>
                <p className="font-extrabold text-admin-ink">Nhắc việc đến hạn</p>
                <div className="mt-3 space-y-2">
                  {dueReminders.slice(0, 3).map((reminder) => (
                    <div key={reminder.id} className="rounded-[0.9rem] bg-sky-50 px-3 py-3">
                      <p className="text-sm font-bold text-admin-ink">{reminder.title}</p>
                      <p className="mt-1 text-xs font-semibold text-admin-steel">{formatDateTime(reminder.remindAt)}</p>
                    </div>
                  ))}
                  {!dueReminders.length ? <p className="text-sm text-admin-steel">Chưa có nhắc việc đến hạn.</p> : null}
                </div>
              </div>

              <div>
                <p className="font-extrabold text-admin-ink">Khoản chưa thu</p>
                <div className="mt-3 space-y-2">
                  {unpaidPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="rounded-[0.9rem] bg-rose-50 px-3 py-3">
                      <p className="text-sm font-bold text-admin-ink">
                        {payment.title || payment.customerName || "Khoản chưa thu"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-admin-steel">{formatCurrency(payment.amount)}</p>
                    </div>
                  ))}
                  {!unpaidPayments.length ? <p className="text-sm text-admin-steel">Không có khoản chưa thu.</p> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card rounded-[1.25rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="admin-title text-xl font-extrabold text-admin-ink">Nguồn lực</h3>
              <button type="button" onClick={handleOpenScheduleNotes} className="text-sm font-bold text-admin-ink">
                Lịch xe
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <ResourcePreview
                title="Tài xế sẵn sàng"
                items={availableDrivers}
                emptyText="Không có tài xế rảnh."
                tone="bg-emerald-50 text-emerald-700"
              />
              <ResourcePreview
                title="Tài xế đang nhận chuyến"
                items={assignedDrivers}
                emptyText="Chưa có tài xế được gán."
                tone="bg-indigo-50 text-indigo-700"
              />
              <ResourcePreview
                title="Xe đang dùng"
                items={busyVehicles}
                emptyText="Chưa có xe được gán."
                tone="bg-amber-50 text-amber-700"
              />
              <ResourcePreview
                title="Xe còn trống"
                items={readyVehicles}
                emptyText="Không còn xe trống."
                tone="bg-sky-50 text-sky-700"
              />
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}
