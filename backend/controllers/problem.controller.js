// ============================================================================
// Problem Controller — Prisma/PostgreSQL
// ============================================================================

const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

exports.getProblems = asyncHandler(async (req, res) => {
  const {
    search = "",
    difficulty,
    category,
    concept,
    topic,
    page = 1,
    limit = 20,
  } = req.query;

  const where = { isApproved: true };

  if (search) {
    if (!isNaN(search)) {
      where.problemNumber = parseInt(search);
    } else {
      where.title = { contains: search, mode: "insensitive" };
    }
  }

  if (difficulty && difficulty !== "All") where.difficulty = difficulty.toLowerCase();
  if (category && category !== "All") where.category = { equals: category, mode: "insensitive" };
  if (concept && concept !== "All") where.concept = { equals: concept, mode: "insensitive" };
  if (topic) where.topics = { has: topic };

  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.max(1, Math.min(parseInt(limit), 100));

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { problemNumber: "asc" },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      include: {
        _count: { select: { submissions: true, testCases: true } },
      },
    }),
    prisma.problem.count({ where }),
  ]);

  // Check which problems the user has solved
  const solvedSet = new Set();
  if (req.user) {
    const solved = await prisma.submission.findMany({
      where: {
        userId: req.user.id,
        status: "completed",
        passedTests: { not: null },
      },
      select: { problemId: true, passedTests: true, totalTests: true },
    });
    solved.forEach((s) => {
      if (s.passedTests === s.totalTests && s.totalTests > 0) {
        solvedSet.add(s.problemId);
      }
    });
  }

  const enrichedProblems = problems.map((p) => ({
    ...p,
    solved: solvedSet.has(p.id),
    submissionCount: p._count.submissions,
    testCaseCount: p._count.testCases,
  }));

  res.json({
    success: true,
    problems: enrichedProblems,
    pagination: { total, page: parsedPage, limit: parsedLimit, pages: Math.ceil(total / parsedLimit) },
  });
});

exports.getProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        where: { category: "public" },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
  }

  res.json({ success: true, problem });
});

exports.createProblem = asyncHandler(async (req, res) => {
  const { title, description, difficulty, category, concept, topics, tags, starterCode, hints, constraints, expectedComplexity, testCases } = req.body;

  const problem = await prisma.problem.create({
    data: {
      title,
      description,
      difficulty: difficulty.toLowerCase(),
      category: category || "Algorithms",
      concept: concept || "General",
      topics: topics || [],
      tags: tags || [],
      starterCode: starterCode || null,
      hints: hints || [],
      constraints: constraints || [],
      expectedComplexity: expectedComplexity || null,
      testCases: testCases ? {
        create: testCases.map((tc, i) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          category: tc.category || "public",
          orderIndex: i,
        })),
      } : undefined,
    },
    include: { testCases: true },
  });

  res.status(201).json({ success: true, problem });
});
