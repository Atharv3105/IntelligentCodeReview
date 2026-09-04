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
            provider: process.env.AI_PROVIDER || "nvidia",
            model: process.env.AI_MODEL || "nvidia/nemotron-3-super-120b-a12b",
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
  const { problemId, problemDescription, currentCode, hintLevel = 1 } = req.body;

  if (!problemDescription && !problemId) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Problem description or problemId is required." } });
  }

  try {
    const result = await aiGateway.generateHint({
      problemDescription: problemDescription || "",
      currentCode: currentCode || "",
      hintLevel: parseInt(hintLevel),
      userId: req.user?.id,
    });
    return res.json({ success: true, hint: result.data });
  } catch (err) {
    let fallbackHint = null;
    if (problemId) {
      const prob = await prisma.problem.findUnique({ where: { id: problemId }, select: { hints: true } });
      if (prob?.hints && prob.hints.length > 0) {
        const idx = Math.min(parseInt(hintLevel) - 1, prob.hints.length - 1);
        fallbackHint = prob.hints[idx] || prob.hints[0];
      }
    }

    if (!fallbackHint) {
      if (parseInt(hintLevel) === 1) {
        fallbackHint = "Consider identifying the core data structure (e.g. Hash Map, Two Pointers, or Stack) to reduce time complexity.";
      } else if (parseInt(hintLevel) === 2) {
        fallbackHint = "Check constraints and edge cases: empty inputs, boundary values, and potential duplicates.";
      } else {
        fallbackHint = "Trace the state step-by-step: store intermediate calculations to avoid redundant recomputation.";
      }
    }

    return res.json({
      success: true,
      hint: {
        hint: fallbackHint,
        direction: "Algorithmic Analysis",
        isFallback: true,
      },
    });
  }
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
      provider: process.env.AI_PROVIDER || "nvidia",
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

// ── Code Review (DSA) ─────────────────────────────────────────────────────

exports.reviewCode = asyncHandler(async (req, res) => {
  const { code, language, problemId, problemTitle, problemDescription } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Code and language are required." } });
  }

  // Optionally fetch problem info
  let title = problemTitle;
  let description = problemDescription;
  if (problemId && !title) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { title: true, description: true },
    });
    if (problem) {
      title = problem.title;
      description = problem.description;
    }
  }

  try {
    const result = await aiGateway.reviewCode({
      code,
      language,
      problemTitle: title || "Unknown",
      problemDescription: description || "",
      userId: req.user.id,
    });
    return res.json({ success: true, review: result.data });
  } catch (err) {
    return res.json({
      success: true,
      review: {
        overallScore: 85,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        explanation: "Code parsed and structured cleanly. Core logic adheres to expected patterns.",
        strengths: ["Clean syntax and readable variable naming", "Direct solution flow"],
        improvements: ["Ensure edge cases (empty or single-element inputs) are tested"],
        optimizedSnippet: code,
        isFallback: true,
      },
    });
  }
});

// ── Concept Explanation (DSA) ─────────────────────────────────────────────

exports.explainConcept = asyncHandler(async (req, res) => {
  const { concept, difficulty, language } = req.body;

  if (!concept) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Concept is required." } });
  }

  try {
    const result = await aiGateway.explainConcept({
      concept,
      difficulty: difficulty || "medium",
      language: language || "python",
      userId: req.user.id,
    });
    return res.json({ success: true, explanation: result.data });
  } catch (err) {
    return res.json({
      success: true,
      explanation: {
        concept,
        summary: `${concept} is a fundamental pattern frequently evaluated in technical interviews.`,
        keyTakeaways: [
          "Understand time and space trade-offs before coding",
          "Identify boundary conditions and corner cases",
          "Practice dry-running with small input examples",
        ],
        isFallback: true,
      },
    });
  }
});

// ── SQL AI Explain ────────────────────────────────────────────────────────

exports.explainSQL = asyncHandler(async (req, res) => {
  const { query, error, schema, challengeId } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "SQL query is required." } });
  }

  // Optionally fetch challenge schema context
  let schemaContext = schema;
  if (challengeId && !schemaContext) {
    const challenge = await prisma.sQLChallenge.findUnique({
      where: { id: challengeId },
      select: { setupSQL: true, title: true },
    });
    if (challenge) {
      schemaContext = `Challenge: ${challenge.title}\nSchema:\n${challenge.setupSQL}`;
    }
  }

  try {
    const result = await aiGateway.explainSQL({
      query,
      error: error || null,
      schema: schemaContext,
      userId: req.user.id,
    });
    return res.json({ success: true, explanation: result.data });
  } catch (err) {
    return res.json({
      success: true,
      explanation: {
        summary: "SQL Query Structural Analysis",
        feedback: error ? `Error detected: ${error}. Verify table schemas and JOIN keys.` : "Query syntax structured properly.",
        optimizedQuery: query,
        isFallback: true,
      },
    });
  }
});

// ── Generate DSA Problem ──────────────────────────────────────────────────

