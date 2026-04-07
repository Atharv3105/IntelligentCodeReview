const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/exam.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

// All routes require authentication
router.use(auth);

// ── Teacher / Admin — Exam Management ────────────────────────────────────
router.post(   "/",                        requireRole("teacher", "admin"), ctrl.createExam);
router.get(    "/",                        requireRole("teacher", "admin"), ctrl.listExams);
router.put(    "/:id",                     requireRole("teacher", "admin"), ctrl.updateExam);
router.delete( "/:id",                     requireRole("teacher", "admin"), ctrl.deleteExam);
router.put(    "/:id/publish",             requireRole("teacher", "admin"), ctrl.publishExam);
router.get(    "/:id/results",             requireRole("teacher", "admin"), ctrl.getResults);
router.get(    "/:id/results/:studentId",  requireRole("teacher", "admin"), ctrl.getStudentResult);
router.get(    "/:id/export/pdf",          requireRole("teacher", "admin"), ctrl.exportPDF);

// ── Student — Exam Discovery ──────────────────────────────────────────────
// NOTE: /available must come BEFORE /:id to avoid route collision
router.get("/available", requireRole("student"), ctrl.getAvailableExams);

// ── All Authenticated Users — Exam Details & Leaderboard ─────────────────
router.get("/:id",            ctrl.getExam);
router.get("/:id/leaderboard", ctrl.getLeaderboard);

// ── Student — Attempt Lifecycle ───────────────────────────────────────────
router.post("/:id/attempt/start",  requireRole("student"), ctrl.startAttempt);
router.get( "/:id/attempt/me",     requireRole("student"), ctrl.getMyAttempt);
router.post("/:id/attempt/event",  requireRole("student"), ctrl.logEvent);
router.post("/:id/attempt/submit", requireRole("student"), ctrl.submitAttempt);

module.exports = router;
