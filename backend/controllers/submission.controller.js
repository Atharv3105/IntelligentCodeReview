const Submission = require("../models/Submission");
const { callWorker } = require("../services/worker.service");
const mongoose = require("mongoose");

exports.createSubmission = async (req, res) => {
  try {
    const { problemId, code, language = "python" } = req.body || {};

    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ message: "A valid problemId is required." });
    }

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Code cannot be empty." });
    }

    const submission = await Submission.create({
      problemId,
      userId: req.user.id,
      code,
      language,
      status: "Pending"
    });

    // Immediately acknowledge submission to client
    res.json({ submissionId: submission._id, status: "Pending" });

    // enqueue a job for grading; job processor will update the submission
    callWorker(submission).catch((err) => {
      console.error("Failed to enqueue worker job:", err);
      Submission.findByIdAndUpdate(submission._id, {
        status: "Failed",
        error: err.message
      }).catch(() => {});
    });
  } catch (err) {
    console.error("CREATE SUBMISSION ERROR:", err);
    res.status(500).json({ 
      message: "Submission Creation Failed", 
      error: err.message,
      stack: err.stack,
      details: err.errors // For Mongoose validation errors
    });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const subs = await Submission.find({ userId: req.user.id })
      .populate("problemId")
      .sort({ createdAt: -1 });

    res.json(subs);
  } catch (err) {
    console.error("GET MY SUBMISSIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch submission history", error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid submission id." });
    }

    const submission = await Submission.findOne({ _id: id, userId: req.user.id }).populate("problemId");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    res.json(submission);
  } catch (err) {
    console.error("GET SUBMISSION BY ID ERROR:", err);
    res.status(500).json({ message: "Failed to fetch submission details", error: err.message });
  }
};
