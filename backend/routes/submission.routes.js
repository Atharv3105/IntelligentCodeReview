const express = require("express");
const router = express.Router();
const controller = require("../controllers/submission.controller");
const protect = require("../middleware/auth.middleware");

router.post("/", protect, controller.createSubmission);
router.get("/", protect, controller.getMySubmissions);
router.get("/my", protect, controller.getMySubmissions);
router.get("/:id", protect, controller.getSubmissionById);

module.exports = router;
