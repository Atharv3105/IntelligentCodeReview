/**
 * Exam Controller
 * Handles all exam lifecycle operations:
 *   - CRUD for teacher/admin
 *   - Student attempt flow (start → submit)
 *   - Anti-cheat event logging
 *   - Results and leaderboard
 *   - PDF export
 */

const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { computeGrade, computeRanks } = require("../services/grading.service");
const { generateExamReport } = require("../services/pdf.service");
const logger = require("../utils/logger");

// Anti-cheat: flag attempt after this many violations
const TAB_SWITCH_THRESHOLD    = 3;
const FULLSCREEN_EXIT_THRESHOLD = 3;

// ── Utility: Fisher-Yates shuffle ─────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Utility: compute and save scores for an attempt ──────────────────────
async function finaliseAttempt(attempt, statusOverride) {
  const totalScore = attempt.problemSubmissions.reduce(
    (sum, ps) => sum + (ps.marksAwarded || 0), 0
  );
  const totalMaxScore = attempt.problemSubmissions.reduce(
    (sum, ps) => sum + (ps.maxMarks || 0), 0
  );
  const percentage = totalMaxScore > 0
    ? parseFloat(((totalScore / totalMaxScore) * 100).toFixed(2))
    : 0;
  const { letter } = computeGrade(percentage);

  attempt.totalScore    = totalScore;
  attempt.totalMaxScore = totalMaxScore;
  attempt.percentage    = percentage;
  attempt.grade         = letter;
  attempt.status        = statusOverride || "submitted";
  attempt.submittedAt   = new Date();
  attempt.graded        = true;

  await attempt.save();
}

// ── Utility: recompute ranks for all attempts in an exam ─────────────────
async function recomputeRanks(examId) {
  const attempts = await ExamAttempt.find({
    examId,
    status: { $in: ["submitted", "auto_submitted"] }
  });
  const ranked = computeRanks(attempts);
  await Promise.all(
    ranked.map((a) => ExamAttempt.findByIdAndUpdate(a._id, { rank: a.rank }))
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TEACHER / ADMIN — EXAM CRUD
// ════════════════════════════════════════════════════════════════════════════

/** POST /api/exams — Create a draft exam */
exports.createExam = async (req, res) => {
  try {
    const {
      title, description, type, subject,
      targetYear, targetDivision, targetBranch,
      problems, totalMarks, passingMarks,
      durationMinutes, scheduledStart, scheduledEnd,
      shuffleProblems, allowedAttempts, instructions, resultsReleased
    } = req.body;

    const exam = await Exam.create({
      title, description, type, subject,
      createdBy: req.user.id,
      targetYear, targetDivision, targetBranch,
      problems: problems || [],
      totalMarks:   totalMarks   || 0,
      passingMarks: passingMarks || 0,
      durationMinutes: durationMinutes || 90,
      scheduledStart, scheduledEnd,
      shuffleProblems: shuffleProblems !== false,
      allowedAttempts: allowedAttempts || 1,
      instructions,
      resultsReleased: resultsReleased !== false,
      status: "draft"
    });

    res.status(201).json(exam);
  } catch (err) {
    logger.error("createExam error:", err);
    res.status(500).json({ message: "Failed to create exam" });
  }
};

/** GET /api/exams — List all exams (teacher/admin) */
exports.listExams = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { createdBy: req.user.id };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    // Admins see all exams
    if (req.user.role === "admin") delete filter.createdBy;

    const exams = await Exam.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    // Attach participant counts
    const examIds = exams.map((e) => e._id);
    const counts = await ExamAttempt.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: "$examId", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[String(c._id)] = c.count; });

    const result = exams.map((e) => ({
      ...e.toObject(),
      participantCount: countMap[String(e._id)] || 0
    }));

    res.json(result);
  } catch (err) {
    logger.error("listExams error:", err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

/** GET /api/exams/available — Student's scheduled/live exams */
exports.getAvailableExams = async (req, res) => {
  try {
    const { year, division, branch } = req.user;

    // Build audience filter — include exams targeting this student's class OR all-students exams
    const audienceFilter = {
      status: { $in: ["scheduled", "live", "ended"] },
      $or: [
        { targetYear: null },
        { targetYear: year }
      ]
    };

    const exams = await Exam.find(audienceFilter).sort({ scheduledStart: 1 });

    // Fetch this student's attempts
    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({
      examId: { $in: examIds },
      studentId: req.user.id
    });
    const attemptMap = {};
    attempts.forEach((a) => { attemptMap[String(a.examId)] = a; });

    const result = exams.map((e) => ({
      ...e.toObject(),
      myAttempt: attemptMap[String(e._id)] || null
    }));

    res.json(result);
  } catch (err) {
    logger.error("getAvailableExams error:", err);
    res.status(500).json({ message: "Failed to fetch available exams" });
  }
};

/** GET /api/exams/:id — Get single exam */
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("problems.problemId", "title difficulty maxMarks concept")
      .populate("createdBy", "name email");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    logger.error("getExam error:", err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

/** PUT /api/exams/:id — Update exam (only if draft) */
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.status !== "draft") {
      return res.status(400).json({ message: "Only draft exams can be edited" });
    }

    Object.assign(exam, req.body);
    await exam.save();
    res.json(exam);
  } catch (err) {
    logger.error("updateExam error:", err);
    res.status(500).json({ message: "Failed to update exam" });
  }
};

