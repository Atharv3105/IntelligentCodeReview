const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  problemNumber: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true },
  category: { type: String, default: "Algorithms", index: true },
  concept: { type: String, default: "General", index: true },
  collections: [{ type: String, index: true }], // e.g. ["Blind75", "Neetcode150"]
  tags: [{ type: String }],
  starterCode: { type: String, default: "def solution():\n    pass" },
  hints: [{ type: String }],
  testCases: [
    {
      input: String,
      expectedOutput: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);
