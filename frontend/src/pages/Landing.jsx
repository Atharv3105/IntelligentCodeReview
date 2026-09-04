import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Database,
  BookOpen,
  Mic,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

function DiffBadge({ level }) {
  const map = {
    Easy: { bg: "rgba(52,211,153,.12)", color: "#10b981", border: "rgba(52,211,153,.25)" },
    Medium: { bg: "rgba(251,191,36,.12)", color: "#f59e0b", border: "rgba(251,191,36,.25)" },
    Hard: { bg: "rgba(248,113,113,.12)", color: "#ef4444", border: "rgba(248,113,113,.25)" },
  };
  const c = map[level] || map.Easy;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  );
}

export default function Landing() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const previewProblems = [
    { n: 1, title: "Two Sum", tags: "Arrays · Hashing", diff: "Easy" },
    { n: 2, title: "Valid Anagram", tags: "Strings · Hashing", diff: "Easy" },
    { n: 3, title: "Best Time to Buy & Sell", tags: "Arrays · Sliding Window", diff: "Easy" },
    { n: 4, title: "Valid Parentheses", tags: "Stack · Strings", diff: "Easy" },
    { n: 5, title: "Max Subarray", tags: "Arrays · Dynamic Programming", diff: "Medium" },
    { n: 6, title: "Container With Most Water", tags: "Arrays · Two Pointers", diff: "Medium" },
  ];

  return (
    <div
      className="min-h-screen font-sans relative overflow-x-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── Floating Pill Navigation ── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(calc(100%-32px),1160px)]">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex items-center justify-between px-4 py-2.5 rounded-full border shadow-xl"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mr-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}
            >
              II
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline" style={{ color: "var(--text-primary)" }}>
              Interview Intelligence
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Features", href: "#features" },
              { label: "Practice", href: user ? "/problems" : "/login" },
              { label: "SQL Lab", href: user ? "/sql" : "/login" },
              { label: "Interviews", href: user ? "/interviews" : "/login" },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.href.startsWith("#")) {
                    document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    navigate(link.href);
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors hover:text-blue-500 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme switch */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-full border cursor-pointer transition-colors"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                color: "var(--text-secondary)",
              }}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-md transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--accent-glow)",
                }}
              >
                Open Dashboard →
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 cursor-pointer"
                  style={{
                    background: "var(--glass-bg)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-md transition-all hover:scale-105 cursor-pointer"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "var(--accent-glow)",
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </motion.div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-32 pb-16 px-6 max-w-5xl mx-auto text-center relative">
        {/* Glow backdrop */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[110px] pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 text-xs font-semibold"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            color: "var(--accent)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>v2.0 • Native AI Engine & PostgreSQL Sandbox</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl sm:text-6xl font-light tracking-tight mb-6 max-w-4xl mx-auto leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          The intelligent <span className="font-bold">interview platform.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Master technical interviews with real-time AI code reviews, isolated SQL database sandboxes, intelligent mock sessions, and adaptive practice paths built for top engineering roles.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          <button
            onClick={() => navigate(user ? "/problems" : "/register")}
            className="px-6 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            style={{
              background: "var(--accent)",
              boxShadow: "var(--accent-glow)",
            }}
          >
            <span>Start Practicing</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="px-6 py-3 rounded-full text-sm font-medium border transition-all hover:scale-105 cursor-pointer"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
              backdropFilter: "blur(12px)",
            }}
          >
            Explore Platform
          </button>
        </motion.div>

        {/* Trust Stats Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span>500+ Curated Problems</span>
          <span>•</span>
          <span>4 Interview Modes</span>
          <span>•</span>
          <span>10+ CS Topics</span>
          <span>•</span>
          <span>100% Runs Locally</span>
        </motion.div>
      </section>

      {/* ── Interactive Live Code Window Showcase ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, type: "spring" }}
          className="rounded-3xl border overflow-hidden shadow-2xl"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* macOS Title Bar */}
          <div
            className="px-5 py-3.5 flex items-center justify-between border-b"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="text-xs font-medium ml-3" style={{ color: "var(--text-tertiary)" }}>
                Two Sum • Easy • JavaScript
              </span>
            </div>

            <div
              className="px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ background: "rgba(251,191,36,0.12)", color: "#f59e0b", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              <span>⭐ 94th Percentile</span>
            </div>
          </div>

          {/* Split IDE Demo & Problem List */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Code Box */}
            <div
              className="p-6 font-mono text-xs leading-relaxed border-b md:border-b-0 md:border-r overflow-x-auto"
              style={{
                background: "var(--code-bg)",
                borderColor: "var(--glass-border)",
                color: "#e2e8f0",
              }}
            >
              {[
                [1, "function twoSum(nums, target) {", "#e2e8f0"],
                [2, "  const map = new Map();", "#e2e8f0"],
                [3, "  for (let i = 0; i < nums.length; i++) {", "#e2e8f0"],
                [4, "    const complement = target - nums[i];", "#93c5fd"],
                [5, "    if (map.has(complement))", "#e2e8f0"],
                [6, "      return [map.get(complement), i];", "#34d399"],
                [7, "    map.set(nums[i], i);", "#e2e8f0"],
                [8, "  }", "#e2e8f0"],
                [9, "}", "#e2e8f0"],
                [10, "", "#e2e8f0"],
                [11, "// ✅ All 57 test cases passed", "#34d399"],
                [12, "// ⏱  Runtime: 68ms (beats 94.2%)", "#94a3b8"],
                [13, "// 📦 Memory:  41.9MB (beats 88.1%)", "#94a3b8"],
              ].map(([num, line, color]) => (
                <div key={num} className="flex gap-4">
                  <span className="text-slate-600 select-none w-5 text-right">{num}</span>
                  <span style={{ color }}>{line}</span>
                </div>
              ))}
            </div>

            {/* Right: Problem Arena Preview */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
                  DSA Problem Arena
                </p>
                <div className="space-y-1.5">
                  {previewProblems.map((p, idx) => (
                    <div
                      key={p.n}
                      className="glass-row flex items-center justify-between p-2.5 rounded-xl border border-transparent transition-all cursor-pointer"
                      style={{
                        background: idx === 0 ? "var(--accent-subtle)" : "transparent",
                        borderLeftColor: idx === 0 ? "var(--accent)" : "transparent",
                      }}
                      onClick={() => navigate(user ? `/problems` : "/login")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                          #{p.n}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold truncate block" style={{ color: "var(--text-primary)" }}>
                            {p.title}
                          </span>
                          <span className="text-[10px] truncate block" style={{ color: "var(--text-tertiary)" }}>
                            {p.tags}
                          </span>
                        </div>
                      </div>
                      <DiffBadge level={p.diff} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Explore 500+ standard interview questions
                </span>
                <button
                  onClick={() => navigate(user ? "/problems" : "/login")}
                  className="text-xs font-semibold flex items-center gap-1 text-blue-500 hover:underline cursor-pointer"
                >
                  <span>Open Arena</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Feature Showcase Section ── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Everything you need to <span className="font-bold">get hired.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            A complete interview preparation system — from daily practice to full-length proctored simulations.
          </p>
        </div>

        {/* Hero Feature Card: DSA & SQL Arenas */}
        <div
          className="p-8 sm:p-10 rounded-3xl border mb-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div>
            <div
              className="inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              500+ Problems & Sandboxes
            </div>
            <h3 className="text-2xl font-normal mb-3" style={{ color: "var(--text-primary)" }}>
              DSA & SQL Arenas
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              Solve algorithm and SQL challenges with real-time test case evaluation via Judge0 and isolated PostgreSQL database schemas. Every submission is analyzed for time and space complexity.
            </p>
            <button
              onClick={() => navigate(user ? "/problems" : "/login")}
              className="px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              <span>Try Problem Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className="p-5 rounded-2xl border space-y-2"
            style={{
              background: "var(--bg-surface-2)",
              borderColor: "var(--glass-border)",
            }}
          >
            {previewProblems.slice(0, 4).map((p) => (
              <div
                key={p.n}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: "var(--glass-border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                    #{p.n}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {p.title}
                  </span>
                </div>
                <DiffBadge level={p.diff} />
              </div>
            ))}
          </div>
        </div>

        {/* Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div
            className="p-8 rounded-3xl border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
              4 Interview Modes
            </span>
            <h3 className="text-xl font-normal mt-3 mb-2" style={{ color: "var(--text-primary)" }}>
              AI Interview Simulator
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Run technical, coding, and behavioral interviews powered by native AI. Receive probing follow-ups and comprehensive evaluation scorecards.
            </p>
          </div>

          <div
            className="p-8 rounded-3xl border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Skill-Level Insights
            </span>
            <h3 className="text-xl font-normal mt-3 mb-2" style={{ color: "var(--text-primary)" }}>
              Readiness Analytics
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Track a 0–100 interview readiness score. Follow personalized day-by-day roadmaps and mistake retrospectives built from actual submissions.
            </p>
          </div>
        </div>

        {/* Triple Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="p-6 rounded-2xl border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(16px)",
            }}
          >
            <BookOpen className="w-5 h-5 text-blue-500 mb-3" />
            <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Core CS Theory Lab
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Practice OS, Networks, DBMS, and System Design with dynamic AI question generation and model answers.
            </p>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Shield className="w-5 h-5 text-emerald-500 mb-3" />
            <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Live Proctoring & Security
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Full-screen enforcement, tab-switch logging, and anti-cheating audit feeds for high-stakes test environments.
            </p>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(16px)",
            }}
          >
            <Database className="w-5 h-5 text-violet-500 mb-3" />
            <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              PostgreSQL Sandbox
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Execute window functions, multi-table joins, and complex aggregations safely in isolated PostgreSQL sessions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t py-12 px-6 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        style={{ borderColor: "var(--glass-border)", color: "var(--text-tertiary)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
            II
          </div>
          <span>Interview Intelligence Platform © 2026</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="hover:text-blue-500 transition-colors">Sign In</Link>
          <Link to="/register" className="hover:text-blue-500 transition-colors">Register</Link>
          <a href="#features" className="hover:text-blue-500 transition-colors">Features</a>
        </div>
      </footer>
    </div>
  );
}
