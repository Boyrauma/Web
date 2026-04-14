import { useMemo, useState } from "react";

import { useEffect } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const paymentStatusOptions = [
  { value: "unpaid", label: "Chưa thu" },
  { value: "paid", label: "Đã thu" }
];

const paymentSortOptions = [
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Chưa ghi tiền";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getPaymentStatusLabel(status) {
  return paymentStatusOptions.find((item) => item.value === status)?.label ?? status;
}

function getPaymentStatusClass(status) {
  return status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
}

function getSourceBadge(item) {
  const isBookingLinked = Boolean(
    item.payment?.bookingRequestId ?? item.scheduleNote?.bookingRequestId ?? item.booking?.id
  );

  return isBookingLinked
    ? { label: "BK", className: "bg-sky-100 text-sky-700" }
    : { label: "TT", className: "bg-violet-100 text-violet-700" };
}

function toDateTimeInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function createInlineDraft(payment) {
  return {
    scheduleNoteId: payment.scheduleNoteId ?? "",
    bookingRequestId: payment.bookingRequestId ?? payment.scheduleNote?.bookingRequestId ?? "",
    vehicleId: payment.vehicleId ?? "",
    title: payment.title ?? "",
    customerName:
      payment.customerName ??
      payment.scheduleNote?.customerName ??
      payment.bookingRequest?.customerName ??
      "",
    phoneNumber:
      payment.phoneNumber ??
      payment.scheduleNote?.phoneNumber ??
      payment.bookingRequest?.phoneNumber ??
      "",
    tripDate: toDateTimeInputValue(payment.tripDate),
    pickupLocation:
      payment.pickupLocation ??
      payment.scheduleNote?.pickupLocation ??
      payment.bookingRequest?.pickupLocation ??
      "",
    dropoffLocation:
      payment.dropoffLocation ??
      payment.scheduleNote?.dropoffLocation ??
      payment.bookingRequest?.dropoffLocation ??
      "",
    amount: payment.amount ?? "",
    paymentStatus: payment.paymentStatus ?? "unpaid",
    note: payment.note ?? ""
  };
}

