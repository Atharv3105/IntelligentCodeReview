const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const controller = require("../controllers/submission.controller");

router.post("/", protect, controller.createSubmission);
router.get("/my", protect, controller.getMySubmissions);
router.get("/:id", protect, controller.getSubmissionById);

module.exports = router;
