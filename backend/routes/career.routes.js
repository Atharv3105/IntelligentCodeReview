const express = require("express");
const router = express.Router();
const controller = require("../controllers/career.controller");
const protect = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.post("/resume/upload", protect, upload.single("file"), controller.uploadResume);
router.post("/resume/analyze", protect, controller.analyzeResume);
router.get("/resumes", protect, controller.getResumes);
router.post("/github/analyze", protect, controller.analyzeGitHub);
router.get("/memory", protect, controller.getCandidateMemory);
router.put("/memory", protect, controller.updateCandidateMemory);
router.delete("/memory", protect, controller.deleteCandidateMemory);
router.post("/coach", protect, controller.careerCoach);

module.exports = router;
