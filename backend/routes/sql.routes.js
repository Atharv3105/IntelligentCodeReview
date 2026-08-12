const express = require("express");
const router = express.Router();
const controller = require("../controllers/sql.controller");
const protect = require("../middleware/auth.middleware");

router.get("/challenges", protect, controller.getChallenges);
router.get("/challenges/:id", protect, controller.getChallenge);
router.post("/execute", protect, controller.executeQuery);
router.post("/generate", protect, controller.generateChallenge);

module.exports = router;
