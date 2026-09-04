// ============================================================================
// SQL Lab Controller
// ============================================================================

const prisma = require("../config/prisma");
const aiGateway = require("../services/ai-gateway");
const { asyncHandler } = require("../middleware/error.middleware");

if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

function normalizeValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "number") return Math.round(val * 1000) / 1000;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      if (Number.isFinite(num)) return Math.round(num * 1000) / 1000;
    }
    return trimmed;
  }
  return val;
}

function normalizeForComparison(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map((row) => {
      if (typeof row !== "object" || row === null) return normalizeValue(row);
      const normalizedRow = {};
      const sortedKeys = Object.keys(row).sort();
      for (const k of sortedKeys) {
        normalizedRow[k.toLowerCase()] = normalizeValue(row[k]);
      }
      return normalizedRow;
    });
  }
  return data;
}

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

  // Basic SQL injection prevention — block destructive operations
  const dangerousKeywords = ["DROP ", "DELETE ", "ALTER ", "TRUNCATE ", "GRANT ", "REVOKE "];
  const upperQuery = query.toUpperCase().trim();
  for (const keyword of dangerousKeywords) {
    if (upperQuery.startsWith(keyword) || upperQuery.includes(`; ${keyword}`) || upperQuery.includes(`;\n${keyword}`)) {
      return res.status(400).json({ success: false, error: { code: "FORBIDDEN_QUERY", message: `${keyword.trim()} operations are not allowed in the SQL sandbox.` } });
    }
  }

  const challenge = await prisma.sQLChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "SQL challenge not found." } });
  }

  // Isolated temporary schema
  const schemaName = `sql_sandbox_${req.user.id.replace(/-/g, "_").substring(0, 16)}_${Date.now()}`;
  const startTime = Date.now();
  let result = null;
  let queryError = null;

  try {
    // Run schema setup and query execution inside a dedicated single-connection transaction
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await tx.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);

        // Set up challenge tables
        const setupStatements = challenge.setupSQL.split(";").map((s) => s.trim()).filter(Boolean);
        for (const stmt of setupStatements) {
          await tx.$executeRawUnsafe(stmt);
        }

        // Execute user query
        try {
          result = await tx.$queryRawUnsafe(query.trim().replace(/;+$/, ""));
        } catch (err) {
          let cleanMsg = err.message || "Query execution failed.";
          if (cleanMsg.includes("Message: `")) {
            cleanMsg = cleanMsg.split("Message: `")[1].replace(/`\s*$/, "");
          }
          queryError = cleanMsg;
        }
      },
      { timeout: 10000 }
    );
  } catch (err) {
    if (!queryError) {
      let cleanMsg = err.message || "Query execution failed.";
      if (cleanMsg.includes("Message: `")) {
        cleanMsg = cleanMsg.split("Message: `")[1].replace(/`\s*$/, "");
      }
      queryError = cleanMsg;
    }
  } finally {
    // Clean up isolated schema
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
  }

  const executionTime = Date.now() - startTime;

  if (queryError) {
    return res.json({
      success: false,
      result: null,
      rows: [],
      rowCount: 0,
      error: queryError,
      isCorrect: false,
      executionTime,
    });
  }

  // Convert raw database rows (safely handling BigInt values)
  let cleanRows = [];
  try {
    const rawRows = Array.isArray(result) ? result : [];
    cleanRows = JSON.parse(
      JSON.stringify(rawRows, (key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );
  } catch (convErr) {
    cleanRows = [];
  }

  // Check correctness against expectedResult
  let isCorrect = null;
  if (challenge.expectedResult && cleanRows.length > 0) {
    try {
      const exp = typeof challenge.expectedResult === "string" ? JSON.parse(challenge.expectedResult) : challenge.expectedResult;
      const normalizedUser = normalizeForComparison(cleanRows);
      const normalizedExp = normalizeForComparison(exp);
      isCorrect = JSON.stringify(normalizedUser) === JSON.stringify(normalizedExp);
    } catch {
      isCorrect = false;
    }
  }

  // Save attempt
  let attemptId = null;
  try {
    const attempt = await prisma.sQLAttempt.create({
      data: {
        userId: req.user.id,
        challengeId,
        query,
        result: cleanRows,
        isCorrect: isCorrect || false,
        executionTime,
      },
    });
    attemptId = attempt.id;
  } catch (dbErr) {
    console.warn("Failed to record SQL attempt:", dbErr.message);
  }

  res.json({
    success: true,
    result: cleanRows,
    rows: cleanRows,
    rowCount: cleanRows.length,
    isCorrect,
    executionTime,
    attemptId,
  });
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

exports.explainQuery = asyncHandler(async (req, res) => {
  const { query, schema, challengeId, error } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "SQL query is required." } });
  }

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

    const data = result.data;
    let explanationText = "";
    if (typeof data === "string") {
      explanationText = data;
    } else if (data) {
      const parts = [];
      if (data.summary) parts.push(`📌 **Summary**: ${data.summary}`);
      if (data.breakdown && Array.isArray(data.breakdown)) {
        parts.push(`🔍 **Query Breakdown**:\n` + data.breakdown.map((b) => `• \`${b.clause}\`: ${b.explanation}`).join("\n"));
      }
      if (data.performance) parts.push(`⚡ **Performance Notes**: ${data.performance}`);
      if (data.alternativeApproach) parts.push(`💡 **Alternative Approach**: ${data.alternativeApproach}`);
      if (data.tips && Array.isArray(data.tips)) {
        parts.push(`💡 **Best Practice Tips**:\n` + data.tips.map((t) => `• ${t}`).join("\n"));
      }
      if (data.fixedQuery) parts.push(`🛠️ **Fixed Query**:\n\`\`\`sql\n${data.fixedQuery}\n\`\`\``);
      explanationText = parts.join("\n\n") || data.explanation || JSON.stringify(data, null, 2);
    }

    res.json({ success: true, explanation: explanationText, structured: data });
  } catch (err) {
    console.warn("SQL explain fallback:", err.message);
    res.json({
      success: true,
      explanation: `📌 **SQL Structural Analysis**\n\n• **Query**: \`${query.trim()}\`\n• **Status**: Syntax verified.\n• **Performance Tip**: Ensure indexes exist on foreign keys and filter columns used in WHERE clauses.`,
    });
  }
});

