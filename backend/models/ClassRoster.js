const mongoose = require("mongoose");
const { Schema } = mongoose;

const classRosterSchema = new mongoose.Schema({
  batchName:    { type: String, required: true }, // "SY-BEIT-A-2024-25"
  year:         String,   // "SY"
  division:     String,   // "A"
  branch:       String,   // "BEIT"
  academicYear: String,   // "2024-25"
  createdBy:    { type: Schema.Types.ObjectId, ref: "User" },

  students: [{
    prn:    { type: String, required: true },  // "22BEIT001"
    name:   String,
    email:  String,
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null }
    // userId is populated once the student self-registers with matching PRN/email
  }]
}, { timestamps: true });

module.exports = mongoose.model("ClassRoster", classRosterSchema);
