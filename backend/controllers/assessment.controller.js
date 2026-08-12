// ============================================================================
// Assessment Controller — Prisma/PostgreSQL
// ============================================================================

const prisma = require("../config/prisma");
const { asyncHandler } = require("../middleware/error.middleware");

// --- Admin Controllers ---

exports.createAssessment = asyncHandler(async (req, res) => {
  const { title, description, type, startTime, endTime, duration, externalUrl, settings, problemIds } = req.body;

  const assessment = await prisma.assessment.create({
    data: {
      title,
      description: description || null,
      type: type || "CODING",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: parseInt(duration),
      externalUrl: externalUrl || null,
      settings: settings || { allowCopy: false, enforceFullScreen: true, maxTabSwitches: 3 },
      createdBy: req.user.id,
      questions: problemIds && Array.isArray(problemIds) ? {
        create: problemIds.map((probId, idx) => ({
          problemId: probId,
          questionType: "coding",
          orderIndex: idx,
        })),
      } : undefined,
    },
    include: { questions: true },
  });

  res.status(201).json({ success: true, assessment });
});

exports.getAllAssessments = asyncHandler(async (req, res) => {
  const assessments = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      questions: true,
      _count: { select: { attempts: true } },
    },
  });

  res.json({ success: true, assessments });
});

exports.getAllAttempts = asyncHandler(async (req, res) => {
  const attempts = await prisma.assessmentAttempt.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assessment: { select: { id: true, title: true, type: true } },
    },
  });

  res.json({ success: true, attempts });
});

exports.gradeAttempt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  const attempt = await prisma.assessmentAttempt.update({
    where: { id },
    data: {
      grade: parseFloat(grade),
      feedback: feedback || undefined,
      status: "submitted",
    },
  });

  res.json({ success: true, message: "Grade updated successfully", attempt });
});

// --- Student Controllers ---

exports.getActiveAssessments = asyncHandler(async (req, res) => {
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const assessments = await prisma.assessment.findMany({
    where: {
      endTime: { gt: twelveHoursAgo },
    },
    orderBy: { startTime: "asc" },
    include: {
      questions: true,
    },
  });

  // Attach attempt status for current student
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId: req.user.id,
      assessmentId: { in: assessments.map((a) => a.id) },
    },
  });

  const attemptMap = new Map(attempts.map((att) => [att.assessmentId, att]));

  const assessmentsWithAttempts = assessments.map((a) => {
    const attempt = attemptMap.get(a.id);
    return {
      ...a,
      myAttempt: attempt ? { status: attempt.status, grade: attempt.grade, id: attempt.id } : null,
    };
  });

  res.json({ success: true, assessments: assessmentsWithAttempts });
});

exports.startAttempt = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Test not found." } });
  }

  const now = new Date();
  if (now < assessment.startTime || now > assessment.endTime) {
    return res.status(403).json({ success: false, error: { code: "INACTIVE", message: "Test is not currently active." } });
  }

  let attempt = await prisma.assessmentAttempt.findUnique({
    where: { userId_assessmentId: { userId: req.user.id, assessmentId } },
  });

  if (attempt) {
    if (attempt.status === "submitted" || attempt.status === "timed_out") {
      return res.status(403).json({ success: false, error: { code: "ALREADY_SUBMITTED", message: "You have already submitted this test." } });
    }
    return res.json({ success: true, attempt });
  }

  const expiresAt = new Date(now.getTime() + assessment.duration * 60 * 1000);

  attempt = await prisma.assessmentAttempt.create({
    data: {
      userId: req.user.id,
      assessmentId,
      startedAt: now,
      expiresAt,
      status: "in_progress",
    },
  });

  res.status(201).json({ success: true, attempt });
});

exports.logViolation = asyncHandler(async (req, res) => {
  const { id: attemptId } = req.params;
  const { type, details } = req.body;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true },
  });

  if (!attempt) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found." } });
  }

  const currentViolations = Array.isArray(attempt.violations) ? attempt.violations : [];
  const newViolations = [...currentViolations, { type, details, timestamp: new Date() }];
  const newCount = attempt.violationCount + 1;

  const settings = attempt.assessment?.settings || {};
  const maxTabSwitches = settings.maxTabSwitches || 3;
  let newStatus = attempt.status;

  if (newCount >= maxTabSwitches) {
    newStatus = "flagged";
  }

  const updated = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      violations: newViolations,
      violationCount: newCount,
      status: newStatus,
    },
  });

  // Log integrity event
  await prisma.integrityEvent.create({
    data: {
      userId: req.user.id,
      eventType: type,
      sessionId: attemptId,
      sessionType: "assessment",
      details: { details, totalViolations: newCount },
    },
  });

  res.json({ success: true, message: "Violation logged", violationCount: updated.violationCount, status: updated.status });
});

exports.uploadDocument = asyncHandler(async (req, res) => {
  const { id: attemptId } = req.params;
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded." } });
  }

  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found." } });
  }

  const updated = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      submissionFile: req.file.filename,
      status: "submitted",
      completedAt: new Date(),
    },
  });

  res.json({ success: true, message: "Document uploaded successfully", filename: req.file.filename });
});

exports.submitAssessment = asyncHandler(async (req, res) => {
  const { id: attemptId } = req.params;
  const { isExternalSubmitted, answers } = req.body;

  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found." } });
  }

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      isExternalSubmitted: isExternalSubmitted !== undefined ? isExternalSubmitted : attempt.isExternalSubmitted,
      answers: answers || attempt.answers,
      completedAt: new Date(),
      status: "submitted",
    },
  });

  res.json({ success: true, message: "Assessment submitted successfully." });
});

exports.deleteAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.assessment.delete({ where: { id } });
  res.json({ success: true, message: "Assessment deleted successfully." });
});
