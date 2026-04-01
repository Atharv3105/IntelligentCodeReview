const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: String,
  category: { type: String, default: "Algorithms" },
  concept: { type: String, default: "General" },
  tags: [{ type: String }],
  starterCode: String,
  hints: [{ type: String }],
  testCases: [
    {
      input: String,
      expectedOutput: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);
