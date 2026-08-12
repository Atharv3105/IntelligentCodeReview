const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const aiGateway = require("../services/ai-gateway");
const protect = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");

// Create mock test
router.post("/", protect, asyncHandler(async (req, res) => {
  const { targetRole, topics, difficulty, duration, questionCount, isAdaptive, topicWeights } = req.body;

  const mockTest = await prisma.mockTest.create({
    data: {
      title: `${targetRole || "General"} Mock Test`,
      targetRole: targetRole || "Software Engineer",
      difficulty: difficulty || "medium",
      duration: duration || 60,
      questionCount: questionCount || 20,
      topicWeights: topicWeights || { DSA: 40, SQL: 20, DBMS: 15, OS: 10, CN: 10, OOP: 5 },
      isAdaptive: isAdaptive || false,
      isGenerated: true,
      status: "draft",
    },
  });

  // Generate questions via AI
  const result = await aiGateway.generateStructured({
    systemPrompt: `Generate ${questionCount || 20} mixed-type questions for a mock test.
Include MCQ, short answer, and coding questions.
Distribute across topics according to the weights provided.`,
    userPrompt: `Generate a mock test for ${targetRole || "Software Engineer"}.
Topic weights: ${JSON.stringify(topicWeights || { DSA: 40, SQL: 20, DBMS: 15, OS: 10, CN: 10, OOP: 5 })}
Difficulty: ${difficulty || "medium"}
Question count: ${questionCount || 20}

Return JSON:
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "mcq|short_answer|coding",
      "topic": "DSA",
      "difficulty": "easy|medium|hard",
      "points": 10,
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "...",
      "starterCode": null,
      "testCases": null
    }
  ]
}`,
    userId: req.user.id,
    requestType: "mock_test_generation",
  });

  const questions = result.data.questions || [];
  for (let i = 0; i < questions.length; i++) {
    await prisma.mockTestQuestion.create({
      data: {
        mockTestId: mockTest.id,
        questionText: questions[i].questionText,
        questionType: questions[i].questionType || "mcq",
        topic: questions[i].topic,
        difficulty: questions[i].difficulty || difficulty || "medium",
        orderIndex: i,
        points: questions[i].points || 10,
        options: questions[i].options || [],
        correctAnswer: questions[i].correctAnswer ?? null,
        explanation: questions[i].explanation || null,
        starterCode: questions[i].starterCode || null,
        testCases: questions[i].testCases || null,
      },
    });
  }

  await prisma.mockTest.update({ where: { id: mockTest.id }, data: { status: "active" } });

  const fullTest = await prisma.mockTest.findUnique({
    where: { id: mockTest.id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  res.status(201).json({ success: true, mockTest: fullTest });
}));

// Start attempt
router.post("/:id/start", protect, asyncHandler(async (req, res) => {
  const mockTest = await prisma.mockTest.findUnique({ where: { id: req.params.id } });
  if (!mockTest) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Mock test not found." } });

  const existing = await prisma.mockTestAttempt.findFirst({
    where: { userId: req.user.id, mockTestId: req.params.id, status: "in_progress" },
  });
  if (existing) return res.json({ success: true, attempt: existing });

  const attempt = await prisma.mockTestAttempt.create({
    data: {
      userId: req.user.id,
      mockTestId: req.params.id,
      expiresAt: new Date(Date.now() + mockTest.duration * 60 * 1000),
    },
  });

  const questions = await prisma.mockTestQuestion.findMany({
    where: { mockTestId: req.params.id },
    orderBy: { orderIndex: "asc" },
    select: { id: true, questionText: true, questionType: true, topic: true, difficulty: true, options: true, points: true, orderIndex: true },
  });

  res.json({ success: true, attempt, questions });
}));

// Submit attempt
router.post("/attempts/:id/submit", protect, asyncHandler(async (req, res) => {
  const { answers } = req.body;

  const attempt = await prisma.mockTestAttempt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!attempt) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found." } });

  const questions = await prisma.mockTestQuestion.findMany({
    where: { mockTestId: attempt.mockTestId },
    orderBy: { orderIndex: "asc" },
  });

  // Grade MCQ questions deterministically
  let totalScore = 0;
  let totalPoints = 0;
  const topicScores = {};
  const gradedAnswers = [];

  for (const q of questions) {
    totalPoints += q.points;
    const answer = answers?.find((a) => a.questionId === q.id);
    let earned = 0;

    if (q.questionType === "mcq" && answer && q.correctAnswer !== null) {
      earned = answer.selectedOption === q.correctAnswer ? q.points : 0;
    } else if (answer?.answerText) {
      // For non-MCQ, give partial credit (can be refined with AI later)
      earned = q.points * 0.5;
    }

    totalScore += earned;
    if (!topicScores[q.topic]) topicScores[q.topic] = { earned: 0, total: 0 };
    topicScores[q.topic].earned += earned;
    topicScores[q.topic].total += q.points;

    gradedAnswers.push({ questionId: q.id, answer: answer || null, earned, total: q.points, correct: earned === q.points });
  }

  const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

  // Convert topic scores to percentages
  const topicPercentages = {};
  Object.entries(topicScores).forEach(([topic, { earned, total }]) => {
    topicPercentages[topic] = total > 0 ? Math.round((earned / total) * 100) : 0;
  });

  await prisma.mockTestAttempt.update({
    where: { id: req.params.id },
    data: {
      status: "submitted",
      completedAt: new Date(),
      score: totalScore,
      totalPoints,
      percentage,
      topicScores: topicPercentages,
      answers: gradedAnswers,
    },
  });

  res.json({ success: true, score: totalScore, totalPoints, percentage, topicScores: topicPercentages });
}));

// Get history
router.get("/history", protect, asyncHandler(async (req, res) => {
  const attempts = await prisma.mockTestAttempt.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { mockTest: { select: { title: true, duration: true, questionCount: true } } },
  });

  res.json({ success: true, attempts });
}));

module.exports = router;
