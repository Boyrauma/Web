import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdminAuth } from "../middlewares/authMiddleware.js";
import { comparePassword, hashPassword, signAdminToken } from "../utils/auth.js";

const router = Router();

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

router.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid login payload",
      errors: parsed.error.flatten()
    });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email }
  });

  if (!admin || !admin.isActive) {
    return response.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await comparePassword(
    parsed.data.password,
    admin.passwordHash
  );

  if (!isValidPassword) {
    return response.status(401).json({ message: "Invalid credentials" });
  }

  const token = signAdminToken(admin);

  return response.json({
    token,
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
      isActive: true
    }
  });

  if (!admin) {
    return response.status(404).json({ message: "Admin not found" });
  }

  return response.json(admin);
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

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword)
    }
  });

  return response.json({ message: "Password updated successfully" });
});

export default router;
