const logger = require("../utils/logger");

const fs = require("fs");
const path = require("path");

module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  
  // Log to file if it's a 500 error
  if (status === 500) {
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\nError: ${err.message}\nStack: ${err.stack}\nBody: ${JSON.stringify(req.body)}\n---\n`;
    try {
      fs.appendFileSync(path.join(__dirname, "../error_debug.log"), logEntry);
    } catch (fsErr) {
      console.error("Critical: Failed to write to error_debug.log", fsErr);
    }
  }

  // if Joi validation error
  if (err.isJoi || err.details) {
    logger.warn("Validation error", { message: err.message });
    return res.status(err.status || 400).json({ message: err.message });
  }

  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ message: err.message || "Internal server error" });
};