/** DELETE /api/exams/:id — Delete exam */
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.status === "live") {
      return res.status(400).json({ message: "Cannot delete a live exam" });
    }
    await exam.deleteOne();
    res.json({ message: "Exam deleted" });
  } catch (err) {
    logger.error("deleteExam error:", err);
    res.status(500).json({ message: "Failed to delete exam" });
  }
};

/** PUT /api/exams/:id/publish — Transition exam status */
exports.publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const { status } = req.body;
    const validTransitions = {
      draft:     ["scheduled", "live"],
      scheduled: ["live", "draft"],
      live:      ["ended"],
      ended:     []
    };

    if (!validTransitions[exam.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${exam.status}" to "${status}"`
      });
    }

    exam.status = status;
    await exam.save();
    res.json({ message: `Exam is now ${status}`, exam });
  } catch (err) {
    logger.error("publishExam error:", err);
    res.status(500).json({ message: "Failed to update exam status" });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  STUDENT — ATTEMPT LIFECYCLE
// ════════════════════════════════════════════════════════════════════════════

/** POST /api/exams/:id/attempt/start — Begin an exam attempt (idempotent) */
exports.startAttempt = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("problems.problemId");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.status !== "live") {
      return res.status(400).json({ message: "This exam is not currently live" });
    }

    // Idempotent: return existing attempt if already started
    const existing = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.user.id
    });
    if (existing) {
      if (existing.status !== "in_progress") {
        return res.status(400).json({ message: "You have already submitted this exam" });
      }
      return res.json(existing);
    }

    // Build problem list — shuffle if enabled
    let orderedProblems = exam.problems.map((p) => ({
      problemId: p.problemId._id,
      maxMarks:  p.marks,
      submissionId: null,
      marksAwarded: 0
    }));
    if (exam.shuffleProblems) {
      orderedProblems = shuffleArray(orderedProblems);
    }

    const attempt = await ExamAttempt.create({
      examId:    exam._id,
      studentId: req.user.id,
      startedAt: new Date(),
      status:    "in_progress",
      problemSubmissions: orderedProblems
    });

    res.status(201).json(attempt);
  } catch (err) {
    logger.error("startAttempt error:", err);
    res.status(500).json({ message: "Failed to start attempt" });
  }
};

/** GET /api/exams/:id/attempt/me — Get current attempt + time remaining */
exports.getMyAttempt = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("problems.problemId", "title description difficulty starterCode hints testCases");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.user.id
    }).populate("problemSubmissions.submissionId", "code status result grade feedback");

    if (!attempt) return res.status(404).json({ message: "No attempt found — please start the exam first" });

    // Calculate time remaining
    const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt)) / 1000);
    const totalAllowed = exam.durationMinutes * 60;
    const timeRemainingSeconds = Math.max(0, totalAllowed - elapsed);

    // Auto-submit if time expired and still in_progress
    if (timeRemainingSeconds === 0 && attempt.status === "in_progress") {
      attempt.timeRemainingSeconds = 0;
      await finaliseAttempt(attempt, "auto_submitted");
      await recomputeRanks(exam._id);
    }

    // Build problem list with exam-specific marks
    const examProblemMap = {};
    exam.problems.forEach((p) => { examProblemMap[String(p.problemId._id)] = p; });

    const problemsWithDetails = attempt.problemSubmissions.map((ps) => {
      const examProblem = examProblemMap[String(ps.problemId)];
      return {
        ...ps.toObject(),
        problem: examProblem?.problemId || null,
        marks: ps.maxMarks
      };
    });

    res.json({
      attempt: attempt.toObject(),
      problems: problemsWithDetails,
      timeRemainingSeconds,
      examTitle: exam.title,
      examDuration: exam.durationMinutes
    });
  } catch (err) {
    logger.error("getMyAttempt error:", err);
    res.status(500).json({ message: "Failed to get attempt" });
  }
};

