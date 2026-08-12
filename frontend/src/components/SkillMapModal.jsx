import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Drawer } from "./ui/Drawer";
import { Badge } from "./ui/Badge";
import { ArrowUpRight, AlertTriangle, CheckCircle2, Play, BookOpen } from "lucide-react";

function AnimatedBar({ value, isLow, delay = 0 }) {
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
      <motion.div
        className={`h-full rounded-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

export function SkillMapModal({ skill, isOpen, onClose }) {
  if (!skill) return null;

  const isLow = skill.mastery < 60;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${skill.name} — Skill Analysis`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Mastery Score Header */}
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Mastery Score
              </span>
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="text-3xl font-black text-slate-900 dark:text-slate-100"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 22 }}
                >
                  {Math.round(skill.mastery)}%
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className={`text-xs font-semibold ${
                    isLow
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isLow ? "Needs Attention" : "Strong Mastery"}
                </motion.span>
              </div>
              <AnimatedBar value={skill.mastery} isLow={isLow} delay={0.3} />
            </div>
            <Badge variant={isLow ? "warning" : "success"} animate>
              {skill.category}
            </Badge>
          </div>
        </motion.div>

        {/* Diagnostic */}
        <motion.div variants={itemVariants}>
          {isLow ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagnostic Assessment</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                Your score is currently low because of state transition errors in 3 recent dynamic programming attempts.
                Focus on identifying base cases before writing loops.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Consistent High Performance</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Great job! You have solved 8 problems in this topic with optimal time complexity.
              </p>
            </div>
          )}
        </motion.div>

        {/* Recommended Actions */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Recommended Next Steps
          </h4>

          {[
            {
              to: "/problems",
              icon: BookOpen,
              iconBg: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
              label: `Practice ${skill.name} Problems`,
              sub: "2 targeted practice problems",
              hoverColor: "text-blue-600",
            },
            {
              to: "/interviews?type=technical",
              icon: Play,
              iconBg: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
              label: "Start Targeted AI Interview",
              sub: "15-minute concept deep-dive",
              hoverColor: "text-violet-600",
            },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.to + idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + idx * 0.1 }}
                whileHover={{ x: 3 }}
                className="origin-left"
              >
                <Link
                  to={action.to}
                  onClick={onClose}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        {action.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{action.sub}</span>
                    </div>
                  </div>
                  <ArrowUpRight
                    className={`w-4 h-4 text-slate-400 group-hover:${action.hoverColor} transition-colors`}
                  />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Practice Stats */}
        <motion.div
          variants={itemVariants}
          className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-2 gap-3"
        >
          {[
            { label: "Total Attempts", value: skill.attempts || 0, color: "text-slate-900 dark:text-slate-100" },
            { label: "Successful Solutions", value: skill.successes || 0, color: "text-emerald-600 dark:text-emerald-400" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + idx * 0.1, type: "spring", stiffness: 300, damping: 24 }}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center"
            >
              <span className={`text-xl font-bold block ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Drawer>
  );
}
