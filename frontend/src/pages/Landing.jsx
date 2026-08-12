import React, { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Code2, Bot, BarChart3, CheckCircle2, Zap,
  Shield, Cpu, Database, Play, Star, ChevronRight
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

/* ── Data ─────────────────────────────────────── */
const features = [
  {
    icon: Code2,
    title: "DSA & SQL Arenas",
    desc: "Solve 500+ algorithm and SQL problems with real-time test-case evaluation via Judge0 and isolated database schemas.",
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
    border: "hover:border-blue-500/40",
    tag: "500+ Problems",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: Bot,
    title: "AI Interview Simulator",
    desc: "Run technical, coding, and behavioral interviews powered by AI. Get probing follow-ups and real evaluation reports.",
    color: "from-violet-500/20 to-violet-600/5",
    iconColor: "text-violet-400",
    border: "hover:border-violet-500/40",
    tag: "4 Interview Modes",
    tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  {
    icon: BarChart3,
    title: "Readiness Analytics",
    desc: "Track a 0–100 interview readiness score. Follow personalized day-by-day roadmaps built from your actual mistakes.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
    border: "hover:border-emerald-500/40",
    tag: "Skill-level Insights",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
];

const stats = [
  { value: "500+", label: "Curated Problems" },
  { value: "4", label: "Interview Modes" },
  { value: "10+", label: "CS Topics" },
  { value: "100%", label: "Runs Locally" },
];

const trust = [
  "No subscription required",
  "Runs fully on your machine",
  "Open-source codebase",
  "No data sent to cloud",
];

/* ── Star Field ───────────────────────────────── */
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 90}%`,
  left: `${Math.random() * 100}%`,
  dur: `${2.5 + Math.random() * 4}s`,
  delay: `${Math.random() * 3}s`,
  size: Math.random() > 0.7 ? 3 : 2,
}));

/* ── Code Preview ─────────────────────────────── */
const CODE_PREVIEW = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement))
      return [map.get(complement), i];
    map.set(nums[i], i);
  }
}

// ✅ All 57 test cases passed
// ⏱  Runtime: 68ms  (beats 94.2%)
// 📦 Memory:  41.9MB (beats 88.1%)`;

/* ── Main Component ───────────────────────────── */
export default function Landing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 font-sans overflow-x-hidden">

      {/* ─── Star Field ─────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {STARS.map((s) => (
          <span
            key={s.id}
            className="star"
            style={{
              top: s.top,
              left: s.left,
              "--dur": s.dur,
              "--delay": s.delay,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
        {/* Subtle grid */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* ─── Nav ────────────────────────────────── */}
      <nav className="relative z-20 glass-dark border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/30">
                II
              </div>
              <span className="live-dot absolute -top-0.5 -right-0.5" style={{ width: 6, height: 6 }} />
            </div>
            <div className="leading-none">
              <span className="text-sm font-bold text-white block tracking-tight">Interview</span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-[0.15em] block">Intelligence</span>
            </div>
          </motion.div>

          {/* Center links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="hidden md:flex items-center gap-1"
          >
            {["Features", "Practice", "Interviews", "Analytics"].map((label) => (
              <button
                key={label}
                className="px-3.5 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all font-medium"
              >
                {label}
              </button>
            ))}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            className="flex items-center gap-3"
          >
            {user ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="btn-glow btn-ripple flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-colors"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-400 hover:text-slate-100 font-medium transition-colors">
                  Sign in
                </Link>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/register")}
                  className="btn-glow btn-ripple flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-colors"
                >
                  Get Started <ChevronRight className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                AI-powered · Runs locally · Free forever
              </span>
            </motion.div>

            <motion.h1 variants={item} className="text-5xl md:text-6xl font-black tracking-tight leading-[1.04]">
              <span className="text-gradient-white">Master technical</span>
              <br />
              <span className="text-gradient-blue">interviews with AI.</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg text-slate-400 leading-relaxed max-w-xl">
              Practice DSA & SQL problems, run AI-powered interview simulations, and follow personalized roadmaps — all{" "}
              <span className="text-slate-200 font-semibold">running privately on your own machine</span>.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3">
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(59,130,246,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/dashboard")}
                  className="btn-glow btn-ripple flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all"
                >
                  Open Dashboard <ArrowRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(59,130,246,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/register")}
                    className="btn-glow btn-ripple flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all"
                  >
                    Start for free <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-base transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" /> Watch demo
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={item} className="flex flex-wrap gap-x-5 gap-y-2">
              {trust.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Code preview card */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block float"
          >
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-blue-600/15 via-violet-600/8 to-transparent rounded-3xl blur-2xl" />

              {/* Main card */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-slate-900/90 shadow-2xl shadow-black/60 overflow-hidden backdrop-blur-sm">
                {/* Window bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">Two Sum · Easy · JavaScript</span>
                </div>

                {/* Code */}
                <div className="p-5">
                  <pre className="text-xs leading-6 font-mono text-slate-300 overflow-x-auto">
                    {CODE_PREVIEW.split("\n").map((line, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-slate-600 select-none w-4 text-right flex-shrink-0">{i + 1}</span>
                        <span
                          className={
                            line.startsWith("//") ? "text-slate-500" :
                            line.startsWith("function") ? "text-blue-400" :
                            line.includes("return") ? "text-violet-400" :
                            "text-slate-300"
                          }
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>

                {/* Status bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.06] bg-emerald-500/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">All test cases passed</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">68ms · 94.2%ile</span>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                className="float-delay absolute -top-4 -right-4 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-xl backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white">94th Percentile</span>
                </div>
              </motion.div>

              {/* Floating AI chip */}
              <motion.div
                className="float absolute -bottom-4 -left-4 rounded-xl border border-violet-500/20 bg-violet-950/80 px-3 py-2.5 shadow-xl backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <div>
                    <span className="text-[10px] font-bold text-violet-300 block leading-none">AI Feedback</span>
                    <span className="text-[10px] text-violet-500">Optimal O(n) solution</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 + idx * 0.08, type: "spring", stiffness: 300, damping: 24 }}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-5 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <div className="relative text-2xl font-black text-white">{stat.value}</div>
              <div className="relative text-xs font-medium text-slate-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features ───────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
            Everything you need to get hired.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            A complete interview preparation system — from daily practice to full-length simulations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 280, damping: 22 } }}
                className={`relative rounded-2xl border border-white/[0.07] ${feat.border} bg-gradient-to-b ${feat.color} backdrop-blur-sm p-6 overflow-hidden group transition-colors duration-300`}
              >
                {/* Top shine */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={`inline-flex p-3 rounded-xl bg-white/5 border border-white/[0.08] mb-5 ${feat.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`inline-block mb-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${feat.tagColor}`}>
                  {feat.tag}
                </span>

                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Screenshot / Preview Grid ──────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {[
            { icon: Cpu, label: "Core CS Theory", sub: "DBMS · OS · Networking · OOP", color: "from-blue-500/20 to-transparent", iconColor: "text-blue-400" },
            { icon: Database, label: "SQL Lab Sandbox", sub: "Live queries on real schemas", color: "from-emerald-500/20 to-transparent", iconColor: "text-emerald-400" },
            { icon: Shield, label: "ATS Resume Scorer", sub: "Keyword analysis & suggestions", color: "from-violet-500/20 to-transparent", iconColor: "text-violet-400" },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 24 } }}
                className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b ${card.color} p-5 flex items-center gap-4 cursor-pointer hover:border-white/15 transition-colors`}
              >
                <div className={`p-3 rounded-xl bg-white/5 border border-white/[0.07] ${card.iconColor} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{card.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto flex-shrink-0" />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ─── CTA Section ────────────────────────── */}
      <section className="relative z-10 border-t border-white/[0.05]">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-violet-600/3 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 22 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Ready to land your
              <span className="text-gradient-blue"> dream offer</span>?
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              No cloud, no subscription, no data harvesting.
              Just you and the tools to get hired.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(59,130,246,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/register")}
              className="btn-glow btn-ripple inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-2xl shadow-blue-600/30 transition-all"
            >
              Create free account <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-base transition-all"
            >
              Sign in to continue
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-[10px]">II</div>
            <span className="text-sm font-bold text-slate-400">Interview Intelligence</span>
          </div>
          <p className="text-xs text-slate-600">
            Built for engineers who take their careers seriously.
          </p>
        </div>
      </footer>
    </div>
  );
}