/** POST /api/exams/:id/attempt/event — Log an anti-cheat event */
exports.logEvent = async (req, res) => {
  try {
    const { event } = req.body;
    const validEvents = ["tab_switch", "fullscreen_exit", "paste_attempt", "copy_attempt"];

    if (!validEvents.includes(event)) {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const attempt = await ExamAttempt.findOne({
      examId: req.params.id,
      studentId: req.user.id,
      status: "in_progress"
    });

    if (!attempt) return res.status(404).json({ message: "Active attempt not found" });

    // Append to audit log
    attempt.auditLog.push({ event, timestamp: new Date() });

    // Increment counters
    if (event === "tab_switch")      attempt.tabSwitchCount++;
    if (event === "fullscreen_exit") attempt.fullscreenExitCount++;

    // Auto-flag if threshold exceeded
    if (
      attempt.tabSwitchCount >= TAB_SWITCH_THRESHOLD ||
      attempt.fullscreenExitCount >= FULLSCREEN_EXIT_THRESHOLD
    ) {
      attempt.flagged = true;
    }

    await attempt.save();

    res.json({
      flagged:             attempt.flagged,
      tabSwitchCount:      attempt.tabSwitchCount,
      fullscreenExitCount: attempt.fullscreenExitCount
    });
  } catch (err) {
    logger.error("logEvent error:", err);
    res.status(500).json({ message: "Failed to log event" });
  }
};

/** POST /api/exams/:id/attempt/submit — Final submission */
exports.submitAttempt = async (req, res) => {
  try {
    const { problemResults } = req.body;
    // problemResults: [{ problemId, submissionId, marksAwarded }]  (optional override from client)

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.user.id,
      status: "in_progress"
    });

    if (!attempt) {
      return res.status(400).json({ message: "No active attempt found or already submitted" });
    }

    // Apply any last-minute submission data the client sends
    if (Array.isArray(problemResults)) {
      problemResults.forEach(({ problemId, submissionId, marksAwarded }) => {
        const ps = attempt.problemSubmissions.find(
          (p) => String(p.problemId) === String(problemId)
        );
        if (ps) {
          if (submissionId) ps.submissionId = submissionId;
          if (typeof marksAwarded === "number") ps.marksAwarded = marksAwarded;
          ps.attemptedAt = new Date();
        }
      });
    }

    attempt.timeRemainingSeconds =
      Math.max(0, exam.durationMinutes * 60 - Math.floor((Date.now() - new Date(attempt.startedAt)) / 1000));

    await finaliseAttempt(attempt, "submitted");

    // Recompute ranks for everyone in this exam
    await recomputeRanks(exam._id);

    // Re-fetch updated attempt to get rank
    const updated = await ExamAttempt.findById(attempt._id);

    res.json({
      message: "Exam submitted successfully",
      attempt: updated,
      resultsAvailable: exam.resultsReleased
    });
  } catch (err) {
    logger.error("submitAttempt error:", err);
    res.status(500).json({ message: "Failed to submit exam" });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  RESULTS & LEADERBOARD
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/exams/:id/results — All student results (teacher/admin) */
exports.getResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find({ examId: exam._id })
      .populate("studentId", "name email prn division year branch")
      .sort({ rank: 1, totalScore: -1 });

    const stats = {
      total:     attempts.length,
      submitted: attempts.filter((a) => a.status !== "in_progress").length,
      passed:    attempts.filter((a) => a.grade !== "F" && a.graded).length,
      average:   attempts.length
        ? (attempts.reduce((s, a) => s + a.totalScore, 0) / attempts.length).toFixed(1)
        : 0,
      flagged:   attempts.filter((a) => a.flagged).length
    };

    res.json({ exam, attempts, stats });
  } catch (err) {
    logger.error("getResults error:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
};

/** GET /api/exams/:id/results/:studentId — Single student's result */
exports.getStudentResult = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      examId:    req.params.id,
      studentId: req.params.studentId
    })
      .populate("studentId", "name email prn division year")
      .populate("problemSubmissions.submissionId", "code status result grade feedback");

    if (!attempt) return res.status(404).json({ message: "Result not found" });
    res.json(attempt);
  } catch (err) {
    logger.error("getStudentResult error:", err);
    res.status(500).json({ message: "Failed to fetch result" });
  }
};

/** GET /api/exams/:id/leaderboard — Top-N ranked attempts */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Only show leaderboard if results are released OR requester is teacher/admin
    if (!exam.resultsReleased && !["teacher", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Results not yet released by teacher" });
    }

    const top = await ExamAttempt.find({
      examId: exam._id,
      status: { $in: ["submitted", "auto_submitted"] }
    })
      .sort({ rank: 1 })
      .limit(limit)
      .populate("studentId", "name prn division year");

    // Also fetch current user's attempt rank if they took this exam
    const myAttempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.user.id
    });

    res.json({
      exam: { title: exam.title, totalMarks: exam.totalMarks },
      leaderboard: top,
      myRank:      myAttempt?.rank || null,
      myScore:     myAttempt?.totalScore || null,
      myGrade:     myAttempt?.grade || null
    });
  } catch (err) {
    logger.error("getLeaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

/** GET /api/exams/:id/export/pdf — Download PDF result report */
exports.exportPDF = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const attempts = await ExamAttempt.find({ examId: exam._id })
      .populate("studentId", "name email prn division year")
      .sort({ rank: 1 });

    const teacher = await User.findById(req.user.id);

    const pdfBuffer = await generateExamReport(exam, attempts, teacher);

    const filename = `${exam.title.replace(/[^a-z0-9]/gi, "_")}_Results.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error("exportPDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
