const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  // Analytics Fields
  streakCount: { type: Number, default: 0 },
  lastSuccessDate: { type: Date },
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  activityLog: [{ type: String }] // Store unique dates as "YYYY-MM-DD"
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);