const pino = require('pino');

// replaceable logger - writes to stdout
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;