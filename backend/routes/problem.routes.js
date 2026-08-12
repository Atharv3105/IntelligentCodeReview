const express = require("express");
const router = express.Router();
const controller = require("../controllers/problem.controller");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.get("/", protect, controller.getProblems);
router.get("/:id", protect, controller.getProblem);
router.post("/", protect, authorize("admin"), controller.createProblem);

module.exports = router;