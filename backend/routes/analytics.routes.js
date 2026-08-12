const express = require("express");
const router = express.Router();
const controller = require("../controllers/analytics.controller");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.get("/dashboard", protect, controller.getDashboardStats);
router.get("/skills", protect, controller.getSkillGraph);
router.get("/admin", protect, authorize("admin"), controller.getAdminStats);
router.get("/student/:id", protect, authorize("admin"), controller.getStudentDetails);

module.exports = router;