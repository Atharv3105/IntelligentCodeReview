/**
 * Exam Scheduler Service
 * Uses node-cron to automatically:
 * 1. Transition "scheduled" exams → "live"  when scheduledStart is reached
 * 2. Transition "live" exams → "ended"      when scheduledEnd is reached
 * 3. Auto-submit all in_progress attempts   when their exam ends
 *
 * Runs every 30 seconds to keep transitions snappy.
 */

const cron = require("node-cron");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const { computeGrade, computeRanks } = require("./grading.service");
const logger = require("../utils/logger");

// ── Helper: finalise a single attempt score ────────────────────────────────
async function finaliseAttempt(attempt, exam, statusOverride) {
  const totalScore = (attempt.problemSubmissions || []).reduce(
    (sum, ps) => sum + (ps.marksAwarded || 0),
    0
  );
  const totalMaxScore = (attempt.problemSubmissions || []).reduce(
    (sum, ps) => sum + (ps.maxMarks || 0),
    0
  );
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  const { letter } = computeGrade(percentage);

  attempt.totalScore    = totalScore;
  attempt.totalMaxScore = totalMaxScore;
  attempt.percentage    = parseFloat(percentage.toFixed(2));
  attempt.grade         = letter;
  attempt.status        = statusOverride || "auto_submitted";
  attempt.submittedAt   = attempt.submittedAt || new Date();
  attempt.graded        = true;

  await attempt.save();
}

// ── Helper: recompute ranks for all attempts in an exam ───────────────────
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

// ── Cron: every 30 seconds ─────────────────────────────────────────────────
cron.schedule("*/30 * * * * *", async () => {
  const now = new Date();

  try {
    // 1. Activate scheduled exams whose start time has passed
    const toActivate = await Exam.find({
      status: "scheduled",
      scheduledStart: { $lte: now }
    });

    for (const exam of toActivate) {
      exam.status = "live";
      await exam.save();
      logger.info(`[Scheduler] Exam "${exam.title}" is now LIVE`);
    }

    // 2. End live exams whose end time has passed
    const toEnd = await Exam.find({
      status: "live",
      scheduledEnd: { $lte: now }
    });

    for (const exam of toEnd) {
      exam.status = "ended";
      await exam.save();
      logger.info(`[Scheduler] Exam "${exam.title}" has ENDED — auto-submitting in-progress attempts`);

      // 3. Auto-submit all in_progress attempts for this exam
      const openAttempts = await ExamAttempt.find({
        examId: exam._id,
        status: "in_progress"
      });

      for (const attempt of openAttempts) {
        await finaliseAttempt(attempt, exam, "auto_submitted");
      }

      // 4. Recompute ranks for all attempts once everyone is done
      await recomputeRanks(exam._id);
      logger.info(`[Scheduler] Ranks recomputed for exam "${exam.title}"`);
    }
  } catch (err) {
    logger.error("[Scheduler] Error in exam scheduler cron:", err);
  }
});

logger.info("[Scheduler] Exam scheduler started — checking every 30 seconds");
