export const BOOKING_STATUS_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Liên hệ" },
  { value: "scheduled", label: "Lên lịch" },
  { value: "cancelled", label: "Hủy" },
  { value: "completed", label: "Hoàn thành" }
];

export function getBookingStatusLabel(status) {
  return BOOKING_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getBookingStatusClass(status) {
  if (status === "new") return "bg-sky-50 text-sky-700";
  if (status === "contacted") return "bg-amber-50 text-amber-700";
  if (status === "scheduled") return "bg-indigo-50 text-indigo-700";
  if (status === "cancelled") return "bg-rose-50 text-rose-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

