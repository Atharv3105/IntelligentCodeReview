const socketService = require("./socket.service");
const submissionQueue = require("../queue");

exports.callWorker = async (submission) => {
  socketService.emitSubmissionUpdate(submission._id, {
    stage: "QUEUED",
    progress: 0
  });

  // add job to queue, with automatic retries; do not wait here
  const job = await submissionQueue.add(
    { submissionId: submission._id, code: submission.code },
    { attempts: 3, backoff: 5000 }
  );

  return job; // caller can ignore or monitor
};