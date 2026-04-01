const express = require("express");
const Problem = require("../models/Problem");
const router = express.Router();

router.get("/", async (req, res) => {
  res.json(await Problem.find());
});

router.get("/:id", async (req, res) => {
  res.json(await Problem.findById(req.params.id));
});

module.exports = router;