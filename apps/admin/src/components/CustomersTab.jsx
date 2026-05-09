import { useEffect, useMemo, useState } from "react";
import AdminPagination, { PAGE_SIZE, getPageSlice } from "./AdminPagination";
import { getBookingStatusClass, getBookingStatusLabel } from "../utils/bookingStatus";

const customerStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "regular", label: "Khách thường" },
  { value: "vip", label: "Khách VIP" },
  { value: "watchlist", label: "Cần lưu ý" },
  { value: "blocked", label: "Tạm ngưng nhận" }
];

function getCustomerStatusLabel(status) {
  return customerStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getCustomerStatusClass(status) {
  if (status === "vip") return "bg-amber-100 text-amber-800";
  if (status === "watchlist") return "bg-orange-100 text-orange-800";
  if (status === "blocked") return "bg-rose-100 text-rose-800";
  return "bg-emerald-50 text-emerald-700";
}

function formatDateTime(value) {
  if (!value) return "Chưa có dữ liệu";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "Chưa có lịch đi";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatRoute(item) {
  const pickup = item?.pickupLocation || "Chưa có điểm đón";
  const dropoff = item?.dropoffLocation || "Chưa có điểm trả";
  return `${pickup} - ${dropoff}`;
}

export default function CustomersTab({
  customers,
  customerForm,
  editingCustomerId,
  savingCustomer,
  handleCustomerFormChange,
  handleCreateCustomer,
  handleEditCustomer,
  handleDeleteCustomer,
  resetCustomerForm
}) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return customers.filter((customer) => {
      if (statusFilter !== "all" && customer.status !== statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        customer.fullName,
        customer.phoneNumber,
        customer.note,
        customer.latestRoute,
        customer.latestBooking?.pickupLocation,
        customer.latestBooking?.dropoffLocation
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [customers, keyword, statusFilter]);

  const visibleCustomers = useMemo(
    () => getPageSlice(filteredCustomers, currentPage),
    [currentPage, filteredCustomers]
  );

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === selectedCustomerId) ??
      filteredCustomers[0] ??
      null,
    [customers, filteredCustomers, selectedCustomerId]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter]);

  useEffect(() => {
    if (!filteredCustomers.length) {
      setSelectedCustomerId("");
      return;
    }

    if (!filteredCustomers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(filteredCustomers[0].id);
    }
  }, [filteredCustomers, selectedCustomerId]);

  const vipCount = useMemo(
    () => customers.filter((customer) => customer.status === "vip").length,
    [customers]
  );
  const repeatCount = useMemo(
    () => customers.filter((customer) => customer.bookingCount >= 2).length,
    [customers]
  );
  const watchCount = useMemo(
    () => customers.filter((customer) => customer.status === "watchlist").length,
    [customers]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng khách hàng
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {customers.length}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Khách quay lại
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {repeatCount}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Khách VIP
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {vipCount}
          </p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Cần lưu ý
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {watchCount}
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingCustomerId ? "Cập nhật khách hàng" : "Hồ sơ khách hàng"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Lưu ghi chú, phân loại khách quen và xem lại lịch sử đặt xe theo số điện thoại.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateCustomer}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tên khách hàng</span>
              <input
                className="admin-field"
                name="fullName"
                value={customerForm.fullName}
                onChange={handleCustomerFormChange}
                placeholder="Ví dụ: Anh Minh"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Số điện thoại</span>
              <input
                className="admin-field"
                name="phoneNumber"
                value={customerForm.phoneNumber}
                onChange={handleCustomerFormChange}
                placeholder="09..."
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Phân loại</span>
              <select
                className="admin-select"
                name="status"
                value={customerForm.status}
                onChange={handleCustomerFormChange}
              >
                {customerStatusOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ghi chú nội bộ</span>
              <textarea
                className="admin-field admin-textarea"
                name="note"
                value={customerForm.note}
                onChange={handleCustomerFormChange}
                placeholder="Ví dụ: khách quen tuyến sân bay, ưu tiên xe rộng..."
              />
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="admin-button-primary" disabled={savingCustomer}>
                {savingCustomer ? "Đang lưu..." : editingCustomerId ? "Lưu thay đổi" : "Lưu hồ sơ"}
              </button>
              <button
                type="button"
                className="admin-button-ghost"
                onClick={resetCustomerForm}
                disabled={savingCustomer}
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="admin-card rounded-[1.25rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
                  Danh sách khách hàng
                </h3>
                <p className="mt-2 text-sm text-admin-steel">
                  Tự gom từ booking cũ và hồ sơ đã lưu.
                </p>
              </div>
              <span className="admin-pill bg-slate-100 text-slate-700">
                {filteredCustomers.length}/{customers.length} khách
              </span>
            </div>

            <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Tìm khách</span>
                  <input
                    className="admin-field"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tên, số điện thoại, tuyến đi, ghi chú..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Lọc phân loại</span>
                  <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    {customerStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {visibleCustomers.map((customer) => (
                <article
                  key={customer.id}
                  className={`rounded-[1.15rem] border p-5 transition ${
                    selectedCustomer?.id === customer.id
                      ? "border-admin-gold bg-amber-50/50"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold text-admin-ink">{customer.fullName}</p>
                        <p className="mt-1 text-sm font-semibold text-admin-steel">
                          {customer.phoneNumber}
                        </p>
                      </div>
                      <span className={`admin-pill ${getCustomerStatusClass(customer.status)}`}>
                        {getCustomerStatusLabel(customer.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-[0.9rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-admin-steel">
                          Booking
                        </p>
                        <p className="mt-1 font-extrabold text-admin-ink">{customer.bookingCount}</p>
                      </div>
                      <div className="rounded-[0.9rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-admin-steel">
                          Hoàn tất
                        </p>
                        <p className="mt-1 font-extrabold text-admin-ink">{customer.completedCount}</p>
                      </div>
                      <div className="rounded-[0.9rem] bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-admin-steel">
                          Lịch gần nhất
                        </p>
                        <p className="mt-1 font-extrabold text-admin-ink">
                          {formatDate(customer.lastTripDate)}
                        </p>
                      </div>
                    </div>

                    {customer.latestRoute ? (
                      <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">
                        {customer.latestRoute}
                      </p>
                    ) : null}
                  </button>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      Sửa hồ sơ
                    </button>
                    <a className="admin-button-ghost" href={`tel:${customer.phoneNumber}`}>
                      Gọi khách
                    </a>
                    {customer.profileId ? (
                      <button
                        type="button"
                        className="admin-button-danger"
                        onClick={() => handleDeleteCustomer(customer)}
                      >
                        Xóa hồ sơ
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <AdminPagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              totalItems={filteredCustomers.length}
              pageSize={PAGE_SIZE}
              itemLabel="khách hàng"
            />
          </div>

          <aside className="admin-card rounded-[1.25rem] p-6">
            {selectedCustomer ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-admin-gold">
                      Chi tiết khách hàng
                    </p>
                    <h3 className="admin-title mt-2 text-2xl font-extrabold text-admin-ink">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">
                      {selectedCustomer.phoneNumber}
                    </p>
                  </div>
                  <span className={`admin-pill ${getCustomerStatusClass(selectedCustomer.status)}`}>
                    {getCustomerStatusLabel(selectedCustomer.status)}
                  </span>
                </div>

                {selectedCustomer.profileId ? (
                  <p className="mt-4 rounded-[0.9rem] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Đã có hồ sơ ghi chú riêng.
                  </p>
                ) : (
                  <p className="mt-4 rounded-[0.9rem] bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Khách này đang được gom từ booking. Bấm “Sửa hồ sơ” để lưu ghi chú riêng.
                  </p>
                )}

                {selectedCustomer.note ? (
                  <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-admin-steel">
                      Ghi chú
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-admin-ink">
                      {selectedCustomer.note}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-[0.9rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-admin-steel">
                      Lần tạo gần nhất
                    </p>
                    <p className="mt-1 font-bold text-admin-ink">
                      {formatDateTime(selectedCustomer.lastBookingAt)}
                    </p>
                  </div>
                  <div className="rounded-[0.9rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-admin-steel">
                      Booking đang mở
                    </p>
                    <p className="mt-1 font-bold text-admin-ink">
                      {selectedCustomer.activeBookingCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="admin-title text-lg font-extrabold text-admin-ink">
                    Lịch sử booking gần đây
                  </h4>
                  <div className="mt-4 space-y-3">
                    {selectedCustomer.bookings?.length ? (
                      selectedCustomer.bookings.map((booking) => (
                        <article
                          key={booking.id}
                          className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-extrabold text-admin-ink">
                                {formatRoute(booking)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-admin-steel">
                                {formatDateTime(booking.tripDate ?? booking.createdAt)}
                              </p>
                            </div>
                            <span className={`admin-pill ${getBookingStatusClass(booking.status)}`}>
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          {booking.assignedVehicle || booking.assignedDriver ? (
                            <p className="mt-3 text-xs font-semibold text-admin-steel">
                              {booking.assignedVehicle?.name ?? "Chưa gán xe"} ·{" "}
                              {booking.assignedDriver?.fullName ?? "Chưa gán tài xế"}
                            </p>
                          ) : null}
                          {booking.note ? (
                            <p className="mt-3 rounded-[0.8rem] bg-white px-3 py-2 text-xs text-admin-steel">
                              {booking.note}
                            </p>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-admin-steel">
                        Chưa có booking nào cho khách này.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-admin-steel">
                Chưa có khách hàng phù hợp bộ lọc.
              </p>
            )}
          </aside>
        </div>
      </section>
    </section>
  );
}
