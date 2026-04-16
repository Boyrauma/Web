import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdminAuth } from "../middlewares/authMiddleware.js";
import {
  ADMIN_AUTH_COOKIE,
  buildAdminAuthCookieOptions,
  comparePassword,
  hashPassword,
  signAdminToken
} from "../utils/auth.js";

const router = Router();
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"]
  });

function getLoginAttemptKey(request, email) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : request.ip;

  return `${ip}:${email.toLowerCase()}`;
}

function readLoginAttemptState(key) {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current) {
    return null;
  }

  if (current.blockedUntil && current.blockedUntil > now) {
    return current;
  }

  if (current.windowStartedAt + LOGIN_WINDOW_MS <= now) {
    loginAttempts.delete(key);
    return null;
  }

  return current;
}

function registerFailedLogin(key) {
  const now = Date.now();
  const current = readLoginAttemptState(key);

  if (!current) {
    loginAttempts.set(key, {
      attempts: 1,
      windowStartedAt: now,
      blockedUntil: null
    });
    return;
  }

  const attempts = current.attempts + 1;
  loginAttempts.set(key, {
    attempts,
    windowStartedAt: current.windowStartedAt,
    blockedUntil: attempts >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_BLOCK_MS : null
  });
}

function clearFailedLogins(key) {
  loginAttempts.delete(key);
}

router.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid login payload",
      errors: parsed.error.flatten()
    });
  }

  const attemptKey = getLoginAttemptKey(request, parsed.data.email);
  const attemptState = readLoginAttemptState(attemptKey);

  if (attemptState?.blockedUntil && attemptState.blockedUntil > Date.now()) {
    const retryAfterSeconds = Math.ceil((attemptState.blockedUntil - Date.now()) / 1000);
    response.setHeader("Retry-After", String(retryAfterSeconds));
    return response.status(429).json({
      message: "Too many login attempts. Please try again later."
    });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email }
  });

  if (!admin || !admin.isActive) {
    registerFailedLogin(attemptKey);
    return response.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await comparePassword(
    parsed.data.password,
    admin.passwordHash
  );

  if (!isValidPassword) {
    registerFailedLogin(attemptKey);
    return response.status(401).json({ message: "Invalid credentials" });
  }

  clearFailedLogins(attemptKey);

  const token = signAdminToken(admin);
  response.cookie(ADMIN_AUTH_COOKIE, token, buildAdminAuthCookieOptions());

  return response.json({
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    }
  });
});

router.get("/me", requireAdminAuth, async (request, response) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: request.admin.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  if (!admin) {
    return response.status(404).json({ message: "Admin not found" });
  }

  const token = signAdminToken(admin);
  response.cookie(ADMIN_AUTH_COOKIE, token, buildAdminAuthCookieOptions());

  return response.json({
    admin
  });
});

router.post("/change-password", requireAdminAuth, async (request, response) => {
  const parsed = changePasswordSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid password payload",
      errors: parsed.error.flatten()
    });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: request.admin.sub }
  });

  if (!admin) {
    return response.status(404).json({ message: "Admin not found" });
  }

  const isValidPassword = await comparePassword(
    parsed.data.currentPassword,
    admin.passwordHash
  );

  if (!isValidPassword) {
    return response.status(400).json({ message: "Current password is incorrect" });
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return response.status(400).json({
      message: "New password must be different from current password"
    });
  }

  const updatedAdmin = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword)
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  const token = signAdminToken(updatedAdmin);
  response.cookie(ADMIN_AUTH_COOKIE, token, buildAdminAuthCookieOptions());

  return response.json({ message: "Password updated successfully" });
});

router.post("/logout", (request, response) => {
  response.clearCookie(ADMIN_AUTH_COOKIE, {
    ...buildAdminAuthCookieOptions(),
    maxAge: undefined
  });

  return response.status(204).send();
});

export default router;
