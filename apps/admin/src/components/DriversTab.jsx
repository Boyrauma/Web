import { useMemo, useState } from "react";

const driverStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "available", label: "Sẵn sàng" },
  { value: "assigned", label: "Đang nhận chuyến" },
  { value: "off", label: "Nghỉ" },
  { value: "inactive", label: "Ngưng hoạt động" }
];

function getDriverStatusClass(status) {
  if (status === "available") return "bg-emerald-50 text-emerald-700";
  if (status === "assigned") return "bg-indigo-50 text-indigo-700";
  if (status === "off") return "bg-amber-50 text-amber-700";
  if (status === "inactive") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

function getDriverStatusLabel(status) {
  return driverStatusOptions.find((item) => item.value === status)?.label ?? status;
}

export default function DriversTab({
  drivers,
  driverForm,
  editingDriverId,
  savingDriver,
  handleDriverFormChange,
  handleCreateDriver,
  handleEditDriver,
  handleDeleteDriver,
  resetDriverForm
}) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDrivers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return drivers.filter((driver) => {
      if (statusFilter !== "all" && driver.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [driver.fullName, driver.phoneNumber, driver.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [drivers, searchValue, statusFilter]);

  const activeCount = useMemo(
    () => drivers.filter((driver) => driver.isActive).length,
    [drivers]
  );
  const availableCount = useMemo(
    () => drivers.filter((driver) => driver.isActive && driver.status === "available").length,
    [drivers]
  );
  const assignedCount = useMemo(
    () => drivers.filter((driver) => driver.isActive && driver.status === "assigned").length,
    [drivers]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng tài xế
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{drivers.length}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang hoạt động
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{activeCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Sẵn sàng
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{availableCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang nhận chuyến
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{assignedCount}</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingDriverId ? "Cập nhật tài xế" : "Thêm tài xế"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Quản lý người phụ trách từng chuyến để gán nhanh vào booking.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateDriver}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Họ tên</span>
              <input
                className="admin-field"
                name="fullName"
                value={driverForm.fullName}
                onChange={handleDriverFormChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Số điện thoại</span>
              <input
                className="admin-field"
                name="phoneNumber"
                value={driverForm.phoneNumber}
                onChange={handleDriverFormChange}
                placeholder="09..."
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Trạng thái</span>
              <select
                className="admin-select"
                name="status"
                value={driverForm.status}
                onChange={handleDriverFormChange}
              >
                {driverStatusOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ghi chú</span>
              <textarea
                className="admin-field admin-textarea"
                name="note"
                value={driverForm.note}
                onChange={handleDriverFormChange}
                placeholder="Ghi chú nội bộ về tài xế"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={driverForm.isActive}
                onChange={handleDriverFormChange}
              />
              <span className="text-sm font-semibold text-admin-ink">Đang hoạt động</span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="admin-button-primary" disabled={savingDriver}>
                {savingDriver ? "Đang lưu..." : editingDriverId ? "Lưu thay đổi" : "Thêm tài xế"}
              </button>
              <button
                type="button"
                className="admin-button-ghost"
                onClick={resetDriverForm}
                disabled={savingDriver}
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Danh sách tài xế</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Theo dõi tình trạng sẵn sàng để gán vào booking nhanh hơn.
              </p>
            </div>
            <span className="admin-pill bg-slate-100 text-slate-700">
              {filteredDrivers.length}/{drivers.length} tài xế
            </span>
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Tìm tài xế</span>
                <input
                  className="admin-field"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Họ tên, số điện thoại, ghi chú..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Lọc trạng thái</span>
                <select
                  className="admin-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {driverStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredDrivers.map((driver) => (
              <article
                key={driver.id}
                className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold text-admin-ink">{driver.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">{driver.phoneNumber}</p>
                  </div>
                  <span className={`admin-pill ${getDriverStatusClass(driver.status)}`}>
                    {getDriverStatusLabel(driver.status)}
                  </span>
                </div>

                {driver.note ? (
                  <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">
                    {driver.note}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="admin-button-secondary"
                    onClick={() => handleEditDriver(driver)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="admin-button-danger"
                    onClick={() => handleDeleteDriver(driver.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}

            {!filteredDrivers.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
                Không có tài xế nào khớp với bộ lọc hiện tại.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
