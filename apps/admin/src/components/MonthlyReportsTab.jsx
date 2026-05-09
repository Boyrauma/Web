import { useMemo, useState } from "react";
import {
  downloadExcelHtml,
  escapeHtml,
  openPrintDocument
} from "../utils/documentExport";

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

function formatDateTime(value) {
  if (!value) return "Chưa có thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function buildMonthOptions({ bookings, notes, payments, expenses, maintenances, trips }) {
  const keys = new Set([getMonthKey(new Date())]);

  [
    ...bookings.map((item) => item.createdAt),
    ...notes.map((item) => item.tripDate ?? item.createdAt),
    ...payments.map((item) => item.tripDate ?? item.updatedAt ?? item.createdAt),
    ...expenses.map((item) => item.expenseDate ?? item.createdAt),
    ...maintenances.map((item) => item.serviceDate ?? item.createdAt),
    ...trips.map((item) => item.tripDate ?? item.createdAt)
  ].forEach((value) => {
    const key = getMonthKey(value);
    if (key) keys.add(key);
  });

  return [...keys]
    .sort((left, right) => right.localeCompare(left))
    .map((value) => ({ value, label: formatMonthLabel(value) }));
}

function buildDailySeries(selectedMonth, { bookings, notes, payments, expenses, maintenances, trips }) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const items = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    bookingCount: 0,
    tripCount: 0,
    completedTripCount: 0,
    scheduleCount: 0,
    paidCount: 0,
    maintenanceCount: 0,
    expenseCount: 0,
    revenue: 0,
    expenses: 0
  }));

  bookings.forEach((item) => {
    const date = new Date(item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].bookingCount += 1;
  });

  trips.forEach((item) => {
    const date = new Date(item.tripDate ?? item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].tripCount += 1;
    if (item.status === "completed") {
      items[date.getDate() - 1].completedTripCount += 1;
    }
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

  expenses.forEach((item) => {
    const date = new Date(item.expenseDate ?? item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].expenseCount += 1;
    items[date.getDate() - 1].expenses += Number(item.amount || 0);
  });

  maintenances.forEach((item) => {
    const date = new Date(item.serviceDate ?? item.createdAt);
    if (getMonthKey(date) !== selectedMonth) return;
    items[date.getDate() - 1].maintenanceCount += 1;
  });

  return items;
}

function buildTopVehicles(selectedMonth, { notes, payments, trips }) {
  const map = new Map();

  [...notes, ...payments, ...trips].forEach((item) => {
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

function buildTopDrivers(selectedMonth, trips = []) {
  const map = new Map();

  trips.forEach((trip) => {
    const referenceDate = trip.tripDate ?? trip.createdAt;
    if (getMonthKey(referenceDate) !== selectedMonth) return;

    const driverName = trip.driver?.fullName;
    if (!driverName) return;

    map.set(driverName, (map.get(driverName) ?? 0) + 1);
  });

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function MultiSeriesChart({ data }) {
  const chartHeight = 220;
  const chartWidth = Math.max(760, data.length * 42);
  const padding = { top: 16, right: 20, bottom: 36, left: 36 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const series = [
    { key: "bookingCount", label: "Booking", color: "#0ea5e9" },
    { key: "tripCount", label: "Chuyến", color: "#2563eb" },
    { key: "scheduleCount", label: "Lịch xe", color: "#8b5cf6" },
    { key: "paidCount", label: "Thu tiền", color: "#10b981" },
    { key: "expenseCount", label: "Chi phí", color: "#ef4444" },
    { key: "maintenanceCount", label: "Bảo dưỡng", color: "#f59e0b" }
  ];
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => series.map((seriesItem) => item[seriesItem.key]))
  );
  const groupWidth = (chartWidth - padding.left - padding.right) / data.length;
  const barWidth = Math.max(4, Math.min(7, groupWidth / (series.length + 1)));

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
          const groupX =
            padding.left + index * groupWidth + (groupWidth - series.length * barWidth) / 2;
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
  const chartWidth = Math.max(760, data.length * 30);
  const padding = { top: 16, right: 20, bottom: 32, left: 56 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const maxRevenue = Math.max(1, ...data.map((item) => Math.max(item.revenue, item.expenses)));
  const groupWidth = (chartWidth - padding.left - padding.right) / data.length;
  const barWidth = Math.max(8, groupWidth / 3);

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
          const baseX = padding.left + index * groupWidth + 4;
          const revenueHeight = (item.revenue / maxRevenue) * innerHeight;
          const expenseHeight = (item.expenses / maxRevenue) * innerHeight;

          return (
            <g key={item.day}>
              <rect
                x={baseX}
                y={padding.top + innerHeight - revenueHeight}
                width={barWidth}
                height={revenueHeight}
                rx="3"
                fill="#0f766e"
              />
              <rect
                x={baseX + barWidth + 3}
                y={padding.top + innerHeight - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                rx="3"
                fill="#ef4444"
              />
              <text
                x={baseX + barWidth}
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

function buildMonthlyTableHtml(selectedMonth, summary, dailySeries) {
  const dailyRows = dailySeries
    .map(
      (item) => `
        <tr>
          <td>${item.day}</td>
          <td>${item.bookingCount}</td>
          <td>${item.tripCount}</td>
          <td>${item.completedTripCount}</td>
          <td>${item.scheduleCount}</td>
          <td>${item.paidCount}</td>
          <td>${item.expenseCount}</td>
          <td>${escapeHtml(formatCurrency(item.revenue))}</td>
          <td>${escapeHtml(formatCurrency(item.expenses))}</td>
          <td>${escapeHtml(formatCurrency(item.revenue - item.expenses))}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Tháng</th>
          <th>Booking</th>
          <th>Chuyến</th>
          <th>Hoàn tất</th>
          <th>Lịch xe</th>
          <th>Phiếu thu</th>
          <th>Chi phí</th>
          <th>Doanh thu</th>
          <th>Tổng chi</th>
          <th>Lãi tạm tính</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(formatMonthLabel(selectedMonth))}</td>
          <td>${summary.bookingsTotal}</td>
          <td>${summary.tripsTotal}</td>
          <td>${summary.completedTripsTotal}</td>
          <td>${summary.schedulesTotal}</td>
          <td>${summary.paidTotal}</td>
          <td>${summary.expenseCount}</td>
          <td>${escapeHtml(formatCurrency(summary.revenueTotal))}</td>
          <td>${escapeHtml(formatCurrency(summary.expenseTotal))}</td>
          <td>${escapeHtml(formatCurrency(summary.profitTotal))}</td>
        </tr>
      </tbody>
    </table>

    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Booking</th>
          <th>Chuyến</th>
          <th>Hoàn tất</th>
          <th>Lịch xe</th>
          <th>Phiếu thu</th>
          <th>Chi phí</th>
          <th>Doanh thu</th>
          <th>Tổng chi</th>
          <th>Lãi tạm tính</th>
        </tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>
  `;
}

export default function MonthlyReportsTab({
  bookings,
  notes,
  payments,
  expenses = [],
  maintenances,
  trips
}) {
  const monthOptions = useMemo(
    () => buildMonthOptions({ bookings, notes, payments, expenses, maintenances, trips }),
    [bookings, expenses, maintenances, notes, payments, trips]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions[0]?.value ?? getMonthKey(new Date())
  );

  const dailySeries = useMemo(
    () => buildDailySeries(selectedMonth, { bookings, notes, payments, expenses, maintenances, trips }),
    [bookings, expenses, maintenances, notes, payments, selectedMonth, trips]
  );

  const summary = useMemo(() => {
    const bookingsTotal = dailySeries.reduce((sum, item) => sum + item.bookingCount, 0);
    const tripsTotal = dailySeries.reduce((sum, item) => sum + item.tripCount, 0);
    const completedTripsTotal = dailySeries.reduce((sum, item) => sum + item.completedTripCount, 0);
    const schedulesTotal = dailySeries.reduce((sum, item) => sum + item.scheduleCount, 0);
    const paidTotal = dailySeries.reduce((sum, item) => sum + item.paidCount, 0);
    const maintenanceTotal = dailySeries.reduce((sum, item) => sum + item.maintenanceCount, 0);
    const expenseCount = dailySeries.reduce((sum, item) => sum + item.expenseCount, 0);
    const revenueTotal = dailySeries.reduce((sum, item) => sum + item.revenue, 0);
    const expenseTotal = dailySeries.reduce((sum, item) => sum + item.expenses, 0);

    return {
      bookingsTotal,
      tripsTotal,
      completedTripsTotal,
      schedulesTotal,
      paidTotal,
      maintenanceTotal,
      expenseCount,
      revenueTotal,
      expenseTotal,
      profitTotal: revenueTotal - expenseTotal
    };
  }, [dailySeries]);

  const topVehicles = useMemo(
    () => buildTopVehicles(selectedMonth, { notes, payments, trips }),
    [notes, payments, selectedMonth, trips]
  );
  const topDrivers = useMemo(() => buildTopDrivers(selectedMonth, trips), [selectedMonth, trips]);

  const legend = [
    { label: "Booking", color: "bg-sky-500" },
    { label: "Chuyến đi", color: "bg-blue-600" },
    { label: "Lịch xe", color: "bg-violet-500" },
    { label: "Thu tiền", color: "bg-emerald-500" },
    { label: "Chi phí", color: "bg-rose-500" },
    { label: "Bảo dưỡng", color: "bg-amber-500" }
  ];

  function handleExportExcel() {
    downloadExcelHtml(
      `bao-cao-thang-${selectedMonth}.xls`,
      `Báo cáo tháng ${formatMonthLabel(selectedMonth)}`,
      buildMonthlyTableHtml(selectedMonth, summary, dailySeries)
    );
  }

  function handlePrintPdf() {
    openPrintDocument(
      `Báo cáo tháng ${formatMonthLabel(selectedMonth)}`,
      `
        <p class="brand">Nhà xe Định Dung</p>
        <h1>Báo cáo tháng ${escapeHtml(formatMonthLabel(selectedMonth))}</h1>
        <p>Tổng hợp vận hành, doanh thu, chi phí và lợi nhuận tạm tính.</p>
        ${buildMonthlyTableHtml(selectedMonth, summary, dailySeries)}
      `
    );
  }

  const kpiItems = [
    { label: "Doanh thu", value: formatCurrency(summary.revenueTotal), compact: true },
    { label: "Tổng chi", value: formatCurrency(summary.expenseTotal), compact: true },
    { label: "Lãi tạm tính", value: formatCurrency(summary.profitTotal), compact: true },
    { label: "Chuyến hoàn tất", value: summary.completedTripsTotal }
  ];

  const operationItems = [
    { label: "Booking mới", value: summary.bookingsTotal },
    { label: "Chuyến đi", value: summary.tripsTotal },
    { label: "Lịch xe", value: summary.schedulesTotal },
    { label: "Phiếu thu", value: summary.paidTotal },
    { label: "Bảo dưỡng", value: summary.maintenanceTotal }
  ];

  return (
    <section className="mt-8 space-y-6">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Báo cáo tháng</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Tổng hợp booking, chuyến đi, lịch xe, doanh thu, chi phí và lợi nhuận tạm tính.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-end gap-3 lg:w-auto">
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
            <button type="button" className="admin-button-secondary" onClick={handleExportExcel}>
              Xuất Excel
            </button>
            <button type="button" className="admin-button-ghost" onClick={handlePrintPdf}>
              In / Lưu PDF
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((item) => (
          <div key={item.label} className="admin-card rounded-[1.25rem] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
              {item.label}
            </p>
            <p
              className={`admin-title mt-4 font-extrabold text-admin-ink ${
                item.compact ? "text-2xl" : "text-4xl"
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xl font-extrabold text-admin-ink">Vận hành trong tháng</h4>
            <p className="mt-2 text-sm text-admin-steel">
              Các số vận hành chính được gom lại để báo cáo dễ đọc hơn.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{formatMonthLabel(selectedMonth)}</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {operationItems.map((item) => (
            <div key={item.label} className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-extrabold text-admin-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-extrabold text-admin-ink">Khối lượng công việc</h4>
              <p className="mt-2 text-sm text-admin-steel">
                So sánh booking, chuyến, lịch xe, thu tiền, chi phí và bảo dưỡng theo ngày.
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

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-admin-steel">
                <span className="h-3 w-3 rounded-full bg-emerald-700" />
                Doanh thu
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-admin-steel">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                Chi phí
              </span>
            </div>
            <RevenueChart data={dailySeries} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card rounded-[1.25rem] p-6">
            <h4 className="text-xl font-extrabold text-admin-ink">Xe hoạt động nhiều</h4>
            <p className="mt-2 text-sm text-admin-steel">
              Xếp theo số lần xuất hiện trong chuyến đi, lịch xe và tiền xe của tháng này.
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

          <div className="admin-card rounded-[1.25rem] p-6">
            <h4 className="text-xl font-extrabold text-admin-ink">Tài xế nhận chuyến nhiều</h4>
            <p className="mt-2 text-sm text-admin-steel">
              Tính theo số lần tài xế được gán vào các chuyến đi trong tháng.
            </p>

            <div className="mt-5 space-y-3">
              {topDrivers.length ? (
                topDrivers.map((item, index) => (
                  <div key={item.name} className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-admin-steel">#{index + 1}</p>
                        <p className="mt-1 truncate text-base font-extrabold text-admin-ink">{item.name}</p>
                      </div>
                      <span className="admin-pill bg-slate-100 text-slate-700">{item.count} chuyến</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-admin-steel">
                  Chưa có dữ liệu tài xế trong tháng này.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <details className="admin-card rounded-[1.25rem] p-6">
        <summary className="cursor-pointer text-xl font-extrabold text-admin-ink">
          Xem dữ liệu chuyến trong tháng
        </summary>
        <p className="mt-2 text-sm text-admin-steel">
          Bảng chi tiết được thu gọn để màn hình báo cáo không bị rối.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Chuyến</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Xe</th>
                <th className="px-4 py-3">Tài xế</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips
                .filter((trip) => getMonthKey(trip.tripDate ?? trip.createdAt) === selectedMonth)
                .map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-4 py-3 font-bold text-admin-ink">{trip.title}</td>
                    <td className="px-4 py-3 text-admin-steel">{formatDateTime(trip.tripDate)}</td>
                    <td className="px-4 py-3 text-admin-steel">{trip.vehicle?.name || "Chưa gán xe"}</td>
                    <td className="px-4 py-3 text-admin-steel">{trip.driver?.fullName || "Chưa gán tài xế"}</td>
                    <td className="px-4 py-3 text-admin-steel">{trip.bookings?.length ?? 0}</td>
                    <td className="px-4 py-3 text-admin-steel">{trip.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
