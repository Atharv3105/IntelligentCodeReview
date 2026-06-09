const Queue = require('bull');

// use REDIS_URL env var or default localhost
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const queueOptions = {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
};

// For secure Upstash connections (rediss://)
if (redisUrl.startsWith('rediss://')) {
  queueOptions.redis.tls = {
    rejectUnauthorized: false
  };
}

const submissionQueue = new Queue('submission', redisUrl, queueOptions);

module.exports = submissionQueue;