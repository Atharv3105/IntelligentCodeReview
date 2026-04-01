const express = require("express");
const Submission = require("../models/Submission");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  const submission = await Submission.create(req.body);

  const workerResponse = await axios.post(
    "http://localhost:8000/analyze",
    { submissionId: submission._id, code: submission.code }
  );

  res.json(workerResponse.data);
});

module.exports = router;