const express = require("express");
const router = express.Router();
const controller = require("../controllers/leaderboard.controller");

router.get("/", controller.getLeaderboard);

module.exports = router;