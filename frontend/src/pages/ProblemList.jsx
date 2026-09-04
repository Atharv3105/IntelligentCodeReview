import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, CheckCircle2, Code2, Sparkles } from "lucide-react";
import api from "../services/api";

const TOPICS = [
  "All",
  "Arrays",
  "Strings",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Dynamic Programming",
  "Trees",
  "Graphs",
  "Hashing",
  "Heap",
  "SQL",
];

function DiffBadge({ level }) {
  const map = {
    easy:   { bg: "rgba(52,211,153,0.12)", color: "#10b981", border: "rgba(52,211,153,0.25)" },
    medium: { bg: "rgba(251,191,36,0.12)", color: "#f59e0b", border: "rgba(251,191,36,0.25)" },
    hard:   { bg: "rgba(248,113,113,0.12)", color: "#ef4444", border: "rgba(248,113,113,0.25)" },
  };
  const norm = String(level || "easy").toLowerCase();
  const c = map[norm] || map.easy;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-all"
      style={{
        border: `1px solid ${active ? "var(--accent)" : "var(--glass-border)"}`,
        background: active ? "var(--accent-subtle)" : "var(--glass-bg)",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {label}
    </motion.button>
  );
}

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, [selectedDifficulty, selectedTopic]);

  const fetchProblems = async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (selectedDifficulty !== "All") q.append("difficulty", selectedDifficulty.toLowerCase());
      if (selectedTopic !== "All") q.append("topic", selectedTopic);
      q.append("limit", 100);
      const res = await api.get(`/problems?${q.toString()}`);
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      setError(err.response?.data?.error?.message || "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = problems.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      String(p.problemNumber || "").includes(term) ||
      (p.topics && p.topics.some((t) => t.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
          DSA <span className="font-bold">Problem Arena</span>
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          Practice curated algorithm and data structure problems with real-time test case feedback and AI code review.
        </p>
      </motion.div>

      {/* Topic Chips */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar"
      >
        {TOPICS.map((topic) => (
          <Chip
            key={topic}
            label={topic}
            active={selectedTopic === topic}
            onClick={() => setSelectedTopic(topic)}
          />
        ))}
      </motion.div>

      {/* Search Bar + Difficulty Segment Controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-center"
      >
        {/* Search */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border flex-1 w-full"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(16px)",
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search problems by title, topic, or #ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Difficulty Selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-full border self-stretch sm:self-auto justify-center"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            backdropFilter: "blur(16px)",
          }}
        >
          {["All", "Easy", "Medium", "Hard"].map((d) => {
            const isActive = selectedDifficulty === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className="px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  boxShadow: isActive ? "var(--accent-glow)" : "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Problem List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="spinner-ios" />
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Loading DSA problems...
            </span>
          </div>
        ) : error ? (
          <div
            className="p-6 rounded-2xl border text-center text-xs"
            style={{
              background: "var(--glass-bg)",
              borderColor: "rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-12 rounded-3xl border text-center text-xs italic"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              color: "var(--text-tertiary)",
            }}
          >
            No problems match your current filters.
          </div>
        ) : (
          filtered.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025, type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => navigate(`/problem/${p.id}`)}
              className="glass-row flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="font-mono text-xs font-semibold w-8 text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  #{p.problemNumber || idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p.title}
                    </span>
                    {p.isApproved === false && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        AI Draft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {p.topics?.length ? p.topics.join(" • ") : p.concept || "Algorithms"}
                    </span>
                    {p.collections && p.collections.length > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                        {p.collections[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <DiffBadge level={p.difficulty} />
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--text-tertiary)" }} />
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
