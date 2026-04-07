import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { examAPI } from "../services/examApi";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";

const GRADE_COLORS = {
  "O":  "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  "A+": "text-green-400   bg-green-500/15   border-green-500/30",
  "A":  "text-teal-400    bg-teal-500/15    border-teal-500/30",
  "B+": "text-blue-400    bg-blue-500/15    border-blue-500/30",
  "B":  "text-indigo-400  bg-indigo-500/15  border-indigo-500/30",
  "C":  "text-yellow-400  bg-yellow-500/15  border-yellow-500/30",
  "F":  "text-red-400     bg-red-500/15     border-red-500/30"
};

const MEDAL = ["🥇", "🥈", "🥉"];

export default function ExamResults() {
  const { id }   = useParams();
  const { user } = useContext(AuthContext);

  const [attempt,     setAttempt]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [examTitle,   setExamTitle]   = useState("");
  const [totalMarks,  setTotalMarks]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [attemptRes, lbRes] = await Promise.all([
          examAPI.getMyAttempt(id),
          examAPI.leaderboard(id, 10)
        ]);

        const { attempt: att } = attemptRes.data;
        setAttempt(att);

        const lb = lbRes.data;
        setLeaderboard(lb.leaderboard || []);
        setExamTitle(lb.exam?.title || "Exam Results");
        setTotalMarks(lb.exam?.totalMarks || 0);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-accent-green" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-300">{error}</p>
            <Link to="/exams" className="mt-4 inline-block btn-secondary text-sm">← Back to Exams</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const gradeColor = GRADE_COLORS[attempt?.grade] || GRADE_COLORS["F"];
  const percentage = attempt?.percentage?.toFixed(1) || 0;
  const passed = attempt?.grade !== "F";

  return (
    <Layout>
      <section className="section-padding mx-auto max-w-3xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 text-5xl">{passed ? "🎉" : "📋"}</div>
          <h1 className="text-2xl font-bold text-gray-100">{examTitle}</h1>
          <p className="mt-1 text-gray-500 text-sm">Results submitted successfully</p>
        </motion.div>

        {/* ── Score Card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 py-4">
              <div>
                <p className="text-4xl font-black text-gray-100">
                  {attempt?.totalScore}
                  <span className="text-xl text-gray-500">/{totalMarks}</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">Your Score</p>
              </div>

              <div className={`rounded-xl border px-5 py-3 ${gradeColor}`}>
                <p className="text-3xl font-black">{attempt?.grade}</p>
                <p className="text-xs mt-0.5 opacity-75">{percentage}%</p>
              </div>

              <div>
                <p className="text-4xl font-black text-gray-100">
                  #{attempt?.rank || "—"}
                </p>
                <p className="mt-1 text-sm text-gray-500">Class Rank</p>
              </div>

              {attempt?.timeRemainingSeconds !== undefined && (
                <div>
                  <p className="text-2xl font-bold text-gray-300">
                    {Math.floor((attempt.timeRemainingSeconds) / 60)}m left
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Time Remaining</p>
                </div>
              )}
            </div>

            {attempt?.flagged && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-sm text-amber-400">
                ⚠️ Your attempt was flagged for review. Your teacher has been notified.
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Problem Breakdown ────────────────────────────────────────── */}
        {attempt?.problemSubmissions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <h2 className="mb-4 text-base font-semibold text-gray-200">Problem Breakdown</h2>
              <div className="space-y-2">
                {attempt.problemSubmissions.map((ps, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-gray-800/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Q{i + 1}</span>
                      <span className="text-sm text-gray-300">Problem {i + 1}</span>
                      {!ps.submissionId && (
                        <span className="text-xs text-gray-600">(Not attempted)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${ps.marksAwarded > 0 ? "text-accent-green" : "text-gray-500"}`}>
                        {ps.marksAwarded}
                      </span>
                      <span className="text-gray-600 text-xs">/ {ps.maxMarks}</span>
                      <div className="ml-2 h-1.5 w-16 rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-accent-green"
                          style={{ width: `${ps.maxMarks > 0 ? (ps.marksAwarded / ps.maxMarks) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Class Leaderboard ────────────────────────────────────────── */}
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <h2 className="mb-4 text-base font-semibold text-gray-200">🏆 Class Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.studentId?._id === user?.id || String(entry.studentId) === user?.id;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all ${
                        isMe
                          ? "bg-accent-green/10 border border-accent-green/20"
                          : "bg-gray-800/40"
                      }`}
                    >
                      <span className="w-6 text-center text-sm">
                        {i < 3 ? MEDAL[i] : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-sm font-medium ${isMe ? "text-accent-green" : "text-gray-200"}`}>
                          {entry.studentId?.name || "Student"}
                          {isMe && " (You)"}
                        </p>
                        {entry.studentId?.prn && (
                          <p className="text-xs text-gray-600">{entry.studentId.prn}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-sm text-gray-100">
                          {entry.totalScore}/{totalMarks}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[entry.grade] || ""}`}>
                          {entry.grade}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/exams" className="btn-secondary text-sm">← Back to Exams</Link>
          <Link to="/problems" className="btn-primary text-sm">Continue Practicing →</Link>
        </div>
      </section>
    </Layout>
  );
}
