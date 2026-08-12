// ============================================================================
// AI Gateway — Main Orchestrator
// ============================================================================
// Central interface for all AI operations. Routes requests through configured
// providers with automatic fallback, rate limiting, usage tracking, and
// structured output validation.
// ============================================================================

const OpenAIProvider = require("./providers/openai");
const GeminiProvider = require("./providers/gemini");
const GroqProvider = require("./providers/groq");
const NvidiaProvider = require("./providers/nvidia");
const prisma = require("../../config/prisma");
const { getConfig } = require("../../config/env");

// Cost per 1M tokens (approximate, USD)
const COST_TABLE = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4-turbo": { input: 10.00, output: 30.00 },
  "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  "gemini-1.5-pro": { input: 1.25, output: 5.00 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
  // NVIDIA NIM models (free tier)
  "nvidia/nemotron-3-super-120b-a12b": { input: 0.00, output: 0.00 },
  "nvidia/llama-3.1-nemotron-70b-instruct": { input: 0.00, output: 0.00 },
  "meta/llama-3.1-8b-instruct": { input: 0.00, output: 0.00 },
};

const PROVIDER_MAP = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  groq: GroqProvider,
  nvidia: NvidiaProvider,
};

class AIGateway {
  constructor() {
    this._primary = null;
    this._fallback = null;
    this._initialized = false;
    // In-memory rate limit tracking (per user per hour)
    this._rateLimits = new Map();
  }

  _ensureInitialized() {
    if (this._initialized) return;
    const config = getConfig();
    const { ai } = config;

    if (ai.apiKey && PROVIDER_MAP[ai.provider]) {
      const ProviderClass = PROVIDER_MAP[ai.provider];
      this._primary = new ProviderClass({ apiKey: ai.apiKey, model: ai.model });
    }

    if (ai.fallbackApiKey && ai.fallbackProvider && PROVIDER_MAP[ai.fallbackProvider]) {
      const FallbackClass = PROVIDER_MAP[ai.fallbackProvider];
      this._fallback = new FallbackClass({ apiKey: ai.fallbackApiKey, model: ai.fallbackModel });
    }

    this._maxRequestsPerHour = ai.maxRequestsPerUserPerHour;
    this._maxTokensPerDay = ai.maxTokensPerUserPerDay;
    this._initialized = true;
  }

  _getProvider() {
    this._ensureInitialized();
    if (!this._primary) {
      throw Object.assign(new Error("AI provider not configured. Set AI_API_KEY in environment."), { code: "AI_NOT_CONFIGURED" });
    }
    return this._primary;
  }

  // ── Rate Limiting ────────────────────────────────────────────────────────

  _checkRateLimit(userId) {
    if (!userId) return;
    const key = `${userId}:${Math.floor(Date.now() / 3600000)}`;
    const count = this._rateLimits.get(key) || 0;
    if (count >= this._maxRequestsPerHour) {
      throw Object.assign(
        new Error(`AI rate limit exceeded. Maximum ${this._maxRequestsPerHour} requests per hour.`),
        { code: "AI_RATE_LIMITED", status: 429 }
      );
    }
    this._rateLimits.set(key, count + 1);

    // Clean old entries periodically
    if (this._rateLimits.size > 10000) {
      const currentHour = Math.floor(Date.now() / 3600000);
      for (const [k] of this._rateLimits) {
        const hour = parseInt(k.split(":")[1]);
        if (hour < currentHour - 1) this._rateLimits.delete(k);
      }
    }
  }

  // ── Usage Tracking ───────────────────────────────────────────────────────

