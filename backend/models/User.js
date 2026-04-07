const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:              String,
  email:             { type: String, unique: true },
  password:          String,
  role:              { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  isVerified:        { type: Boolean, default: false },
  verificationToken: String,

  // College identity fields (optional — null for public/non-college users)
  prn:      { type: String, unique: true, sparse: true }, // e.g. "22BEIT001"
  division: { type: String, default: null },              // "A" | "B" | "C"
  year:     { type: String, default: null },              // "FY" | "SY" | "TY" | "Final Year"
  branch:   { type: String, default: null }               // "BEIT" | "CS" | "AIDS" | etc.
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);