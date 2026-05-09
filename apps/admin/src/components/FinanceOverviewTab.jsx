import { useMemo, useState } from "react";

const expenseTypeOptions = [
  { value: "fuel", label: "Dầu xe" },
  { value: "toll", label: "Cầu đường" },
  { value: "parking", label: "Gửi xe" },
  { value: "driver_meal", label: "Ăn nghỉ tài xế" },
  { value: "repair", label: "Sửa chữa phát sinh" },
  { value: "other", label: "Chi phí khác" }
];

function getExpenseTypeLabel(value) {
  return expenseTypeOptions.find((item) => item.value === value)?.label ?? value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
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

function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function getMonthKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthOptions({ payments, expenses }) {
  const keys = new Set([getMonthKey(new Date())]);

  [...payments.map((item) => item.tripDate ?? item.collectedAt ?? item.createdAt), ...expenses.map((item) => item.expenseDate ?? item.createdAt)]
    .map(getMonthKey)
    .filter(Boolean)
    .forEach((key) => keys.add(key));

  return [...keys]
    .sort((left, right) => right.localeCompare(left))
    .map((value) => {
      const [year, month] = value.split("-");
      return { value, label: `Tháng ${month}/${year}` };
    });
}

function getPaymentVehicleId(payment) {
  return payment.vehicleId ?? payment.vehicle?.id ?? payment.scheduleNote?.vehicleId ?? "";
}

function buildVehicleProfitRows({ payments, expenses, vehicles }) {
  const map = new Map(
    vehicles.map((vehicle) => [
      vehicle.id,
      {
        id: vehicle.id,
        name: vehicle.name,
        revenue: 0,
        receivable: 0,
        expense: 0,
        profit: 0
      }
    ])
  );

  for (const payment of payments) {
    const vehicleId = getPaymentVehicleId(payment);
    if (!vehicleId) continue;
    const current = map.get(vehicleId) ?? {
      id: vehicleId,
      name: payment.vehicle?.name ?? payment.scheduleNote?.vehicle?.name ?? "Xe chưa rõ",
      revenue: 0,
      receivable: 0,
      expense: 0,
      profit: 0
    };

    if (payment.paymentStatus === "paid") {
      current.revenue += Number(payment.amount || 0);
    } else {
      current.receivable += Number(payment.amount || 0);
    }

    map.set(vehicleId, current);
  }

  for (const expense of expenses) {
    const vehicleId = expense.vehicleId ?? expense.vehicle?.id ?? "";
    if (!vehicleId) continue;
    const current = map.get(vehicleId) ?? {
      id: vehicleId,
      name: expense.vehicle?.name ?? "Xe chưa rõ",
      revenue: 0,
      receivable: 0,
      expense: 0,
      profit: 0
    };

    current.expense += Number(expense.amount || 0);
    map.set(vehicleId, current);
  }

  return [...map.values()]
    .map((item) => ({ ...item, profit: item.revenue - item.expense }))
    .filter((item) => item.revenue || item.receivable || item.expense)
    .sort((left, right) => right.profit - left.profit);
}

export default function FinanceOverviewTab({
  payments,
  expenses,
  trips,
  vehicles,
  bookings,
  expenseForm,
  editingExpenseId,
  savingExpense,
  handleExpenseFormChange,
  handleCreateExpense,
  handleEditExpense,
  handleDeleteExpense,
  resetExpenseForm
}) {
  const monthOptions = useMemo(() => buildMonthOptions({ payments, expenses }), [expenses, payments]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? getMonthKey(new Date()));
  const [keyword, setKeyword] = useState("");

  const scopedPayments = useMemo(
    () => payments.filter((item) => getMonthKey(item.tripDate ?? item.collectedAt ?? item.createdAt) === selectedMonth),
    [payments, selectedMonth]
  );
  const scopedExpenses = useMemo(
    () => expenses.filter((item) => getMonthKey(item.expenseDate ?? item.createdAt) === selectedMonth),
    [expenses, selectedMonth]
  );
  const filteredExpenses = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return scopedExpenses;

    return scopedExpenses.filter((item) =>
      [
        item.title,
        item.expenseType,
        item.vehicle?.name,
        item.trip?.title,
        item.bookingRequest?.customerName,
        item.paidBy,
        item.note
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [keyword, scopedExpenses]);

  const paidRevenue = useMemo(
    () =>
      scopedPayments
        .filter((item) => item.paymentStatus === "paid")
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [scopedPayments]
  );
  const receivable = useMemo(
    () =>
      scopedPayments
        .filter((item) => item.paymentStatus !== "paid")
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [scopedPayments]
  );
  const totalExpense = useMemo(
    () => scopedExpenses.reduce((total, item) => total + Number(item.amount || 0), 0),
    [scopedExpenses]
  );
  const profit = paidRevenue - totalExpense;
  const vehicleRows = useMemo(
    () => buildVehicleProfitRows({ payments: scopedPayments, expenses: scopedExpenses, vehicles }),
    [scopedExpenses, scopedPayments, vehicles]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Đã thu</p>
          <p className="admin-title mt-4 text-3xl font-extrabold text-admin-ink">{formatCurrency(paidRevenue)}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Còn phải thu</p>
          <p className="admin-title mt-4 text-3xl font-extrabold text-admin-ink">{formatCurrency(receivable)}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Tổng chi</p>
          <p className="admin-title mt-4 text-3xl font-extrabold text-admin-ink">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">Lợi nhuận tạm tính</p>
          <p className={`admin-title mt-4 text-3xl font-extrabold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatCurrency(profit)}
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
            {editingExpenseId ? "Cập nhật chi phí" : "Thêm chi phí chuyến"}
          </h3>
          <p className="mt-2 text-sm text-admin-steel">
            Ghi dầu xe, cầu đường, ăn nghỉ tài xế và các khoản phát sinh để tính lãi thực tế.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateExpense}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tiêu đề</span>
              <input className="admin-field" name="title" value={expenseForm.title} onChange={handleExpenseFormChange} placeholder="Ví dụ: Dầu xe chuyến Nội Bài" />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Loại chi phí</span>
                <select className="admin-select" name="expenseType" value={expenseForm.expenseType} onChange={handleExpenseFormChange}>
                  {expenseTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Số tiền</span>
                <input className="admin-field" type="number" min="0" name="amount" value={expenseForm.amount} onChange={handleExpenseFormChange} required />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Thời gian chi</span>
              <input className="admin-field" type="datetime-local" name="expenseDate" value={expenseForm.expenseDate} onChange={handleExpenseFormChange} />
            </label>

            <details className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-extrabold text-admin-ink">
                Thông tin gắn kèm (không bắt buộc)
              </summary>

              <div className="mt-4 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Chuyến đi</span>
                  <select className="admin-select" name="tripId" value={expenseForm.tripId} onChange={handleExpenseFormChange}>
                    <option value="">Không gắn chuyến</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>{trip.title} · {formatDateTime(trip.tripDate)}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Booking</span>
                  <select className="admin-select" name="bookingRequestId" value={expenseForm.bookingRequestId} onChange={handleExpenseFormChange}>
                    <option value="">Không gắn booking</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>{booking.customerName} · {formatDateTime(booking.tripDate)}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Xe</span>
                  <select className="admin-select" name="vehicleId" value={expenseForm.vehicleId} onChange={handleExpenseFormChange}>
                    <option value="">Không gắn xe</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Người chi</span>
                  <input className="admin-field" name="paidBy" value={expenseForm.paidBy} onChange={handleExpenseFormChange} placeholder="Ví dụ: điều hành / tài xế" />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-admin-ink">Ghi chú</span>
                  <textarea className="admin-field admin-textarea" name="note" value={expenseForm.note} onChange={handleExpenseFormChange} placeholder="Ghi chú nội bộ" />
                </label>
              </div>
            </details>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="admin-button-primary" disabled={savingExpense}>
                {savingExpense ? "Đang lưu..." : editingExpenseId ? "Lưu thay đổi" : "Thêm chi phí"}
              </button>
              <button type="button" className="admin-button-ghost" onClick={resetExpenseForm} disabled={savingExpense}>Làm mới</button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="admin-card rounded-[1.25rem] p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Chi phí và lợi nhuận</h3>
                <p className="mt-2 text-sm text-admin-steel">Theo dõi thu, chi và lãi tạm tính theo tháng.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="admin-select" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input className="admin-field" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm chi phí..." />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredExpenses.map((expense) => (
                <article key={expense.id} className="rounded-[1.1rem] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-admin-ink">{expense.title}</p>
                      <p className="mt-1 text-sm font-semibold text-admin-steel">
                        {getExpenseTypeLabel(expense.expenseType)} · {formatDateTime(expense.expenseDate)}
                      </p>
                    </div>
                    <span className="admin-pill bg-rose-100 text-rose-700">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <span className="rounded-[0.9rem] bg-white px-4 py-3 font-semibold text-admin-ink">{expense.vehicle?.name ?? "Chưa gắn xe"}</span>
                    <span className="rounded-[0.9rem] bg-white px-4 py-3 font-semibold text-admin-ink">{expense.trip?.title ?? "Chưa gắn chuyến"}</span>
                    <span className="rounded-[0.9rem] bg-white px-4 py-3 font-semibold text-admin-ink">{expense.paidBy || "Chưa ghi người chi"}</span>
                  </div>
                  {expense.note ? <p className="mt-4 rounded-[0.9rem] bg-white px-4 py-3 text-sm text-admin-steel">{expense.note}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="admin-button-secondary" onClick={() => handleEditExpense(expense)}>Sửa</button>
                    <button type="button" className="admin-button-danger" onClick={() => handleDeleteExpense(expense.id)}>Xóa</button>
                  </div>
                </article>
              ))}
              {!filteredExpenses.length ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-admin-steel">
                  Chưa có chi phí nào trong tháng này.
                </div>
              ) : null}
            </div>
          </div>

          <div className="admin-card rounded-[1.25rem] p-6">
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Lãi theo xe</h3>
            <div className="mt-5 space-y-3">
              {vehicleRows.map((row) => (
                <div key={row.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-extrabold text-admin-ink">{row.name}</p>
                    <span className={`admin-pill ${row.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      Lãi: {formatCurrency(row.profit)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-admin-steel">
                    Thu {formatCurrency(row.revenue)} · Chưa thu {formatCurrency(row.receivable)} · Chi {formatCurrency(row.expense)}
                  </p>
                </div>
              ))}
              {!vehicleRows.length ? (
                <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-admin-steel">
                  Chưa có dữ liệu thu/chi theo xe.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export { expenseTypeOptions, toDateTimeInputValue as toExpenseDateInputValue };
