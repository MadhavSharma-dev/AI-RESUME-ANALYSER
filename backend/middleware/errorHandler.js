import logger from "../utils/logger.js";

/**
 * Global error handler — catches all unhandled errors from routes/middleware.
 * Returns a generic message to the client; logs the full error server-side.
 * Never leaks stack traces, internal file paths, or DB error details.
 */
const errorHandler = (err, req, res, _next) => {
  // If response already started, delegate to Express default
  if (res.headersSent) {
    return _next(err);
  }

  const statusCode = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

  // Log full error details server-side
  logger.error({
    err: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    statusCode
  }, "Unhandled error");

  res.status(statusCode).json({
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message || "An unexpected error occurred"
  });
};

export default errorHandler;
