const axios = require("axios");
const submissionQueue = require("./queue");
const Submission = require("./models/Submission");
const User = require("./models/User");
const socketService = require("./services/socket.service");

submissionQueue.process(async (job) => {
  const { submissionId, code } = job.data;
  socketService.emitSubmissionUpdate(submissionId, { stage: "STARTED", progress: 5 });

  try {
    // 1. Fetch submission with Problem populated to get test cases
    const submission = await Submission.findById(submissionId).populate("problemId");
    if (!submission) throw new Error("Submission not found in DB");

    const problem = submission.problemId;
    if (!problem) throw new Error("Linked problem not found");

    socketService.emitSubmissionUpdate(submissionId, { stage: "EVALUATING_CODE", progress: 30 });

    // 2. Call FastAPI Worker with language and test cases
    const response = await axios.post(`${process.env.WORKER_URL}/analyze`, {
      submissionId: submissionId,
      code: code,
      language: submission.language || "python",
      problemTitle: problem.title,
      testCases: problem.testCases || []
    });
    
    const result = response.data;
    
    // 3. Update Submission Record with detailed Python results
    submission.status = "Completed";
    submission.result = result;
    submission.grade = result.grade; // Percentage (0-100)
    submission.plagiarismScore = result.plagiarism;
    submission.feedback = result.feedback;
    await submission.save();

    // --- Start Analytics & Streak Logic ---
    if (submission.grade >= 70) {
      const user = await User.findById(submission.userId);
      if (user) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Update Activity Log (Heatmap)
        if (!user.activityLog.includes(todayStr)) {
          user.activityLog.push(todayStr);

          // 2. Update Streak Logic
          const lastSuccess = user.lastSuccessDate ? new Date(user.lastSuccessDate) : null;
          
          if (!lastSuccess) {
            user.streakCount = 1;
          } else {
            const diffTime = Math.abs(today.setHours(0,0,0,0) - lastSuccess.setHours(0,0,0,0));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              user.streakCount += 1; // Consecutive day
            } else if (diffDays > 1) {
              user.streakCount = 1; // Broke streak
            }
            // If diffDays === 0, it means they already solved a problem today, streak stays the same
          }

          user.lastSuccessDate = new Date();
        }

        // 3. Update Solved Problems
        if (!user.solvedProblems.includes(submission.problemId)) {
          user.solvedProblems.push(submission.problemId);
        }

        await user.save();

        // Emit global win for AdminDashboard Live Wins ticker
        socketService.emitGlobalWin({
          problemId: submission.problemId._id,
          problemNumber: submission.problemId.problemNumber,
          title: submission.problemId.title,
          studentName: user.name,
          grade: submission.grade,
          plagiarism: submission.plagiarismScore,
          status: 'success',
          timestamp: new Date()
        });
      }
    }
    // --- End Analytics & Streak Logic ---

    // 4. Notify frontend via socket
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
