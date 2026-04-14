require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const socketService = require("./services/socket.service");
const errorHandler = require("./middleware/error.middleware");
const logger = require("./utils/logger");

connectDB();

// start the queue processor (requires Redis configured)
require("./jobProcessor");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

socketService.initialize(io);

// simple request logger middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url });
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // increased from 150 for normal API usage
  message: { message: "Too many requests from this IP, please try again." }
});

// Separate limiter for polling/frequent endpoints
const pollLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 120, // 2 requests per second
  message: { message: "Too many polling requests, please try again." }
});

app.use("/api", apiLimiter);
// Apply stricter limit to polling endpoints
app.use("/api/submissions/my", pollLimiter);

// Input Sanitization Middleware to prevent NoSQL Injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/problems", require("./routes/problem.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/leaderboard", require("./routes/leaderboard.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

app.use(errorHandler);

server.listen(process.env.PORT || 5050, "0.0.0.0", () =>
  logger.info(`Server running on port ${process.env.PORT || 5050}`)
);

// catch unhandled promise rejections so the process doesn't die unexpectedly
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
