export function normalizePhoneKey(phoneNumber = "") {
  return String(phoneNumber ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}
