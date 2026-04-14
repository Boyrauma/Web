const rateLimitStore = new Map();

function getClientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.ip ?? request.socket?.remoteAddress ?? "unknown";
}

function pruneExpiredEntries(now) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function createIpRateLimit({
  windowMs,
  maxRequests,
  message = "Too many requests"
}) {
  return function ipRateLimitMiddleware(request, response, next) {
    const now = Date.now();
    pruneExpiredEntries(now);

    const ip = getClientIp(request);
    const key = `${request.method}:${request.baseUrl}${request.path}:${ip}`;
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({
        message,
        retryAfter: retryAfterSeconds
      });
      return;
    }

    current.count += 1;
    rateLimitStore.set(key, current);
    next();
  };
}
