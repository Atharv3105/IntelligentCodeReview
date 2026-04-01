const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  // if Joi validation error
  if (err.isJoi || err.details) {
    logger.warn("Validation error", { message: err.message });
    return res.status(err.status || 400).json({ message: err.message });
  }

  // custom status field (we added in register earlier)
  const status = err.status || 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ message: err.message || "Internal server error" });
};