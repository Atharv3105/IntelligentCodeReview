const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["MCQ", "DOCUMENT", "CODING"], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  
  externalUrl: String, // For Google Forms (MCQ)
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  
  settings: {
    allowCopy: { type: Boolean, default: false },
    enforceFullScreen: { type: Boolean, default: true },
    maxTabSwitches: { type: Number, default: 3 }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);
