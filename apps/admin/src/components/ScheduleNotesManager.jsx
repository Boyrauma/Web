import { useMemo, useState } from "react";
import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

import { useEffect } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const scheduleSortOptions = [
  { value: "newest", label: "Ngày mới nhất" },
  { value: "oldest", label: "Ngày cũ nhất" }
];

const scheduleStatuses = [
  { value: "scheduled", label: "Đã ghi lịch" },
  { value: "confirmed", label: "Đã chốt xe" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" }
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

function toDateTimeInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function getStatusClass(status) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "completed") return "bg-sky-100 text-sky-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function getStatusLabel(status) {
  return scheduleStatuses.find((item) => item.value === status)?.label ?? status;
}

function getSourceBadgeClasses(source) {
  return source === "booking" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700";
}

function getSourceBadgeLabel(source) {
  return source === "booking" ? "BK" : "TT";
}

function buildScheduleItems(notes = [], bookings = []) {
  const linkedBookingIds = new Set(notes.map((note) => note.bookingRequestId).filter(Boolean));

  const noteItems = notes.map((note) => ({
    id: note.id,
    kind: "note",
    tripDate: note.tripDate,
    createdAt: note.createdAt,
    data: note
  }));

  const bookingItems = bookings
    .filter((booking) => booking.tripDate && !linkedBookingIds.has(booking.id))
    .map((booking) => ({
      id: booking.id,
      kind: "booking",
      tripDate: booking.tripDate,
      createdAt: booking.createdAt,
      data: booking
    }));

  return [...noteItems, ...bookingItems].sort((left, right) => {
    const leftTime = left.tripDate ? new Date(left.tripDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.tripDate ? new Date(right.tripDate).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) return leftTime - rightTime;
    return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
  });
}

function createBookingDraft(booking) {
  return {
    customerName: booking.customerName ?? "",
    phoneNumber: booking.phoneNumber ?? "",
    pickupLocation: booking.pickupLocation ?? "",
    dropoffLocation: booking.dropoffLocation ?? "",
    tripDate: toDateTimeInputValue(booking.tripDate),
    note: booking.note ?? "",
    status: booking.status ?? "new"
  };
}

function createScheduleDraft(note) {
  return {
    vehicleId: note.vehicleId ?? "",
    bookingRequestId: note.bookingRequestId ?? "",
    title: note.title ?? "",
    customerName: note.customerName ?? note.bookingRequest?.customerName ?? "",
    phoneNumber: note.phoneNumber ?? note.bookingRequest?.phoneNumber ?? "",
    tripDate: toDateTimeInputValue(note.tripDate),
    pickupLocation: note.pickupLocation ?? note.bookingRequest?.pickupLocation ?? "",
    dropoffLocation: note.dropoffLocation ?? note.bookingRequest?.dropoffLocation ?? "",
    status: note.status ?? "scheduled",
    note: note.note ?? ""
  };
}

