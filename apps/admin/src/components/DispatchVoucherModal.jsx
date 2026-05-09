import {
  escapeHtml,
  formatExportDateTime,
  openPrintDocument
} from "../utils/documentExport";

function formatRoute(item) {
  return `${item.pickupLocation || "Chưa có điểm đón"} → ${item.dropoffLocation || "Chưa có điểm trả"}`;
}

function getVoucherData(voucher) {
  const item = voucher?.item;
  if (!item) return null;

  if (voucher.type === "trip") {
    return {
      title: item.title || "Phiếu điều xe",
      code: item.id,
      date: item.tripDate,
      customerName: (item.bookings ?? []).map((booking) => booking.customerName).join(", ") || "Chưa gắn booking",
      phoneNumber: (item.bookings ?? []).map((booking) => booking.phoneNumber).filter(Boolean).join(", ") || "Chưa có số điện thoại",
      route: formatRoute(item),
      vehicleName: item.vehicle?.name || "Chưa gán xe",
      driverName: item.driver?.fullName || "Chưa gán tài xế",
      driverPhone: item.driver?.phoneNumber || "Chưa có số tài xế",
      status: item.status || "draft",
      note: item.note || "",
      bookings: item.bookings ?? []
    };
  }

  return {
    title: `Phiếu xác nhận chuyến - ${item.customerName || "Khách hàng"}`,
    code: item.id,
    date: item.tripDate,
    customerName: item.customerName || "Chưa có tên khách",
    phoneNumber: item.phoneNumber || "Chưa có số điện thoại",
    route: formatRoute(item),
    vehicleName: item.assignedVehicle?.name || "Chưa gán xe",
    driverName: item.assignedDriver?.fullName || "Chưa gán tài xế",
    driverPhone: item.assignedDriver?.phoneNumber || "Chưa có số tài xế",
    status: item.status || "new",
    note: item.internalNote || item.note || "",
    bookings: [item]
  };
}

function buildPrintHtml(data) {
  const bookingRows = data.bookings.length
    ? data.bookings
        .map(
          (booking, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(booking.customerName || "Chưa có tên")}</td>
              <td>${escapeHtml(booking.phoneNumber || "Chưa có số")}</td>
              <td>${escapeHtml(booking.pickupLocation || "Chưa có điểm đón")}</td>
              <td>${escapeHtml(booking.dropoffLocation || "Chưa có điểm trả")}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">Chưa có booking trong phiếu này.</td></tr>`;

  return `
    <p class="brand">Nhà xe Định Dung</p>
    <h1>${escapeHtml(data.title)}</h1>
    <p>Mã phiếu: ${escapeHtml(data.code)} · Ngày xuất: ${escapeHtml(formatExportDateTime(new Date()))}</p>

    <div class="grid">
      <div class="box">
        <p class="label">Thời gian chạy</p>
        <p class="value">${escapeHtml(formatExportDateTime(data.date))}</p>
      </div>
      <div class="box">
        <p class="label">Trạng thái</p>
        <p class="value">${escapeHtml(data.status)}</p>
      </div>
      <div class="box">
        <p class="label">Khách hàng</p>
        <p class="value">${escapeHtml(data.customerName)}</p>
      </div>
      <div class="box">
        <p class="label">Số điện thoại</p>
        <p class="value">${escapeHtml(data.phoneNumber)}</p>
      </div>
      <div class="box">
        <p class="label">Xe</p>
        <p class="value">${escapeHtml(data.vehicleName)}</p>
      </div>
      <div class="box">
        <p class="label">Tài xế</p>
        <p class="value">${escapeHtml(data.driverName)} · ${escapeHtml(data.driverPhone)}</p>
      </div>
    </div>

    <h2>Lộ trình</h2>
    <p>${escapeHtml(data.route)}</p>

    <h2>Danh sách khách / điểm đón trả</h2>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Khách</th>
          <th>Số điện thoại</th>
          <th>Điểm đón</th>
          <th>Điểm trả</th>
        </tr>
      </thead>
      <tbody>${bookingRows}</tbody>
    </table>

    <h2>Ghi chú điều hành</h2>
    <p>${escapeHtml(data.note || "Không có ghi chú.")}</p>
  `;
}

function buildCopyText(data) {
  return [
    `PHIẾU ĐIỀU XE - NHÀ XE ĐỊNH DUNG`,
    `Mã phiếu: ${data.code}`,
    `Thời gian: ${formatExportDateTime(data.date)}`,
    `Khách hàng: ${data.customerName}`,
    `Số điện thoại: ${data.phoneNumber}`,
    `Lộ trình: ${data.route}`,
    `Xe: ${data.vehicleName}`,
    `Tài xế: ${data.driverName} - ${data.driverPhone}`,
    `Ghi chú: ${data.note || "Không có"}`
  ].join("\n");
}

export default function DispatchVoucherModal({ voucher, onClose }) {
  const data = getVoucherData(voucher);
  if (!data) return null;

  function handlePrint() {
    openPrintDocument(data.title, buildPrintHtml(data));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyText(data));
      window.alert("Đã sao chép nội dung phiếu.");
    } catch {
      window.alert("Không thể sao chép tự động. Hãy dùng nút In / Lưu PDF.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
              Phiếu điều xe
            </p>
            <h3 className="admin-title mt-2 text-2xl font-extrabold text-admin-ink">
              {data.title}
            </h3>
            <p className="mt-1 text-sm text-admin-steel">
              Dùng để xác nhận nội bộ, in giấy hoặc lưu thành PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-button-ghost" onClick={handleCopy}>
              Sao chép
            </button>
            <button type="button" className="admin-button-secondary" onClick={handlePrint}>
              In / Lưu PDF
            </button>
            <button type="button" className="admin-button-danger" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>

        <div className="admin-scrollbar max-h-[calc(92vh-112px)] overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Thời gian
              </p>
              <p className="mt-2 text-sm font-extrabold text-admin-ink">
                {formatExportDateTime(data.date)}
              </p>
            </div>
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Khách
              </p>
              <p className="mt-2 text-sm font-extrabold text-admin-ink">{data.customerName}</p>
            </div>
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Xe
              </p>
              <p className="mt-2 text-sm font-extrabold text-admin-ink">{data.vehicleName}</p>
            </div>
            <div className="rounded-[1rem] bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Tài xế
              </p>
              <p className="mt-2 text-sm font-extrabold text-admin-ink">{data.driverName}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Lộ trình
            </p>
            <p className="mt-3 text-base font-extrabold leading-7 text-admin-ink">
              {data.route}
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">Điểm đón</th>
                  <th className="px-4 py-3">Điểm trả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 font-bold text-admin-ink">
                      {booking.customerName || "Chưa có tên"}
                    </td>
                    <td className="px-4 py-3 text-admin-steel">
                      {booking.phoneNumber || "Chưa có số"}
                    </td>
                    <td className="px-4 py-3 text-admin-steel">
                      {booking.pickupLocation || "Chưa có điểm đón"}
                    </td>
                    <td className="px-4 py-3 text-admin-steel">
                      {booking.dropoffLocation || "Chưa có điểm trả"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Ghi chú
            </p>
            <p className="mt-3 text-sm leading-7 text-admin-steel">
              {data.note || "Không có ghi chú."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
