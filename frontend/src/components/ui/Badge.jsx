import { motion } from "framer-motion";

export function Badge({ children, variant = "info", className = "" }) {
  const variants = {
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info"
  };

  return (
    <motion.span
      className={`${variants[variant]} ${className}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.span>
  );
}

export function DifficultyBadge({ difficulty }) {
  const colors = {
    Easy: "success",
    Medium: "warning",
    Hard: "error"
  };

  return <Badge variant={colors[difficulty] || "info"}>{difficulty}</Badge>;
}
