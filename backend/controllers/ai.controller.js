// ============================================================================
// AI Controller — AI Generation Proxy
// ============================================================================

const aiGateway = require("../services/ai-gateway");
const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.generateQuestion = asyncHandler(async (req, res) => {
  const { topic, difficulty, role, experience, language, questionType } = req.body;

  if (!topic || !difficulty) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Topic and difficulty are required." } });
  }

  const result = await aiGateway.generateQuestion({
    topic,
    difficulty,
    role: role || "Software Engineer",
    experience: experience || "Fresher",
    language: language || "python",
    questionType: questionType || "coding",
    userId: req.user.id,
  });

  // Optionally save as a problem
  let savedProblem = null;
  if (result.data.type === "coding" && result.data.title) {
    savedProblem = await prisma.problem.create({
      data: {
        title: result.data.title,
        description: result.data.description || "",
        difficulty: result.data.difficulty || difficulty,
        category: "AI Generated",
        topics: result.data.topics || [topic],
        starterCode: result.data.starterCode || null,
        hints: result.data.hints || [],
        constraints: result.data.constraints || [],
        expectedComplexity: result.data.expectedComplexity || null,
        isGenerated: true,
        isApproved: true,
        testCases: result.data.testCases ? {
          create: result.data.testCases.map((tc, i) => ({
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            category: tc.isHidden ? "hidden" : "public",
            orderIndex: i,
          })),
        } : undefined,
        generatedFrom: {
          create: {
            provider: process.env.AI_PROVIDER || "openai",
            model: process.env.AI_MODEL || "gpt-4o-mini",
            promptVersion: "v1.0",
            rawResponse: result.data,
            isValidated: false,
          },
        },
      },
      include: { testCases: { where: { category: "public" } } },
    });
  }

  res.json({ success: true, question: result.data, problem: savedProblem });
});

exports.getHint = asyncHandler(async (req, res) => {
  const { problemDescription, currentCode, hintLevel = 1 } = req.body;

  if (!problemDescription) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Problem description is required." } });
  }

  const result = await aiGateway.generateHint({
    problemDescription,
    currentCode: currentCode || "",
    hintLevel: parseInt(hintLevel),
    userId: req.user.id,
  });

  res.json({ success: true, hint: result.data });
});

exports.generateStudyPlan = asyncHandler(async (req, res) => {
  const { duration = 7, targetRole, availableHoursPerDay } = req.body;

  const skills = await prisma.userSkill.findMany({
    where: { userId: req.user.id },
    include: { skill: true },
  });

  const weaknesses = skills.filter((s) => s.mastery < 60).map((s) => s.skill.name);

  const result = await aiGateway.generateStudyPlan({
    skills,
    weaknesses: weaknesses.length > 0 ? weaknesses : ["General DSA", "SQL Basics"],
    targetRole: targetRole || "Software Engineer",
    duration,
    availableHoursPerDay: availableHoursPerDay || 4,
    userId: req.user.id,
  });

  // Save the study plan
  const plan = await prisma.studyPlan.create({
    data: {
      userId: req.user.id,
      title: result.data.title || `${duration}-Day Study Plan`,
      duration: duration === 7 ? "seven_days" : duration === 14 ? "fourteen_days" : "thirty_days",
      targetRole: targetRole || "Software Engineer",
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      provider: process.env.AI_PROVIDER || "openai",
      generationId: require("crypto").randomUUID(),
      items: {
        create: (result.data.days || []).flatMap((day) =>
          (day.tasks || []).map((task) => ({
            dayNumber: day.dayNumber,
            title: task.title,
            description: task.description || null,
            type: task.type || "practice",
            topic: task.topic || null,
            difficulty: task.difficulty || null,
            estimatedTime: task.estimatedMinutes || null,
          }))
        ),
      },
    },
    include: { items: { orderBy: [{ dayNumber: "asc" }] } },
  });

  res.json({ success: true, studyPlan: plan });
});

exports.getAIUsage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  const where = req.user.role === "admin" ? {} : { userId: req.user.id };

  const [records, total, aggregate] = await Promise.all([
    prisma.aIUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aIUsage.count({ where }),
    prisma.aIUsage.aggregate({
      where,
      _sum: { totalTokens: true, estimatedCost: true },
      _count: true,
      _avg: { latency: true },
    }),
  ]);

  res.json({
    success: true,
    usage: records,
    summary: {
      totalRequests: aggregate._count,
      totalTokens: aggregate._sum.totalTokens || 0,
      totalCost: Math.round((aggregate._sum.estimatedCost || 0) * 10000) / 10000,
      avgLatency: Math.round(aggregate._avg.latency || 0),
    },
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
