const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  
  status: { 
    type: String, 
    enum: ["In-Progress", "Submitted", "Flagged", "Timed-Out"], 
    default: "In-Progress" 
  },
  
  submissionFile: String, // Path for DOCUMENT type
  isExternalSubmitted: { type: Boolean, default: false }, // For MCQ (Google Forms)
  
  codingSubmissions: [{
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" }
  }],
  
  violations: [{
    type: { type: String, required: true }, // e.g., "TAB_SWITCH", "FULLSCREEN_EXIT"
    timestamp: { type: Date, default: Date.now },
    details: String
  }],
  
  grade: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Attempt", attemptSchema);
