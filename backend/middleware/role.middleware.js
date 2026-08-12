// ============================================================================
// Role Authorization Middleware
// ============================================================================

/**
 * Authorize by role. Pass one or more roles.
 * Usage: authorize("admin") or authorize("admin", "interviewer")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions." } });
    }
    next();
  };
};

module.exports = authorize;