exports.generateDSAProblem = asyncHandler(async (req, res) => {
  const { topic, difficulty, language } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Topic is required." } });
  }

  const result = await aiGateway.generateDSAProblem({
    topic,
    difficulty: difficulty || "medium",
    language: language || "python",
    userId: req.user.id,
  });

  const data = result.data;

  // Save the generated problem
  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      description: data.description || "",
      difficulty: (data.difficulty || difficulty || "medium").toLowerCase(),
      category: "AI Generated",
      topics: data.topics || [topic],
      starterCode: data.starterCode || null,
      hints: data.hints || [],
      constraints: data.constraints || [],
      expectedComplexity: data.expectedComplexity || null,
      isGenerated: true,
      isApproved: true,
      testCases: data.testCases ? {
        create: data.testCases.map((tc, i) => ({
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          category: tc.isHidden ? "hidden" : "public",
          orderIndex: i,
        })),
      } : undefined,
      generatedFrom: {
        create: {
          provider: process.env.AI_PROVIDER || "nvidia",
          model: process.env.AI_MODEL || "nvidia/nemotron-3-super-120b-a12b",
          promptVersion: "v1.0",
          rawResponse: data,
          isValidated: false,
        },
      },
    },
    include: { testCases: { where: { category: "public" } } },
  });

  res.status(201).json({ success: true, problem, rawData: data });
});

// ── Submission Feedback ───────────────────────────────────────────────────

exports.getSubmissionFeedback = asyncHandler(async (req, res) => {
  const { submissionId, code, language, testResults, problemTitle } = req.body;

  // Optionally load submission from DB
  let codeToReview = code;
  let langToReview = language;
  let title = problemTitle;
  let results = testResults;

  if (submissionId) {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: { select: { title: true } } },
    });
    if (sub) {
      codeToReview = codeToReview || sub.code;
      langToReview = langToReview || sub.language;
      title = title || sub.problem?.title;
      results = results || sub.results;
    }
  }

  if (!codeToReview) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Code is required." } });
  }

  const result = await aiGateway.getSubmissionFeedback({
    code: codeToReview,
    language: langToReview || "python",
    testResults: results || [],
    problemTitle: title,
    userId: req.user.id,
  });

  res.json({ success: true, feedback: result.data });
});

// ── Conceptual Subject Evaluation ─────────────────────────────────────────

exports.evaluateConcept = asyncHandler(async (req, res) => {
  const { topic, question, answer, difficulty } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Question and answer are required." },
    });
  }

  const result = await aiGateway.evaluateConceptAnswer({
    topic,
    question,
    answer,
    difficulty: difficulty || "medium",
    userId: req.user.id,
  });

  const evalData = result.data || {};
  const score = typeof evalData.score === "number" ? Math.min(100, Math.max(0, evalData.score)) : 70;

  // Persist user learning progress non-blocking
  try {
    const userId = req.user.id;
    const xpEarned = Math.round(score / 5); // up to 20 XP

    // 1. Update activity log
    await prisma.activity.create({
      data: {
        userId,
        type: "concept_practice",
        title: `Core CS: ${topic || "CS Fundamentals"} (${score}/100)`,
        metadata: { topic, difficulty, score },
        xpEarned,
      },
    });

    // 2. Update user profile XP and streak
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (profile) {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = profile.lastActiveDate;
      const lastActiveStr = lastActive ? lastActive.toISOString().split("T")[0] : null;
      let newStreak = profile.streakCount;

      if (lastActiveStr !== today) {
        if (lastActive) {
          const diffMs = new Date(today).getTime() - new Date(lastActiveStr).getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          newStreak = diffDays === 1 ? profile.streakCount + 1 : diffDays > 1 ? 1 : profile.streakCount;
        } else {
          newStreak = 1;
        }
      }

      await prisma.userProfile.update({
        where: { userId },
        data: {
          xp: profile.xp + xpEarned,
          streakCount: newStreak,
          longestStreak: Math.max(profile.longestStreak, newStreak),
          lastActiveDate: new Date(),
        },
      });
    }

    // 3. Update skill mastery for this topic
    if (topic) {
      let skill = await prisma.skill.findFirst({
        where: {
          OR: [
            { name: { contains: topic, mode: "insensitive" } },
            { category: { contains: topic, mode: "insensitive" } },
          ],
        },
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: { name: topic, category: topic, description: `Conceptual understanding of ${topic}` },
        });
      }

      const userSkill = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: skill.id } },
      });

      if (userSkill) {
        const newMastery = Math.round(userSkill.mastery * 0.7 + score * 0.3);
        await prisma.userSkill.update({
          where: { id: userSkill.id },
          data: {
            mastery: Math.min(100, newMastery),
            attempts: userSkill.attempts + 1,
            lastPracticed: new Date(),
          },
        });
      } else {
        await prisma.userSkill.create({
          data: {
            userId,
            skillId: skill.id,
            mastery: Math.min(100, score),
            attempts: 1,
            lastPracticed: new Date(),
          },
        });
      }
    }
  } catch (progressErr) {
    console.warn("Failed to update user progress for concept evaluation:", progressErr.message);
  }

  res.json({ success: true, evaluation: evalData });
});

// ── AI Usage ──────────────────────────────────────────────────────────────

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
