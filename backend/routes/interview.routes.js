// ============================================================================
// Interview Routes
// ============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/interview.controller");
const protect = require("../middleware/auth.middleware");

router.post("/", protect, controller.createSession);
router.post("/:id/start", protect, controller.startInterview);
router.post("/:id/transcripts", protect, controller.appendTranscript);
router.get("/:id", protect, controller.getSession);
router.get("/:id/current-question", protect, controller.getCurrentQuestion);
router.post("/:id/questions/:questionId/answer", protect, controller.submitAnswer);
router.post("/:id/questions/:questionId/follow-up", protect, controller.getFollowUp);
router.post("/follow-ups/:followUpId/answer", protect, controller.submitFollowUp);
router.post("/:id/next", protect, controller.nextQuestion);
router.post("/:id/finish", protect, controller.finishInterview);
router.get("/", protect, controller.getHistory);

module.exports = router;
