const mongoose = require("mongoose");
const { Schema } = mongoose;

const examAttemptSchema = new mongoose.Schema({
  examId:    { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // Timing
  startedAt:            Date,
  submittedAt:          Date,
  timeRemainingSeconds: Number, // snapshot on submit (for audit trail)

  // Status
  status: {
    type: String,
    enum: ["in_progress", "submitted", "auto_submitted", "disqualified"],
    default: "in_progress"
  },

  // Per-problem tracking
  problemSubmissions: [{
    problemId:    { type: Schema.Types.ObjectId, ref: "Problem" },
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission", default: null },
    marksAwarded: { type: Number, default: 0 },
    maxMarks:     { type: Number, default: 10 },
    attemptedAt:  Date
  }],

  // Scoring
  totalScore:    { type: Number, default: 0 },
  totalMaxScore: { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  grade:         { type: String, default: "F" }, // "O" | "A+" | "A" | "B+" | "B" | "C" | "F"
  rank:          { type: Number, default: null }, // computed after all submissions

  // Anti-cheat audit
  tabSwitchCount:      { type: Number, default: 0 },
  fullscreenExitCount: { type: Number, default: 0 },
  flagged:             { type: Boolean, default: false },
  auditLog: [{
    event:     String,   // "tab_switch" | "fullscreen_exit" | "paste_attempt" | "copy_attempt"
    timestamp: { type: Date, default: Date.now }
  }],

  // Whether marks have been finalised
  graded: { type: Boolean, default: false }
}, { timestamps: true });

// One attempt per student per exam (enforced at DB level)
examAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);
