import crypto from "crypto";
import { env } from "../config/env.js";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", env.jwtSecret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createBookingCaptchaChallenge() {
  const left = crypto.randomInt(1, 10);
  const right = crypto.randomInt(1, 10);
  const now = Date.now();
  const payload = {
    left,
    right,
    nonce: crypto.randomUUID(),
    iat: now,
    exp: now + CAPTCHA_TTL_MS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    prompt: `${left} + ${right} = ?`,
    token: `${encodedPayload}.${signature}`
  };
}

export function verifyBookingCaptcha({ token, answer }) {
  if (!token || typeof token !== "string") {
    return { ok: false };
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { ok: false };
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { ok: false };
  }

  let payload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return { ok: false };
  }

  if (!payload || payload.exp < Date.now()) {
    return { ok: false };
  }

  const normalizedAnswer = Number(answer);
  if (!Number.isInteger(normalizedAnswer)) {
    return { ok: false };
  }

  return {
    ok: normalizedAnswer === Number(payload.left) + Number(payload.right),
    issuedAt: Number(payload.iat),
    expiresAt: Number(payload.exp)
  };
}
