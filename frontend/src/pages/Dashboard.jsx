import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  Code2,
  Database,
  BookOpen,
  Activity,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
  History,
  XCircle,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { SkillMapModal } from "../components/SkillMapModal";

function CountUp({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to || to <= 0) {
      setVal(0);
      return;
    }
    let n = 0;
    const step = Math.max(1, Math.ceil(to / 40));
    const timer = setInterval(() => {
      n = Math.min(n + step, to);
      setVal(n);
      if (n >= to) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

function Bar({ value, color = "var(--accent)", delay = 0 }) {
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ background: "var(--glass-border)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, delay, ease: [0.34, 1.46, 0.64, 1] }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      className="rounded-3xl p-5 relative overflow-hidden border shadow-sm"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {sub && (
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-tertiary)" }}>
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-2xl ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ label, sub, path, icon: Icon, accent, navigate, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02, x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(path)}
      className="glass-row flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer group transition-all border"
      style={{
        borderColor: "var(--glass-border)",
        background: "var(--glass-bg)",
      }}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
          {sub}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function SkillRow({ skill, idx, onClick }) {
  const low = skill.mastery < 50;
  const mid = skill.mastery < 75;
  const color = skill.mastery === 0 ? "rgba(148,163,184,0.4)" : low ? "#f59e0b" : mid ? "var(--accent)" : "#10b981";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + idx * 0.03 }}
      onClick={() => onClick(skill)}
      className="glass-row flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer group transition-all"
    >
      <div className="w-36 min-w-0">
        <span className="text-xs font-medium truncate block group-hover:text-blue-500 transition-colors" style={{ color: "var(--text-secondary)" }}>
          {skill.name}
        </span>
        <span className="text-[9px] block" style={{ color: "var(--text-tertiary)" }}>
          {skill.attempts > 0 ? `${skill.attempts} attempts` : "0 attempts"}
        </span>
      </div>
      <div className="flex-1">
        <Bar value={skill.mastery} color={color} delay={0.15 + idx * 0.03} />
      </div>
      <span className="text-[11px] font-bold font-mono w-9 text-right flex-shrink-0" style={{ color }}>
        {skill.mastery}%
      </span>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then((r) => setDashboard(r.data.dashboard))
      .catch((err) => console.error("Failed to load dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const score = dashboard?.readinessScore ?? 0;
  const streak = dashboard?.streak ?? 0;
  const totalSolved = dashboard?.totalSolved ?? 0;
  const totalInterviews = dashboard?.totalInterviews ?? 0;
  const studyHours = dashboard?.studyHours ?? 0;

  const recs = dashboard?.recommendations || [];
  const primaryRec = recs[0] || {
    skill: "Arrays & Strings",
    category: "DSA",
    mastery: 0,
    suggestion: "Start your preparation by mastering fundamental array manipulation and two-pointer patterns.",
  };

  const dsaSkills = dashboard?.skills?.DSA || [];
  const sqlSkills = dashboard?.skills?.SQL || [];

  // Collect all skills across all categories
  const allSkillsList = [];
  if (dashboard?.skills) {
    Object.values(dashboard.skills).forEach((skillArr) => {
      if (Array.isArray(skillArr)) allSkillsList.push(...skillArr);
    });
  }

  const practicedSkills = allSkillsList.filter((s) => s.attempts > 0 || s.mastery > 0);
  const strongestSkill = practicedSkills.length > 0
    ? [...practicedSkills].sort((a, b) => b.mastery - a.mastery)[0]
    : null;
  const focusSkill = practicedSkills.length > 0
    ? [...practicedSkills].sort((a, b) => a.mastery - b.mastery)[0]
    : null;

  const getRecPath = (rec) => {
    if (rec?.category === "SQL") return "/sql";
    if (["DBMS", "OS", "CN", "OOP", "System Design"].includes(rec?.category)) {
      return `/subjects?topic=${encodeURIComponent(rec.category)}`;
    }
    return "/problems";
  };

  const mentorInsight = (() => {
    if (practicedSkills.length === 0) {
      return "Welcome! Solve your first DSA problem or try an AI interview session to unlock diagnostic feedback and skill growth analytics.";
    }
    if (score >= 80) {
      return `Outstanding progress! Your readiness index is at ${score}%. Polish high-concurrency systems and edge case trade-offs in mock rounds to maintain your edge.`;
    }
    if (focusSkill) {
      return `Good momentum! Focus on ${focusSkill.name} (currently at ${focusSkill.mastery}% mastery) to lift your overall readiness score above ${Math.min(90, Math.round(score + 15))}%.`;
    }
    return `You've completed ${totalSolved} problems. Consistent daily practice will reinforce your algorithm recognition and time complexity precision.`;
  })();

  const recentSubmissions = dashboard?.recentSubmissions || [];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="spinner-ios" />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Loading your personalized workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-6xl pb-8">
      {/* ── Greeting ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
            Welcome back,{" "}
            <span className="font-bold text-blue-500">
              {user?.name?.split(" ")[0] || "Candidate"}
            </span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {streak > 0
              ? `You're on a ${streak}-day streak 🔥 — stay on track for your upcoming rounds.`
              : "Welcome to your AI workspace — start your preparation streak today."}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
          onClick={() => navigate("/analytics")}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 cursor-pointer transition-all hover:scale-105"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#f59e0b",
          }}
        >
          <Flame className="w-4 h-4" />
          <span>{streak > 0 ? `${streak} Day Streak` : "Start Streak 🔥"}</span>
        </motion.div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Readiness Score"
          value={<CountUp to={score} suffix="%" />}
          sub={score > 0 ? "Overall mastery level" : "Calculated from practice"}
          icon={Activity}
          accent="bg-blue-500/10 text-blue-500"
          delay={0.05}
        />
        <StatCard
          label="Problems Solved"
          value={<CountUp to={totalSolved} />}
          sub={totalSolved > 0 ? "Completed solutions" : "None solved yet"}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-500"
          delay={0.1}
        />
        <StatCard
          label="Interview Sessions"
          value={<CountUp to={totalInterviews} />}
          sub={totalInterviews > 0 ? "Mock rounds finished" : "None completed yet"}
          icon={Target}
          accent="bg-violet-500/10 text-violet-500"
          delay={0.15}
        />
        <StatCard
          label="Study Hours"
          value={<CountUp to={studyHours} suffix="h" />}
          sub={studyHours > 0 ? "Active practice time" : "0h tracked"}
          icon={Clock}
          accent="bg-amber-500/10 text-amber-500"
          delay={0.2}
        />
      </div>

      {/* ── Hero CTA + Quick Actions ────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, type: "spring" }}
          className="lg:col-span-3 relative rounded-3xl overflow-hidden p-7 flex flex-col justify-between shadow-xl"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)",
            boxShadow: "0 8px 32px rgba(37,99,235,0.28)",
          }}
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Next Recommended Action</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Practice {primaryRec.skill}
              </h2>
              <p className="text-xs text-blue-100/90 mt-1 leading-relaxed max-w-sm">
                {primaryRec.suggestion}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(getRecPath(primaryRec))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-blue-700 text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <span>Start Practice Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
            <span className="flex items-center text-xs text-blue-100/80 font-medium">
              <Clock className="w-3.5 h-3.5 mr-1" /> ~15-20 min
            </span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-2 rounded-3xl p-5 space-y-2.5 border shadow-sm"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between mb-1 px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Quick Launch
            </h3>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>

          <QuickAction label="AI Technical Interview" sub="Start 30-min live session" path="/interviews?type=technical" icon={Sparkles} accent="bg-violet-500/10 text-violet-500" navigate={navigate} delay={0.3} />
          <QuickAction label="DSA Problem Arena" sub="Explore standard problems" path="/problems" icon={Code2} accent="bg-blue-500/10 text-blue-500" navigate={navigate} delay={0.35} />
          <QuickAction label="SQL Lab Sandbox" sub="PostgreSQL window functions & joins" path="/sql" icon={Database} accent="bg-emerald-500/10 text-emerald-500" navigate={navigate} delay={0.4} />
          <QuickAction label="Core CS Practice" sub="OS, DBMS, Networks, OOP" path="/subjects" icon={BookOpen} accent="bg-amber-500/10 text-amber-500" navigate={navigate} delay={0.45} />
        </motion.div>
      </div>

      {/* ── Skill Map + Readiness ───────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Skill Map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-3 rounded-3xl p-6 border shadow-sm"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Skill Mastery Matrix</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Real-time proficiency across core topics</p>
            </div>
            <button
              onClick={() => navigate("/analytics")}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all hover:scale-105 cursor-pointer"
              style={{
                color: "var(--accent)",
                background: "var(--accent-subtle)",
                borderColor: "var(--glass-border)",
              }}
            >
              Full Analytics →
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 text-blue-500">
                DSA Algorithms
              </p>
              <div className="space-y-1">
                {dsaSkills.length > 0 ? (
                  dsaSkills.map((skill, idx) => (
                    <SkillRow key={skill.name} skill={skill} idx={idx} onClick={setSelectedSkill} />
                  ))
                ) : (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
                    No DSA skills tracked yet. Solve problems to build your matrix!
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 text-emerald-500">
                SQL & Databases
              </p>
              <div className="space-y-1">
                {sqlSkills.length > 0 ? (
                  sqlSkills.map((skill, idx) => (
                    <SkillRow key={skill.name} skill={skill} idx={idx} onClick={setSelectedSkill} />
                  ))
                ) : (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
                    No SQL skills tracked yet. Execute queries in SQL Lab to grow!
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Readiness + AI Mentor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Readiness Score */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-3xl p-6 border shadow-sm"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Interview Readiness
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>

            <div className="text-4xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              <CountUp to={score} suffix="%" />
            </div>
            <p className="text-xs mb-3 font-semibold text-emerald-500">
              {score >= 75 ? "Strong Engineering Readiness" : score >= 40 ? "Developing Competency" : "Starting Your Prep Journey"}
            </p>

            <Bar value={score} delay={0.4} />

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: "var(--text-tertiary)" }} className="text-[11px]">Strongest</p>
                <p className="font-semibold mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>
                  {strongestSkill ? `${strongestSkill.name} (${strongestSkill.mastery}%)` : "None yet"}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--text-tertiary)" }} className="text-[11px]">Needs Focus</p>
                <p className="font-semibold mt-0.5 truncate text-amber-500">
                  {focusSkill ? `${focusSkill.name} (${focusSkill.mastery}%)` : "Foundational Practice"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Mentor Insight */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl p-5 relative overflow-hidden border"
            style={{
              background: "var(--glass-bg)",
              borderColor: "rgba(139,92,246,0.3)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">AI Mentor Insight</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                "{mentorInsight}"
              </p>
              <button
                onClick={() => navigate("/problems")}
                className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <span>View practice arena</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Recent Submissions & Activity Stream ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-3xl p-6 border shadow-sm"
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Recent Submissions & Activity</h3>
          </div>
          <button
            onClick={() => navigate("/submissions")}
            className="text-xs font-semibold px-3 py-1 rounded-full border transition-all hover:scale-105 cursor-pointer"
            style={{
              color: "var(--accent)",
              background: "var(--accent-subtle)",
              borderColor: "var(--glass-border)",
            }}
          >
            View All History →
          </button>
        </div>

        {recentSubmissions.length > 0 ? (
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const isPassed = sub.status === "completed" && (sub.grade === null || sub.grade >= 60);
              return (
                <div
                  key={sub.id}
                  onClick={() => sub.problem?.id && navigate(`/problems/${sub.problem.id}`)}
                  className="glass-row flex items-center justify-between p-3 rounded-2xl border cursor-pointer group transition-all"
                  style={{
                    background: "var(--bg-surface-2)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${isPassed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-blue-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                        {sub.problem?.title || "Custom Problem Solution"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        <span className="capitalize">{sub.language || "Code"}</span>
                        <span>•</span>
                        <span className="capitalize">{sub.problem?.difficulty || "Medium"}</span>
                        <span>•</span>
                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {sub.grade !== null && (
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md" style={{ background: "var(--glass-border)", color: "var(--text-primary)" }}>
                        {sub.grade}/100
                      </span>
                    )}
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: isPassed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: isPassed ? "#34d399" : "#f87171",
                      }}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-xs space-y-2" style={{ color: "var(--text-tertiary)" }}>
            <p>No recent submissions found.</p>
            <button
              onClick={() => navigate("/problems")}
              className="text-xs font-semibold text-blue-500 hover:underline"
            >
              Start solving problems in the DSA Arena →
            </button>
          </div>
        )}
      </motion.div>

      <SkillMapModal skill={selectedSkill} isOpen={!!selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