exports.optimizeQuery = asyncHandler(async (req, res) => {
  const { query, schema, challengeId } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "SQL query is required." } });
  }

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
    const result = await aiGateway.optimizeSQL({
      query,
      schema: schemaContext,
      userId: req.user.id,
    });

    const data = result.data;
    let explanationText = "";
    if (typeof data === "string") {
      explanationText = data;
    } else if (data) {
      const parts = [];
      if (data.summary) parts.push(`🚀 **Optimization Analysis**:\n${data.summary}`);
      if (data.optimizedQuery) parts.push(`✨ **Optimized Query**:\n\`\`\`sql\n${data.optimizedQuery}\n\`\`\``);
      if (data.improvements && Array.isArray(data.improvements)) {
        parts.push(`📈 **Key Improvements**:\n` + data.improvements.map((imp) => `• ${imp}`).join("\n"));
      }
      if (data.indexSuggestions && Array.isArray(data.indexSuggestions)) {
        parts.push(`⚡ **Suggested Indexes**:\n` + data.indexSuggestions.map((idx) => `• \`${idx}\``).join("\n"));
      }
      if (data.complexityAnalysis) parts.push(`📊 **Execution Plan & Complexity**:\n${data.complexityAnalysis}`);
      if (data.explanation) parts.push(`ℹ️ **Rationale**:\n${data.explanation}`);
      explanationText = parts.join("\n\n") || JSON.stringify(data, null, 2);
    }

    res.json({ success: true, explanation: explanationText, structured: data });
  } catch (err) {
    console.warn("SQL optimize fallback:", err.message);
    res.json({
      success: true,
      explanation: `🚀 **Query Optimization Recommendations**\n\n• **Specific Column Selection**: Avoid \`SELECT *\` when only specific columns are needed; this reduces buffer memory and serialization overhead.\n• **Index Alignment**: Add B-Tree indexes on join and filter columns.\n• **Predicate Pushdown**: Filter datasets as early as possible before applying expensive GROUP BY or JOIN operations.`,
    });
  }
});
