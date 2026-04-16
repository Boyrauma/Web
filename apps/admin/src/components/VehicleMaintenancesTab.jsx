import { useEffect, useMemo, useState } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";

const maintenanceTypeOptions = [
  { value: "oil_change", label: "Thay dầu" },
  { value: "maintenance", label: "Bảo dưỡng chung" },
  { value: "inspection", label: "Kiểm tra định kỳ" },
  { value: "repair", label: "Sửa chữa" }
];

const maintenanceStatusOptions = [
  { value: "scheduled", label: "Lên lịch" },
  { value: "completed", label: "Hoàn thành" },
  { value: "overdue", label: "Quá hạn" }
];

function formatDate(value) {
  if (!value) return "Chưa có ngày";

  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Chưa ghi chi phí";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function getTypeLabel(type) {
  return maintenanceTypeOptions.find((item) => item.value === type)?.label ?? type;
}

function getStatusLabel(status) {
  return maintenanceStatusOptions.find((item) => item.value === status)?.label ?? status;
}

function getStatusClass(status) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "overdue") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export default function VehicleMaintenancesTab({
  maintenances,
  vehicles,
  maintenanceForm,
  editingMaintenanceId,
  savingMaintenance,
  handleMaintenanceFormChange,
  handleCreateMaintenance,
  handleEditMaintenance,
  handleDeleteMaintenance,
  resetMaintenanceForm
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilterId, setVehicleFilterId] = useState("all");
  const [licensePlateFilter, setLicensePlateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const visibleMaintenances = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const plateSearch = licensePlateFilter.trim().toLowerCase();
    return [...maintenances].filter((item) => {
      const matchVehicle = vehicleFilterId === "all" ? true : item.vehicleId === vehicleFilterId;
      const matchLicensePlate = plateSearch
        ? (item.licensePlate ?? "").toLowerCase().includes(plateSearch)
        : true;
      if (!matchVehicle || !matchLicensePlate) return false;

      if (!search) return true;

      const content = [
        item.title,
        item.vehicle?.name,
        item.licensePlate,
        item.note,
        getTypeLabel(item.maintenanceType),
        getStatusLabel(item.status)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return content.includes(search);
    }).sort((left, right) => {
      const leftTime = new Date(left.serviceDate ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.serviceDate ?? right.createdAt ?? 0).getTime();
      return rightTime - leftTime;
    });
  }, [licensePlateFilter, maintenances, searchQuery, vehicleFilterId]);
  const totalPages = Math.max(1, Math.ceil(visibleMaintenances.length / PAGE_SIZE));
  const paginatedMaintenances = useMemo(
    () => getPageSlice(visibleMaintenances, currentPage, PAGE_SIZE),
    [currentPage, visibleMaintenances]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [licensePlateFilter, searchQuery, vehicleFilterId]);

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <form onSubmit={handleCreateMaintenance} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingMaintenanceId ? "Sửa bảo dưỡng" : "Thêm bảo dưỡng xe"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi thay dầu và các mốc bảo dưỡng để không bỏ sót lịch chăm xe.
            </p>
          </div>
          {editingMaintenanceId ? (
            <button type="button" onClick={resetMaintenanceForm} className="admin-button-ghost">
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
              value={maintenanceForm.vehicleId}
              onChange={handleMaintenanceFormChange}
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
            <span className="text-sm font-bold text-admin-ink">Hạng mục</span>
            <input
              className="admin-field"
              name="title"
              placeholder="Ví dụ: Thay dầu máy định kỳ"
              value={maintenanceForm.title}
              onChange={handleMaintenanceFormChange}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Loại bảo dưỡng</span>
              <select
                className="admin-select"
                name="maintenanceType"
                value={maintenanceForm.maintenanceType}
                onChange={handleMaintenanceFormChange}
              >
                {maintenanceTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Biển số xe</span>
              <input
                className="admin-field"
                name="licensePlate"
                placeholder="Ví dụ: 36A-12345"
                value={maintenanceForm.licensePlate}
                onChange={handleMaintenanceFormChange}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ngày thực hiện</span>
              <input
                className="admin-field"
                type="date"
                name="serviceDate"
                value={maintenanceForm.serviceDate}
                onChange={handleMaintenanceFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ngày kế tiếp</span>
              <input
                className="admin-field"
                type="date"
                name="nextServiceDate"
                value={maintenanceForm.nextServiceDate}
                onChange={handleMaintenanceFormChange}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Số km</span>
              <input
                className="admin-field"
                type="number"
                name="odometerKm"
                placeholder="Ví dụ: 120000"
                value={maintenanceForm.odometerKm}
                onChange={handleMaintenanceFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Chi phí</span>
              <input
                className="admin-field"
                type="number"
                name="cost"
                placeholder="Ví dụ: 1500000"
                value={maintenanceForm.cost}
                onChange={handleMaintenanceFormChange}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Ghi chú</span>
            <textarea
              className="admin-field admin-textarea"
              name="note"
              placeholder="Ví dụ: thay lọc dầu, nhắc kiểm tra lốp lần tới..."
              value={maintenanceForm.note}
              onChange={handleMaintenanceFormChange}
            />
          </label>

          <button className="admin-button-primary justify-center" disabled={savingMaintenance}>
            {savingMaintenance
              ? "Đang lưu..."
              : editingMaintenanceId
                ? "Cập nhật bảo dưỡng"
                : "Tạo lịch bảo dưỡng"}
          </button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              Nhật ký bảo dưỡng
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Dùng để giám sát thay dầu và các hạng mục chăm xe theo từng mốc.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">
            {visibleMaintenances.length} mục
          </span>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tìm kiếm</span>
              <input
                className="admin-field"
                placeholder="Hạng mục, xe, ghi chú..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Lọc theo xe</span>
              <select
                className="admin-select"
                value={vehicleFilterId}
                onChange={(event) => setVehicleFilterId(event.target.value)}
              >
                <option value="all">Tất cả xe</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Biển số</span>
              <input
                className="admin-field"
                placeholder="Tìm theo biển số"
                value={licensePlateFilter}
                onChange={(event) => setLicensePlateFilter(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {paginatedMaintenances.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-admin-ink">{item.title}</p>
                  <p className="mt-1 text-sm font-semibold text-admin-steel">
                    {item.vehicle?.name ?? "Chưa có xe"} - {getTypeLabel(item.maintenanceType)}
                  </p>
                </div>
                <span className={`admin-pill ${getStatusClass(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Ngày thực hiện
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {formatDate(item.serviceDate)}
                  </p>
                </div>
                <div className="min-w-0 rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Ngày kế tiếp
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {formatDate(item.nextServiceDate)}
                  </p>
                </div>
                <div className="min-w-0 rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Chi phí
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {formatCurrency(item.cost)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-admin-steel">
                <span>Số km: {item.odometerKm ?? "Chưa ghi"}</span>
                <span>Biển số: {item.licensePlate || "Chưa ghi"}</span>
              </div>

              {item.note ? (
                <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-7 text-admin-steel">
                  {item.note}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEditMaintenance(item)}
                  className="admin-button-secondary"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMaintenance(item.id)}
                  className="admin-button-danger"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          {visibleMaintenances.length ? null : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có lịch bảo dưỡng nào.
            </div>
          )}
        </div>

        <AdminPagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalItems={visibleMaintenances.length}
          itemLabel="bảo dưỡng"
        />
      </div>
    </section>
  );
}

