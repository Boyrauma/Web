export default function QuickActions({
  handleOpenVehicleCategories,
  handleOpenVehicles,
  handleOpenBookings,
  handleOpenScheduleNotes,
  handleOpenVehicleMaintenances
}) {
  return (
    <section className="admin-card mt-8 rounded-[2rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Tác vụ nhanh</h3>
          <p className="mt-2 text-sm text-admin-steel">
            Các thao tác thường dùng nhất cho người vận hành.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={handleOpenVehicleCategories} className="admin-button-primary">
          Thêm nhóm xe
        </button>
        <button onClick={handleOpenVehicles} className="admin-button-secondary">
          Thêm xe
        </button>
        <button onClick={handleOpenBookings} className="admin-button-ghost">
          Xem booking mới
        </button>
        <button onClick={handleOpenScheduleNotes} className="admin-button-secondary">
          Lịch xe
        </button>
        <button onClick={handleOpenVehicleMaintenances} className="admin-button-ghost">
          Bảo dưỡng xe
        </button>
      </div>
    </section>
  );
}