  _estimateCost(model, inputTokens, outputTokens) {
    const costs = COST_TABLE[model];
    if (!costs) return 0;
    return (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output;
  }

  async _trackUsage({ userId, provider, model, requestType, promptVersion, usage, latency, status, error }) {
    try {
      await prisma.aIUsage.create({
        data: {
          userId: userId || null,
          provider,
          model,
          requestType,
          promptVersion: promptVersion || null,
          inputTokens: usage?.inputTokens || null,
          outputTokens: usage?.outputTokens || null,
          totalTokens: (usage?.inputTokens || 0) + (usage?.outputTokens || 0),
          latency: latency || null,
          estimatedCost: this._estimateCost(model, usage?.inputTokens || 0, usage?.outputTokens || 0),
          status: status || "success",
          errorMessage: error || null,
        },
      });
    } catch (err) {
      console.error("[AIGateway] Failed to track usage:", err.message);
    }
  }

  // ── Core Methods ─────────────────────────────────────────────────────────

  async _executeWithFallback(fn, requestType, userId, promptVersion) {
    this._checkRateLimit(userId);
    const provider = this._getProvider();
    const startTime = Date.now();

    try {
      const result = await fn(provider);
      const latency = Date.now() - startTime;

      this._trackUsage({
        userId,
        provider: provider.name,
        model: provider.model,
        requestType,
        promptVersion,
        usage: result.usage,
        latency,
        status: "success",
      });

      return result;
    } catch (primaryError) {
      const latency = Date.now() - startTime;
      this._trackUsage({
        userId,
        provider: provider.name,
        model: provider.model,
        requestType,
        promptVersion,
        usage: {},
        latency,
        status: "failed",
        error: primaryError.message,
      });

      // Try fallback
      if (this._fallback) {
        console.warn(`[AIGateway] Primary provider failed, trying fallback: ${primaryError.message}`);
        const fallbackStart = Date.now();
        try {
          const result = await fn(this._fallback);
          const fallbackLatency = Date.now() - fallbackStart;
          this._trackUsage({
            userId,
            provider: this._fallback.name,
            model: this._fallback.model,
            requestType,
            promptVersion,
            usage: result.usage,
            latency: fallbackLatency,
            status: "success",
          });
          return result;
        } catch (fallbackError) {
          console.error(`[AIGateway] Fallback also failed: ${fallbackError.message}`);
        }
      }

      throw primaryError;
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async generateText({ systemPrompt, userPrompt, temperature, maxTokens, userId, requestType = "general", promptVersion }) {
    return this._executeWithFallback(
      (provider) => provider.generateText({ systemPrompt, userPrompt, temperature, maxTokens }),
      requestType,
      userId,
      promptVersion
    );
  }

  async generateStructured({ systemPrompt, userPrompt, schema, temperature, maxTokens, userId, requestType = "structured", promptVersion }) {
    return this._executeWithFallback(
      (provider) => provider.generateStructured({ systemPrompt, userPrompt, schema, temperature, maxTokens }),
      requestType,
      userId,
      promptVersion
    );
  }

  async streamText({ systemPrompt, userPrompt, onChunk, temperature, maxTokens, userId, requestType = "stream", promptVersion }) {
    this._checkRateLimit(userId);
    const provider = this._getProvider();
    return provider.streamText({ systemPrompt, userPrompt, onChunk, temperature, maxTokens });
  }

  async chat({ messages, temperature, maxTokens, userId, requestType = "chat", promptVersion }) {
    return this._executeWithFallback(
      (provider) => provider.chat({ messages, temperature, maxTokens }),
      requestType,
      userId,
      promptVersion
    );
  }

  // ── Domain-Specific Methods ──────────────────────────────────────────────

  async generateQuestion({ topic, difficulty, role, experience, language, questionType, userId }) {
    const systemPrompt = `You are an expert technical interviewer and problem designer. 
Generate a ${questionType} question for a ${role} candidate with ${experience} experience level.
The question should be about ${topic} at ${difficulty} difficulty.
Generate appropriate starter code in ${language || "python"}.
Include test cases, hints, expected complexity, and an evaluation rubric.`;

    const userPrompt = `Generate a ${difficulty} ${questionType} question about ${topic}.
Return a JSON object with this exact structure:
{
  "type": "${questionType}",
  "title": "descriptive title",
  "description": "full problem description with examples",
  "difficulty": "${difficulty}",
  "topics": ["${topic}"],
  "constraints": ["constraint 1"],
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "edgeCases": ["edge case description"],
  "starterCode": {"${language || "python"}": "starter code"},
  "expectedComplexity": {"time": "O(n)", "space": "O(n)"},
  "hints": ["hint 1 - concept", "hint 2 - approach", "hint 3 - implementation"],
  "evaluationRubric": [{"criterion": "correctness", "weight": 40}, {"criterion": "efficiency", "weight": 30}],
  "testCases": [{"input": "...", "expectedOutput": "...", "isHidden": false}]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "question_generation",
      promptVersion: "v1.0",
    });
  }

  async evaluateCode({ code, language, problemDescription, testResults, userId }) {
    const systemPrompt = `You are a senior software engineer reviewing code. 
Evaluate the candidate's solution for correctness, efficiency, code quality, and edge case handling.
Be constructive and specific in your feedback.`;

    const userPrompt = `Review this ${language} solution:

Problem: ${problemDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Test Results: ${JSON.stringify(testResults)}

Return JSON:
{
  "score": 0-100,
  "correctness": {"score": 0-100, "feedback": "..."},
  "efficiency": {"score": 0-100, "timeComplexity": "O(?)", "spaceComplexity": "O(?)", "feedback": "..."},
  "codeQuality": {"score": 0-100, "feedback": "..."},
  "edgeCases": {"score": 0-100, "feedback": "..."},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "optimizedApproach": "brief description"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "code_evaluation",
      promptVersion: "v1.0",
    });
  }

  async generateFollowUp({ questionText, answerText, previousFollowUps = [], topic, userId }) {
    const systemPrompt = `You are a technical interviewer conducting a deep-dive follow-up.
Based on the candidate's answer, ask a probing follow-up question that tests deeper understanding.
Your follow-up should be specific to what the candidate said.
Do NOT repeat questions. Do NOT give away answers.`;

    const history = previousFollowUps.length > 0
      ? `\nPrevious follow-ups:\n${previousFollowUps.map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`).join("\n")}`
      : "";

    const userPrompt = `Original Question: ${questionText}
Candidate's Answer: ${answerText}
${history}

Return JSON:
{
  "followUpQuestion": "your probing follow-up question",
  "expectedKeyPoints": ["key point 1", "key point 2"],
  "difficulty": "same/harder/easier",
  "reasoning": "why this follow-up tests deeper understanding"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "follow_up_generation",
      promptVersion: "v1.0",
    });
  }

