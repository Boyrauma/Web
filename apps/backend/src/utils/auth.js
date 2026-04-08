import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

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
      fullName: admin.fullName
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyAdminToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
