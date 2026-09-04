const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid session token. Please log in again." } });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Session expired or invalid. Please log in again." } });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: { code: "TOKEN_EXPIRED", message: "Token expired." } });
    }
    return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token." } });
  }
};

module.exports = protect;