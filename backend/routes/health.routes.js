// ============================================================================
// Health Routes
// ============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/health.controller");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.get("/", controller.getHealth);
router.get("/database", controller.getDatabaseHealth);
router.get("/redis", controller.getRedisHealth);
router.get("/ai", controller.getAIHealth);
router.get("/judge", controller.getJudgeHealth);
router.get("/storage", controller.getStorageHealth);
router.get("/full", protect, authorize("admin"), controller.getFullHealth);

module.exports = router;
