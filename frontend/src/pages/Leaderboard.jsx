import React, { useEffect, useState } from "react";
import { Trophy, Award, Medal, Crown } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((res) => setLeaders(res.data.leaderboard || res.data || []))
      .catch((err) => console.error("Failed to load leaderboard:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Global Leaderboard</h1>
        <p className="text-xs text-slate-500 mt-1">Ranked by solved problems, submission efficiency, and overall mastery.</p>
      </div>

      <Card className="p-6">
        <div className="space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading rankings...</div>
          ) : leaders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No candidates on the leaderboard yet.</div>
          ) : (
            leaders.map((leader, idx) => (
              <div
                key={leader.userId || idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center text-xs ${
                      idx === 0
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300 dark:border-amber-700"
                        : idx === 1
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        : idx === 2
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{leader.username}</span>
                    <span className="text-[11px] text-slate-500">{leader.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">{leader.solvedCount || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Solved</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{leader.avgGrade || 0}%</span>
                    <span className="text-[10px] text-slate-400 uppercase">Avg Grade</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
