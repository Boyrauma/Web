export function errorHandler(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    return next(error);
  }

  return response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Internal server error"
  });
}
