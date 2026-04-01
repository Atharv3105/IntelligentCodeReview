const axios = require("axios");
const submissionQueue = require("./queue");
const Submission = require("./models/Submission");
const socketService = require("./services/socket.service");

submissionQueue.process(async (job) => {
  const { submissionId, code } = job.data;
  socketService.emitSubmissionUpdate(submissionId, { stage: "STARTED", progress: 5 });

  try {
    const response = await axios.post(`${process.env.WORKER_URL}/analyze`, {
      submissionId,
      code
    });
    const result = response.data;

    const submission = await Submission.findById(submissionId);
    if (submission) {
      submission.status = "Completed";
      submission.result = result;
      submission.grade = result.grade;
      submission.plagiarismScore = result.plagiarism;
      submission.feedback = result.feedback;
      await submission.save();
    }

    socketService.emitSubmissionUpdate(submissionId, { stage: "COMPLETED", progress: 100, result });
    return result;
  } catch (err) {
    const submission = await Submission.findById(submissionId);
    if (submission) {
      submission.status = "Failed";
      submission.error = err.message;
      await submission.save();
    }
    socketService.emitSubmissionUpdate(submissionId, { stage: "FAILED", progress: 0, error: err.message });
    throw err;
  }
});

// exported so server startup can optionally require and start processing
module.exports = submissionQueue;
