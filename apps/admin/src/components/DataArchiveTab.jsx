import { useMemo, useState } from "react";

import { useEffect } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const dataSortOptions = [
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

function buildScheduleEntries(items = [], storageStatus = "active") {
  return items.map((note) => ({
    id: `schedule-${storageStatus}-${note.id}`,
    type: "schedule",
    storageStatus,
    source: note.bookingRequestId ? "BK" : "TT",
    title: note.title || "Lịch xe",
    vehicleName: note.vehicle?.name ?? "Chưa có xe",
    customerName: note.customerName ?? note.bookingRequest?.customerName ?? "Chưa ghi tên",
    phoneNumber:
      note.phoneNumber ?? note.bookingRequest?.phoneNumber ?? "Chưa ghi số điện thoại",
    pickupLocation:
      note.pickupLocation ?? note.bookingRequest?.pickupLocation ?? "Chưa có điểm đón",
    dropoffLocation:
      note.dropoffLocation ?? note.bookingRequest?.dropoffLocation ?? "Chưa có điểm trả",
    note: note.note ?? "",
    statusLabel:
      note.status === "confirmed"
        ? "Đã chốt xe"
        : note.status === "completed"
          ? "Đã hoàn thành"
          : note.status === "cancelled"
            ? "Đã hủy"
            : "Đã ghi lịch",
    amount: null,
    referenceDate: note.tripDate ?? note.createdAt,
    archivedAt: note.archivedAt ?? null
  }));
}

function buildPaymentEntries(items = [], storageStatus = "active") {
  return items.map((payment) => ({
    id: `payment-${storageStatus}-${payment.id}`,
    type: "payment",
    storageStatus,
    source:
      payment.bookingRequestId || payment.scheduleNote?.bookingRequestId ? "BK" : "TT",
    title: payment.title || "Tiền xe",
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
    statusLabel: payment.paymentStatus === "paid" ? "Đã thu" : "Chưa thu",
    amount: payment.amount ?? null,
    referenceDate: payment.tripDate ?? payment.createdAt,
    archivedAt: payment.archivedAt ?? null
  }));
}

export default function DataArchiveTab({
  notes,
  archivedNotes,
  payments,
  archivedPayments
}) {
  const defaultFilters = {
    typeFilter: "all",
    timeFilter: "all",
    selectedDate: "",
    selectedMonth: "",
    vehicleSearch: ""
  };
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [draftTypeFilter, setDraftTypeFilter] = useState(defaultFilters.typeFilter);
  const [draftTimeFilter, setDraftTimeFilter] = useState(defaultFilters.timeFilter);
  const [draftSelectedDate, setDraftSelectedDate] = useState(defaultFilters.selectedDate);
  const [draftSelectedMonth, setDraftSelectedMonth] = useState(defaultFilters.selectedMonth);
  const [draftVehicleSearch, setDraftVehicleSearch] = useState(defaultFilters.vehicleSearch);
  const [sortOrder, setSortOrder] = useState("newest");
  const [draftSortOrder, setDraftSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const dataItems = useMemo(() => {
    const entries = [
      ...buildScheduleEntries(notes, "active"),
      ...buildScheduleEntries(archivedNotes, "archived"),
      ...buildPaymentEntries(payments, "active"),
      ...buildPaymentEntries(archivedPayments, "archived")
    ];

    return entries.sort(
      (left, right) =>
        new Date(right.referenceDate ?? 0).getTime() - new Date(left.referenceDate ?? 0).getTime()
    );
  }, [archivedNotes, archivedPayments, notes, payments]);

  const filteredItems = useMemo(() => {
    const search = vehicleSearch.trim().toLowerCase();

    return dataItems.filter((item) => {
      const matchesType = typeFilter === "all" ? true : item.type === typeFilter;
      const matchesVehicle = search ? item.vehicleName.toLowerCase().includes(search) : true;
      const dayKey = getDayKey(item.referenceDate);
      const monthKey = getMonthKey(item.referenceDate);
      const matchesTime =
        timeFilter === "all"
          ? true
          : timeFilter === "day"
            ? Boolean(selectedDate) && dayKey === selectedDate
            : Boolean(selectedMonth) && monthKey === selectedMonth;

      return matchesType && matchesVehicle && matchesTime;
    });
  }, [dataItems, selectedDate, selectedMonth, timeFilter, typeFilter, vehicleSearch]);
  const visibleItems = useMemo(
    () =>
      [...filteredItems].sort((left, right) => {
        const leftTime = new Date(left.referenceDate ?? 0).getTime();
        const rightTime = new Date(right.referenceDate ?? 0).getTime();
        return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
      }),
    [filteredItems, sortOrder]
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
    setTypeFilter(draftTypeFilter);
    setTimeFilter(draftTimeFilter);
    setSelectedDate(draftSelectedDate);
    setSelectedMonth(draftSelectedMonth);
    setVehicleSearch(draftVehicleSearch);
    setSortOrder(draftSortOrder);
    setCurrentPage(1);
  }

  function clearTimeFilters() {
    setTypeFilter(defaultFilters.typeFilter);
    setTimeFilter(defaultFilters.timeFilter);
    setSelectedDate(defaultFilters.selectedDate);
    setSelectedMonth(defaultFilters.selectedMonth);
    setVehicleSearch(defaultFilters.vehicleSearch);
    setDraftTypeFilter(defaultFilters.typeFilter);
    setDraftTimeFilter(defaultFilters.timeFilter);
    setDraftSelectedDate(defaultFilters.selectedDate);
    setDraftSelectedMonth(defaultFilters.selectedMonth);
    setDraftVehicleSearch(defaultFilters.vehicleSearch);
    setSortOrder("newest");
    setDraftSortOrder("newest");
    setCurrentPage(1);
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Dữ liệu</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Lưu tự động toàn bộ lịch xe và tiền xe để truy xuất theo ngày, tháng hoặc theo tên xe.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-admin-accent">
              Lọc dữ liệu
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">
            {filteredItems.length} dữ liệu
          </span>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-admin-accent">
            Bộ lọc tra cứu
          </p>
          <div className="mt-4 grid gap-4 xl:grid-cols-[180px_220px_minmax(0,1fr)_220px_176px_176px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Loại dữ liệu</span>
              <select
                className="admin-select"
                value={draftTypeFilter}
                onChange={(event) => setDraftTypeFilter(event.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="schedule">Lịch xe</option>
                <option value="payment">Tiền xe</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tên xe</span>
              <input
                className="admin-field"
                placeholder="Tìm theo tên xe"
                value={draftVehicleSearch}
                onChange={(event) => setDraftVehicleSearch(event.target.value)}
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

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Sắp xếp</span>
              <select
                className="admin-select"
                value={draftSortOrder}
                onChange={(event) => setDraftSortOrder(event.target.value)}
              >
                {dataSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={applyFilters}
              className="admin-button-secondary min-w-44 justify-center"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={clearTimeFilters}
              className="admin-button-secondary min-w-44 justify-center"
            >
              Bỏ lọc
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
                        <span
                          className={`admin-pill ${
                            item.type === "payment"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {item.type === "payment" ? "Tiền xe" : "Lịch xe"}
                        </span>
                        <span
                          className={`admin-pill ${
                            item.storageStatus === "archived"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {item.storageStatus === "archived" ? "Đã lưu" : "Đang dùng"}
                        </span>
                        <span className="admin-pill bg-white text-slate-700">{item.source}</span>
                        <p className="text-lg font-extrabold text-admin-ink">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-admin-steel">
                        {item.vehicleName} - {formatDateTime(item.referenceDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="admin-pill bg-white text-slate-700">{item.statusLabel}</span>
                      {item.storageStatus === "archived" && item.archivedAt ? (
                        <span className="admin-pill bg-slate-200 text-slate-700">
                          Lưu lúc {formatDateTime(item.archivedAt)}
                        </span>
                      ) : null}
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
                      <p className="mt-2 text-sm font-semibold text-admin-ink">
                        {item.type === "payment" ? formatCurrency(item.amount) : "Lịch vận hành"}
                      </p>
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
            Không có dữ liệu phù hợp với bộ lọc hiện tại.
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
