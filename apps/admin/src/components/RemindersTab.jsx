import { useMemo, useState } from "react";

const reminderTypeOptions = [
  { value: "manual", label: "Thủ công" },
  { value: "trip_upcoming", label: "Chuyến sắp chạy" },
  { value: "assignment_missing", label: "Thiếu phân công" },
  { value: "schedule_upcoming", label: "Lịch xe sắp đến" },
  { value: "payment_due", label: "Cần thu tiền" },
  { value: "maintenance_due", label: "Bảo dưỡng" }
];

const reminderStatusOptions = [
  { value: "pending", label: "Đang chờ" },
  { value: "sent", label: "Đã gửi" },
  { value: "failed", label: "Gửi lỗi" },
  { value: "completed", label: "Đã xong" },
  { value: "canceled", label: "Đã hủy" }
];

function getReminderTypeLabel(value) {
  return reminderTypeOptions.find((item) => item.value === value)?.label ?? value;
}

function getReminderStatusLabel(value) {
  return reminderStatusOptions.find((item) => item.value === value)?.label ?? value;
}

function getReminderStatusClass(value) {
  if (value === "pending") return "bg-amber-100 text-amber-700";
  if (value === "sent") return "bg-sky-100 text-sky-700";
  if (value === "failed") return "bg-rose-100 text-rose-700";
  if (value === "completed") return "bg-emerald-100 text-emerald-700";
  if (value === "canceled") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

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

function isDue(value) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

function getReminderSource(reminder) {
  if (reminder.bookingRequest) {
    return `${reminder.bookingRequest.customerName || "Booking"} · ${
      reminder.bookingRequest.pickupLocation || "?"
    } - ${reminder.bookingRequest.dropoffLocation || "?"}`;
  }

  if (reminder.trip) {
    return reminder.trip.title || "Chuyến đi";
  }

  if (reminder.scheduleNote) {
    return reminder.scheduleNote.title || reminder.scheduleNote.customerName || "Lịch xe";
  }

  if (reminder.vehicle) return `Xe · ${reminder.vehicle.name}`;
  if (reminder.driver) return `Tài xế · ${reminder.driver.fullName}`;
  return "Nhắc việc riêng";
}

export default function RemindersTab({
  reminders,
  bookings,
  trips,
  scheduleNotes,
  vehicles,
  drivers,
  reminderForm,
  editingReminderId,
  savingReminder,
  processingReminders,
  handleReminderFormChange,
  handleReminderTargetChange,
  handleCreateReminder,
  handleEditReminder,
  handleDeleteReminder,
  handleReminderStatus,
  handleProcessDueReminders,
  resetReminderForm
}) {
  const [statusFilter, setStatusFilter] = useState("active");
  const [keyword, setKeyword] = useState("");

  const filteredReminders = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return reminders.filter((reminder) => {
      if (statusFilter === "active" && !["pending", "failed"].includes(reminder.status)) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && reminder.status !== statusFilter) return false;

      if (!search) return true;

      return [
        reminder.title,
        reminder.note,
        reminder.reminderType,
        reminder.status,
        getReminderSource(reminder)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [keyword, reminders, statusFilter]);

  const dueCount = useMemo(
    () => reminders.filter((item) => item.status === "pending" && isDue(item.remindAt)).length,
    [reminders]
  );
  const pendingCount = useMemo(
    () => reminders.filter((item) => item.status === "pending").length,
    [reminders]
  );
  const failedCount = useMemo(
    () => reminders.filter((item) => item.status === "failed").length,
    [reminders]
  );
  const autoCount = useMemo(
    () => reminders.filter((item) => item.uniqueKey).length,
    [reminders]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Đến hạn</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{dueCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Đang chờ</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{pendingCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Gửi lỗi</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{failedCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Tự động</p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{autoCount}</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
            {editingReminderId ? "Cập nhật nhắc việc" : "Tạo nhắc việc"}
          </h3>
          <p className="mt-2 text-sm text-admin-steel">
            Hệ thống tự sinh nhắc chuyến sắp chạy. Phần này dùng để thêm nhắc việc riêng.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateReminder}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tiêu đề</span>
              <input className="admin-field" name="title" value={reminderForm.title} onChange={handleReminderFormChange} placeholder="Ví dụ: Gọi khách xác nhận giờ đón" required />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Loại nhắc</span>
                <select className="admin-select" name="reminderType" value={reminderForm.reminderType} onChange={handleReminderFormChange}>
                  {reminderTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Thời gian nhắc</span>
                <input className="admin-field" type="datetime-local" name="remindAt" value={reminderForm.remindAt} onChange={handleReminderFormChange} required />
              </label>
            </div>

            <details className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-extrabold text-admin-ink">
                Gắn nhắc việc với dữ liệu (không bắt buộc)
              </summary>

              <div className="mt-4 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Gắn với</span>
                  <select className="admin-select" name="targetType" value={reminderForm.targetType} onChange={handleReminderTargetChange}>
                    <option value="">Nhắc việc riêng</option>
                    <option value="booking">Booking</option>
                    <option value="trip">Chuyến đi</option>
                    <option value="schedule_note">Lịch xe</option>
                    <option value="vehicle">Xe</option>
                    <option value="driver">Tài xế</option>
                  </select>
                </label>

                {reminderForm.targetType === "booking" ? (
                  <select className="admin-select" name="bookingRequestId" value={reminderForm.bookingRequestId} onChange={handleReminderTargetChange}>
                    <option value="">Chọn booking</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>{booking.customerName} · {formatDateTime(booking.tripDate)}</option>
                    ))}
                  </select>
                ) : null}

            {reminderForm.targetType === "trip" ? (
              <select className="admin-select" name="tripId" value={reminderForm.tripId} onChange={handleReminderTargetChange}>
                <option value="">Chọn chuyến</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>{trip.title} · {formatDateTime(trip.tripDate)}</option>
                ))}
              </select>
            ) : null}

            {reminderForm.targetType === "schedule_note" ? (
              <select className="admin-select" name="scheduleNoteId" value={reminderForm.scheduleNoteId} onChange={handleReminderTargetChange}>
                <option value="">Chọn lịch xe</option>
                {scheduleNotes.map((note) => (
                  <option key={note.id} value={note.id}>{note.title || note.customerName} · {formatDateTime(note.tripDate)}</option>
                ))}
              </select>
            ) : null}

            {reminderForm.targetType === "vehicle" ? (
              <select className="admin-select" name="vehicleId" value={reminderForm.vehicleId} onChange={handleReminderTargetChange}>
                <option value="">Chọn xe</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                ))}
              </select>
            ) : null}

            {reminderForm.targetType === "driver" ? (
              <select className="admin-select" name="driverId" value={reminderForm.driverId} onChange={handleReminderTargetChange}>
                <option value="">Chọn tài xế</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.fullName}</option>
                ))}
              </select>
            ) : null}

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Ghi chú</span>
                  <textarea className="admin-field admin-textarea" name="note" value={reminderForm.note} onChange={handleReminderFormChange} placeholder="Nội dung cần lưu ý" />
                </label>
              </div>
            </details>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="admin-button-primary" disabled={savingReminder}>
                {savingReminder ? "Đang lưu..." : editingReminderId ? "Lưu thay đổi" : "Tạo nhắc việc"}
              </button>
              <button type="button" className="admin-button-ghost" onClick={resetReminderForm} disabled={savingReminder}>Làm mới</button>
            </div>
          </form>
        </div>

        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Danh sách nhắc việc</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Nhắc tự động sẽ gửi Telegram khi đến hạn nếu Telegram đang bật.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="active">Đang xử lý</option>
                <option value="all">Tất cả</option>
                {reminderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <input className="admin-field" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm nhắc việc..." />
              <button type="button" className="admin-button-secondary" onClick={handleProcessDueReminders} disabled={processingReminders}>
                {processingReminders ? "Đang chạy..." : "Chạy nhắc đến hạn"}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredReminders.map((reminder) => (
              <article
                key={reminder.id}
                className={`rounded-[1.1rem] border p-5 ${
                  reminder.status === "pending" && isDue(reminder.remindAt)
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-admin-ink">{reminder.title}</p>
                      {reminder.uniqueKey ? <span className="admin-pill bg-violet-100 text-violet-700">Tự động</span> : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">
                      {formatDateTime(reminder.remindAt)} · {getReminderTypeLabel(reminder.reminderType)}
                    </p>
                  </div>
                  <span className={`admin-pill ${getReminderStatusClass(reminder.status)}`}>
                    {getReminderStatusLabel(reminder.status)}
                  </span>
                </div>

                <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm font-semibold text-admin-ink">
                  {getReminderSource(reminder)}
                </p>
                {reminder.note ? <p className="mt-3 whitespace-pre-wrap text-sm text-admin-steel">{reminder.note}</p> : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="admin-button-secondary" onClick={() => handleEditReminder(reminder)}>Sửa</button>
                  {reminder.status !== "completed" ? (
                    <button type="button" className="admin-button-secondary" onClick={() => handleReminderStatus(reminder.id, "completed")}>Đánh dấu xong</button>
                  ) : null}
                  {reminder.status !== "pending" ? (
                    <button type="button" className="admin-button-ghost" onClick={() => handleReminderStatus(reminder.id, "pending")}>Mở lại</button>
                  ) : null}
                  {reminder.status !== "canceled" ? (
                    <button type="button" className="admin-button-ghost" onClick={() => handleReminderStatus(reminder.id, "canceled")}>Hủy</button>
                  ) : null}
                  <button type="button" className="admin-button-danger" onClick={() => handleDeleteReminder(reminder.id)}>Xóa</button>
                </div>
              </article>
            ))}
            {!filteredReminders.length ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-admin-steel">
                Chưa có nhắc việc phù hợp bộ lọc.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}

export { reminderTypeOptions };
