import { useEffect, useMemo, useState } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

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

function formatDayLabel(value) {
  if (!value) return "Chưa có ngày";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Chưa ghi tiền";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function getDayKey(value) {
  if (!value) return "unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSourceBadgeClass(source) {
  return source === "BK" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildPaymentEntries(items = [], storageStatus = "status") {
  return items.map((payment) => ({
    id: `payment-${storageStatus}-${payment.id}`,
    typeLabel: "Tiền xe",
    title: payment.title || "Tiền xe",
    statusLabel: "DONE",
    statusTone: "bg-emerald-100 text-emerald-700",
    vehicleName: payment.vehicle?.name ?? payment.scheduleNote?.vehicle?.name ?? "Chưa có xe",
    customerName:
      payment.customerName ??
      payment.scheduleNote?.customerName ??
      payment.bookingRequest?.customerName ??
      "Chưa ghi tên",
    phoneNumber:
      payment.phoneNumber ??
      payment.scheduleNote?.phoneNumber ??
      payment.bookingRequest?.phoneNumber ??
      "Chưa ghi số điện thoại",
    pickupLocation:
      payment.pickupLocation ??
      payment.scheduleNote?.pickupLocation ??
      payment.bookingRequest?.pickupLocation ??
      "Chưa có điểm đón",
    dropoffLocation:
      payment.dropoffLocation ??
      payment.scheduleNote?.dropoffLocation ??
      payment.bookingRequest?.dropoffLocation ??
      "Chưa có điểm trả",
    note: payment.note ?? "",
    amount: payment.amount ?? null,
    source: payment.bookingRequestId || payment.scheduleNote?.bookingRequestId ? "BK" : "TT",
    bookingCreatedAt: payment.bookingRequest?.createdAt ?? null,
    storageStatus,
    referenceDate:
      payment.tripDate ?? payment.collectedAt ?? payment.archivedAt ?? payment.updatedAt ?? payment.createdAt
  }));
}

function buildArchiveEntries({ payments, archivedPayments }) {
  return [
    ...buildPaymentEntries(
      payments.filter((payment) => payment.paymentStatus === "paid"),
      "status"
    ),
    ...buildPaymentEntries(archivedPayments, "archived")
  ];
}

function exportArchiveItemsToExcel(items) {
  const rows = items
    .map(
      (item) => `
        <tr class="data-row">
          <td class="cell">${escapeHtml(item.source)}</td>
          <td class="cell">${escapeHtml(item.vehicleName)}</td>
          <td class="cell">${escapeHtml(item.title)}</td>
          <td class="cell">${escapeHtml(item.customerName)}</td>
          <td class="cell phone-cell">="${escapeHtml(item.phoneNumber)}"</td>
          <td class="cell">${escapeHtml(formatDateTime(item.referenceDate))}</td>
          <td class="cell">${escapeHtml(formatDateTime(item.bookingCreatedAt))}</td>
          <td class="cell">${escapeHtml(item.pickupLocation)}</td>
          <td class="cell">${escapeHtml(item.dropoffLocation)}</td>
          <td class="cell">${escapeHtml(item.statusLabel)}</td>
          <td class="cell">${escapeHtml(formatCurrency(item.amount))}</td>
          <td class="cell note-cell">${escapeHtml(item.note)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #ffffff; color: #14233c; }
          .report-wrap { padding: 20px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .report-cell { border: 1px solid #b8c4d6; padding: 10px 8px; text-align: center; vertical-align: middle; }
          .report-title-cell { background: #eef3f9; color: #14233c; font-size: 20px; font-weight: 700; }
          .report-subtitle-cell { background: #f8fafc; color: #5b6880; font-size: 11px; }
          .head-cell { background: #1f3352; color: #ffffff; border: 1px solid #b8c4d6; padding: 10px 8px; font-size: 11px; font-weight: 700; text-align: center; vertical-align: middle; }
          .cell { border: 1px solid #cfd7e3; padding: 10px 8px; font-size: 11px; text-align: center; vertical-align: middle; word-wrap: break-word; white-space: normal; }
          .data-row:nth-child(even) .cell { background: #f7f9fc; }
          .phone-cell { mso-number-format: "\\@"; text-align: center; vertical-align: middle; }
          .note-cell { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="report-wrap">
          <table>
            <thead>
              <tr>
                <th class="report-cell report-title-cell" colspan="12">Báo cáo dữ liệu hoàn tất</th>
              </tr>
              <tr>
                <th class="report-cell report-subtitle-cell" colspan="12">Ngày xuất: ${escapeHtml(
                  new Date().toLocaleString("vi-VN")
                )}</th>
              </tr>
              <tr>
                <th class="head-cell">Nguồn</th>
                <th class="head-cell">Xe</th>
                <th class="head-cell">Tiêu đề</th>
                <th class="head-cell">Khách hàng</th>
                <th class="head-cell">Số điện thoại</th>
                <th class="head-cell">Thời gian</th>
                <th class="head-cell">Tạo booking</th>
                <th class="head-cell">Điểm đón</th>
                <th class="head-cell">Điểm trả</th>
                <th class="head-cell">Trạng thái</th>
                <th class="head-cell">Giá trị</th>
                <th class="head-cell">Ghi chú</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([`\ufeff${html}`], {
    type: "application/vnd.ms-excel;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `du-lieu-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DataArchiveTab({ payments, archivedPayments }) {
  const defaultFilters = {
    timeFilter: "all",
    selectedDate: "",
    selectedMonth: "",
    keyword: ""
  };
  const [timeFilter, setTimeFilter] = useState(defaultFilters.timeFilter);
  const [selectedDate, setSelectedDate] = useState(defaultFilters.selectedDate);
  const [selectedMonth, setSelectedMonth] = useState(defaultFilters.selectedMonth);
  const [keyword, setKeyword] = useState(defaultFilters.keyword);
  const [draftTimeFilter, setDraftTimeFilter] = useState(defaultFilters.timeFilter);
  const [draftSelectedDate, setDraftSelectedDate] = useState(defaultFilters.selectedDate);
  const [draftSelectedMonth, setDraftSelectedMonth] = useState(defaultFilters.selectedMonth);
  const [draftKeyword, setDraftKeyword] = useState(defaultFilters.keyword);
  const [currentPage, setCurrentPage] = useState(1);

  const archiveEntries = useMemo(
    () => buildArchiveEntries({ payments, archivedPayments }),
    [archivedPayments, payments]
  );

  const filteredItems = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return archiveEntries.filter((item) => {
      const haystack = [
        item.title,
        item.vehicleName,
        item.customerName,
        item.phoneNumber,
        item.pickupLocation,
        item.dropoffLocation,
        item.note
      ];
      const matchesKeyword = search
        ? haystack.filter(Boolean).join(" ").toLowerCase().includes(search)
        : true;
      const dayKey = getDayKey(item.referenceDate);
      const monthKey = getMonthKey(item.referenceDate);
      const matchesTime =
        timeFilter === "all"
          ? true
          : timeFilter === "day"
            ? Boolean(selectedDate) && dayKey === selectedDate
            : Boolean(selectedMonth) && monthKey === selectedMonth;

      return matchesKeyword && matchesTime;
    });
  }, [archiveEntries, keyword, selectedDate, selectedMonth, timeFilter]);

  const visibleItems = useMemo(
    () =>
      [...filteredItems].sort((left, right) => {
        const leftTime = new Date(left.referenceDate ?? 0).getTime();
        const rightTime = new Date(right.referenceDate ?? 0).getTime();
        return rightTime - leftTime;
      }),
    [filteredItems]
  );

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(
    () => getPageSlice(visibleItems, currentPage, PAGE_SIZE),
    [currentPage, visibleItems]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map();

    paginatedItems.forEach((item) => {
      const key = getDayKey(item.referenceDate);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: key === "unknown" ? "Chưa có ngày" : `Ngày ${formatDayLabel(items[0]?.referenceDate)}`,
      items
    }));
  }, [paginatedItems]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleChangeTimeFilter(nextValue) {
    setDraftTimeFilter(nextValue);

    if (nextValue === "all") {
      setDraftSelectedDate("");
      setDraftSelectedMonth("");
    }
  }

  function applyFilters() {
    setTimeFilter(draftTimeFilter);
    setSelectedDate(draftSelectedDate);
    setSelectedMonth(draftSelectedMonth);
    setKeyword(draftKeyword);
    setCurrentPage(1);
  }

  function clearFilters() {
    setTimeFilter(defaultFilters.timeFilter);
    setSelectedDate(defaultFilters.selectedDate);
    setSelectedMonth(defaultFilters.selectedMonth);
    setKeyword(defaultFilters.keyword);
    setDraftTimeFilter(defaultFilters.timeFilter);
    setDraftSelectedDate(defaultFilters.selectedDate);
    setDraftSelectedMonth(defaultFilters.selectedMonth);
    setDraftKeyword(defaultFilters.keyword);
    setCurrentPage(1);
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Dữ liệu</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Chỉ lưu các chuyến đã thu tiền để tra cứu lịch sử hoàn tất.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{visibleItems.length} mục dữ liệu</span>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_176px_176px_176px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Từ khóa tra cứu</span>
              <input
                className="admin-field"
                placeholder="Tìm theo khách, xe, số điện thoại, lộ trình"
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
              />
            </label>

            <div className="space-y-2 min-w-0">
              <span className="text-sm font-bold text-admin-ink">Mốc thời gian</span>
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="admin-select"
                  value={draftTimeFilter}
                  onChange={(event) => handleChangeTimeFilter(event.target.value)}
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="day">Theo ngày</option>
                  <option value="month">Theo tháng</option>
                </select>

                <input
                  className={`admin-field ${draftTimeFilter === "day" ? "" : "opacity-60"}`}
                  type="date"
                  value={draftSelectedDate}
                  onChange={(event) => {
                    setDraftTimeFilter("day");
                    setDraftSelectedDate(event.target.value);
                  }}
                />

                <input
                  className={`admin-field ${draftTimeFilter === "month" ? "" : "opacity-60"}`}
                  type="month"
                  value={draftSelectedMonth}
                  onChange={(event) => {
                    setDraftTimeFilter("month");
                    setDraftSelectedMonth(event.target.value);
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="admin-button-secondary min-w-44 justify-center"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="admin-button-secondary min-w-44 justify-center"
            >
              Bỏ lọc
            </button>
            <button
              type="button"
              onClick={() => exportArchiveItemsToExcel(visibleItems)}
              className="admin-button-secondary min-w-44 justify-center"
            >
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {groupedItems.map((group) => (
          <div key={group.key} className="admin-card rounded-[1.25rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-extrabold text-admin-ink">{group.label}</h4>
              <span className="admin-pill bg-slate-100 text-slate-700">{group.items.length} mục</span>
            </div>

            <div className="mt-5 space-y-4">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`admin-pill ${getSourceBadgeClass(item.source)}`}>{item.source}</span>
                        {item.storageStatus === "archived" ? (
                          <span className="admin-pill bg-slate-200 text-slate-700">Đã lưu</span>
                        ) : null}
                        <p className="text-lg font-extrabold text-admin-ink">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-admin-steel">
                        {item.vehicleName} - {formatDateTime(item.referenceDate)}
                      </p>
                      {item.bookingCreatedAt ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Tạo booking: {formatDateTime(item.bookingCreatedAt)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`admin-pill ${item.statusTone}`}>{item.statusLabel}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1rem] bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Khách hàng
                      </p>
                      <p className="mt-2 text-sm font-semibold text-admin-ink">{item.customerName}</p>
                      <p className="mt-1 text-sm text-admin-steel">{item.phoneNumber}</p>
                    </div>

                    <div className="rounded-[1rem] bg-white px-4 py-3 xl:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Lộ trình
                      </p>
                      <p className="mt-2 text-sm font-semibold text-admin-ink">{item.pickupLocation}</p>
                      <p className="mt-1 text-sm text-admin-steel">{item.dropoffLocation}</p>
                    </div>

                    <div className="rounded-[1rem] bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Giá trị
                      </p>
                      <p className="mt-2 text-sm font-semibold text-admin-ink">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>

                  {item.note ? (
                    <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">
                      {item.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedItems.length ? null : (
          <div className="admin-card rounded-[1.25rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
            Không có dữ liệu đã thu tiền phù hợp với bộ lọc hiện tại.
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={visibleItems.length}
          itemLabel="dữ liệu"
        />
      </div>
    </section>
  );
}
