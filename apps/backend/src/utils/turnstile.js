import { env } from "../config/env.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken({ token, remoteIp }) {
  if (!env.turnstileEnabled) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      ok: false,
      statusCode: 400,
      message: "Vui lòng hoàn tất xác thực Cloudflare trước khi gửi."
    };
  }

  const requestBody = new URLSearchParams({
    secret: env.turnstileSecretKey,
    response: token.trim()
  });

  if (remoteIp) {
    requestBody.set("remoteip", remoteIp);
  }

  let verificationResponse;

  try {
    verificationResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: requestBody.toString()
    });
  } catch {
    return {
      ok: false,
      statusCode: 503,
      message: "Không thể xác minh chống bot lúc này. Vui lòng thử lại sau ít phút."
    };
  }

  let verificationData = null;

  try {
    verificationData = await verificationResponse.json();
  } catch {
    verificationData = null;
  }

  if (!verificationResponse.ok) {
    return {
      ok: false,
      statusCode: 503,
      message: "Không thể xác minh chống bot lúc này. Vui lòng thử lại sau ít phút."
    };
  }

  if (verificationData?.success) {
    return { ok: true };
  }

  const errorCodes = Array.isArray(verificationData?.["error-codes"])
    ? verificationData["error-codes"]
    : [];

  if (errorCodes.includes("timeout-or-duplicate")) {
    return {
      ok: false,
      statusCode: 400,
      message: "Phiên xác thực Cloudflare đã hết hạn. Vui lòng xác thực lại trước khi gửi."
    };
  }

  return {
    ok: false,
    statusCode: 400,
    message: "Xác thực Cloudflare không hợp lệ. Vui lòng thử lại."
  };
}
