// ============================================================================
// SQL Lab Controller
// ============================================================================

const prisma = require("../config/prisma");
const aiGateway = require("../services/ai-gateway");
const { asyncHandler } = require("../middleware/error.middleware");

exports.getChallenges = asyncHandler(async (req, res) => {
  const { difficulty, topic, page = 1, limit = 20 } = req.query;
  const where = {};
  if (difficulty && difficulty !== "All") where.difficulty = difficulty.toLowerCase();
  if (topic) where.topic = { contains: topic, mode: "insensitive" };

  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(parseInt(limit), 50);

  const [challenges, total] = await Promise.all([
    prisma.sQLChallenge.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      select: { id: true, title: true, description: true, difficulty: true, topic: true, createdAt: true },
    }),
    prisma.sQLChallenge.count({ where }),
  ]);

  res.json({ success: true, challenges, pagination: { total, page: parsedPage, limit: parsedLimit, pages: Math.ceil(total / parsedLimit) } });
});

exports.getChallenge = asyncHandler(async (req, res) => {
  const challenge = await prisma.sQLChallenge.findUnique({
    where: { id: req.params.id },
    select: { id: true, title: true, description: true, difficulty: true, topic: true, setupSQL: true, hints: true, explanation: true },
  });

  if (!challenge) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "SQL challenge not found." } });
  }

  res.json({ success: true, challenge });
});

exports.executeQuery = asyncHandler(async (req, res) => {
  const { challengeId, query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "SQL query cannot be empty." } });
  }

  // Basic SQL injection prevention — block dangerous operations
  const dangerousKeywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"];
  const upperQuery = query.toUpperCase().trim();
  for (const keyword of dangerousKeywords) {
    if (upperQuery.startsWith(keyword)) {
      return res.status(400).json({ success: false, error: { code: "FORBIDDEN_QUERY", message: `${keyword} queries are not allowed in the SQL sandbox.` } });
    }
  }

  const challenge = await prisma.sQLChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "SQL challenge not found." } });
  }

  // Execute in isolated schema using raw SQL
  const schemaName = `sql_sandbox_${req.user.id.replace(/-/g, "_").substring(0, 20)}_${Date.now()}`;

  try {
    // Create isolated schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}"`);

    // Set up challenge tables
    const setupStatements = challenge.setupSQL.split(";").filter((s) => s.trim());
    for (const stmt of setupStatements) {
      if (stmt.trim()) {
        await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}"; ${stmt}`);
      }
    }

    // Execute user query
    const startTime = Date.now();
    let result;
    try {
      result = await prisma.$queryRawUnsafe(`SET search_path TO "${schemaName}"; ${query}`);
    } catch (queryErr) {
      // Clean up schema
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
      return res.json({
        success: true,
        result: null,
        error: queryErr.message,
        isCorrect: false,
        executionTime: Date.now() - startTime,
      });
    }
    const executionTime = Date.now() - startTime;

    // Check correctness
    const isCorrect = challenge.expectedResult
      ? JSON.stringify(result) === JSON.stringify(challenge.expectedResult)
      : null;

    // Clean up schema
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});

    // Save attempt
    const attempt = await prisma.sQLAttempt.create({
      data: {
        userId: req.user.id,
        challengeId,
        query,
        result: result || null,
        isCorrect,
        executionTime,
      },
    });

    res.json({ success: true, result, isCorrect, executionTime, attemptId: attempt.id });
  } catch (err) {
    // Clean up schema on error
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
    throw err;
  }
});

exports.generateChallenge = asyncHandler(async (req, res) => {
  const { topic, difficulty } = req.body;

  const result = await aiGateway.generateStructured({
    systemPrompt: `You are a SQL education expert. Generate a SQL practice challenge.
Create a realistic database schema with sample data and a query challenge.
The setup SQL should use CREATE TABLE and INSERT INTO statements.
The solution SQL should be a SELECT query.`,
    userPrompt: `Generate a ${difficulty || "medium"} SQL challenge about ${topic || "joins"}.
Return JSON:
{
  "title": "Challenge title",
  "description": "Problem description",
  "setupSQL": "CREATE TABLE ...; INSERT INTO ...;",
  "solutionSQL": "SELECT ...",
  "hints": ["hint 1"],
  "explanation": "How to solve this",
  "topic": "${topic || "joins"}"
}`,
    userId: req.user.id,
    requestType: "sql_challenge_generation",
  });

  const challenge = await prisma.sQLChallenge.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      difficulty: difficulty || "medium",
      topic: result.data.topic || topic || "joins",
      setupSQL: result.data.setupSQL,
      solutionSQL: result.data.solutionSQL,
      hints: result.data.hints || [],
      explanation: result.data.explanation || "",
      isGenerated: true,
    },
  });

  res.json({ success: true, challenge });
});
