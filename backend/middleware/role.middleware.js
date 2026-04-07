/**
 * Role-based access middleware.
 * Usage: requireRole("teacher", "admin")  ← accepts any of the listed roles
 * Usage: requireRole("admin")             ← single role only
 */
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};