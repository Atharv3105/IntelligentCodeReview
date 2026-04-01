import { motion } from "framer-motion";

export default function SubmissionProgress({ progress, stage }) {
  const readableStage = stage?.replaceAll("_", " ") || "Processing";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-300">{readableStage}</span>
        <span className="rounded-md bg-green-400/15 px-2 py-0.5 text-xs font-semibold text-accent-green">{progress}%</span>
      </div>

      <div className="progress-bar">
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
      </div>
    </motion.div>
  );
}
