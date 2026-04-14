const express = require("express");
const router = express.Router();
const controller = require("../controllers/assessment.controller");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// --- Admin Routes ---
router.post("/", protect, authorize("admin"), controller.createAssessment);
router.get("/admin/all", protect, authorize("admin"), controller.getAllAssessments);
router.get("/admin/attempts", protect, authorize("admin"), controller.getAllAttempts);
router.put("/admin/attempts/:id/grade", protect, authorize("admin"), controller.gradeAttempt);
router.delete("/admin/:id", protect, authorize("admin"), controller.deleteAssessment);

// --- Student Routes ---
router.get("/active", protect, controller.getActiveAssessments);
router.post("/:assessmentId/start", protect, controller.startAttempt);
router.post("/attempt/:id/violation", protect, controller.logViolation);
router.post("/attempt/:id/upload", protect, upload.single("file"), controller.uploadDocument);
router.post("/attempt/:id/submit", protect, controller.submitAssessment);

module.exports = router;
