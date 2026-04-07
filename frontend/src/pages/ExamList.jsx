import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { examAPI } from "../services/examApi";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import useCountdown from "../hooks/useCountdown";

// ── Type badge colours ─────────────────────────────────────────────────────
const typeMeta = {
  CA1:      { label: "CA-1",     color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  CA2:      { label: "CA-2",     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  Quiz:     { label: "Quiz",     color: "bg-teal-500/20   text-teal-300   border-teal-500/30"   },
  Mock:     { label: "Mock",     color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  Practice: { label: "Practice", color: "bg-gray-500/20   text-gray-300   border-gray-500/30"   }
};

function TypeBadge({ type }) {
  const meta = typeMeta[type] || typeMeta.Practice;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function CountdownBadge({ targetDate, label }) {
  const secondsUntil = Math.max(0, Math.floor((new Date(targetDate) - Date.now()) / 1000));
  const { formattedTime } = useCountdown(secondsUntil, () => {});
  return (
    <span className="font-mono text-sm text-yellow-400">
      {label}: {formattedTime}
    </span>
  );
}

function ExamCard({ exam, attempt }) {
  const status = exam.status;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
    >
      <Card hover className="relative overflow-hidden">
        {/* Live pulse indicator */}
        {status === "live" && (
          <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        )}

        <div className="flex flex-wrap items-start gap-2">
          <TypeBadge type={exam.type} />
          {status === "live"      && <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400 border border-green-500/30">🟢 LIVE</span>}
          {status === "scheduled" && <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">📅 Scheduled</span>}
          {status === "ended"     && <span className="rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs font-semibold text-gray-400 border border-gray-500/30">✓ Ended</span>}
        </div>

        <h3 className="mt-3 text-base font-semibold text-gray-100">{exam.title}</h3>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
          <span>⏱ {exam.durationMinutes} min</span>
          <span>📊 {exam.totalMarks} marks</span>
          {exam.targetYear && <span>🎓 {exam.targetYear} {exam.targetDivision?.length ? `• Div ${exam.targetDivision.join("/")}` : ""}</span>}
          <span>📌 {exam.problems?.length || 0} problems</span>
        </div>

        {/* Countdown / result */}
        <div className="mt-3 min-h-[20px]">
          {status === "scheduled" && exam.scheduledStart && (
            <CountdownBadge targetDate={exam.scheduledStart} label="⏰ Starts in" />
          )}
          {status === "live" && exam.scheduledEnd && (
            <CountdownBadge targetDate={exam.scheduledEnd} label="Ends in" />
          )}
          {status === "ended" && attempt && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">Your Score:</span>
              <span className="font-bold text-accent-green">{attempt.totalScore}/{exam.totalMarks}</span>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-indigo-300 text-xs font-bold">{attempt.grade}</span>
              {attempt.rank && <span className="text-gray-500 text-xs">Rank #{attempt.rank}</span>}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-4">
          {status === "live" && !attempt && (
            <Link to={`/exam/${exam._id}`} className="btn-primary text-sm">
              Enter Exam →
            </Link>
          )}
          {status === "live" && attempt?.status === "in_progress" && (
            <Link to={`/exam/${exam._id}`} className="btn-primary text-sm">
              Resume Exam →
            </Link>
          )}
          {status === "ended" && attempt && (
            <Link to={`/exam/${exam._id}/results`} className="btn-secondary text-sm">
              View Results →
            </Link>
          )}
          {status === "scheduled" && (
            <span className="inline-flex items-center rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-500">
              Not started yet
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

const TABS = ["All", "Live Now", "Upcoming", "Completed"];

export default function ExamList() {
  const { isTeacher } = useContext(AuthContext);
  const [exams,    setExams]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    examAPI.available()
      .then((res) => setExams(res.data))
      .catch(() => setError("Failed to load exams"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter((e) => {
    if (activeTab === "All")       return true;
    if (activeTab === "Live Now")  return e.status === "live";
    if (activeTab === "Upcoming")  return e.status === "scheduled";
    if (activeTab === "Completed") return e.status === "ended";
    return true;
  });

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-hero">📝 CA Exams</h1>
            <p className="mt-1 text-gray-400">Scheduled and live coding assessments for your class.</p>
          </div>
          {isTeacher && (
            <Link to="/teacher" className="btn-primary text-sm">
              ➕ Manage Exams
            </Link>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-700/40 bg-gray-800/30 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-accent-green text-gray-950 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-accent-green" />
            <span className="ml-3">Loading exams...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-500">
                  <p className="text-4xl mb-3">📭</p>
                  <p>No {activeTab.toLowerCase()} exams at the moment.</p>
                  {activeTab === "Upcoming" && <p className="mt-1 text-sm">Check back later or ask your teacher.</p>}
                </div>
              ) : (
                filtered.map((exam, i) => (
                  <motion.div
                    key={exam._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ExamCard exam={exam} attempt={exam.myAttempt} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </Layout>
  );
}
