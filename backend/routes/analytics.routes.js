const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/analytics.controller");

router.get("/", protect, role("admin"), controller.getAnalytics);

module.exports = router;