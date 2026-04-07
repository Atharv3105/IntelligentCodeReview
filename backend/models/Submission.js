const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  problemId:     { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  code:          String,
  status:        String,
  result:        Object,
  grade:         Number,
  plagiarismScore: Number,
  feedback:      Object,
  error:         String,
  // Links submission to a CA exam attempt (null = practice submission)
  examAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAttempt", default: null }
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);