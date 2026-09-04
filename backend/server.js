// ============================================================================
// AI Interview Intelligence Platform — Server Entry Point
// ============================================================================

require("dotenv").config();

// Enable clean serialization of BigInt values in JSON.stringify / Prisma / Express
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

const { validateEnv, getConfig } = require("./config/env");
const prisma = require("./config/prisma");
const socketService = require("./services/socket.service");
const { errorHandler } = require("./middleware/error.middleware");
const logger = require("./utils/logger");
const { ensureStorageDirectories } = require("./utils/storage");

// Validate environment on startup
validateEnv();
const config = getConfig();

// Ensure storage directories exist
ensureStorageDirectories(config.storage.path);

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map(s => s.trim()), credentials: true },
});

socketService.initialize(io);

// ── Request ID & Logging Middleware ──────────────────────────────────────────

app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id || null,
    });
  });
  next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────

const getCorsOrigin = () => {
  const corsOrigin = config.corsOrigin;
  if (!corsOrigin || corsOrigin === "*") return true;
  const origins = corsOrigin.split(",").map(o => o.trim().replace(/\/$/, ""));
  return origins.includes("*") ? true : origins;
};

app.use(cors({ origin: getCorsOrigin(), credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded files with authorization check (static for now)
app.use("/storage", express.static(path.resolve(config.storage.path)));

// ── Rate Limiting ────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many auth attempts. Please try again later." } },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: "AI_RATE_LIMITED", message: "Too many AI requests. Please slow down." } },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/ai", aiLimiter);
// Transcript autosave is a real-time persistence path, not an AI call. It is
// covered by the general API limiter below; applying the stricter AI limit to
// the whole interview router would drop captions during a normal conversation.

// ── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/problems", require("./routes/problem.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/assessments", require("./routes/assessment.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/leaderboard", require("./routes/leaderboard.routes"));
app.use("/api/interviews", require("./routes/interview.routes"));
app.use("/api/mock-tests", require("./routes/mocktest.routes"));
app.use("/api/sql", require("./routes/sql.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/career", require("./routes/career.routes"));
app.use("/api/skills", require("./routes/skill.routes"));
app.use("/api/health", require("./routes/health.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

// ── Health Check (root) ──────────────────────────────────────────────────────

app.get("/api/health", async (req, res) => {
  res.json({ status: "ok", service: "AI Interview Intelligence Platform", timestamp: new Date().toISOString() });
});

// ── Error Handler ────────────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────

const PORT = config.port;

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✓ PostgreSQL connected");

    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║       AI Interview Intelligence Platform                ║
╠══════════════════════════════════════════════════════════╣
║  Backend:   http://localhost:${PORT}                       ║
║  API Docs:  http://localhost:${PORT}/api/health             ║
║  Env:       ${config.nodeEnv.padEnd(43)}║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});
