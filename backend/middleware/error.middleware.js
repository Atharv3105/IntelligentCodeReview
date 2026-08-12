// ============================================================================
// Error Handling Middleware
// ============================================================================

/**
 * Centralized error handler.
 * Returns structured error responses. Never exposes stack traces.
 */
function errorHandler(err, req, res, next) {
  // Default status and code
  let status = err.status || err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "An unexpected error occurred.";

  // Prisma errors
  if (err.code === "P2002") {
    status = 409;
    code = "DUPLICATE_ENTRY";
    const field = err.meta?.target?.[0] || "field";
    message = `A record with this ${field} already exists.`;
  } else if (err.code === "P2025") {
    status = 404;
    code = "NOT_FOUND";
    message = "The requested resource was not found.";
  } else if (err.code === "P2003") {
    status = 400;
    code = "FOREIGN_KEY_ERROR";
    message = "Referenced record does not exist.";
  }

  // Validation errors (Joi/Zod)
  if (err.isJoi || err.name === "ZodError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = err.details?.[0]?.message || err.errors?.[0]?.message || "Validation failed.";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    status = 401;
    code = "INVALID_TOKEN";
    message = "Invalid authentication token.";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    code = "TOKEN_EXPIRED";
    message = "Authentication token has expired.";
  }

  // AI errors
  if (err.code === "AI_NOT_CONFIGURED") {
    status = 503;
  } else if (err.code === "AI_RATE_LIMITED") {
    status = 429;
  } else if (err.code === "JUDGE_UNAVAILABLE") {
    status = 503;
  }

  // Log server errors
  if (status >= 500) {
    console.error(`[ERROR] ${req.requestId || "no-id"} ${req.method} ${req.url}:`, err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId: req.requestId || undefined,
    },
  });
}

/**
 * Async handler wrapper to catch promise rejections.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };