const recentIpSubmissionStore = new Map();
const recentPhoneSubmissionStore = new Map();

const IP_COOLDOWN_MS = 30 * 1000;
const PHONE_COOLDOWN_MS = 2 * 60 * 1000;
const MIN_CAPTCHA_AGE_MS = 4000;
const STORE_TTL_MS = Math.max(IP_COOLDOWN_MS, PHONE_COOLDOWN_MS) * 2;

function getClientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.ip ?? request.socket?.remoteAddress ?? "unknown";
}

function normalizePhoneNumber(value = "") {
  return String(value).replace(/\D/g, "");
}

function pruneExpiredEntries(now) {
  for (const [key, timestamp] of recentIpSubmissionStore.entries()) {
    if (timestamp + STORE_TTL_MS <= now) {
      recentIpSubmissionStore.delete(key);
    }
  }

  for (const [key, timestamp] of recentPhoneSubmissionStore.entries()) {
    if (timestamp + STORE_TTL_MS <= now) {
      recentPhoneSubmissionStore.delete(key);
    }
  }
}

export function validateBookingSubmissionTiming(issuedAt) {
  const normalizedIssuedAt = Number(issuedAt);

  if (!Number.isFinite(normalizedIssuedAt)) {
    return {
      ok: false,
      message: "Xác thực captcha không hợp lệ. Vui lòng thử lại."
    };
  }

  const elapsedMs = Date.now() - normalizedIssuedAt;

  if (elapsedMs < MIN_CAPTCHA_AGE_MS) {
    return {
      ok: false,
      message: "Yêu cầu gửi quá nhanh. Vui lòng chờ vài giây rồi thử lại."
    };
  }

  return { ok: true };
}

export function validateBookingCooldown(request, phoneNumber) {
  const now = Date.now();
  pruneExpiredEntries(now);

  const ip = getClientIp(request);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const recentIpSubmission = recentIpSubmissionStore.get(ip);

  if (recentIpSubmission && now - recentIpSubmission < IP_COOLDOWN_MS) {
    const retryAfter = Math.max(1, Math.ceil((IP_COOLDOWN_MS - (now - recentIpSubmission)) / 1000));
    return {
      ok: false,
      statusCode: 429,
      retryAfter,
      message: "Bạn vừa gửi booking xong. Vui lòng chờ một chút rồi thử lại."
    };
  }

  if (normalizedPhoneNumber) {
    const recentPhoneSubmission = recentPhoneSubmissionStore.get(normalizedPhoneNumber);

    if (recentPhoneSubmission && now - recentPhoneSubmission < PHONE_COOLDOWN_MS) {
      const retryAfter = Math.max(
        1,
        Math.ceil((PHONE_COOLDOWN_MS - (now - recentPhoneSubmission)) / 1000)
      );
      return {
        ok: false,
        statusCode: 429,
        retryAfter,
        message: "Số điện thoại này vừa gửi yêu cầu. Vui lòng chờ ít phút rồi thử lại."
      };
    }
  }

  recentIpSubmissionStore.set(ip, now);
  if (normalizedPhoneNumber) {
    recentPhoneSubmissionStore.set(normalizedPhoneNumber, now);
  }

  return { ok: true };
}