function buildPaymentItems(scheduleNotes = [], bookings = [], payments = []) {
  const paymentByScheduleNoteId = new Map(
    payments.filter((item) => item.scheduleNoteId).map((item) => [item.scheduleNoteId, item])
  );
  const paymentByBookingId = new Map(
    payments.filter((item) => item.bookingRequestId).map((item) => [item.bookingRequestId, item])
  );
  const scheduleNoteByBookingId = new Map(
    scheduleNotes.filter((item) => item.bookingRequestId).map((item) => [item.bookingRequestId, item])
  );

  const scheduleItems = scheduleNotes.map((note) => {
    const payment =
      paymentByScheduleNoteId.get(note.id) ??
      (note.bookingRequestId ? paymentByBookingId.get(note.bookingRequestId) ?? null : null);

    return {
      id: payment?.id ?? `schedule-${note.id}`,
      kind: "schedule",
      payment,
      scheduleNote: note,
      booking: note.bookingRequest ?? null,
      tripDate: payment?.tripDate ?? note.tripDate,
      createdAt: payment?.createdAt ?? note.createdAt
    };
  });

  const bookingItems = bookings
    .filter((booking) => booking.tripDate && !scheduleNoteByBookingId.has(booking.id))
    .map((booking) => ({
      id: paymentByBookingId.get(booking.id)?.id ?? `booking-${booking.id}`,
      kind: "booking",
      payment: paymentByBookingId.get(booking.id) ?? null,
      scheduleNote: null,
      booking,
      tripDate: paymentByBookingId.get(booking.id)?.tripDate ?? booking.tripDate,
      createdAt: paymentByBookingId.get(booking.id)?.createdAt ?? booking.createdAt
    }));

  const scheduleIds = new Set(scheduleNotes.map((item) => item.id));
  const bookingIds = new Set(bookings.map((item) => item.id));

  const manualItems = payments
    .filter(
      (item) =>
        (!item.scheduleNoteId || !scheduleIds.has(item.scheduleNoteId)) &&
        (!item.bookingRequestId || !bookingIds.has(item.bookingRequestId))
    )
    .map((item) => ({
      id: item.id,
      kind: "manual",
      payment: item,
      scheduleNote: null,
      booking: null,
      tripDate: item.tripDate,
      createdAt: item.createdAt
    }));

  return [...scheduleItems, ...bookingItems, ...manualItems].sort((left, right) => {
    const leftTime = left.tripDate ? new Date(left.tripDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.tripDate ? new Date(right.tripDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) return leftTime - rightTime;
    return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
  });
}

function exportItemsToExcel(items) {
  const rows = items
    .map((item) => {
      const payment = item.payment;
      const note = item.scheduleNote;
      const booking = item.booking;

      const vehicleName = payment?.vehicle?.name ?? note?.vehicle?.name ?? "Chưa gán xe";
      const title =
        payment?.title ??
        note?.title ??
        (booking?.customerName ? `Tiền xe - ${booking.customerName}` : "Tiền xe");
      const customerName =
        payment?.customerName ?? note?.customerName ?? booking?.customerName ?? "Chưa ghi tên";
      const phoneNumber =
        payment?.phoneNumber ??
        note?.phoneNumber ??
        booking?.phoneNumber ??
        "Chưa ghi số điện thoại";
      const pickupLocation =
        payment?.pickupLocation ??
        note?.pickupLocation ??
        booking?.pickupLocation ??
        "Chưa có điểm đón";
      const dropoffLocation =
        payment?.dropoffLocation ??
        note?.dropoffLocation ??
        booking?.dropoffLocation ??
        "Chưa có điểm trả";
      const noteText = payment?.note ?? note?.note ?? booking?.note ?? "";

      return `
        <tr class="data-row">
          <td class="cell">${escapeHtml(vehicleName)}</td>
          <td class="cell">${escapeHtml(title)}</td>
          <td class="cell">${escapeHtml(customerName)}</td>
          <td class="cell phone-cell">="${escapeHtml(phoneNumber)}"</td>
          <td class="cell">${escapeHtml(formatDateTime(item.tripDate))}</td>
          <td class="cell">${escapeHtml(pickupLocation)}</td>
          <td class="cell">${escapeHtml(dropoffLocation)}</td>
          <td class="cell">${escapeHtml(getPaymentStatusLabel(payment?.paymentStatus ?? "unpaid"))}</td>
          <td class="cell">${escapeHtml(formatCurrency(payment?.amount))}</td>
          <td class="cell note-cell">${escapeHtml(noteText)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #ffffff;
            color: #14233c;
          }

          .report-wrap {
            padding: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .report-cell {
            border: 1px solid #b8c4d6;
            padding: 10px 8px;
            text-align: center;
            vertical-align: middle;
          }

          .report-title-cell {
            background: #eef3f9;
            color: #14233c;
            font-size: 20px;
            font-weight: 700;
          }

          .report-subtitle-cell {
            background: #f8fafc;
            color: #5b6880;
            font-size: 11px;
          }

          .head-cell {
            background: #1f3352;
            color: #ffffff;
            border: 1px solid #b8c4d6;
            padding: 10px 8px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            vertical-align: middle;
          }

          .cell {
            border: 1px solid #cfd7e3;
            padding: 10px 8px;
            font-size: 11px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
            white-space: normal;
          }

          .data-row:nth-child(even) .cell {
            background: #f7f9fc;
          }

          .phone-cell {
            mso-number-format: "\\@";
            text-align: center;
            vertical-align: middle;
          }

          .note-cell {
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="report-wrap">
          <table>
            <thead>
              <tr>
                <th class="report-cell report-title-cell" colspan="10">Báo cáo tiền xe</th>
              </tr>
              <tr>
                <th class="report-cell report-subtitle-cell" colspan="10">Ngày xuất: ${escapeHtml(
                  new Date().toLocaleString("vi-VN")
                )}</th>
              </tr>
              <tr>
                <th class="head-cell">Xe</th>
                <th class="head-cell">Tiêu đề</th>
                <th class="head-cell">Khách hàng</th>
                <th class="head-cell">Số điện thoại</th>
                <th class="head-cell">Thời gian đi</th>
                <th class="head-cell">Điểm đón</th>
                <th class="head-cell">Điểm trả</th>
                <th class="head-cell">Trạng thái thu</th>
                <th class="head-cell">Số tiền</th>
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
  link.download = `tien-xe-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
export default function VehicleTripPaymentsTab({
  payments,
  scheduleNotes,
  bookings,
  vehicles,
  tripPaymentForm,
  editingTripPaymentId,
  savingTripPayment,
  handleTripPaymentFormChange,
  handleCreateTripPayment,
  handleInlineUpdateTripPayment,
  handleDeleteTripPayment,
  resetTripPaymentForm,
  handleCreateTripPaymentFromSchedule,
  handleCreateTripPaymentFromBooking,
  handleDeleteBooking,
  handleDeleteScheduleNote
}) {
  const defaultFilters = {
    vehicleFilterId: "all",
    paymentStatusFilter: "all"
  };
  const [vehicleFilterId, setVehicleFilterId] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [draftVehicleFilterId, setDraftVehicleFilterId] = useState(defaultFilters.vehicleFilterId);
  const [draftPaymentStatusFilter, setDraftPaymentStatusFilter] = useState(
    defaultFilters.paymentStatusFilter
  );
  const [sortOrder, setSortOrder] = useState("newest");
  const [draftSortOrder, setDraftSortOrder] = useState("newest");
  const [inlineEditingId, setInlineEditingId] = useState("");
  const [inlineDraft, setInlineDraft] = useState(null);
  const [savingInlineId, setSavingInlineId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const paymentItems = useMemo(
    () => buildPaymentItems(scheduleNotes, bookings, payments),
    [bookings, payments, scheduleNotes]
  );

  const filteredItems = useMemo(
    () =>
      paymentItems.filter((item) => {
        const vehicleId = item.payment?.vehicleId ?? item.scheduleNote?.vehicleId ?? "";
        const paymentStatus = item.payment?.paymentStatus ?? "unpaid";

        const matchVehicle =
          vehicleFilterId === "all"
            ? true
            : vehicleFilterId === "unassigned"
              ? !vehicleId
              : vehicleId === vehicleFilterId;

        const matchPaymentStatus =
          paymentStatusFilter === "all" ? true : paymentStatus === paymentStatusFilter;

        return matchVehicle && matchPaymentStatus;
      }),
    [paymentItems, paymentStatusFilter, vehicleFilterId]
  );
  const visibleItems = useMemo(
    () =>
      [...filteredItems].sort((left, right) => {
        const leftTime = new Date(left.tripDate ?? left.createdAt ?? 0).getTime();
        const rightTime = new Date(right.tripDate ?? right.createdAt ?? 0).getTime();
        return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
      }),
    [filteredItems, sortOrder]
  );
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(
    () => getPageSlice(visibleItems, currentPage, PAGE_SIZE),
    [currentPage, visibleItems]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleInlineFieldChange(event) {
    const { name, value } = event.target;
    setInlineDraft((current) => (current ? { ...current, [name]: value } : current));
  }

  function startInlineEdit(payment) {
    setInlineEditingId(payment.id);
    setInlineDraft(createInlineDraft(payment));
  }

  function cancelInlineEdit() {
    setInlineEditingId("");
    setInlineDraft(null);
  }

  async function saveInlineEdit(paymentId) {
    if (!inlineDraft) return;

    setSavingInlineId(paymentId);
    try {
      await handleInlineUpdateTripPayment(paymentId, inlineDraft);
      cancelInlineEdit();
    } finally {
      setSavingInlineId("");
    }
  }

  function applyFilters() {
    setVehicleFilterId(draftVehicleFilterId);
    setPaymentStatusFilter(draftPaymentStatusFilter);
    setSortOrder(draftSortOrder);
    setCurrentPage(1);
  }

  function clearFilters() {
    setVehicleFilterId(defaultFilters.vehicleFilterId);
    setPaymentStatusFilter(defaultFilters.paymentStatusFilter);
    setDraftVehicleFilterId(defaultFilters.vehicleFilterId);
    setDraftPaymentStatusFilter(defaultFilters.paymentStatusFilter);
    setSortOrder("newest");
    setDraftSortOrder("newest");
    setCurrentPage(1);
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <form onSubmit={handleCreateTripPayment} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingTripPaymentId ? "Sửa phiếu tiền xe" : "Thêm phiếu tiền xe"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Phiếu tiền xe sẽ tự được đưa vào mục Dữ liệu để truy xuất theo ngày, tháng hoặc theo tên xe.
            </p>
          </div>
          {editingTripPaymentId ? (
            <button type="button" onClick={resetTripPaymentForm} className="admin-button-ghost">
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Xe</span>
            <select
              className="admin-select"
              name="vehicleId"
              value={tripPaymentForm.vehicleId}
              onChange={handleTripPaymentFormChange}
            >
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tiêu đề</span>
            <input
              className="admin-field"
              name="title"
              placeholder="Ví dụ: Tiền xe tuyến Thanh Hóa - Hà Nội"
              value={tripPaymentForm.title}
              onChange={handleTripPaymentFormChange}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tên khách</span>
              <input
                className="admin-field"
                name="customerName"
                placeholder="Tên khách"
                value={tripPaymentForm.customerName}
                onChange={handleTripPaymentFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Số điện thoại</span>
              <input
                className="admin-field"
                name="phoneNumber"
                placeholder="Số điện thoại"
                value={tripPaymentForm.phoneNumber}
                onChange={handleTripPaymentFormChange}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Thời gian đi</span>
              <input
                className="admin-field"
                type="datetime-local"
                name="tripDate"
                value={tripPaymentForm.tripDate}
                onChange={handleTripPaymentFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Trạng thái thu</span>
              <select
                className="admin-select"
                name="paymentStatus"
                value={tripPaymentForm.paymentStatus}
                onChange={handleTripPaymentFormChange}
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Điểm đón</span>
              <input
                className="admin-field"
                name="pickupLocation"
                placeholder="Điểm đón"
                value={tripPaymentForm.pickupLocation}
                onChange={handleTripPaymentFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Điểm trả</span>
              <input
                className="admin-field"
                name="dropoffLocation"
                placeholder="Điểm trả"
                value={tripPaymentForm.dropoffLocation}
                onChange={handleTripPaymentFormChange}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Số tiền</span>
            <input
              className="admin-field"
              type="number"
              name="amount"
              placeholder="Ví dụ: 2500000"
              value={tripPaymentForm.amount}
              onChange={handleTripPaymentFormChange}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Ghi chú</span>
            <textarea
              className="admin-field admin-textarea"
              name="note"
              placeholder="Nhập ghi chú thu tiền như đã cọc, còn thiếu, thu tại điểm đón..."
              value={tripPaymentForm.note}
              onChange={handleTripPaymentFormChange}
            />
          </label>

          <button className="admin-button-primary justify-center" disabled={savingTripPayment}>
            {savingTripPayment
              ? "Đang lưu..."
              : editingTripPaymentId
                ? "Cập nhật phiếu tiền xe"
                : "Tạo phiếu tiền xe"}
          </button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              Quản lý tiền xe chạy
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi từng xe đã thu hay chưa thu, đồng thời quản lý luôn khách đặt xe đã có ngày đi để xử lý nhanh hơn.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{visibleItems.length} mục</span>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-admin-accent">
            Bộ lọc tiền xe
          </p>
          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_152px_152px_152px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Lọc xe</span>
              <select
                className="admin-select w-full"
                value={draftVehicleFilterId}
                onChange={(event) => setDraftVehicleFilterId(event.target.value)}
              >
                <option value="all">Tất cả xe</option>
                <option value="unassigned">Chưa gán xe</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Thu tiền</span>
              <select
                className="admin-select w-full"
                value={draftPaymentStatusFilter}
                onChange={(event) => setDraftPaymentStatusFilter(event.target.value)}
              >
                <option value="all">Tất cả thu tiền</option>
                <option value="unpaid">Chưa thu</option>
                <option value="paid">Đã thu</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Sắp xếp</span>
              <select
                className="admin-select w-full"
                value={draftSortOrder}
                onChange={(event) => setDraftSortOrder(event.target.value)}
              >
                {paymentSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={applyFilters}
              className="admin-button-secondary w-full min-w-0 justify-center"
            >
              Lọc
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="admin-button-secondary w-full min-w-0 justify-center"
            >
              Bỏ lọc
            </button>

            <button
              type="button"
              onClick={() => exportItemsToExcel(filteredItems)}
              className="admin-button-secondary w-full min-w-0 justify-center"
            >
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {paginatedItems.map((item) => {
            const payment = item.payment;
            const note = item.scheduleNote;
            const booking = item.booking;
            const isInlineEditing = Boolean(payment && inlineEditingId === payment.id && inlineDraft);
            const sourceBadge = getSourceBadge(item);
            const title =
              (isInlineEditing ? inlineDraft.title : payment?.title) ??
              note?.title ??
              (booking?.customerName ? `Tiền xe - ${booking.customerName}` : "Tiền xe");
            const vehicleName = payment?.vehicle?.name ?? note?.vehicle?.name ?? "Chưa gán xe";
            const customerName =
              (isInlineEditing ? inlineDraft.customerName : payment?.customerName) ??
              note?.customerName ??
              booking?.customerName ??
              "Chưa ghi tên";
            const phoneNumber =
              (isInlineEditing ? inlineDraft.phoneNumber : payment?.phoneNumber) ??
              note?.phoneNumber ??
              booking?.phoneNumber ??
              "Chưa ghi số điện thoại";
            const pickupLocation =
              (isInlineEditing ? inlineDraft.pickupLocation : payment?.pickupLocation) ??
              note?.pickupLocation ??
              booking?.pickupLocation ??
              "Chưa có điểm đón";
            const dropoffLocation =
              (isInlineEditing ? inlineDraft.dropoffLocation : payment?.dropoffLocation) ??
              note?.dropoffLocation ??
              booking?.dropoffLocation ??
              "Chưa có điểm trả";
            const paymentNote =
              (isInlineEditing ? inlineDraft.note : payment?.note) ?? note?.note ?? booking?.note ?? "";
            const status =
              (isInlineEditing ? inlineDraft.paymentStatus : payment?.paymentStatus) ?? "unpaid";
            const amount = isInlineEditing ? inlineDraft.amount : payment?.amount;
            const tripDateValue = isInlineEditing ? inlineDraft.tripDate : item.tripDate;

            return (
              <div
                key={item.id}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`admin-pill ${sourceBadge.className}`}>{sourceBadge.label}</span>
                      {isInlineEditing ? (
                        <input
                          className="admin-field min-w-[18rem] flex-1"
                          name="title"
                          value={inlineDraft.title}
                          onChange={handleInlineFieldChange}
                            placeholder="Tiêu đề phiếu tiền xe"
                        />
                      ) : (
                        <p className="text-lg font-extrabold text-admin-ink">{title}</p>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">
                      {vehicleName} - {formatDateTime(tripDateValue)}
                    </p>
                  </div>
                  {isInlineEditing ? (
                    <select
                      className="admin-select min-w-36"
                      name="paymentStatus"
                      value={inlineDraft.paymentStatus}
                      onChange={handleInlineFieldChange}
                    >
                      {paymentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`admin-pill ${getPaymentStatusClass(status)}`}>
                      {getPaymentStatusLabel(status)}
                    </span>
                  )}
                </div>

                {isInlineEditing ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Khách hàng
                        </p>
                        <div className="mt-3 space-y-3">
                          <input
                            className="admin-field"
                            name="customerName"
                            value={inlineDraft.customerName}
                            onChange={handleInlineFieldChange}
                            placeholder="Tên khách"
                          />
                          <input
                            className="admin-field"
                            name="phoneNumber"
                            value={inlineDraft.phoneNumber}
                            onChange={handleInlineFieldChange}
                            placeholder="Số điện thoại"
                          />
                        </div>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Lộ trình
                        </p>
                        <div className="mt-3 space-y-3">
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

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Thu tiền
                        </p>
                        <div className="mt-3 space-y-3">
                          <input
                            className="admin-field"
                            type="datetime-local"
                            name="tripDate"
                            value={inlineDraft.tripDate}
                            onChange={handleInlineFieldChange}
                          />
                          <input
                            className="admin-field"
                            type="number"
                            name="amount"
                            value={inlineDraft.amount}
                            onChange={handleInlineFieldChange}
                            placeholder="Số tiền"
                          />
                        </div>
                      </div>
                    </div>

                    <textarea
                      className="admin-field admin-textarea mt-4"
                      name="note"
                      value={inlineDraft.note}
                      onChange={handleInlineFieldChange}
                      placeholder="Ghi chú thu tiền"
                    />
                  </>
                ) : (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Khách hàng
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">{customerName}</p>
                        <p className="mt-1 text-sm text-admin-steel">{phoneNumber}</p>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Lộ trình
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">{pickupLocation}</p>
                        <p className="mt-1 text-sm text-admin-steel">{dropoffLocation}</p>
                      </div>

                      <div className="rounded-[1rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Tiền xe
                        </p>
                        <p className="mt-2 text-sm font-semibold text-admin-ink">
                          {formatCurrency(amount)}
                        </p>
                      </div>
                    </div>

                    {paymentNote ? (
                      <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">
                        {paymentNote}
                      </p>
                    ) : null}
                  </>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {payment ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          isInlineEditing ? saveInlineEdit(payment.id) : startInlineEdit(payment)
                        }
                        className="admin-button-secondary"
                        disabled={savingInlineId === payment.id}
                      >
                        {isInlineEditing
                          ? savingInlineId === payment.id
                            ? "Đang lưu..."
                            : "Lưu"
                          : "Sửa"}
                      </button>
                      {isInlineEditing ? (
                        <button
                          type="button"
                          onClick={cancelInlineEdit}
                          className="admin-button-ghost"
                          disabled={savingInlineId === payment.id}
                        >
                          Hủy
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteTripPayment(payment.id)}
                        className="admin-button-danger"
                        disabled={savingInlineId === payment.id}
                      >
                        Xóa
                      </button>
                    </>
                  ) : item.kind === "schedule" && note ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCreateTripPaymentFromSchedule(note)}
                        className="admin-button-secondary"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          note.bookingRequestId
                            ? handleDeleteBooking(note.bookingRequestId)
                            : handleDeleteScheduleNote(note.id)
                        }
                        className="admin-button-danger"
                      >
                        Xóa
                      </button>
                    </>
                  ) : item.kind === "booking" && booking ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCreateTripPaymentFromBooking(booking)}
                        className="admin-button-secondary"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="admin-button-danger"
                      >
                        Xóa
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filteredItems.length ? null : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có mục tiền xe nào trong bộ lọc này.
            </div>
          )}
        </div>

        <AdminPagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={visibleItems.length}
          itemLabel="phiếu tiền xe"
        />
      </div>
    </section>
  );
}

