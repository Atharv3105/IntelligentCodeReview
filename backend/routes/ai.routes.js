// ============================================================================
// AI Routes — NVIDIA NIM Powered
// ============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/ai.controller");
const protect = require("../middleware/auth.middleware");

// Existing
router.post("/generate-question", protect, controller.generateQuestion);
router.post("/hint", protect, controller.getHint);
router.post("/study-plan", protect, controller.generateStudyPlan);
router.get("/usage", protect, controller.getAIUsage);

// DSA features
router.post("/review-code", protect, controller.reviewCode);
router.post("/explain-concept", protect, controller.explainConcept);
router.post("/generate-dsa-problem", protect, controller.generateDSAProblem);
router.post("/submission-feedback", protect, controller.getSubmissionFeedback);

// SQL Lab features
router.post("/explain-sql", protect, controller.explainSQL);

module.exports = router;
