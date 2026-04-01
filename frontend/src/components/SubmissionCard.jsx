import { motion } from "framer-motion";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export default function SubmissionCard({ submission }) {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return { color: "success", label: "Completed" };
      case "failed":
        return { color: "error", label: "Failed" };
      case "pending":
        return { color: "warning", label: "Pending" };
      default:
        return { color: "info", label: "Unknown" };
    }
  };

  const getGradeColor = (grade) => {
    const g = parseFloat(grade);
    if (g >= 80) return "from-green-500 to-emerald-500";
    if (g >= 60) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-pink-500";
  };

  const statusConfig = getStatusConfig(submission.status);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card hover className="h-full">
        <div className="mb-3">
          <h3 className="text-card-title truncate text-gray-100">{submission.problemId?.title || "Unknown Problem"}</h3>
          <p className="mt-1 text-xs text-gray-400">{submission.problemId?.concept || "General"}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Grade</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${getGradeColor(submission.grade)} bg-clip-text text-transparent`}>
              {submission.grade || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Difficulty</p>
            <p className="text-sm font-semibold text-gray-200">{submission.problemId?.difficulty || "-"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-700/30 pt-3">
          <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
          <p className="text-xs text-gray-400">{new Date(submission.createdAt).toLocaleDateString()}</p>
        </div>
      </Card>
    </motion.div>
  );
}
