import { verifyAdminToken } from "../utils/auth.js";

export function requireAdminAuth(request, response, next) {
  const authHeader = request.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = verifyAdminToken(token);
    request.admin = payload;
    return next();
  } catch (error) {
    return response.status(401).json({ message: "Invalid token" });
  }
}
