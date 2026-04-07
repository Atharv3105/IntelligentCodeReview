import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";

// ── Python Topics Definition ────────────────────────────────────────────────
const TOPICS = [
  { id: "variables",   title: "Variables & Data Types",   icon: "🔢", concept: "Variables",     description: "int, str, float, bool, type casting" },
  { id: "control",     title: "Control Flow",             icon: "🔀", concept: "Control Flow",  description: "if/elif/else, loops, break, continue" },
  { id: "functions",   title: "Functions & Scope",        icon: "⚡", concept: "Functions",     description: "def, args, kwargs, lambda, scope" },
  { id: "lists",       title: "Lists & Tuples",           icon: "📋", concept: "Lists",         description: "list ops, slicing, comprehensions" },
  { id: "dicts",       title: "Dictionaries & Sets",      icon: "📖", concept: "Dictionaries",  description: "dict ops, set theory, hash maps" },
  { id: "strings",     title: "String Manipulation",      icon: "✍️",  concept: "Strings",       description: "formatting, methods, regex basics" },
  { id: "fileio",      title: "File I/O",                 icon: "💾", concept: "File I/O",      description: "read/write files, with statement" },
  { id: "oop",         title: "OOP Basics",               icon: "🏗️",  concept: "OOP",           description: "classes, objects, __init__, methods" },
  { id: "oop-adv",     title: "OOP Advanced",             icon: "🧬", concept: "Inheritance",   description: "inheritance, polymorphism, dunder" },
  { id: "exceptions",  title: "Exception Handling",       icon: "🛡️",  concept: "Exceptions",    description: "try/except/finally, custom errors" },
  { id: "recursion",   title: "Recursion",                icon: "🌀", concept: "Recursion",     description: "base case, stack, memoization" },
  { id: "algorithms",  title: "Algorithms & Complexity",  icon: "⚙️",  concept: "Algorithms",    description: "sorting, searching, Big-O notation" }
];

// ── SVG Progress Ring ───────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 52, stroke = 4 }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;

  const color = percentage >= 80 ? "#34d399" : percentage >= 40 ? "#60a5fa" : "#6b7280";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#374151" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Topic Card ──────────────────────────────────────────────────────────────
function TopicCard({ topic, solved, total, index }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const complete = pct === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/problems?concept=${encodeURIComponent(topic.concept)}`}>
        <Card hover className={`relative overflow-hidden transition-all ${complete ? "border-emerald-500/30 bg-emerald-950/20" : ""}`}>
          {complete && (
            <span className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              ✓ Complete
            </span>
          )}

          <div className="flex items-start gap-4">
            <div className="flex flex-shrink-0 flex-col items-center gap-1">
              <div className="relative flex items-center justify-center">
                <ProgressRing percentage={pct} />
                <span className="absolute text-lg">{topic.icon}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-500">{pct}%</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-100 text-sm leading-tight">{topic.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{topic.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-gray-700">
                  <motion.div
                    className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-gray-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 whitespace-nowrap">{solved}/{total}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ── Main LearningHub ────────────────────────────────────────────────────────
export default function LearningHub() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState({}); // { concept: { solved, total } }
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Fetch all problems and user's submissions in parallel
        const [problemsRes, subsRes] = await Promise.all([
          api.get("/problems"),
          api.get("/submissions/my").catch(() => ({ data: [] }))
        ]);

        const problems    = problemsRes.data?.problems || problemsRes.data || [];
        const submissions = subsRes.data || [];

        // Build a set of solved problemIds (grade > 0 or status completed)
        const solvedIds = new Set(
          submissions
            .filter((s) => s.status === "completed" && (s.grade || 0) > 0)
            .map((s) => String(s.problemId?._id || s.problemId))
        );

        // Compute per-concept totals and solved counts
        const map = {};
        for (const topic of TOPICS) {
          const topicProblems = problems.filter(
            (p) => (p.concept || "General").toLowerCase() === topic.concept.toLowerCase()
          );
          const solvedCount = topicProblems.filter((p) => solvedIds.has(String(p._id))).length;
          map[topic.id] = { solved: solvedCount, total: topicProblems.length };
        }
        setProgress(map);
      } catch (err) {
        console.error("LearningHub progress fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // Overall platform progress
  const totalSolved = Object.values(progress).reduce((s, p) => s + p.solved, 0);
  const totalAll    = Object.values(progress).reduce((s, p) => s + p.total, 0);
  const overallPct  = totalAll > 0 ? Math.round((totalSolved / totalAll) * 100) : 0;
  const completedTopics = Object.values(progress).filter((p) => p.total > 0 && p.solved >= p.total).length;

  return (
    <Layout>
      <section className="section-padding">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <motion.h1
            className="text-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            📚 Python Mastery Roadmap
          </motion.h1>
          <p className="mt-1 text-gray-400">
            Structured learning path from basics to algorithms.
            {user?.branch && ` Tailored for ${user.branch}.`}
          </p>
        </div>

        {/* ── Overall Progress Bar ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ProgressRing percentage={overallPct} size={72} stroke={6} />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-100">
                    {overallPct}%
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-100">Overall Progress</p>
                  <p className="text-sm text-gray-400">{totalSolved} of {totalAll} problems solved</p>
                </div>
              </div>

              <div className="flex gap-6 ml-auto flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-green">{completedTopics}</p>
                  <p className="text-xs text-gray-500">Topics Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-100">{TOPICS.length - completedTopics}</p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{totalAll}</p>
                  <p className="text-xs text-gray-500">Total Problems</p>
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-green to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </Card>
        </motion.div>

        {/* ── Topic Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-accent-green" />
            <span className="ml-3">Loading your progress...</span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic, i) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                solved={progress[topic.id]?.solved || 0}
                total={progress[topic.id]?.total  || 0}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ── Quick tip ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 rounded-xl border border-gray-700/30 bg-gray-800/40 p-4 text-center text-sm text-gray-500"
        >
          💡 Tip: Complete each topic's problems to unlock better CA exam scores and leaderboard ranks.
        </motion.div>
      </section>
    </Layout>
  );
}
