import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";

const podiumOrder = [1, 0, 2];
const rankStyles = [
  { label: "1st", ring: "ring-2 ring-amber-400/55", accent: "text-amber-400" },
  { label: "2nd", ring: "ring-2 ring-slate-400/55", accent: "text-slate-400" },
  { label: "3rd", ring: "ring-2 ring-orange-400/55", accent: "text-orange-400" }
];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((res) => setLeaders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const topThree = useMemo(() => leaders.slice(0, 3), [leaders]);

  return (
    <Layout>
      <section className="section-padding">
        <motion.div
          className="mb-8 rounded-2xl border border-gray-700/25 bg-gray-800/25 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Community Rankings</p>
          <h1 className="text-hero">Global Leaderboard</h1>
          <p className="mt-2 max-w-2xl text-gray-400">
            Track top performers by average grade, best grade, solved problems, and submission consistency.
          </p>
        </motion.div>

        {topThree.length > 0 && (
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {podiumOrder.map((orderIndex, visualIndex) => {
              const leader = topThree[orderIndex];
              if (!leader) return null;

              const rank = orderIndex;
              const style = rankStyles[rank];

              return (
                <motion.div
                  key={leader.userId || rank}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: visualIndex * 0.08 }}
                  className={rank === 0 ? "md:-translate-y-2" : ""}
                >
                  <Card hover className={`h-full ${style.ring}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`rounded-md bg-gray-800/45 px-2 py-1 text-xs font-semibold ${style.accent}`}>{style.label}</span>
                      <span className="text-xs text-gray-400">Rank #{rank + 1}</span>
                    </div>

                    <h3 className="mb-3 truncate text-xl font-bold text-gray-100">{leader.username}</h3>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gray-800/45 p-3">
                        <p className="text-xs text-gray-400">Avg Grade</p>
                        <p className="mt-1 font-semibold text-gray-100">{(leader.avgGrade || 0).toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-800/45 p-3">
                        <p className="text-xs text-gray-400">Best Grade</p>
                        <p className="mt-1 font-semibold text-gray-100">{leader.bestGrade?.toFixed(1) || "-"}</p>
                      </div>
                      <div className="rounded-lg bg-gray-800/45 p-3">
                        <p className="text-xs text-gray-400">Solved</p>
                        <p className="mt-1 font-semibold text-gray-100">{leader.solvedCount || 0}</p>
                      </div>
                      <div className="rounded-lg bg-gray-800/45 p-3">
                        <p className="text-xs text-gray-400">Submissions</p>
                        <p className="mt-1 font-semibold text-gray-100">{leader.totalSubmissions || 0}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.1 }}
        >
          <Card className="overflow-hidden p-0">
            {loading ? (
              <div className="py-16 text-center text-gray-400">Loading leaderboard...</div>
            ) : leaders.length === 0 ? (
              <div className="py-16 text-center text-gray-400">No leaderboard data yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-gray-700/35 bg-gray-800/35">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Rank</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">User</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Avg Grade</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Best Grade</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Solved</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaders.map((leader, i) => (
                      <motion.tr
                        key={leader.userId || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.015 }}
                        className="border-b border-gray-700/20 transition-colors hover:bg-gray-800/35"
                      >
                        <td className="px-5 py-3 text-sm font-semibold text-accent-green">#{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-100">{leader.username}</td>
                        <td className="px-5 py-3 text-right text-sm text-gray-200">{(leader.avgGrade || 0).toFixed(1)}</td>
                        <td className="px-5 py-3 text-right text-sm text-gray-200">{leader.bestGrade?.toFixed(1) || "-"}</td>
                        <td className="px-5 py-3 text-right text-sm text-gray-200">{leader.solvedCount || 0}</td>
                        <td className="px-5 py-3 text-right text-sm text-gray-200">{leader.totalSubmissions}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
}
