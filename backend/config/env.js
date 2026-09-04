// ============================================================================
// Environment Configuration & Validation
// ============================================================================
// Validates required environment variables at startup.
// Fails fast with clear error messages for missing config.
// ============================================================================

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
];

const OPTIONAL_ENV_VARS = {
  NODE_ENV: "development",
  PORT: "5000",
  CORS_ORIGIN: "http://localhost:5173",
  FRONTEND_URL: "http://localhost:5173",
  AI_PROVIDER: "openai",
  AI_API_KEY: "",
  AI_MODEL: "gpt-4o-mini",
  AI_FALLBACK_PROVIDER: "",
  AI_FALLBACK_API_KEY: "",
  AI_FALLBACK_MODEL: "",
  AI_MAX_REQUESTS_PER_USER_PER_HOUR: "60",
  AI_MAX_TOKENS_PER_USER_PER_DAY: "100000",
  JUDGE_API_URL: "http://localhost:2358",
  JUDGE_API_KEY: "",
  JUDGE_TIMEOUT: "10",
  JUDGE_MEMORY_LIMIT: "256000",
  JUDGE_CPU_TIME_LIMIT: "5",
  STORAGE_PATH: "./storage",
  ACCESS_TOKEN_EXPIRE: "15m",
  REFRESH_TOKEN_EXPIRE: "7d",
  SMTP_HOST: "",
  SMTP_PORT: "587",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  EMAIL_FROM: "noreply@interview-platform.local",
  SPEECH_TO_TEXT_PROVIDER: "browser",
  TEXT_TO_SPEECH_PROVIDER: "browser",
  GITHUB_TOKEN: "",
  LOG_LEVEL: "info",
};

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required vars
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Set defaults for optional vars
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // Automatically alias NVIDIA_NIM_API_KEY / NVIDIA_NIM_MODEL if set
  if (!process.env.AI_API_KEY && process.env.NVIDIA_NIM_API_KEY) {
    process.env.AI_API_KEY = process.env.NVIDIA_NIM_API_KEY;
    if (!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "openai") {
      process.env.AI_PROVIDER = "nvidia";
    }
  }
  if (process.env.AI_PROVIDER === "nvidia" && (!process.env.AI_MODEL || process.env.AI_MODEL === "gpt-4o-mini")) {
    process.env.AI_MODEL = process.env.NVIDIA_NIM_MODEL || "nvidia/nemotron-3-super-120b-a12b";
  }

  // Warn about missing AI key
  if (!process.env.AI_API_KEY) {
    warnings.push("AI_API_KEY is not set. AI features will be unavailable.");
  }

  // Warn about default secrets in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET === "change-me-to-a-random-64-char-string") {
      missing.push("JWT_SECRET (must be changed from default in production)");
    }
    if (process.env.JWT_REFRESH_SECRET === "change-me-to-another-random-64-char-string") {
      missing.push("JWT_REFRESH_SECRET (must be changed from default in production)");
    }
  }

  if (missing.length > 0) {
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║         MISSING REQUIRED ENVIRONMENT VARIABLES         ║");
    console.error("╠══════════════════════════════════════════════════════════╣");
    for (const key of missing) {
      console.error(`║  ✗ ${key.padEnd(52)} ║`);
    }
    console.error("╠══════════════════════════════════════════════════════════╣");
    console.error("║  Copy .env.example to .env and fill in the values.     ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  for (const warning of warnings) {
    console.warn(`⚠ ENV WARNING: ${warning}`);
  }

  return true;
}

/**
 * Get a typed configuration object from validated env vars.
 */
function getConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10),
    corsOrigin: process.env.CORS_ORIGIN,
    frontendUrl: process.env.FRONTEND_URL,

    database: {
      url: process.env.DATABASE_URL,
    },

    redis: {
      url: process.env.REDIS_URL,
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpire: process.env.ACCESS_TOKEN_EXPIRE,
      refreshExpire: process.env.REFRESH_TOKEN_EXPIRE,
    },

    ai: {
      provider: process.env.AI_PROVIDER || (process.env.NVIDIA_NIM_API_KEY ? "nvidia" : "openai"),
      apiKey: process.env.AI_API_KEY || process.env.NVIDIA_NIM_API_KEY || "",
      model: process.env.AI_MODEL || process.env.NVIDIA_NIM_MODEL || (process.env.AI_PROVIDER === "nvidia" || process.env.NVIDIA_NIM_API_KEY ? "nvidia/nemotron-3-super-120b-a12b" : "gpt-4o-mini"),
      fallbackProvider: process.env.AI_FALLBACK_PROVIDER || null,
      fallbackApiKey: process.env.AI_FALLBACK_API_KEY || null,
      fallbackModel: process.env.AI_FALLBACK_MODEL || null,
      maxRequestsPerUserPerHour: parseInt(process.env.AI_MAX_REQUESTS_PER_USER_PER_HOUR || "60", 10),
      maxTokensPerUserPerDay: parseInt(process.env.AI_MAX_TOKENS_PER_USER_PER_DAY || "100000", 10),
    },

    judge: {
      apiUrl: process.env.JUDGE_API_URL,
      apiKey: process.env.JUDGE_API_KEY || null,
      timeout: parseInt(process.env.JUDGE_TIMEOUT, 10),
      memoryLimit: parseInt(process.env.JUDGE_MEMORY_LIMIT, 10),
      cpuTimeLimit: parseInt(process.env.JUDGE_CPU_TIME_LIMIT, 10),
    },

    storage: {
      path: process.env.STORAGE_PATH,
    },

    email: {
      host: process.env.SMTP_HOST || null,
      port: parseInt(process.env.SMTP_PORT, 10),
      user: process.env.SMTP_USER || null,
      password: process.env.SMTP_PASSWORD || null,
      from: process.env.EMAIL_FROM,
    },

    speech: {
      sttProvider: process.env.SPEECH_TO_TEXT_PROVIDER,
      ttsProvider: process.env.TEXT_TO_SPEECH_PROVIDER,
    },

    github: {
      token: process.env.GITHUB_TOKEN || null,
    },

    logLevel: process.env.LOG_LEVEL,
  };
}

module.exports = { validateEnv, getConfig };
