const mongoose = require("mongoose");
const { Schema } = mongoose;

const examSchema = new mongoose.Schema({
  title:       { type: String, required: true }, // "CA-1 — Python Fundamentals"
  description: String,
  type:        { type: String, enum: ["CA1", "CA2", "Quiz", "Mock", "Practice"], required: true },
  subject:     { type: String, default: "Python Programming" },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" }, // teacher or admin

  // Audience targeting (college CAs — null/empty means all students)
  targetYear:     { type: String, default: null },    // "SY" | "TY" | null
  targetDivision: [{ type: String }],                 // ["A", "B"] | []
  targetBranch:   { type: String, default: null },    // "BEIT" | null

  // Problems list with per-exam mark overrides
  problems: [{
    problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    order:     { type: Number, default: 0 },
    marks:     { type: Number, default: 10 } // overrides Problem.maxMarks for this exam
  }],

  totalMarks:   { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },

  // Scheduling
  durationMinutes: { type: Number, required: true, default: 90 },
  scheduledStart:  Date,
  scheduledEnd:    Date,
  status:          { type: String, enum: ["draft", "scheduled", "live", "ended"], default: "draft" },

  // Anti-cheat settings
  shuffleProblems: { type: Boolean, default: true },
  allowedAttempts: { type: Number, default: 1 },

  instructions: String,

  // Result visibility — true = students see score immediately after submitting
  resultsReleased: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);
