import { motion } from "framer-motion";

export default function GradeCard({ grade }) {
  const score = Number.parseFloat(grade || 0);

  const getGradeColor = () => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--warning)";
    return "var(--error)";
  };

  const getGradeLabel = () => {
    if (score >= 90) return "Outstanding";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Needs Improvement";
    return "Keep Practicing";
  };

  return (
    <motion.div
      className="grade-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{ borderColor: getGradeColor(), boxShadow: `0 0 30px ${getGradeColor()}22` }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">AI Review Grade</p>
      <div className="grade-number" style={{ color: getGradeColor() }}>{grade}</div>
      <p className="mt-2 text-sm text-gray-400">Out of 100</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: getGradeColor() }}>{getGradeLabel()}</p>
    </motion.div>
  );
}
