const Queue = require('bull');

// use REDIS_URL env var or default localhost
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const submissionQueue = new Queue('submission', redisUrl);

module.exports = submissionQueue;