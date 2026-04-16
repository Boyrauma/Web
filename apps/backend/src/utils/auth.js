import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const ADMIN_AUTH_COOKIE = "dinhdung_admin_session";

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
      sessionIssuedAt: Date.now()
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyAdminToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function buildAdminAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}