export default function ScheduleNotesManager({
  notes,
  vehicles,
  bookings,
  payments,
  scheduleNoteForm,
  editingScheduleNoteId,
  savingScheduleNote,
  handleScheduleNoteFormChange,
  handleCreateScheduleNote,
  handleInlineUpdateScheduleNote,
  handleInlineUpdateBooking,
  handleDeleteScheduleNote,
  resetScheduleNoteForm,
  handleCreateScheduleFromBooking,
  handleCreateTripPaymentFromSchedule,
  handleEditTripPayment,
  handleDeleteBooking
}) {
  const [inlineEditingKey, setInlineEditingKey] = useState("");
  const [inlineDraft, setInlineDraft] = useState(null);
  const [savingInlineKey, setSavingInlineKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const scheduleItems = useMemo(() => buildScheduleItems(notes, bookings), [bookings, notes]);
  const paymentByScheduleNoteId = useMemo(
    () => new Map(payments.filter((payment) => payment.scheduleNoteId).map((payment) => [payment.scheduleNoteId, payment])),
    [payments]
  );
  const paymentByBookingId = useMemo(
    () => new Map(payments.filter((payment) => payment.bookingRequestId).map((payment) => [payment.bookingRequestId, payment])),
    [payments]
  );
  const visibleScheduleItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const matchedItems = scheduleItems.filter((item) => {
      if (!search) return true;

      const data = item.data;
      const content =
        item.kind === "booking"
          ? [
              data.customerName,
              data.phoneNumber,
              data.pickupLocation,
              data.dropoffLocation,
              data.note
            ]
          : [
              data.title,
              data.vehicle?.name,
              data.customerName,
              data.bookingRequest?.customerName,
              data.phoneNumber,
              data.bookingRequest?.phoneNumber,
              data.pickupLocation,
              data.bookingRequest?.pickupLocation,
              data.dropoffLocation,
              data.bookingRequest?.dropoffLocation,
              data.note
            ];

      return content.filter(Boolean).join(" ").toLowerCase().includes(search);
    });

    return [...matchedItems].sort((left, right) => {
      const leftTime = new Date(left.tripDate ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.tripDate ?? right.createdAt ?? 0).getTime();
      return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [scheduleItems, searchQuery, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(visibleScheduleItems.length / PAGE_SIZE));
  const paginatedScheduleItems = useMemo(
    () => getPageSlice(visibleScheduleItems, currentPage, PAGE_SIZE),
    [currentPage, visibleScheduleItems]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

  function handleInlineFieldChange(event) {
    const { name, value } = event.target;
    setInlineDraft((current) => (current ? { ...current, [name]: value } : current));
  }

  function startBookingInlineEdit(booking) {
    setInlineEditingKey(`booking-${booking.id}`);
    setInlineDraft(createBookingDraft(booking));
  }

  function startScheduleInlineEdit(note) {
    setInlineEditingKey(`note-${note.id}`);
    setInlineDraft(createScheduleDraft(note));
  }

  function cancelInlineEdit() {
    setInlineEditingKey("");
    setInlineDraft(null);
  }

  async function saveBookingInlineEdit(bookingId) {
    if (!inlineDraft) return;

    const currentKey = `booking-${bookingId}`;
    setSavingInlineKey(currentKey);
    try {
      await handleInlineUpdateBooking(bookingId, inlineDraft);
      cancelInlineEdit();
    } finally {
      setSavingInlineKey("");
    }
  }

  async function saveScheduleInlineEdit(noteId) {
    if (!inlineDraft) return;

    const currentKey = `note-${noteId}`;
    setSavingInlineKey(currentKey);
    try {
      await handleInlineUpdateScheduleNote(noteId, inlineDraft);
      cancelInlineEdit();
    } finally {
      setSavingInlineKey("");
    }
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <form onSubmit={handleCreateScheduleNote} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingScheduleNoteId ? "Sửa lịch xe" : "Thêm lịch xe"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Ghi chú vận hành theo từng xe. Dữ liệu lịch xe sẽ tự được đưa vào mục Dữ liệu để tra cứu sau này.
            </p>
          </div>
          {editingScheduleNoteId ? (
            <button type="button" onClick={resetScheduleNoteForm} className="admin-button-ghost">
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Xe</span><select className="admin-select" name="vehicleId" value={scheduleNoteForm.vehicleId} onChange={handleScheduleNoteFormChange}><option value="">Chọn xe</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Tiêu đề</span><input className="admin-field" name="title" placeholder="Có thể để trống nếu chỉ cần ghi note" value={scheduleNoteForm.title} onChange={handleScheduleNoteFormChange} /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Tên khách</span><input className="admin-field" name="customerName" placeholder="Tên khách" value={scheduleNoteForm.customerName} onChange={handleScheduleNoteFormChange} /></label>
            <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Số điện thoại</span><input className="admin-field" name="phoneNumber" placeholder="Số điện thoại" value={scheduleNoteForm.phoneNumber} onChange={handleScheduleNoteFormChange} /></label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Thời gian đi</span><input className="admin-field" type="datetime-local" name="tripDate" value={scheduleNoteForm.tripDate} onChange={handleScheduleNoteFormChange} /></label>
            <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Trạng thái</span><select className="admin-select" name="status" value={scheduleNoteForm.status} onChange={handleScheduleNoteFormChange}>{scheduleStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          </div>
          <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Điểm đón</span><input className="admin-field" name="pickupLocation" placeholder="Điểm đón" value={scheduleNoteForm.pickupLocation} onChange={handleScheduleNoteFormChange} /></label>
          <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Điểm trả</span><input className="admin-field" name="dropoffLocation" placeholder="Điểm trả" value={scheduleNoteForm.dropoffLocation} onChange={handleScheduleNoteFormChange} /></label>
          <label className="space-y-2"><span className="text-sm font-bold text-admin-ink">Ghi chú vận hành</span><textarea className="admin-field admin-textarea" name="note" placeholder="Nhập note thủ công cho xe này" value={scheduleNoteForm.note} onChange={handleScheduleNoteFormChange} /></label>
          <button className="admin-button-primary justify-center" disabled={savingScheduleNote}>{savingScheduleNote ? "Đang lưu..." : editingScheduleNoteId ? "Cập nhật lịch xe" : "Tạo lịch xe"}</button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Lịch xe đã tạo</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Hiển thị lịch xe thủ công và booking từ website có ngày đi để nắm thông tin điều phối.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{visibleScheduleItems.length} mục</span>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-admin-accent">
            Bộ lọc lịch xe
          </p>
          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tìm kiếm</span>
              <input
                className="admin-field"
                placeholder="Tên khách, số điện thoại, xe, lộ trình..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Sắp xếp</span>
              <select
                className="admin-select"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                {scheduleSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {paginatedScheduleItems.map((item) => {
            if (item.kind === "booking") {
              const booking = item.data;
              const currentKey = `booking-${booking.id}`;
              const isInlineEditing = inlineEditingKey === currentKey && inlineDraft;

              return (
                <div key={currentKey} className="rounded-[1.25rem] border border-sky-100 bg-sky-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`admin-pill ${getSourceBadgeClasses("booking")}`}>{getSourceBadgeLabel("booking")}</span>
                        {isInlineEditing ? (
                          <input className="admin-field min-w-[18rem] flex-1" name="customerName" value={inlineDraft.customerName} onChange={handleInlineFieldChange} placeholder="Tên khách" />
                        ) : (
                          <p className="text-lg font-extrabold text-admin-ink">{booking.customerName || "Booking từ website"}</p>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-admin-steel">Chưa gán xe - {formatDateTime(isInlineEditing ? inlineDraft.tripDate : booking.tripDate)}</p>
                    </div>
                    {isInlineEditing ? (
                      <select className="admin-select min-w-40" name="status" value={inlineDraft.status} onChange={handleInlineFieldChange}>
                        <option value="new">Mới</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="confirmed">Đã chốt</option>
                        <option value="closed">Đã đóng</option>
                      </select>
                    ) : (
                      <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>{getBookingStatusLabel(booking.status)}</span>
                    )}
                  </div>

                  {isInlineEditing ? (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Liên hệ</p><div className="mt-3 space-y-3"><input className="admin-field" name="phoneNumber" value={inlineDraft.phoneNumber} onChange={handleInlineFieldChange} placeholder="Số điện thoại" /><input className="admin-field" type="datetime-local" name="tripDate" value={inlineDraft.tripDate} onChange={handleInlineFieldChange} /></div></div>
                        <div className="rounded-[1rem] bg-white px-4 py-3 md:col-span-2 xl:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lộ trình</p><div className="mt-3 grid gap-3 md:grid-cols-2"><input className="admin-field" name="pickupLocation" value={inlineDraft.pickupLocation} onChange={handleInlineFieldChange} placeholder="Điểm đón" /><input className="admin-field" name="dropoffLocation" value={inlineDraft.dropoffLocation} onChange={handleInlineFieldChange} placeholder="Điểm trả" /></div></div>
                      </div>
                      <textarea className="admin-field admin-textarea mt-4" name="note" value={inlineDraft.note} onChange={handleInlineFieldChange} placeholder="Ghi chú booking" />
                    </>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Khách hàng</p><p className="mt-2 text-sm font-semibold text-admin-ink">{booking.customerName || "Chưa ghi tên"}</p><p className="mt-1 text-sm text-admin-steel">{booking.phoneNumber || "Chưa ghi số điện thoại"}</p></div>
                        <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lộ trình</p><p className="mt-2 text-sm font-semibold text-admin-ink">{booking.pickupLocation || "Chưa có điểm đón"}</p><p className="mt-1 text-sm text-admin-steel">{booking.dropoffLocation || "Chưa có điểm trả"}</p></div>
                      </div>
                      {booking.note ? <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">{booking.note}</p> : null}
                    </>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => (isInlineEditing ? saveBookingInlineEdit(booking.id) : startBookingInlineEdit(booking))} className="admin-button-secondary" disabled={savingInlineKey === currentKey}>{isInlineEditing ? savingInlineKey === currentKey ? "Đang lưu..." : "Lưu" : "Sửa"}</button>
                  {isInlineEditing ? <button type="button" onClick={cancelInlineEdit} className="admin-button-ghost" disabled={savingInlineKey === currentKey}>Hủy</button> : null}
                  <button type="button" onClick={() => handleDeleteBooking(booking.id)} className="admin-button-danger" disabled={savingInlineKey === currentKey}>Xóa</button>
                  </div>
                </div>
              );
            }

            const note = item.data;
            const currentKey = `note-${note.id}`;
            const isInlineEditing = inlineEditingKey === currentKey && inlineDraft;
            const payment = paymentByScheduleNoteId.get(note.id) ?? (note.bookingRequestId ? paymentByBookingId.get(note.bookingRequestId) ?? null : null);
            const paymentBadgeClass = payment?.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
            const paymentBadgeLabel = payment?.paymentStatus === "paid" ? "Đã thu tiền" : "Chưa thu tiền";

            return (
              <div key={currentKey} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`admin-pill ${getSourceBadgeClasses(note.bookingRequestId ? "booking" : "manual")}`}>{getSourceBadgeLabel(note.bookingRequestId ? "booking" : "manual")}</span>
                      {isInlineEditing ? <input className="admin-field min-w-[18rem] flex-1" name="title" value={inlineDraft.title} onChange={handleInlineFieldChange} placeholder="Tiêu đề lịch xe" /> : <p className="text-lg font-extrabold text-admin-ink">{note.title}</p>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">{note.vehicle?.name ?? "Chưa có xe"} - {formatDateTime(isInlineEditing ? inlineDraft.tripDate : note.tripDate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`admin-pill ${paymentBadgeClass}`}>{paymentBadgeLabel}</span>
                    {isInlineEditing ? (
                      <select className="admin-select min-w-40" name="status" value={inlineDraft.status} onChange={handleInlineFieldChange}>{scheduleStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
                    ) : (
                      <span className={`admin-pill ${getStatusClass(note.status)}`}>{getStatusLabel(note.status)}</span>
                    )}
                  </div>
                </div>

                {isInlineEditing ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Khách hàng</p><div className="mt-3 space-y-3"><input className="admin-field" name="customerName" value={inlineDraft.customerName} onChange={handleInlineFieldChange} placeholder="Tên khách" /><input className="admin-field" name="phoneNumber" value={inlineDraft.phoneNumber} onChange={handleInlineFieldChange} placeholder="Số điện thoại" /></div></div>
                      <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lộ trình</p><div className="mt-3 space-y-3"><input className="admin-field" name="pickupLocation" value={inlineDraft.pickupLocation} onChange={handleInlineFieldChange} placeholder="Điểm đón" /><input className="admin-field" name="dropoffLocation" value={inlineDraft.dropoffLocation} onChange={handleInlineFieldChange} placeholder="Điểm trả" /></div></div>
                      <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Điều phối</p><div className="mt-3 space-y-3"><input className="admin-field" type="datetime-local" name="tripDate" value={inlineDraft.tripDate} onChange={handleInlineFieldChange} /><select className="admin-select" name="vehicleId" value={inlineDraft.vehicleId} onChange={handleInlineFieldChange}><option value="">Chọn xe</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></div></div>
                    </div>
                    <textarea className="admin-field admin-textarea mt-4" name="note" value={inlineDraft.note} onChange={handleInlineFieldChange} placeholder="Ghi chú vận hành" />
                  </>
                ) : (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Khách hàng</p><p className="mt-2 text-sm font-semibold text-admin-ink">{note.customerName || note.bookingRequest?.customerName || "Chưa ghi tên"}</p><p className="mt-1 text-sm text-admin-steel">{note.phoneNumber || note.bookingRequest?.phoneNumber || "Chưa ghi số điện thoại"}</p></div>
                      <div className="rounded-[1rem] bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lộ trình</p><p className="mt-2 text-sm font-semibold text-admin-ink">{note.pickupLocation || note.bookingRequest?.pickupLocation || "Chưa có điểm đón"}</p><p className="mt-1 text-sm text-admin-steel">{note.dropoffLocation || note.bookingRequest?.dropoffLocation || "Chưa có điểm trả"}</p></div>
                    </div>
                    {note.note ? <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">{note.note}</p> : null}
                  </>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => (isInlineEditing ? saveScheduleInlineEdit(note.id) : startScheduleInlineEdit(note))} className="admin-button-secondary" disabled={savingInlineKey === currentKey}>{isInlineEditing ? savingInlineKey === currentKey ? "Đang lưu..." : "Lưu" : "Sửa"}</button>
                  {isInlineEditing ? <button type="button" onClick={cancelInlineEdit} className="admin-button-ghost" disabled={savingInlineKey === currentKey}>Hủy</button> : null}
                  <button type="button" onClick={() => handleDeleteScheduleNote(note.id)} className="admin-button-danger" disabled={savingInlineKey === currentKey}>Xóa</button>
                </div>
              </div>
            );
          })}

          {visibleScheduleItems.length ? null : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có lịch xe nào.
            </div>
          )}
        </div>

        <AdminPagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={visibleScheduleItems.length}
          itemLabel="lịch xe"
        />
      </div>
    </section>
  );
}
