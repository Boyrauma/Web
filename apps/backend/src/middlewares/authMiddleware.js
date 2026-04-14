import { prisma } from "../config/prisma.js";
import { ADMIN_AUTH_COOKIE, verifyAdminToken } from "../utils/auth.js";

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
        isActive: true
      }
    });

    if (!admin || !admin.isActive) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    request.admin = {
      ...payload,
      sub: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    };
    return next();
  } catch (error) {
    return response.status(401).json({ message: "Invalid token" });
  }
}
