import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { Badge } from "../components/ui/Badge";

const TOPICS = ["All", "Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming", "SQL", "Hashing", "Sorting"];

const diffBadge = {
  easy:   { label: "Easy",   bg: "rgba(16,185,129,0.10)", color: "#10b981", border: "rgba(16,185,129,0.25)" },
  medium: { label: "Medium", bg: "rgba(245,158,11,0.10)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  hard:   { label: "Hard",   bg: "rgba(239,68,68,0.10)",  color: "#ef4444", border: "rgba(239,68,68,0.25)"  },
};

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const navigate = useNavigate();

  useEffect(() => { fetchProblems(); }, [selectedDifficulty, selectedTopic]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedDifficulty !== "All") q.append("difficulty", selectedDifficulty);
      if (selectedTopic !== "All") q.append("topic", selectedTopic);
      q.append("limit", 100);
      const res = await api.get(`/problems?${q.toString()}`);
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = problems.filter(
    (p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.problemNumber || "").includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>DSA Problem Arena</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Practice curated algorithm and data structure problems with real-time test case feedback.
        </p>
      </motion.div>

      {/* Topic Pills */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        {TOPICS.map((topic, idx) => {
          const active = selectedTopic === topic;
          return (
            <motion.button
              key={topic}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedTopic(topic)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? "rgba(59,130,246,0.1)" : "var(--bg-surface-2)",
                border: `1px solid ${active ? "rgba(59,130,246,0.35)" : "var(--border-subtle)"}`,
                color: active ? "var(--brand-blue)" : "var(--text-tertiary)",
              }}
            >
              {topic}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Search + Difficulty */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }} className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            placeholder="Search problems by title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all focus:outline-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--brand-blue)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        {/* Difficulty toggle */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
        >
          {["All", "Easy", "Medium", "Hard"].map((diff) => {
            const active = selectedDifficulty === diff;
            return (
              <motion.button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                whileTap={{ scale: 0.95 }}
                className="relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{ color: active ? "var(--text-primary)" : "var(--text-tertiary)" }}
              >
                {active && (
                  <motion.div
                    layoutId="diff-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{diff}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Problem List */}
      <div className="space-y-2">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }} className="h-[68px] skeleton rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}>
            No problems match your current filters.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((prob, idx) => {
              const diff = prob.difficulty?.toLowerCase() || "easy";
              const badge = diffBadge[diff] || diffBadge.easy;
              return (
                <motion.div
                  key={prob.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, scale: 0.98 }}
                  transition={{ delay: Math.min(idx * 0.025, 0.3), duration: 0.22 }}
                  onClick={() => navigate(`/problem/${prob.id}`)}
                  whileHover={{ y: -1 }}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer group transition-all ambient-card"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                  onHoverStart={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onHoverEnd={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "var(--shadow-xs)";
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold w-8" style={{ color: "var(--text-disabled)" }}>
                      #{prob.problemNumber || idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold transition-colors" style={{ color: "var(--text-primary)" }}>
                          {prob.title}
                        </h3>
                        {prob.solved && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(prob.topics || []).slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] font-semibold" style={{ color: "var(--text-disabled)" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
                      style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                    >
                      {prob.difficulty}
                    </span>
                    <motion.span
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ color: "var(--text-disabled)" }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
