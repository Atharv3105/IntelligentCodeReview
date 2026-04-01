const express = require("express");
const router = express.Router();
const controller = require("../controllers/problem.controller");

router.get("/", controller.getProblems);
router.get("/:id", controller.getProblem);

module.exports = router;