import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bot,
  Terminal,
  MessageSquare,
  Code,
  Database,
  Cpu,
  FileCheck2,
  SlidersHorizontal,
  FileText,
  Compass,
  BarChart3,
  History,
  X,
  ArrowRight,
} from "lucide-react";

const actions = [
  { id: "interview-tech", label: "Start Technical AI Interview", path: "/interviews?type=technical", category: "Interviews", icon: Bot },
  { id: "interview-coding", label: "Start Coding Interview", path: "/interviews?type=coding", category: "Interviews", icon: Terminal },
  { id: "interview-behavioral", label: "Start Behavioral Simulation", path: "/interviews?type=behavioral", category: "Interviews", icon: MessageSquare },
  { id: "practice-dsa", label: "Open DSA Problem Arena", path: "/problems", category: "Practice", icon: Code },
  { id: "practice-sql", label: "Launch SQL Lab Sandbox", path: "/sql", category: "Practice", icon: Database },
  { id: "practice-cs", label: "Practice Core CS Theory (DBMS, OS, CN)", path: "/subjects", category: "Practice", icon: Cpu },
  { id: "mock-quick", label: "Take Quick 20-min Mock Test", path: "/mock-tests?mode=quick", category: "Assessments", icon: FileCheck2 },
  { id: "mock-adaptive", label: "Take Adaptive Skill Assessment", path: "/mock-tests?mode=adaptive", category: "Assessments", icon: SlidersHorizontal },
  { id: "career-resume", label: "Analyze Resume for ATS Compatibility", path: "/career?tab=resume", category: "Career", icon: FileText },
  { id: "career-plan", label: "View Personalized Study Plan", path: "/career?tab=plan", category: "Career", icon: Compass },
  { id: "insights-analytics", label: "View Interview Readiness & Skill Graph", path: "/analytics", category: "Insights", icon: BarChart3 },
  { id: "insights-history", label: "View Practice & Session History", path: "/submissions", category: "Insights", icon: History },
];

const categoryColors = {
  Interviews: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
  Practice:   { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  Assessments:{ bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  Career:     { bg: "rgba(16,185,129,0.1)",  color: "#10b981", border: "rgba(16,185,129,0.25)" },
  Insights:   { bg: "rgba(100,116,139,0.1)", color: "#64748b", border: "rgba(100,116,139,0.25)" },
};

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => (p < filtered.length - 1 ? p + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => (p > 0 ? p - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, filtered, selectedIndex, navigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command Panel */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 pointer-events-none">
            <motion.div
              key="cp-panel"
              initial={{ opacity: 0, scale: 0.93, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl pointer-events-auto"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-main)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              {/* Input Header */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search actions, topics, practice or interviews..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Action List */}
              <div ref={listRef} className="max-h-96 overflow-y-auto p-2 no-scrollbar">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-10 text-center text-xs text-slate-500"
                  >
                    No matching commands found.
                  </motion.div>
                ) : (
                  filtered.map((action, idx) => {
                    const Icon = action.icon;
                    const isSelected = idx === selectedIndex;

                    return (
                      <motion.button
                        key={action.id}
                        onClick={() => {
                          navigate(action.path);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.025, duration: 0.18 }}
                        className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors"
                        style={{
                          background: isSelected ? "rgba(59,130,246,0.08)" : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              background: isSelected ? "rgba(59,130,246,0.12)" : "var(--bg-surface-2)",
                              color: isSelected ? "var(--brand-blue)" : "var(--text-tertiary)",
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className="text-xs font-medium transition-colors"
                            style={{ color: isSelected ? "var(--brand-blue)" : "var(--text-secondary)" }}
                          >
                            {action.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                            style={{
                              background: (categoryColors[action.category] || categoryColors.Insights).bg,
                              color: (categoryColors[action.category] || categoryColors.Insights).color,
                              border: `1px solid ${(categoryColors[action.category] || categoryColors.Insights).border}`,
                            }}
                          >
                            {action.category}
                          </span>
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={isSelected ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
                            className="text-blue-500"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </motion.span>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2 flex justify-between items-center text-[11px]"
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface-2)",
                  color: "var(--text-disabled)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-surface-3)", color: "var(--text-tertiary)" }}>↑↓</kbd>{" "}
                    Navigate
                  </span>
                  <span>
                    <kbd className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-surface-3)", color: "var(--text-tertiary)" }}>↵</kbd>{" "}
                    Select
                  </span>
                </div>
                <span>
                  <kbd className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-surface-3)", color: "var(--text-tertiary)" }}>ESC</kbd>{" "}
                  Close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
