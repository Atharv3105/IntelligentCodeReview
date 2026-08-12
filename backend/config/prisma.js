// ============================================================================
// Prisma Client Singleton
// ============================================================================
// Ensures a single Prisma client instance is used across the application.
// Prevents connection exhaustion during development with hot-reload.
// ============================================================================

const { PrismaClient } = require("@prisma/client");

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error", "warn"],
  });
} else {
  // Reuse client in development to avoid exhausting connections
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
