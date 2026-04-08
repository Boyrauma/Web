export const BOOKING_STATUS_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "confirmed", label: "Đã chốt" },
  { value: "closed", label: "Đã đóng" }
];

export function getBookingStatusLabel(status) {
  return BOOKING_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getBookingStatusClass(status) {
  if (status === "new") return "bg-sky-50 text-sky-700";
  if (status === "contacted") return "bg-amber-50 text-amber-700";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "closed") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}
