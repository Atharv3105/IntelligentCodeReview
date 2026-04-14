const Assessment = require("../models/Assessment");
const Attempt = require("../models/Attempt");
const mongoose = require("mongoose");
const path = require("path");

// --- Admin Controllers ---

exports.createAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ message: "Failed to create assessment", error: err.message });
  }
};

exports.getAllAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate("problems")
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assessments", error: err.message });
  }
};

exports.getAllAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find()
      .populate("userId", "name email")
      .populate("assessmentId", "title type")
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit data", error: err.message });
  }
};

exports.gradeAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;
    
    const attempt = await Attempt.findByIdAndUpdate(id, { grade }, { new: true });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    
    res.json({ message: "Grade updated successfully", attempt });
  } catch (err) {
    res.status(500).json({ message: "Failed to update grade", error: err.message });
  }
};

// --- Student Controllers ---

exports.getActiveAssessments = async (req, res) => {
  try {
    const now = new Date();
    // Allow a 12-hour buffer for "active" tests to stay visible even if clock or timezone differs slightly
    // Also ensures upcoming tests (startTime > now) are fetched.
    const assessments = await Assessment.find({
      endTime: { $gt: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
    }).sort({ startTime: 1 }).lean();
    
    // Attach attempt status/grade if exists for the student
    const assessmentsWithAttempts = await Promise.all(assessments.map(async (a) => {
      const attempt = await Attempt.findOne({ userId: req.user.id, assessmentId: a._id });
      return {
        ...a,
        myAttempt: attempt ? { status: attempt.status, grade: attempt.grade } : null
      };
    }));

    res.json(assessmentsWithAttempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active tests", error: err.message });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: "Test not found" });
    
    const now = new Date();
    if (now < assessment.startTime || now > assessment.endTime) {
      return res.status(403).json({ message: "Test is not currently active" });
    }

    let attempt = await Attempt.findOne({ userId: req.user.id, assessmentId });
    if (attempt) {
      if (attempt.status === "Submitted") {
        return res.status(403).json({ message: "You have already submitted this test" });
      }
      return res.json(attempt);
    }

    attempt = await Attempt.create({
      userId: req.user.id,
      assessmentId,
      startTime: now,
      status: "In-Progress"
    });

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to start test", error: err.message });
  }
};

exports.logViolation = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const { type, details } = req.body;

    const attempt = await Attempt.findByIdAndUpdate(
      attemptId,
      { $push: { violations: { type, details, timestamp: new Date() } } },
      { new: true }
    );

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const assessment = await Assessment.findById(attempt.assessmentId);
    if (assessment && attempt.violations.length >= (assessment.settings?.maxTabSwitches || 3)) {
        attempt.status = "Flagged";
        await attempt.save();
    }

    res.json({ message: "Violation logged", violationCount: attempt.violations.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to log violation", error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    attempt.submissionFile = req.file.filename;
    attempt.status = "Submitted";
    attempt.endTime = new Date();
    await attempt.save();

    res.json({ message: "Document uploaded successfully", filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const { isExternalSubmitted } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (isExternalSubmitted !== undefined) {
      attempt.isExternalSubmitted = isExternalSubmitted;
    }
    
    attempt.endTime = new Date();
    attempt.status = "Submitted";
    await attempt.save();

    res.json({ message: "Assessment submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Submission failed", error: err.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assessment.findByIdAndDelete(id);
    // Also cleanup attempts for this assessment
    await Attempt.deleteMany({ assessmentId: id });
    res.json({ message: "Assessment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete assessment", error: err.message });
  }
};

