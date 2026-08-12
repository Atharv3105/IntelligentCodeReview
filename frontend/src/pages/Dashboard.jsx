import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, TrendingUp, Target, Sparkles, Play,
  Code2, Database, BookOpen, Layers, Activity,
  CheckCircle2, Clock, Flame, ChevronRight,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { SkillMapModal } from "../components/SkillMapModal";

/* ── Default skill data ── */
const defaultSkillMap = {
  DSA: [
    { name: "Arrays", category: "DSA", mastery: 91, attempts: 12, successes: 11 },
    { name: "Strings", category: "DSA", mastery: 84, attempts: 10, successes: 8 },
    { name: "Trees", category: "DSA", mastery: 72, attempts: 8, successes: 6 },
    { name: "Graphs", category: "DSA", mastery: 54, attempts: 6, successes: 3 },
    { name: "Dynamic Programming", category: "DSA", mastery: 38, attempts: 7, successes: 2 },
  ],
  SQL: [
    { name: "Joins", category: "SQL", mastery: 89, attempts: 14, successes: 13 },
    { name: "Aggregation", category: "SQL", mastery: 81, attempts: 9, successes: 7 },
    { name: "Window Functions", category: "SQL", mastery: 63, attempts: 5, successes: 3 },
  ],
};

/* ── Animated count-up ── */
function CountUp({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.ceil(to / 60));
    const timer = setInterval(() => {
      n = Math.min(n + step, to);
      setVal(n);
      if (n >= to) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

/* ── Animated progress bar ── */
function Bar({ value, gradient = "progress-gradient", delay = 0, bg = "" }) {
  return (
    <div className={`w-full h-1.5 rounded-full overflow-hidden ${bg || "bg-slate-100 dark:bg-slate-800/60"}`}>
      <motion.div
        className={`h-full rounded-full ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub, icon: Icon, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
            {label}
          </p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-tertiary)" }}>
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Quick action button ── */
function QuickAction({ label, sub, path, icon: Icon, accent, navigate, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ x: 3 }}
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer group transition-colors"
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
      }}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>
          {sub}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--brand-blue)" }} />
    </motion.div>
  );
}

/* ── Skill Row ── */
function SkillRow({ skill, idx, onClick }) {
  const low = skill.mastery < 60;
  const mid = skill.mastery < 80;
  const gradClass = low ? "bg-amber-500" : mid ? "bg-blue-500" : "progress-gradient";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + idx * 0.06 }}
      onClick={() => onClick(skill)}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
    >
      <span className="text-[13px] font-semibold w-36 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ color: "var(--text-secondary)" }}>
        {skill.name}
      </span>
      <div className="flex-1">
        <Bar value={skill.mastery} gradient={gradClass} delay={0.3 + idx * 0.06} bg="bg-slate-100 dark:bg-slate-800/40" />
      </div>
      <span className="text-[12px] font-bold font-mono w-9 text-right flex-shrink-0" style={{ color: low ? "#f59e0b" : "var(--text-tertiary)" }}>
        {skill.mastery}%
      </span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then((r) => setDashboard(r.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = dashboard?.readinessScore || 72;
  const recs = dashboard?.recommendations || [];
  const topWeakness = recs[0]?.skill || "Dynamic Programming";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 skeleton w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton" />)}
        </div>
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-72 skeleton" />
          <div className="lg:col-span-2 h-72 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-6xl">
      {/* ── Greeting ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Good morning,{" "}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              style={{ color: "var(--brand-blue)" }}
            >
              {user?.name?.split(" ")[0] || "Candidate"}
            </motion.span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            You're on a 3-day streak 🔥 — keep the momentum going.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.18)",
            color: "#f59e0b",
          }}
        >
          <Flame className="w-4 h-4" />
          3 Day Streak
        </motion.div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Readiness Score" value={<CountUp to={score} suffix="%" />} sub="+8% this month" icon={Activity} accent="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" delay={0.05} />
        <StatCard label="Problems Solved" value={<CountUp to={47} />} sub="This month" icon={CheckCircle2} accent="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" delay={0.1} />
        <StatCard label="Interview Sessions" value={<CountUp to={12} />} sub="All time" icon={Target} accent="bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400" delay={0.15} />
        <StatCard label="Study Hours" value={<CountUp to={34} suffix="h" />} sub="This month" icon={Clock} accent="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" delay={0.2} />
      </div>

      {/* ── Hero CTA + Quick Actions ────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-3 relative rounded-2xl overflow-hidden p-7 min-h-[200px] flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #4f46e5 100%)",
            boxShadow: "0 8px 40px rgba(37,99,235,0.30)",
          }}
        >
          {/* Ambient orbs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Next Best Action</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Practice {topWeakness}
              </h2>
              <p className="text-sm text-blue-100/80 mt-2 leading-relaxed max-w-sm">
                AI analysis detected state transition errors in your last 3 attempts. 2 focused problems will boost your mastery by ~12%.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/problems")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 text-sm font-black shadow-lg transition-all"
            >
              Start Practice <ArrowRight className="w-4 h-4" />
            </motion.button>
            <span className="flex items-center text-xs text-blue-200/80 font-medium">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> ~20 minutes
            </span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl p-5 space-y-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Quick Start
            </h3>
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--text-disabled)" }} />
          </div>

          <QuickAction label="AI Technical Interview" sub="Start 30-min session" path="/interviews?type=technical" icon={Sparkles} accent="bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400" navigate={navigate} delay={0.35} />
          <QuickAction label="DSA Problem Arena" sub="47 unsolved problems" path="/problems" icon={Code2} accent="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" navigate={navigate} delay={0.4} />
          <QuickAction label="SQL Lab Sandbox" sub="Practice window functions" path="/sql" icon={Database} accent="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" navigate={navigate} delay={0.45} />
          <QuickAction label="Mock Assessment" sub="Adaptive 20-min test" path="/mock-tests?mode=adaptive" icon={Target} accent="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" navigate={navigate} delay={0.5} />
        </motion.div>
      </div>

      {/* ── Skill Map + Readiness ───────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Skill Map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-3 rounded-2xl p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>Skill Map</h3>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Click a skill for targeted practice</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => navigate("/analytics")}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--brand-blue)",
                background: "var(--brand-blue-light)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              Full Graph →
            </motion.button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-disabled)" }}>
                DSA
              </p>
              <div className="space-y-1">
                {defaultSkillMap.DSA.map((skill, idx) => (
                  <SkillRow key={skill.name} skill={skill} idx={idx} onClick={setSelectedSkill} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-disabled)" }}>
                SQL
              </p>
              <div className="space-y-1">
                {defaultSkillMap.SQL.map((skill, idx) => (
                  <SkillRow key={skill.name} skill={skill} idx={idx} onClick={setSelectedSkill} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Readiness + Continue Learning */}
        <div className="lg:col-span-2 space-y-5">
          {/* Readiness Score */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Readiness Score
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <TrendingUp className="w-2.5 h-2.5" /> ↑8%
              </span>
            </div>

            <motion.div
              className="text-5xl font-black mb-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 20 }}
              style={{ color: "var(--text-primary)" }}
            >
              <CountUp to={score} suffix="%" />
            </motion.div>
            <p className="text-xs mb-4 font-semibold text-emerald-600 dark:text-emerald-400">Good Progress</p>

            <Bar value={score} delay={0.5} />

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: "var(--text-tertiary)" }} className="font-medium">Strongest</p>
                <p className="font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>SQL Queries (89%)</p>
              </div>
              <div>
                <p style={{ color: "var(--text-tertiary)" }} className="font-medium">Improve</p>
                <p className="font-bold mt-0.5 text-amber-600 dark:text-amber-400">{topWeakness} (38%)</p>
              </div>
            </div>
          </motion.div>

          {/* AI Mentor */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e1b4b, #2e1065)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 4px 24px rgba(139,92,246,0.15)",
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI Mentor</span>
              </div>
              <p className="text-sm text-violet-100/90 leading-relaxed">
                "You're strong in SQL and arrays. Your biggest gap is DP state transitions. Focus there this week."
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/career?tab=coach")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-100 transition-colors"
                style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.35)" }}
              >
                View full plan <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Skill Diagnostic Drawer ── */}
      <SkillMapModal skill={selectedSkill} isOpen={!!selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
