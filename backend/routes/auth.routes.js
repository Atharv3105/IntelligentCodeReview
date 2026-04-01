const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../utils/validators");

// rate limiter for auth endpoints to slow brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many requests, please try again later." }
});

// validation middleware
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      error.status = 400;
      return next(error);
    }
    next();
  };
}

router.get("/verify/:token", controller.verify);
router.post("/register", authLimiter, validateBody(registerSchema), controller.register);
router.post("/login", authLimiter, validateBody(loginSchema), controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refreshToken);

module.exports = router;