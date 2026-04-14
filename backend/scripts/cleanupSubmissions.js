const mongoose = require('mongoose');
require('dotenv').config();
const Submission = require('../models/Submission');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for cleanup...");

    // Delete submissions that have errors or represent the old "mismatched" state
    const result = await Submission.deleteMany({
      $or: [
        { status: "Failed" },
        { error: { $exists: true, $ne: "" } }
      ]
    });

    console.log(`Successfully deleted ${result.deletedCount} malformed submissions.`);
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();

