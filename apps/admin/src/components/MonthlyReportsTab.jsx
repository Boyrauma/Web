import { useMemo, useState } from "react";

function getMonthKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(value) {
  if (!value) return "Chưa chọn tháng";

  const [year, month] = value.split("-");
  return `Tháng ${month}/${year}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function buildMonthOptions({ bookings, notes, payments, maintenances }) {
  const keys = new Set([getMonthKey(new Date())]);

  [
    ...bookings.map((item) => item.createdAt),
    ...notes.map((item) => item.tripDate ?? item.createdAt),
    ...payments.map((item) => item.tripDate ?? item.updatedAt ?? item.createdAt),
    ...maintenances.map((item) => item.serviceDate ?? item.createdAt)
  ].forEach((value) => {
    const key = getMonthKey(value);
    if (key) keys.add(key);
  });

  return [...keys]
    .sort((left, right) => right.localeCompare(left))
    .map((value) => ({ value, label: formatMonthLabel(value) }));
}

function buildDailySeries(selectedMonth, { bookings, notes, payments, maintenances }) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const items = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    bookingCount: 0,
    scheduleCount: 0,
    paidCount: 0,
    maintenanceCount: 0,
    revenue: 0
  }));

  bookings.forEach((item) => {
    const date = new Date(item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].bookingCount += 1;
  });

  notes.forEach((item) => {
    const date = new Date(item.tripDate ?? item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].scheduleCount += 1;
  });

  payments
    .filter((item) => item.paymentStatus === "paid")
    .forEach((item) => {
      const date = new Date(item.tripDate ?? item.updatedAt ?? item.createdAt);
      if (getMonthKey(date) !== selectedMonth) return;
      items[date.getDate() - 1].paidCount += 1;
      items[date.getDate() - 1].revenue += Number(item.amount || 0);
    });

  maintenances.forEach((item) => {
    const date = new Date(item.serviceDate ?? item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].maintenanceCount += 1;
  });

  return items;
}

function buildTopVehicles(selectedMonth, { notes, payments }) {
  const map = new Map();

  [...notes, ...payments].forEach((item) => {
    const referenceDate = item.tripDate ?? item.updatedAt ?? item.createdAt;
    if (getMonthKey(referenceDate) !== selectedMonth) return;

    const vehicleName = item.vehicle?.name ?? item.scheduleNote?.vehicle?.name;
    if (!vehicleName) return;

    map.set(vehicleName, (map.get(vehicleName) ?? 0) + 1);
  });

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function MultiSeriesChart({ data }) {
  const chartHeight = 220;
  const chartWidth = Math.max(760, data.length * 34);
  const padding = { top: 16, right: 20, bottom: 36, left: 36 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.bookingCount,
      item.scheduleCount,
      item.paidCount,
      item.maintenanceCount
    ])
  );
  const groupWidth = (chartWidth - padding.left - padding.right) / data.length;
  const barWidth = Math.max(5, Math.min(8, groupWidth / 5));
  const series = [
    { key: "bookingCount", label: "Booking", color: "#0ea5e9" },
    { key: "scheduleCount", label: "Lịch xe", color: "#8b5cf6" },
    { key: "paidCount", label: "Thu tiền", color: "#10b981" },
    { key: "maintenanceCount", label: "Bảo dưỡng", color: "#f59e0b" }
  ];

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="min-w-full">
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padding.top + (innerHeight / 4) * tick;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {Math.round(maxValue - (maxValue / 4) * tick)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const groupX = padding.left + index * groupWidth + (groupWidth - series.length * barWidth) / 2;
          return (
            <g key={item.day}>
              {series.map((seriesItem, seriesIndex) => {
                const value = item[seriesItem.key];
                const height = (value / maxValue) * innerHeight;
                const x = groupX + seriesIndex * barWidth;
                const y = padding.top + innerHeight - height;

                return (
                  <rect
                    key={seriesItem.key}
                    x={x}
                    y={y}
                    width={barWidth - 1}
                    height={height}
                    rx="2"
                    fill={seriesItem.color}
                  />
                );
              })}

              <text
                x={padding.left + index * groupWidth + groupWidth / 2}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {item.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RevenueChart({ data }) {
  const chartHeight = 180;
  const chartWidth = Math.max(760, data.length * 28);
  const padding = { top: 16, right: 20, bottom: 32, left: 56 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const maxRevenue = Math.max(1, ...data.map((item) => item.revenue));
  const barWidth = (chartWidth - padding.left - padding.right) / data.length - 4;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="min-w-full">
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padding.top + (innerHeight / 4) * tick;
          const value = Math.round(maxRevenue - (maxRevenue / 4) * tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {value > 0 ? `${Math.round(value / 1000000)}tr` : "0"}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const x = padding.left + index * ((chartWidth - padding.left - padding.right) / data.length) + 2;
          const height = (item.revenue / maxRevenue) * innerHeight;
          const y = padding.top + innerHeight - height;

          return (
            <g key={item.day}>
              <rect x={x} y={y} width={barWidth} height={height} rx="3" fill="#0f766e" />
              <text
                x={x + barWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {item.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MonthlyReportsTab({
  bookings,
  notes,
  payments,
  maintenances
}) {
  const monthOptions = useMemo(
    () => buildMonthOptions({ bookings, notes, payments, maintenances }),
    [bookings, maintenances, notes, payments]
  );
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? getMonthKey(new Date()));

  const dailySeries = useMemo(
    () => buildDailySeries(selectedMonth, { bookings, notes, payments, maintenances }),
    [bookings, maintenances, notes, payments, selectedMonth]
  );

  const summary = useMemo(() => {
    const bookingsTotal = dailySeries.reduce((sum, item) => sum + item.bookingCount, 0);
    const schedulesTotal = dailySeries.reduce((sum, item) => sum + item.scheduleCount, 0);
    const paidTotal = dailySeries.reduce((sum, item) => sum + item.paidCount, 0);
    const maintenanceTotal = dailySeries.reduce((sum, item) => sum + item.maintenanceCount, 0);
    const revenueTotal = dailySeries.reduce((sum, item) => sum + item.revenue, 0);

    return { bookingsTotal, schedulesTotal, paidTotal, maintenanceTotal, revenueTotal };
  }, [dailySeries]);

  const topVehicles = useMemo(
    () => buildTopVehicles(selectedMonth, { notes, payments }),
    [notes, payments, selectedMonth]
  );

  const legend = [
    { label: "Booking", color: "bg-sky-500" },
    { label: "Lịch xe", color: "bg-violet-500" },
    { label: "Thu tiền", color: "bg-emerald-500" },
    { label: "Bảo dưỡng", color: "bg-amber-500" }
  ];

  return (
    <section className="mt-8 space-y-6">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Báo cáo tháng</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Tổng hợp booking, lịch xe, thu tiền, doanh thu và bảo dưỡng theo từng ngày trong tháng.
            </p>
          </div>

          <label className="w-full max-w-[220px] space-y-2">
            <span className="text-sm font-bold text-admin-ink">Chọn tháng</span>
            <select
              className="admin-select"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="admin-card rounded-[1.25rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Booking mới</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{summary.bookingsTotal}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Lịch xe</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{summary.schedulesTotal}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Thu tiền</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{summary.paidTotal}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Doanh thu</p>
          <p className="admin-title mt-4 text-2xl font-extrabold text-admin-ink">{formatCurrency(summary.revenueTotal)}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Bảo dưỡng</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{summary.maintenanceTotal}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-extrabold text-admin-ink">Biểu đồ khối lượng công việc</h4>
              <p className="mt-2 text-sm text-admin-steel">
                So sánh số lượng công việc phát sinh theo từng ngày trong tháng.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {legend.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2 text-sm font-semibold text-admin-steel">
                  <span className={`h-3 w-3 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/70 p-4">
            <MultiSeriesChart data={dailySeries} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card rounded-[1.25rem] p-6">
            <h4 className="text-xl font-extrabold text-admin-ink">Doanh thu theo ngày</h4>
            <p className="mt-2 text-sm text-admin-steel">
              Chỉ tính các phiếu đã thu tiền trong tháng đang chọn.
            </p>

            <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/70 p-4">
              <RevenueChart data={dailySeries} />
            </div>
          </div>

          <div className="admin-card rounded-[1.25rem] p-6">
            <h4 className="text-xl font-extrabold text-admin-ink">Xe hoạt động nhiều</h4>
            <p className="mt-2 text-sm text-admin-steel">
              Xếp theo số lần xuất hiện trong lịch xe và tiền xe của tháng này.
            </p>

            <div className="mt-5 space-y-3">
              {topVehicles.length ? (
                topVehicles.map((item, index) => (
                  <div key={item.name} className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-admin-steel">#{index + 1}</p>
                        <p className="mt-1 truncate text-base font-extrabold text-admin-ink">{item.name}</p>
                      </div>
                      <span className="admin-pill bg-slate-100 text-slate-700">{item.count} lượt</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-admin-steel">
                  Chưa có dữ liệu xe trong tháng này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
