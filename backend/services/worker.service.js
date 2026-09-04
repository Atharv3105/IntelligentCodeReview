const socketService = require("./socket.service");
const submissionQueue = require("../queue");

exports.callWorker = async (submission) => {
  const submissionId = submission.id || submission._id;
  socketService.emitSubmissionUpdate(submissionId, {
    stage: "QUEUED",
    progress: 0
  });

  // add job to queue, with automatic retries; do not wait here
  const job = await submissionQueue.add(
    { submissionId, code: submission.code, language: submission.language },
    { attempts: 3, backoff: 5000 }
  );

  return job; // caller can ignore or monitor
};