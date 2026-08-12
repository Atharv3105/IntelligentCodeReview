// ============================================================================
// Health Controller
// ============================================================================

const prisma = require("../config/prisma");
const Redis = require("ioredis");
const aiGateway = require("../services/ai-gateway");
const judgeService = require("../services/judge");
const { asyncHandler } = require("../middleware/error.middleware");
const fs = require("fs");
const path = require("path");

exports.getHealth = asyncHandler(async (req, res) => {
  res.json({ status: "ok", service: "AI Interview Intelligence Platform", timestamp: new Date().toISOString() });
});

exports.getDatabaseHealth = asyncHandler(async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy", service: "PostgreSQL" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", service: "PostgreSQL", error: err.message });
  }
});

exports.getRedisHealth = asyncHandler(async (req, res) => {
  try {
    const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    res.json({ status: "healthy", service: "Redis" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", service: "Redis", error: err.message });
  }
});

exports.getAIHealth = asyncHandler(async (req, res) => {
  const health = await aiGateway.healthCheck();
  const status = health.status === "healthy" ? 200 : health.status === "unconfigured" ? 200 : 503;
  res.status(status).json({ ...health, service: "AI Provider" });
});

exports.getJudgeHealth = asyncHandler(async (req, res) => {
  const health = await judgeService.healthCheck();
  const status = health.status === "healthy" ? 200 : 503;
  res.status(status).json({ ...health, service: "Judge0" });
});

exports.getStorageHealth = asyncHandler(async (req, res) => {
  try {
    const storagePath = path.resolve(process.env.STORAGE_PATH || "./storage");
    const exists = fs.existsSync(storagePath);
    const writable = exists && (() => {
      try { fs.accessSync(storagePath, fs.constants.W_OK); return true; } catch { return false; }
    })();
    res.json({ status: exists && writable ? "healthy" : "unhealthy", service: "Local Storage", path: storagePath, exists, writable });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", service: "Local Storage", error: err.message });
  }
});

exports.getFullHealth = asyncHandler(async (req, res) => {
  const checks = {};

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy" };
  } catch (err) {
    checks.database = { status: "unhealthy", error: err.message };
  }

  // Redis
  try {
    const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    checks.redis = { status: "healthy" };
  } catch (err) {
    checks.redis = { status: "unhealthy", error: err.message };
  }

  // AI
  checks.ai = await aiGateway.healthCheck();

  // Judge
  checks.judge = await judgeService.healthCheck();

  // Storage
  const storagePath = path.resolve(process.env.STORAGE_PATH || "./storage");
  checks.storage = { status: fs.existsSync(storagePath) ? "healthy" : "unhealthy" };

  const allHealthy = Object.values(checks).every((c) => c.status === "healthy" || c.status === "unconfigured");
  res.status(allHealthy ? 200 : 503).json({ status: allHealthy ? "healthy" : "degraded", services: checks, timestamp: new Date().toISOString() });
});
