import { env } from "../config/env.js";

export function errorHandler(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    return next(error);
  }

  const isSafeClientError = (error.statusCode ?? 500) < 500;
  const message = isSafeClientError || env.nodeEnv !== "production"
    ? error.message ?? "Internal server error"
    : "Internal server error";

  return response.status(error.statusCode ?? 500).json({
    message
  });
}
