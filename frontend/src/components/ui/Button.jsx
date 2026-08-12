import React from "react";
import { motion } from "framer-motion";

const variants = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 border-transparent",
  secondary: "border text-sm font-semibold",
  intelligence: "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 border-transparent",
  ghost: "bg-transparent border-transparent",
  outline: "bg-transparent border",
  danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border-transparent",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-[13px] rounded-xl gap-2",
  lg: "px-5 py-2.5 text-sm rounded-xl gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-semibold cursor-pointer transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed btn-ripple";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading && (
        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="-ml-0.5 h-3.5 w-3.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </motion.svg>
      )}
      {children}
    </motion.button>
  );
}
