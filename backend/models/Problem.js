const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title:       String,
  description: String,
  difficulty:  String,
  category:    { type: String, default: "Algorithms" },
  concept:     { type: String, default: "General" },
  tags:        [{ type: String }],
  starterCode: String,
  hints:       [{ type: String }],
  testCases: [
    {
      input:          String,
      expectedOutput: String
    }
  ],
  // CA Exam fields
  maxMarks: { type: Number, default: 10 }, // point weight when used in a CA exam
  isPublic: { type: Boolean, default: true } // false = only appears inside CA exams, not in public practice
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);
