// ============================================================================
// Interview Engine — State Machine & Orchestrator
// ============================================================================
// Manages the full lifecycle of AI interviews with state transitions,
// context-aware follow-ups, and adaptive question selection.
// ============================================================================

const prisma = require("../../config/prisma");
const aiGateway = require("../ai-gateway");

// Valid state transitions
const STATE_TRANSITIONS = {
  created: ["preparing", "cancelled"],
  preparing: ["active", "cancelled"],
  active: ["listening", "next_question", "final_evaluation", "cancelled"],
  listening: ["thinking", "cancelled"],
  thinking: ["follow_up", "next_question", "final_evaluation"],
  follow_up: ["listening", "next_question", "final_evaluation"],
  next_question: ["active", "final_evaluation"],
  final_evaluation: ["completed"],
  completed: [],
  cancelled: [],
};

class InterviewEngine {
  /**
   * Create a new interview session.
   */
  async createSession({ userId, type, topics, difficulty, targetRole, experienceLevel, duration, questionCount, isVoiceEnabled }) {
    const session = await prisma.interviewSession.create({
      data: {
        userId,
        type,
        state: "created",
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Interview`,
        topics: topics || [],
        difficulty: difficulty || "medium",
        targetRole: targetRole || null,
        experienceLevel: experienceLevel || null,
        duration: duration || 30,
        questionCount: questionCount || 5,
        isVoiceEnabled: isVoiceEnabled || false,
      },
    });

    return session;
  }

  /**
   * Transition interview state with validation.
   */
  async transitionState(sessionId, newState) {
    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Interview session not found");

    const validTransitions = STATE_TRANSITIONS[session.state];
    if (!validTransitions || !validTransitions.includes(newState)) {
      throw new Error(`Invalid state transition: ${session.state} → ${newState}`);
    }

    const updateData = { state: newState };
    if (newState === "active" && !session.startedAt) {
      updateData.startedAt = new Date();
    }
    if (newState === "completed" || newState === "cancelled") {
      updateData.completedAt = new Date();
      if (session.startedAt) {
        updateData.totalDuration = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
      }
    }

    return prisma.interviewSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  /**
   * Prepare and start the interview — generate initial questions.
   */
  async prepareInterview(sessionId) {
    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Interview session not found");

    await this.transitionState(sessionId, "preparing");

    // Generate questions via AI
    const result = await aiGateway.generateInterviewQuestions({
      type: session.type,
      topics: session.topics,
      difficulty: session.difficulty,
      role: session.targetRole || "Software Engineer",
      experience: session.experienceLevel || "Fresher",
      count: session.questionCount || 5,
      userId: session.userId,
    });

    const questions = result.data.questions || [];

    // Store questions
    for (let i = 0; i < questions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          sessionId,
          questionText: questions[i].questionText,
          questionType: this._mapQuestionType(questions[i].questionType || session.type),
          topic: questions[i].topic || session.topics[0],
          difficulty: questions[i].difficulty || session.difficulty,
          orderIndex: i,
          expectedAnswer: questions[i].expectedAnswer || null,
          starterCode: questions[i].starterCode || null,
          testCases: questions[i].testCases || null,
        },
      });
    }

    await this.transitionState(sessionId, "active");

    return prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
  }

  /**
   * Get the current question for the session.
   */
  async getCurrentQuestion(sessionId) {
    const questions = await prisma.interviewQuestion.findMany({
      where: { sessionId },
      include: { answer: true, followUps: { orderBy: { orderIndex: "asc" } } },
      orderBy: { orderIndex: "asc" },
    });

    // Find first unanswered question
    const current = questions.find((q) => !q.answer);
    const answered = questions.filter((q) => q.answer);

    return {
      currentQuestion: current || null,
      questionIndex: current ? current.orderIndex : questions.length,
      totalQuestions: questions.length,
      answeredCount: answered.length,
      isComplete: !current,
    };
  }

  /**
   * Submit an answer for the current question.
   */
  async submitAnswer(sessionId, questionId, { answerText, code, codeLanguage }) {
    const question = await prisma.interviewQuestion.findFirst({
      where: { id: questionId, sessionId },
      include: { answer: true },
    });

    if (!question) throw new Error("Question not found in this session");
    if (question.answer) throw new Error("Question already answered");

    const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });

    // Evaluate the answer using AI
    const evaluation = await aiGateway.evaluateInterviewAnswer({
      questionText: question.questionText,
      answerText: answerText || code || "",
      questionType: question.questionType,
      topic: question.topic || "",
      userId: session.userId,
    });

    const answer = await prisma.interviewAnswer.create({
      data: {
        questionId,
        answerText: answerText || null,
        code: code || null,
        codeLanguage: codeLanguage || null,
        score: evaluation.data.score,
        evaluation: evaluation.data,
        strengths: evaluation.data.strengths || [],
        weaknesses: evaluation.data.weaknesses || [],
      },
    });

    return { answer, evaluation: evaluation.data };
  }

  /**
   * Generate a follow-up question based on the candidate's answer.
   */
  async generateFollowUp(sessionId, questionId) {
    const question = await prisma.interviewQuestion.findFirst({
      where: { id: questionId, sessionId },
      include: {
        answer: true,
        followUps: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!question || !question.answer) {
      throw new Error("Question must be answered before generating follow-ups");
    }

    // Get previous follow-ups for context
    const previousFollowUps = question.followUps.map((f) => ({
      question: f.followUpText,
      answer: f.answerText || "",
    }));

    const result = await aiGateway.generateFollowUp({
      questionText: question.questionText,
      answerText: question.answer.answerText || question.answer.code || "",
      previousFollowUps,
      topic: question.topic,
      userId: (await prisma.interviewSession.findUnique({ where: { id: sessionId } })).userId,
    });

    const followUp = await prisma.interviewFollowUp.create({
      data: {
        questionId,
        followUpText: result.data.followUpQuestion,
        orderIndex: question.followUps.length,
      },
    });

    await this.transitionState(sessionId, "follow_up");

    return { followUp, metadata: result.data };
  }

  /**
   * Submit a follow-up answer.
   */
  async submitFollowUpAnswer(followUpId, { answerText }) {
    const followUp = await prisma.interviewFollowUp.findUnique({
      where: { id: followUpId },
      include: { question: true },
    });

    if (!followUp) throw new Error("Follow-up not found");

    // Evaluate follow-up answer
    const evaluation = await aiGateway.evaluateInterviewAnswer({
      questionText: followUp.followUpText,
      answerText,
      questionType: followUp.question.questionType,
      topic: followUp.question.topic || "",
      userId: (await prisma.interviewSession.findUnique({
        where: { id: followUp.question.sessionId },
      })).userId,
    });

    return prisma.interviewFollowUp.update({
      where: { id: followUpId },
      data: {
        answerText,
        score: evaluation.data.score,
        evaluation: evaluation.data,
      },
    });
  }

  /**
   * Move to the next question.
   */
  async nextQuestion(sessionId) {
    await this.transitionState(sessionId, "next_question");
    const status = await this.getCurrentQuestion(sessionId);

    if (status.isComplete) {
      return this.finishInterview(sessionId);
    }

    await this.transitionState(sessionId, "active");
    return status;
  }

  /**
   * Finish the interview and generate a report.
   */
  async finishInterview(sessionId) {
    await this.transitionState(sessionId, "final_evaluation");

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            answer: true,
            followUps: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Generate report via AI
    const answers = session.questions.map((q) => q.answer);
    const reportData = await aiGateway.generateInterviewReport({
      session,
      questions: session.questions,
      answers,
      userId: session.userId,
    });

    const report = await prisma.interviewReport.create({
      data: {
        sessionId,
        overallScore: reportData.data.overallScore || 0,
        technicalScore: reportData.data.technicalScore || null,
        codingScore: reportData.data.codingScore || null,
        problemSolvingScore: reportData.data.problemSolvingScore || null,
        communicationScore: reportData.data.communicationScore || null,
        conceptualScore: reportData.data.conceptualScore || null,
        strengths: reportData.data.strengths || [],
        weaknesses: reportData.data.weaknesses || [],
        recommendations: reportData.data.recommendations || [],
        detailedFeedback: reportData.data.detailedFeedback || null,
        suggestedTopics: reportData.data.suggestedTopics || [],
        suggestedDifficulty: reportData.data.suggestedDifficulty || null,
        nextInterviewType: reportData.data.nextInterviewType || null,
      },
    });

    // Update session scores
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        overallScore: reportData.data.overallScore,
        technicalScore: reportData.data.technicalScore,
        communicationScore: reportData.data.communicationScore,
        problemSolvingScore: reportData.data.problemSolvingScore,
      },
    });

    await this.transitionState(sessionId, "completed");

    // Update user skills based on interview performance
    await this._updateUserSkills(session.userId, session.topics, reportData.data);

    return { session: await prisma.interviewSession.findUnique({ where: { id: sessionId }, include: { report: true } }), report };
  }

  /**
   * Update user skills based on interview/practice performance.
   */
  async _updateUserSkills(userId, topics, evaluation) {
    for (const topicName of topics) {
      // Find or create the skill
      let skill = await prisma.skill.findUnique({ where: { name: topicName } });
      if (!skill) {
        skill = await prisma.skill.create({
          data: { name: topicName, category: this._inferCategory(topicName) },
        });
      }

      const userSkill = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: skill.id } },
      });

      const score = evaluation.overallScore || 50;
      if (userSkill) {
        // Weighted moving average
        const newMastery = userSkill.mastery * 0.7 + score * 0.3;
        await prisma.userSkill.update({
          where: { id: userSkill.id },
          data: {
            mastery: Math.round(newMastery * 100) / 100,
            attempts: userSkill.attempts + 1,
            successes: score >= 70 ? userSkill.successes + 1 : userSkill.successes,
            confidence: Math.min(1, (userSkill.attempts + 1) / 10),
            lastPracticed: new Date(),
          },
        });
      } else {
        await prisma.userSkill.create({
          data: {
            userId,
            skillId: skill.id,
            mastery: score,
            attempts: 1,
            successes: score >= 70 ? 1 : 0,
            confidence: 0.1,
            lastPracticed: new Date(),
          },
        });
      }
    }
  }

  _mapQuestionType(type) {
    const map = {
      technical: "short_answer",
      coding: "coding",
      behavioral: "behavioral",
      hr: "short_answer",
      system_design: "system_design",
      mcq: "mcq",
      sql: "sql",
    };
    return map[type] || "short_answer";
  }

  _inferCategory(topicName) {
    const lower = topicName.toLowerCase();
    if (["arrays", "strings", "trees", "graphs", "dp", "dynamic programming", "linked lists", "stacks", "queues", "heaps", "binary search", "sorting", "recursion", "backtracking", "greedy", "bit manipulation", "sliding window", "two pointers", "tries", "union find", "segment trees", "prefix sum", "hashing", "bst"].includes(lower)) return "DSA";
    if (["sql", "queries", "joins", "aggregation"].includes(lower)) return "SQL";
    if (["normalization", "acid", "transactions", "indexing", "dbms", "database"].includes(lower)) return "DBMS";
    if (["processes", "threads", "scheduling", "memory management", "os", "operating systems", "paging", "deadlocks"].includes(lower)) return "OS";
    if (["tcp", "udp", "http", "dns", "osi", "networking", "computer networks", "cn", "routing", "sockets"].includes(lower)) return "CN";
    if (["inheritance", "polymorphism", "encapsulation", "abstraction", "oop", "design patterns"].includes(lower)) return "OOP";
    if (["scalability", "system design", "load balancing", "caching", "apis"].includes(lower)) return "System Design";
    return "General";
  }
}

module.exports = new InterviewEngine();
