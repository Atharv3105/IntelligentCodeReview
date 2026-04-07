const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/generateToken");
const { sendVerificationEmail } = require("../services/email.service");
const logger = require("../utils/logger");

exports.register = async (req, res) => {
  try {
    const { name, email, password, prn, division, year, branch } = req.body;
    logger.info(`register attempt for ${email}`);

    // basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // If PRN provided, check it's not already taken
    if (prn) {
      const prnExists = await User.findOne({ prn });
      if (prnExists) return res.status(400).json({ message: "PRN already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    
    // Check if email credentials are not configured (local development mode)
    const isLocalDev = !process.env.EMAIL_USER || process.env.EMAIL_USER === "your_email@gmail.com";

    const user = await User.create({
      name,
      email,
      password: hashed,
      verificationToken: isLocalDev ? null : token,
      isVerified: isLocalDev,
      // College identity fields (null if not provided by public users)
      prn:      prn      || null,
      division: division || null,
      year:     year     || null,
      branch:   branch   || null
    });

    if (isLocalDev) {
      logger.info(`Local dev: auto-verified user ${email}`);
      return res.json({ message: "Registration successful. Auto-verified for local development." });
    }

    try {
      await sendVerificationEmail(user, token);
    } catch (emailErr) {
      logger.warn("Verification email failed:", emailErr);
      return res.status(500).json({ message: "Registered but failed to send verification email" });
    }

    res.json({ message: "Verification email sent" });
  } catch (err) {
    logger.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// verify email token
exports.verify = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token });
  if (!user) return res.status(400).json({ message: "Invalid verification token" });

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.json({ message: "Account verified" });
};

// logout endpoint: remove refresh token and clear cookie
exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await RefreshToken.deleteOne({ token });
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

// refresh access token
exports.refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No token" });

  // verify token exists in DB
  const stored = await RefreshToken.findOne({ token });
  if (!stored) return res.status(403).json({ message: "Token revoked" });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    logger.warn("Refresh token invalid", err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  logger.info(`login attempt for ${email}`);

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  if (!user.isVerified) {
    return res.status(403).json({ message: "Account not verified" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  // Payload includes role + college identity so frontend knows context without extra API call
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // decode token to get expiration
  const decoded = jwt.decode(refreshToken);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;

  // persist refresh token
  await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });

  res.json({ accessToken });
};
