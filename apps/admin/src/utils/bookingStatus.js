export const BOOKING_STATUS_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "called_back", label: "Đã liên hệ" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "assigned", label: "Đã phân công" },
  { value: "scheduled", label: "Đã lên lịch" },
  { value: "canceled", label: "Đã hủy" },
  { value: "completed", label: "Hoàn thành" }
];

export function getBookingStatusLabel(status) {
  if (status === "contacted") return "Đã liên hệ";
  if (status === "cancelled") return "Đã hủy";
  return BOOKING_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getBookingStatusClass(status) {
  if (status === "new") return "bg-sky-50 text-sky-700";
  if (status === "contacted") return "bg-amber-50 text-amber-700";
  if (status === "called_back") return "bg-amber-50 text-amber-700";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "assigned") return "bg-indigo-50 text-indigo-700";
  if (status === "scheduled") return "bg-indigo-50 text-indigo-700";
  if (status === "canceled") return "bg-rose-50 text-rose-700";
  if (status === "cancelled") return "bg-rose-50 text-rose-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}
