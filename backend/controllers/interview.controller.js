// ============================================================================
// Interview Controller
// ============================================================================

const interviewEngine = require("../services/interview-engine");
const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.createSession = asyncHandler(async (req, res) => {
  const { type, topics, difficulty, targetRole, experienceLevel, duration, questionCount, isVoiceEnabled } = req.body;

  if (!type) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Interview type is required." } });
  }

  const session = await interviewEngine.createSession({
    userId: req.user.id,
    type,
    topics: topics || [],
    difficulty,
    targetRole,
    experienceLevel,
    duration,
    questionCount,
    isVoiceEnabled,
  });

  res.status(201).json({ success: true, session });
});

exports.startInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const result = await interviewEngine.prepareInterview(id);
  const current = await interviewEngine.getCurrentQuestion(id);
  res.json({
    success: true,
    session: result,
    question: current.currentQuestion,
    questionIndex: current.questionIndex,
    totalQuestions: current.totalQuestions,
  });
});

exports.getCurrentQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const status = await interviewEngine.getCurrentQuestion(id);
  res.json({ success: true, ...status });
});

exports.submitAnswer = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  const { answerText, code, codeLanguage } = req.body;

  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const result = await interviewEngine.submitAnswer(id, questionId, { answerText, code, codeLanguage });
  res.json({ success: true, ...result });
});

exports.getFollowUp = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;

  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const result = await interviewEngine.generateFollowUp(id, questionId);
  res.json({ success: true, ...result });
});

exports.submitFollowUp = asyncHandler(async (req, res) => {
  const { followUpId } = req.params;
  const { answerText } = req.body;

  const result = await interviewEngine.submitFollowUpAnswer(followUpId, { answerText });
  res.json({ success: true, followUp: result });
});

exports.nextQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const result = await interviewEngine.nextQuestion(id);
  res.json({ success: true, ...result });
});

exports.finishInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.interviewSession.findFirst({ where: { id, userId: req.user.id } });
  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  const result = await interviewEngine.finishInterview(id);
  res.json({ success: true, ...result });
});

exports.getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.interviewSession.findFirst({
    where: { id, userId: req.user.id },
    include: {
      questions: {
        include: { answer: true, followUps: { orderBy: { orderIndex: "asc" } } },
        orderBy: { orderIndex: "asc" },
      },
      report: true,
    },
  });

  if (!session) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Interview session not found." } });
  }

  res.json({ success: true, session });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const type = req.query.type;

  const where = { userId: req.user.id };
  if (type) where.type = type;

  const [sessions, total] = await Promise.all([
    prisma.interviewSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { report: { select: { overallScore: true } } },
    }),
    prisma.interviewSession.count({ where }),
  ]);

  res.json({
    success: true,
    sessions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
