// ============================================================================
// Storage Utilities
// ============================================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_DIRS = ["resumes", "documents", "reports", "interview-recordings", "temporary"];

/**
 * Ensure storage directories exist.
 */
function ensureStorageDirectories(basePath) {
  const resolved = path.resolve(basePath);
  for (const dir of STORAGE_DIRS) {
    const dirPath = path.join(resolved, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

/**
 * Generate a secure random filename preserving extension.
 */
function generateSecureFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(32).toString("hex");
  return `${randomName}${ext}`;
}

/**
 * Get the storage path for a category.
 */
function getStoragePath(basePath, category) {
  return path.join(path.resolve(basePath), category);
}

// Allowed MIME types per category
const ALLOWED_MIMES = {
  resumes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
  documents: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown"],
};

const MAX_FILE_SIZES = {
  resumes: 10 * 1024 * 1024,    // 10MB
  documents: 20 * 1024 * 1024,  // 20MB
};

/**
 * Validate uploaded file.
 */
function validateFile(file, category) {
  const errors = [];

  const allowedMimes = ALLOWED_MIMES[category];
  if (allowedMimes && !allowedMimes.includes(file.mimetype)) {
    errors.push(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(", ")}`);
  }

  const maxSize = MAX_FILE_SIZES[category] || 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
  }

  return errors;
}

module.exports = {
  ensureStorageDirectories,
  generateSecureFilename,
  getStoragePath,
  validateFile,
  ALLOWED_MIMES,
  MAX_FILE_SIZES,
};