  async generateInterviewQuestions({ type, topics, difficulty, role, experience, count = 5, userId }) {
    const systemPrompt = `You are designing a ${type} interview for a ${role} candidate (${experience}).
Generate ${count} interview questions covering the requested topics.
Questions should progress from easier to harder.
Each question should test a different aspect of the topic.`;

    const userPrompt = `Generate ${count} ${type} interview questions.
Topics: ${topics.join(", ")}
Difficulty: ${difficulty}

Return JSON:
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "${type === "coding" ? "coding" : "short_answer"}",
      "topic": "specific topic",
      "difficulty": "${difficulty}",
      "expectedAnswer": "key points the candidate should cover",
      "followUpTopics": ["potential follow-up areas"],
      "evaluationCriteria": ["what to look for"]
    }
  ]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "interview_generation",
      promptVersion: "v1.0",
    });
  }

  async evaluateInterviewAnswer({ questionText, answerText, questionType, topic, userId }) {
    const systemPrompt = `You are evaluating a candidate's interview answer.
Score each dimension on 0-100. Be fair but rigorous.
Do not claim to measure psychological traits. Focus on technical content and communication clarity.`;

    const userPrompt = `Question: ${questionText}
Type: ${questionType}
Topic: ${topic}

Candidate's Answer: ${answerText}

Return JSON:
{
  "score": 0-100,
  "technical": {"score": 0-100, "feedback": "..."},
  "reasoning": {"score": 0-100, "feedback": "..."},
  "communication": {"score": 0-100, "feedback": "..."},
  "clarity": {"score": 0-100, "feedback": "..."},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missedPoints": ["key points the candidate did not cover"],
  "improvement": "specific suggestion for improvement"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "answer_evaluation",
      promptVersion: "v1.0",
    });
  }

  async generateHint({ problemDescription, currentCode, hintLevel, userId }) {
    const levels = {
      1: "Give a high-level conceptual hint. Do NOT reveal the approach or algorithm.",
      2: "Give a hint about the approach or algorithm to use. Do NOT reveal implementation details.",
      3: "Give an implementation hint. You may reference specific data structures or patterns.",
    };

    const systemPrompt = `You are a coding coach giving hints.
${levels[hintLevel] || levels[1]}
Consider the candidate's current code when giving the hint.`;

    const userPrompt = `Problem: ${problemDescription}

Current Code:
\`\`\`
${currentCode || "// No code written yet"}
\`\`\`

Return JSON:
{
  "hint": "your hint text",
  "hintLevel": ${hintLevel},
  "direction": "what concept or technique to explore"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "hint_generation",
      promptVersion: "v1.0",
    });
  }

  async analyzeResume({ resumeText, targetRole, userId }) {
    const systemPrompt = `You are an expert career advisor and resume reviewer.
Analyze the resume for a ${targetRole || "software engineering"} role.
Provide an estimated ATS compatibility score (clearly labeled as an estimate).
Be specific and actionable in your feedback.
Do NOT access or assume access to proprietary ATS systems.`;

    const userPrompt = `Analyze this resume:

${resumeText}

Return JSON:
{
  "atsScore": 0-100,
  "atsScoreNote": "This is an estimated compatibility score, not an exact ATS score.",
  "skills": ["extracted skill 1", "extracted skill 2"],
  "education": [{"institution": "...", "degree": "...", "year": "..."}],
  "experience": [{"company": "...", "role": "...", "duration": "...", "highlights": ["..."]}],
  "projects": [{"name": "...", "technologies": ["..."], "description": "..."}],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missingSkills": ["skills typically expected for ${targetRole || "software engineering"}"],
  "suggestions": ["specific improvement suggestion"],
  "interviewTopics": ["topics to prepare based on this resume"]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "resume_analysis",
      promptVersion: "v1.0",
    });
  }

  async generateStudyPlan({ skills, weaknesses, targetRole, duration, availableHoursPerDay, userId }) {
    const systemPrompt = `You are an expert interview preparation coach.
Create a detailed, day-by-day study plan tailored to the candidate's weaknesses.
Each day should have specific, actionable tasks.`;

    const userPrompt = `Create a ${duration}-day study plan.
Target Role: ${targetRole}
Current Strengths: ${skills.filter((s) => s.mastery > 70).map((s) => s.name).join(", ") || "None identified"}
Weaknesses: ${weaknesses.join(", ")}
Available Time: ${availableHoursPerDay || 4} hours/day

Return JSON:
{
  "title": "Study Plan for ${targetRole}",
  "days": [
    {
      "dayNumber": 1,
      "theme": "day theme",
      "tasks": [
        {
          "title": "task title",
          "type": "practice|interview|review|mock_test",
          "topic": "specific topic",
          "difficulty": "easy|medium|hard",
          "estimatedMinutes": 30,
          "description": "what to do"
        }
      ]
    }
  ]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "study_plan",
      promptVersion: "v1.0",
    });
  }

  async generateInterviewReport({ session, questions, answers, userId }) {
    const systemPrompt = `You are generating a comprehensive interview performance report.
Be specific, constructive, and actionable.
Do not claim to predict hiring outcomes.
Label all scores as preparation metrics.`;

    const qa = questions.map((q, i) => ({
      question: q.questionText,
      answer: answers[i]?.answerText || "No answer provided",
      topic: q.topic,
      followUps: q.followUps || [],
    }));

    const userPrompt = `Generate an interview report.
Interview Type: ${session.type}
Duration: ${session.totalDuration ? Math.round(session.totalDuration / 60) : "N/A"} minutes
Topics: ${session.topics.join(", ")}

Questions & Answers:
${JSON.stringify(qa, null, 2)}

Return JSON:
{
  "overallScore": 0-100,
  "technicalScore": 0-100,
  "codingScore": null or 0-100,
  "problemSolvingScore": 0-100,
  "communicationScore": 0-100,
  "conceptualScore": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "detailedFeedback": {
    "perQuestion": [{"questionIndex": 0, "score": 0-100, "feedback": "..."}]
  },
  "suggestedTopics": ["topics to study"],
  "suggestedDifficulty": "easy|medium|hard",
  "nextInterviewType": "what type of interview to try next"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "interview_report",
      promptVersion: "v1.0",
    });
  }

  // ── DSA / Code Review / SQL AI Methods ──────────────────────────────────

  /**
   * Review user code for correctness, style, and efficiency.
   * Used by Problem (DSA) page.
   */
  async reviewCode({ code, language, problemTitle, problemDescription, userId }) {
    const systemPrompt = `You are an expert software engineer doing a code review.
Analyze the code for correctness, time/space complexity, code style, and potential bugs.
Be constructive, specific, and educational. Mention both strengths and areas for improvement.`;

    const userPrompt = `Review this ${language} code:

Problem: ${problemTitle || "Unknown"}
Description: ${problemDescription || "Not provided"}

\`\`\`${language}
${code}
\`\`\`

Return JSON:
{
  "overallScore": 0-100,
  "verdict": "excellent|good|needs_improvement|poor",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "correctness": { "score": 0-100, "feedback": "..." },
  "efficiency": { "score": 0-100, "feedback": "..." },
  "codeStyle": { "score": 0-100, "feedback": "..." },
  "bugs": ["potential bug or edge case"],
  "strengths": ["what was done well"],
  "improvements": ["specific improvement suggestion"],
  "optimizedSnippet": "// A concise optimized version or key optimization idea",
  "explanation": "Overall summary for the student"
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "code_review",
      promptVersion: "v1.0",
    });
  }

  /**
   * Explain a DSA concept or problem approach.
   * Used by Problem (DSA) page.
   */
  async explainConcept({ concept, difficulty, language, userId }) {
    const systemPrompt = `You are a top CS educator. Explain programming concepts clearly with examples.
Adjust depth based on difficulty level. Use ${language || "Python"} for code examples.`;

    const userPrompt = `Explain: "${concept}"
Difficulty Level: ${difficulty || "medium"}
Language for examples: ${language || "Python"}

Return JSON:
{
  "title": "${concept}",
  "summary": "1-2 sentence overview",
  "explanation": "detailed explanation",
  "keyPoints": ["key point 1", "key point 2"],
  "codeExample": "// Working code example in ${language || "Python"}",
  "complexity": { "time": "O(?)", "space": "O(?)" },
  "useCases": ["when to use this"],
  "commonMistakes": ["common error or pitfall"],
  "relatedConcepts": ["related topic"]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "concept_explanation",
      promptVersion: "v1.0",
    });
  }

  /**
   * Explain a SQL query result or error.
   * Used by SQL Lab page.
   */
  async explainSQL({ query, error, schema, userId }) {
    const systemPrompt = `You are a SQL expert and educator.
Help students understand SQL queries, errors, and optimization.
Be clear, educational, and practical.`;

    const userPrompt = error
      ? `The following SQL query produced an error.

Query:
\`\`\`sql
${query}
\`\`\`

Error: ${error}
Schema context: ${schema || "Not provided"}

Return JSON:
{
  "errorType": "syntax|semantic|logic|permission",
  "explanation": "what caused the error",
  "fixedQuery": "corrected SQL query",
  "explanation": "why the fix works",
  "tips": ["tip to avoid this error"]
}`
      : `Explain this SQL query:

\`\`\`sql
${query}
\`\`\`

Schema context: ${schema || "Not provided"}

Return JSON:
{
  "summary": "what this query does in plain English",
  "breakdown": [
    { "clause": "SELECT", "explanation": "..." }
  ],
  "performance": "performance notes or index suggestions",
  "alternativeApproach": "simpler or more efficient alternative if any",
  "tips": ["best practice tip"]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "sql_explanation",
      promptVersion: "v1.0",
    });
  }

  /**
   * Generate a DSA problem with test cases.
   * Used by admin / AI generate problem feature.
   */
  async generateDSAProblem({ topic, difficulty, language, userId }) {
    const systemPrompt = `You are a competitive programming problem setter.
Create original, well-defined algorithmic problems with clear constraints and test cases.
Problems must be solvable and have at least one optimal solution.`;

    const userPrompt = `Generate a ${difficulty || "medium"} DSA problem on the topic: "${topic || "Arrays"}".
Primary language: ${language || "python"}

Return JSON:
{
  "title": "Problem title",
  "description": "Full problem statement with examples",
  "difficulty": "${difficulty || "medium"}",
  "topics": ["${topic || "Arrays"}"],
  "constraints": ["1 <= n <= 10^5"],
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "starterCode": { "${language || "python"}": "def solution(...):\n    pass" },
  "solutionCode": { "${language || "python"}": "def solution(...):\n    # optimal solution" },
  "expectedComplexity": { "time": "O(n log n)", "space": "O(n)" },
  "hints": ["hint 1", "hint 2"],
  "testCases": [
    { "input": "5\n1 2 3 4 5", "expectedOutput": "15", "isHidden": false },
    { "input": "3\n-1 0 1", "expectedOutput": "0", "isHidden": true }
  ]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "dsa_problem_generation",
      promptVersion: "v1.0",
    });
  }

  /**
   * Get AI feedback on a submission.
   * Used by submission result page.
   */
  async getSubmissionFeedback({ code, language, testResults, problemTitle, userId }) {
    const passed = testResults?.filter(t => t.passed)?.length || 0;
    const total = testResults?.length || 0;

    const systemPrompt = `You are a coding mentor reviewing a student submission.
Give constructive, encouraging feedback. Focus on what the student did right and how to improve.`;

    const userPrompt = `Submission for problem: "${problemTitle || "Unknown"}"
Language: ${language}
Test results: ${passed}/${total} passed

Code:
\`\`\`${language}
${code}
\`\`\`

Failed tests (if any): ${JSON.stringify(testResults?.filter(t => !t.passed) || [])}

Return JSON:
{
  "score": ${Math.round((passed / Math.max(total, 1)) * 100)},
  "status": "${passed === total ? "accepted" : "partially_correct"}",
  "summary": "brief overall feedback",
  "correctness": { "score": 0-100, "feedback": "..." },
  "efficiency": { "score": 0-100, "timeComplexity": "O(?)", "feedback": "..." },
  "strengths": ["what was done well"],
  "failureReason": "why tests failed (if any)",
  "nextSteps": ["what to try next"]
}`;

    return this.generateStructured({
      systemPrompt,
      userPrompt,
      userId,
      requestType: "submission_feedback",
      promptVersion: "v1.0",
    });
  }

  // ── Health Check ─────────────────────────────────────────────────────────

  async healthCheck() {
    try {
      this._ensureInitialized();
      if (!this._primary) {
        return { status: "unconfigured", message: "No AI provider configured" };
      }
      // Simple connectivity test
      const result = await this._primary.generateText({
        systemPrompt: "Respond with 'ok'",
        userPrompt: "Health check",
        maxTokens: 5,
        temperature: 0,
      });
      return { status: "healthy", provider: this._primary.name, model: this._primary.model };
    } catch (err) {
      return { status: "unhealthy", provider: this._primary?.name, error: err.message };
    }
  }
}

// Singleton
const gateway = new AIGateway();
module.exports = gateway;
