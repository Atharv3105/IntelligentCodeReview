const Submission = require("../models/Submission");
const { callWorker } = require("../services/worker.service");
const mongoose = require("mongoose");

exports.createSubmission = async (req, res) => {
  const { problemId, code } = req.body || {};

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
    status: "Pending"
  });

  // Immediately acknowledge submission to client
  res.json({ submissionId: submission._id, status: "Pending" });

  // enqueue a job for grading; job processor will update the submission
  callWorker(submission).catch((err) => {
    // log, but we don't want to crash the request handler
    console.error("Failed to enqueue worker job", err);
    Submission.findByIdAndUpdate(submission._id, {
      status: "Failed",
      error: err.message
    }).catch(() => {});
  });
};

exports.getMySubmissions = async (req, res) => {
  const subs = await Submission.find({ userId: req.user.id })
    .populate("problemId")
    .sort({ createdAt: -1 });

  res.json(subs);
};

exports.getSubmissionById = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid submission id." });
  }

  const submission = await Submission.findOne({ _id: id, userId: req.user.id }).populate("problemId");
  if (!submission) {
    return res.status(404).json({ message: "Submission not found." });
  }

  res.json(submission);
};
