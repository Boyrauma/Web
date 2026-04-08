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

function getStatusClass(status) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "completed") return "bg-sky-100 text-sky-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function getStatusLabel(status) {
  return scheduleStatuses.find((item) => item.value === status)?.label ?? status;
}

export default function ScheduleNotesTab({
  notes,
  vehicles,
  bookings,
  scheduleNoteForm,
  editingScheduleNoteId,
  savingScheduleNote,
  handleScheduleNoteFormChange,
  handleCreateScheduleNote,
  handleEditScheduleNote,
  handleDeleteScheduleNote,
  resetScheduleNoteForm
}) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <form onSubmit={handleCreateScheduleNote} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingScheduleNoteId ? "Sửa lịch xe" : "Thêm lịch xe"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Ghi chú xe đã chốt, thời gian đi và thông tin khách để theo dõi vận hành.
            </p>
          </div>
          {editingScheduleNoteId ? (
            <button type="button" onClick={resetScheduleNoteForm} className="admin-button-ghost">
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
              value={scheduleNoteForm.vehicleId}
              onChange={handleScheduleNoteFormChange}
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
            <span className="text-sm font-bold text-admin-ink">Gắn với booking</span>
            <select
              className="admin-select"
              name="bookingRequestId"
              value={scheduleNoteForm.bookingRequestId}
              onChange={handleScheduleNoteFormChange}
            >
              <option value="">Không gắn booking cụ thể</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.customerName} - {booking.phoneNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tiêu đề</span>
            <input
              className="admin-field"
              name="title"
              placeholder="Ví dụ: Xe đã chốt cho khách đoàn"
              value={scheduleNoteForm.title}
              onChange={handleScheduleNoteFormChange}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tên khách</span>
              <input
                className="admin-field"
                name="customerName"
                placeholder="Tên khách"
                value={scheduleNoteForm.customerName}
                onChange={handleScheduleNoteFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Số điện thoại</span>
              <input
                className="admin-field"
                name="phoneNumber"
                placeholder="Số điện thoại"
                value={scheduleNoteForm.phoneNumber}
                onChange={handleScheduleNoteFormChange}
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
                value={scheduleNoteForm.tripDate}
                onChange={handleScheduleNoteFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Trạng thái</span>
              <select
                className="admin-select"
                name="status"
                value={scheduleNoteForm.status}
                onChange={handleScheduleNoteFormChange}
              >
                {scheduleStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Điểm đón</span>
            <input
              className="admin-field"
              name="pickupLocation"
              placeholder="Điểm đón"
              value={scheduleNoteForm.pickupLocation}
              onChange={handleScheduleNoteFormChange}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Điểm trả</span>
            <input
              className="admin-field"
              name="dropoffLocation"
              placeholder="Điểm trả"
              value={scheduleNoteForm.dropoffLocation}
              onChange={handleScheduleNoteFormChange}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Ghi chú vận hành</span>
            <textarea
              className="admin-field admin-textarea"
              name="note"
              placeholder="Ví dụ: nhắc tài xế trước 30 phút, khách có hành lý nhiều..."
              value={scheduleNoteForm.note}
              onChange={handleScheduleNoteFormChange}
            />
          </label>

          <button className="admin-button-primary justify-center" disabled={savingScheduleNote}>
            {savingScheduleNote
              ? "Đang lưu..."
              : editingScheduleNoteId
                ? "Cập nhật lịch xe"
                : "Tạo lịch xe"}
          </button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Lịch xe đã tạo</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi các xe đã đặt để không sót lịch và biết xe nào đang bận.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{notes.length} lịch</span>
        </div>

        <div className="mt-6 space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-admin-ink">{note.title}</p>
                  <p className="mt-1 text-sm font-semibold text-admin-steel">
                    {note.vehicle?.name ?? "Chưa có xe"} - {formatDateTime(note.tripDate)}
                  </p>
                </div>
                <span className={`admin-pill ${getStatusClass(note.status)}`}>
                  {getStatusLabel(note.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Khách hàng
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {note.customerName || note.bookingRequest?.customerName || "Chưa ghi tên"}
                  </p>
                  <p className="mt-1 text-sm text-admin-steel">
                    {note.phoneNumber || note.bookingRequest?.phoneNumber || "Chưa ghi số điện thoại"}
                  </p>
                </div>
                <div className="rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Lộ trình
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {note.pickupLocation || note.bookingRequest?.pickupLocation || "Chưa có điểm đón"}
                  </p>
                  <p className="mt-1 text-sm text-admin-steel">
                    {note.dropoffLocation || note.bookingRequest?.dropoffLocation || "Chưa có điểm trả"}
                  </p>
                </div>
              </div>

              {note.note ? (
                <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">
                  {note.note}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEditScheduleNote(note)}
                  className="admin-button-secondary"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScheduleNote(note.id)}
                  className="admin-button-danger"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          {notes.length ? null : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có lịch xe nào.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
