import { motion } from "framer-motion";
import useCountdown from "../hooks/useCountdown";

/**
 * ExamTimer — sticky countdown bar shown in ExamRoom header
 * Props:
 *   totalSeconds {number}    — initial time remaining
 *   onExpire     {Function}  — called when timer hits 0
 */
export default function ExamTimer({ totalSeconds, onExpire }) {
  const { formattedTime, timeLeft } = useCountdown(totalSeconds, onExpire);

  const urgency =
    timeLeft <= 60  ? "critical" :
    timeLeft <= 300 ? "warning"  : "normal";

  const colorClass =
    urgency === "critical" ? "text-red-400 animate-pulse" :
    urgency === "warning"  ? "text-yellow-400"            : "text-accent-green";

  const bgClass =
    urgency === "critical" ? "bg-red-500/10 border-red-500/30"     :
    urgency === "warning"  ? "bg-yellow-500/10 border-yellow-500/30" : "bg-gray-800/60 border-gray-700/40";

  return (
    <motion.div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${bgClass}`}
      animate={urgency === "critical" ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
    >
      <span className="text-sm text-gray-400">⏰ Time Left</span>
      <span className={`font-mono text-xl font-bold tracking-widest ${colorClass}`}>
        {formattedTime}
      </span>
      {urgency === "warning"  && <span className="text-xs text-yellow-400">⚠ 5 min left</span>}
      {urgency === "critical" && <span className="text-xs text-red-400 font-semibold">🚨 1 min left!</span>}
    </motion.div>
  );
}
