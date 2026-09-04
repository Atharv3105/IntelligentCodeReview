const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../utils/validators");
const protect = require("../middleware/auth.middleware");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } },
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.details[0]?.message || "Validation failed." } });
    }
    next();
  };
}

router.get("/verify/:token", controller.verify);
router.post("/register", authLimiter, validateBody(registerSchema), controller.register);
router.post("/login", authLimiter, validateBody(loginSchema), controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refreshToken);
router.get("/profile", protect, controller.getProfile);
router.put("/profile", protect, controller.updateProfile);

module.exports = router;