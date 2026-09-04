// ============================================================================
// Queue Job Processor — Bull Queue
// ============================================================================

const submissionQueue = require("./queue");
const prisma = require("./config/prisma");
const judgeService = require("./services/judge");
const aiGateway = require("./services/ai-gateway");
const socketService = require("./services/socket.service");

submissionQueue.process(async (job) => {
  const { submissionId, code, language } = job.data;
  socketService.emitSubmissionUpdate(submissionId, { stage: "STARTED", progress: 5 });

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: { include: { testCases: true } } },
    });

    if (!submission) throw new Error("Submission not found in DB");
    const problem = submission.problem;
    if (!problem) throw new Error("Linked problem not found");

    socketService.emitSubmissionUpdate(submissionId, { stage: "EVALUATING_CODE", progress: 30 });

    // 1. Evaluate with Judge0
    const judgeResult = await judgeService.evaluateSubmission({
      code,
      language: language || submission.language || "python",
      testCases: problem.testCases,
      executionConfig: problem.executionConfig,
    });

    socketService.emitSubmissionUpdate(submissionId, { stage: "AI_REVIEW", progress: 70 });

    // 2. AI Review
    let aiFeedback = null;
    try {
      const aiResult = await aiGateway.evaluateCode({
        code,
        language: language || submission.language || "python",
        problemDescription: problem.description,
        testResults: judgeResult,
        userId: submission.userId,
      });
      aiFeedback = aiResult.data;
    } catch (aiErr) {
      console.warn("AI review failed in queue processor:", aiErr.message);
    }

    const aiScore = aiFeedback?.overallScore || aiFeedback?.score || (aiFeedback?.codeQuality?.score ? Math.round(aiFeedback.codeQuality.score) : null);
    const grade = aiScore ? Math.min(100, Math.max(50, aiScore)) : Math.min(100, (judgeResult.percentage || 90));

    // 3. Update Submission Record
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "completed",
        passedTests: judgeResult.passedTests,
        totalTests: judgeResult.totalTests,
        runtime: judgeResult.runtime,
        memory: judgeResult.memory,
        compileError: judgeResult.compileError || null,
        testResults: judgeResult,
        grade: Math.round(grade * 100) / 100,
        feedback: aiFeedback,
        timeComplexity: aiFeedback?.efficiency?.timeComplexity || null,
        spaceComplexity: aiFeedback?.efficiency?.spaceComplexity || null,
      },
    });

    // 4. Update Analytics & Streak
    if (judgeResult.passedTests === judgeResult.totalTests && judgeResult.totalTests > 0) {
      const user = await prisma.user.findUnique({ where: { id: submission.userId } });
      if (user) {
        socketService.emitGlobalWin({
          problemId: problem.id,
          problemNumber: problem.problemNumber,
          title: problem.title,
          studentName: user.name,
          grade: Math.round(grade),
          status: "success",
          timestamp: new Date(),
        });
      }
    }

    socketService.emitSubmissionUpdate(submissionId, { stage: "COMPLETED", progress: 100, result: { ...judgeResult, feedback: aiFeedback, grade } });
    return judgeResult;
  } catch (err) {
    console.error("Queue job failed:", err);
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "failed", runtimeError: err.message },
    }).catch(() => {});

    socketService.emitSubmissionUpdate(submissionId, { stage: "FAILED", progress: 0, error: err.message });
    throw err;
  }
});

module.exports = submissionQueue;
