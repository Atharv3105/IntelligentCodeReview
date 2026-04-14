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
  starterCode: { 
    type: Object, 
    default: {
      python: "def solution():\n    pass",
      java: "public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
      cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
      javascript: "function solution() {\n    // Your code here\n}"
    } 
  },
  hints: [{ type: String }],
  testCases: [
    {
      input: String,
      expectedOutput: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);
