import React from "react";
import { motion } from "framer-motion";

const variants = {
  primary: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/70",
  success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/70",
  warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/70",
  error: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/70",
  neutral: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  intelligence: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/70",
  outline: "bg-transparent text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
};

export function Badge({ children, variant = "neutral", className = "", animate = false, ...props }) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none tracking-wide";

  if (animate) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={`${base} ${variants[variant] || variants.neutral} ${className}`}
        {...props}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className={`${base} ${variants[variant] || variants.neutral} ${className}`} {...props}>
      {children}
    </span>
  );
}
