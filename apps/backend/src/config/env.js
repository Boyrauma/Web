import dotenv from "dotenv";

dotenv.config();

const isProduction = (process.env.NODE_ENV ?? "development") === "production";
const rawJwtSecret = process.env.JWT_SECRET ?? "";
const rawCorsOrigins = process.env.CORS_ORIGINS ?? "";
const rawTurnstileSiteKey = (process.env.TURNSTILE_SITE_KEY ?? "").trim();
const rawTurnstileSecretKey = (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
const defaultDevCorsOrigins = ["http://localhost:5173", "http://localhost:5174"];

if (!rawJwtSecret || rawJwtSecret === "change-this-secret" || rawJwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET must be set to a strong secret with at least 32 characters before the backend can start."
  );
}

const resolvedCorsOrigins = rawCorsOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && resolvedCorsOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must be configured explicitly in production.");
}

if ((rawTurnstileSiteKey && !rawTurnstileSecretKey) || (!rawTurnstileSiteKey && rawTurnstileSecretKey)) {
  throw new Error("TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.");
}

const turnstileEnabled = isProduction && Boolean(rawTurnstileSiteKey && rawTurnstileSecretKey);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.BACKEND_PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? "",
  publicSiteUrl: (
    process.env.PUBLIC_SITE_URL ?? (isProduction ? "https://nhaxedinhdung.vn" : "")
  ).trim(),
  frontendInternalUrl: (
    process.env.FRONTEND_INTERNAL_URL ??
    (isProduction ? "http://frontend:80" : "http://127.0.0.1:5173")
  ).replace(/\/$/, ""),
  jwtSecret: rawJwtSecret,
  corsOrigins: resolvedCorsOrigins.length ? resolvedCorsOrigins : defaultDevCorsOrigins,
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  turnstileEnabled,
  turnstileSiteKey: rawTurnstileSiteKey,
  turnstileSecretKey: rawTurnstileSecretKey
};
