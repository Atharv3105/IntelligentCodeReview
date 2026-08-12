// ============================================================================
// Auth Controller — Prisma/PostgreSQL
// ============================================================================

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { sendVerificationEmail } = require("../services/email.service");
const { asyncHandler } = require("../middleware/error.middleware");
const logger = require("../utils/logger");

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  logger.info(`Register attempt for ${email}`);

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name, email and password are required." } });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, error: { code: "DUPLICATE_ENTRY", message: "User already exists." } });
  }

  const hashed = await bcrypt.hash(password, 12);
  const token = crypto.randomBytes(32).toString("hex");
  const isLocalDev = !process.env.SMTP_HOST || !process.env.SMTP_USER;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      verificationToken: isLocalDev ? null : token,
      isVerified: isLocalDev,
      profile: {
        create: {} // Create empty profile
      },
    },
  });

  if (isLocalDev) {
    logger.info(`Local dev: auto-verified user ${email}`);
    return res.json({ success: true, message: "Registration successful. Auto-verified for local development." });
  }

  try {
    await sendVerificationEmail(user, token);
  } catch (emailErr) {
    logger.warn("Verification email failed:", emailErr);
    return res.json({ success: true, message: "Registered. Verification email failed to send — contact admin." });
  }

  res.json({ success: true, message: "Verification email sent." });
});

exports.verify = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) {
    return res.status(400).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid verification token." } });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null },
  });

  res.json({ success: true, message: "Account verified." });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  logger.info(`Login attempt for ${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } });
  }

  if (!user.isVerified) {
    return res.status(403).json({ success: false, error: { code: "NOT_VERIFIED", message: "Account not verified." } });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out." });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: "NO_TOKEN", message: "No refresh token." } });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) {
    return res.status(403).json({ success: false, error: { code: "TOKEN_REVOKED", message: "Token revoked." } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } });
    }

    const accessToken = generateAccessToken(user);
    res.json({ success: true, accessToken });
  } catch (err) {
    // Delete invalid refresh token
    await prisma.refreshToken.deleteMany({ where: { token } });
    return res.status(403).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid refresh token." } });
  }
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      profile: true,
      skills: { include: { skill: true }, orderBy: { mastery: "desc" } },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      profile: user.profile,
      skills: user.skills,
      createdAt: user.createdAt,
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { targetRole, experienceLevel, preferredLanguage, institution, graduationYear, bio } = req.body;

  const profile = await prisma.userProfile.upsert({
    where: { userId: req.user.id },
    update: { targetRole, experienceLevel, preferredLanguage, institution, graduationYear, bio },
    create: { userId: req.user.id, targetRole, experienceLevel, preferredLanguage, institution, graduationYear, bio },
  });

  res.json({ success: true, profile });
});
