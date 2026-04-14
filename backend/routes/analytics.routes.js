const express = require("express");
const router = express.Router();
const controller = require("../controllers/analytics.controller");
const auth = require("../middleware/auth.middleware");

// Student analytics
router.get("/dashboard", auth, controller.getDashboardStats);

// Admin / Teacher analytics
router.get("/admin", auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
}, controller.getAdminStats);

// GET specific student details (Admin only)
router.get("/student/:id", auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
}, controller.getStudentDetails);

module.exports = router;