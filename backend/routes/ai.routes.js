// ============================================================================
// AI Routes
// ============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/ai.controller");
const protect = require("../middleware/auth.middleware");

router.post("/generate-question", protect, controller.generateQuestion);
router.post("/hint", protect, controller.getHint);
router.post("/study-plan", protect, controller.generateStudyPlan);
router.get("/usage", protect, controller.getAIUsage);

module.exports = router;
