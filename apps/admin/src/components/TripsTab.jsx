import AdminPagination from "./AdminPagination";
import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

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

const tripStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "draft", label: "Bản nháp" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "canceled", label: "Đã hủy" }
];

function getTripStatusClass(status) {
  if (status === "draft") return "bg-slate-100 text-slate-700";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-indigo-50 text-indigo-700";
  if (status === "completed") return "bg-sky-50 text-sky-700";
  if (status === "canceled") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function getTripStatusLabel(status) {
  return tripStatusOptions.find((item) => item.value === status)?.label ?? status;
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalizedValue}"`;
}

function downloadCsv(filename, rows) {
  const csvContent = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TripsTab({
  trips,
  tripPageData,
  tripQuery,
  tripPageLoading,
  onTripQueryChange,
  fetchAllFilteredTrips,
  vehicles,
  drivers,
  tripForm,
  editingTripId,
  savingTrip,
  tripAssignableBookings,
  handleTripFormChange,
  handleTripBookingToggle,
  handleCreateTrip,
  handleEditTrip,
  handleDeleteTrip,
  handleTripNextStep,
  handleOpenTripVoucher,
  resetTripForm
}) {
  const filteredTrips = trips;

  async function handleExportCsv() {
    const exportTrips = await fetchAllFilteredTrips();
    const rows = [
      [
        "Ten chuyen",
        "Ngay chay",
        "Trang thai",
        "Diem don",
        "Diem tra",
        "Xe",
        "Tai xe",
        "So booking",
        "Danh sach khach",
        "Ghi chu"
      ],
      ...exportTrips.map((trip) => [
        trip.title,
        formatDateTime(trip.tripDate),
        getTripStatusLabel(trip.status),
        trip.pickupLocation,
        trip.dropoffLocation,
        trip.vehicle?.name,
        trip.driver?.fullName,
        trip.bookings?.length ?? 0,
        (trip.bookings ?? []).map((booking) => booking.customerName).join(" | "),
        trip.note
      ])
    ];

    downloadCsv(`trips-${tripQuery.tripDate || "all"}-${Date.now()}.csv`, rows);
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div>
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
            {editingTripId ? "Cập nhật chuyến đi" : "Tạo chuyến đi"}
          </h3>
          <p className="mt-2 text-sm text-admin-steel">
            Gom nhiều booking vào một chuyến để điều phối theo ngày rõ ràng hơn.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleCreateTrip}>
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tên chuyến</span>
            <input
              className="admin-field"
              name="title"
              value={tripForm.title}
              onChange={handleTripFormChange}
              placeholder="Ví dụ: Thanh Hóa - Nội Bài sáng"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Thời gian chạy</span>
            <input
              className="admin-field"
              type="datetime-local"
              name="tripDate"
              value={tripForm.tripDate}
              onChange={handleTripFormChange}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Điểm đón</span>
              <input
                className="admin-field"
                name="pickupLocation"
                value={tripForm.pickupLocation}
                onChange={handleTripFormChange}
                placeholder="Điểm đón"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Điểm trả</span>
              <input
                className="admin-field"
                name="dropoffLocation"
                value={tripForm.dropoffLocation}
                onChange={handleTripFormChange}
                placeholder="Điểm trả"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Xe</span>
              <select
                className="admin-select"
                name="vehicleId"
                value={tripForm.vehicleId}
                onChange={handleTripFormChange}
              >
                <option value="">Chưa gán xe</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tài xế</span>
              <select
                className="admin-select"
                name="driverId"
                value={tripForm.driverId}
                onChange={handleTripFormChange}
              >
                <option value="">Chưa gán tài xế</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Trạng thái</span>
            <select
              className="admin-select"
              name="status"
              value={tripForm.status}
              onChange={handleTripFormChange}
            >
              {tripStatusOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Ghi chú điều hành</span>
            <textarea
              className="admin-field admin-textarea"
              name="note"
              value={tripForm.note}
              onChange={handleTripFormChange}
              placeholder="Ghi chú thêm cho chuyến đi"
            />
          </label>

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-admin-ink">Booking đi cùng chuyến</p>
              <span className="admin-pill bg-white text-slate-700">
                {tripForm.bookingIds.length} booking
              </span>
            </div>

            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {tripAssignableBookings.map((booking) => {
                const checked = tripForm.bookingIds.includes(booking.id);

                return (
                  <label
                    key={booking.id}
                    className="flex cursor-pointer items-start gap-3 rounded-[0.95rem] border border-slate-200 bg-white px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTripBookingToggle(booking.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-admin-ink">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-admin-steel">
                        {booking.pickupLocation || "Chưa có điểm đón"} →{" "}
                        {booking.dropoffLocation || "Chưa có điểm trả"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(booking.tripDate)}
                      </p>
                    </div>
                  </label>
                );
              })}

              {!tripAssignableBookings.length ? (
                <div className="rounded-[1rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-admin-steel">
                  Chưa có booking nào phù hợp để gán vào chuyến.
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="admin-button-primary" disabled={savingTrip}>
              {savingTrip ? "Đang lưu..." : editingTripId ? "Lưu thay đổi" : "Tạo chuyến"}
            </button>
            <button
              type="button"
              className="admin-button-ghost"
              onClick={resetTripForm}
              disabled={savingTrip}
            >
              Làm mới
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              Danh sách chuyến đi
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi các chuyến đã gom booking, xe và tài xế trên cùng một màn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="admin-pill bg-slate-100 text-slate-700">
              {tripPageData.total}/{tripPageData.allTotal} chuyến
            </span>
            <button type="button" className="admin-button-ghost" onClick={() => void handleExportCsv()} disabled={tripPageLoading}>
              Xuất CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_180px]">
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tìm chuyến</span>
            <input
              className="admin-field"
              value={tripQuery.search}
              onChange={(event) => onTripQueryChange("search", event.target.value)}
              placeholder="Tên chuyến, xe, tài xế, khách..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Lọc trạng thái</span>
            <select
              className="admin-select"
              value={tripQuery.status}
              onChange={(event) => onTripQueryChange("status", event.target.value)}
            >
              {tripStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Lọc theo ngày</span>
            <input
              className="admin-field"
              type="date"
              value={tripQuery.tripDate}
              onChange={(event) => onTripQueryChange("tripDate", event.target.value)}
            />
          </label>
        </div>

        {(tripQuery.search || tripQuery.status !== "all" || tripQuery.tripDate) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {tripQuery.search ? (
              <span className="admin-pill bg-slate-100 text-slate-700">
                Từ khóa: {tripQuery.search}
              </span>
            ) : null}
            {tripQuery.status !== "all" ? (
              <span className="admin-pill bg-slate-100 text-slate-700">
                Trạng thái: {getTripStatusLabel(tripQuery.status)}
              </span>
            ) : null}
            {tripQuery.tripDate ? (
              <span className="admin-pill bg-slate-100 text-slate-700">
                Ngày: {tripQuery.tripDate}
              </span>
            ) : null}
            <button
              type="button"
              className="admin-button-ghost !px-4 !py-2"
              onClick={() => {
                onTripQueryChange("reset");
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {tripPageLoading ? <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải chuyến đi…</p> : null}
        <div className="mt-6 space-y-4">
          {filteredTrips.map((trip) => (
            <article
              key={trip.id}
              className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-extrabold text-admin-ink">{trip.title}</p>
                    <span className={`admin-pill ${getTripStatusClass(trip.status)}`}>
                      {getTripStatusLabel(trip.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-admin-steel">{formatDateTime(trip.tripDate)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Lộ trình
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-admin-ink">
                    {trip.pickupLocation || "Chưa có điểm đón"} →{" "}
                    {trip.dropoffLocation || "Chưa có điểm trả"}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Xe và tài xế
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {trip.vehicle?.name || "Chưa gán xe"}
                  </p>
                  <p className="mt-1 text-sm text-admin-steel">
                    {trip.driver?.fullName || "Chưa gán tài xế"}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Booking trong chuyến
                  </p>
                  <p className="mt-2 text-sm font-semibold text-admin-ink">
                    {trip.bookings?.length ?? 0} booking
                  </p>
                </div>
              </div>

              {trip.bookings?.length ? (
                <div className="mt-4 rounded-[1rem] bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Danh sách khách trong chuyến
                  </p>
                  <div className="mt-3 space-y-2">
                    {trip.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border border-slate-100 px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-admin-ink">{booking.customerName}</p>
                          <p className="mt-1 text-sm text-admin-steel">
                            {booking.pickupLocation || "Chưa có điểm đón"} →{" "}
                            {booking.dropoffLocation || "Chưa có điểm trả"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {booking.phoneNumber || "Chưa có số điện thoại"}
                          </p>
                        </div>
                        <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {trip.note ? (
                <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">
                  {trip.note}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => handleEditTrip(trip)}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="admin-button-ghost"
                  onClick={() => handleOpenTripVoucher(trip)}
                >
                  In phiếu điều xe
                </button>
                {trip.status !== "canceled" ? (
                  <button
                    type="button"
                    className="admin-button-primary"
                    onClick={() => handleTripNextStep(trip)}
                  >
                    {trip.status === "draft"
                      ? "Xác nhận chuyến"
                      : trip.status === "confirmed"
                        ? "Bắt đầu chuyến"
                        : trip.status === "in_progress"
                          ? "Hoàn tất chuyến"
                          : "Ghi nhận tiền xe"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="admin-button-danger"
                  onClick={() => handleDeleteTrip(trip.id)}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}

          {!filteredTrips.length && !tripPageLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Không có chuyến nào khớp với bộ lọc hiện tại.
            </div>
          ) : null}
        </div>
        <AdminPagination
          currentPage={tripPageData.page}
          onPageChange={(page) => onTripQueryChange("page", page)}
          totalItems={tripPageData.total}
          pageSize={tripPageData.pageSize}
          itemLabel="chuyến đi"
        />
      </div>
    </section>
  );
}
