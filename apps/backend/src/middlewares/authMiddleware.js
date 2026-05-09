import { prisma } from "../config/prisma.js";
import { ADMIN_AUTH_COOKIE, verifyAdminToken } from "../utils/auth.js";
import { adminHasPermission } from "../utils/adminPermissions.js";

export async function requireAdminAuth(request, response, next) {
  const authHeader = request.headers.authorization ?? "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const cookieToken =
    typeof request.cookies?.[ADMIN_AUTH_COOKIE] === "string"
      ? request.cookies[ADMIN_AUTH_COOKIE]
      : null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = verifyAdminToken(token);
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        isActive: true,
        updatedAt: true
      }
    });

    if (!admin || !admin.isActive) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const tokenIssuedAt = typeof payload.sessionIssuedAt === "number"
      ? payload.sessionIssuedAt
      : typeof payload.iat === "number"
        ? payload.iat * 1000
        : 0;
    const adminUpdatedAt = new Date(admin.updatedAt).getTime();

    if (tokenIssuedAt < adminUpdatedAt) {
      return response.status(401).json({ message: "Session expired" });
    }

    request.admin = {
      ...payload,
      sub: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions ?? []
    };
    return next();
  } catch (error) {
    return response.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdminPermission(...requiredPermissions) {
  return function checkAdminPermission(request, response, next) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      adminHasPermission(request.admin, permission)
    );

    if (!hasAllPermissions) {
      return response.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này."
      });
    }

    return next();
  };
}

export function requireAdminRole(...allowedRoles) {
  return function checkAdminRole(request, response, next) {
    const currentRole = request.admin?.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return response.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này."
      });
    }

    return next();
  };
}
