import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Flame, Target, Trophy, ChevronRight, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Generate Year Heatmap Data
  const heatmapData = useMemo(() => {
    if (!stats) return [];
    const today = new Date();
    const data = [];
    // Show last 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        active: stats.activityLog.includes(dateStr)
      });
    }
    return data;
  }, [stats]);

  if (loading) return <Layout><div className="flex min-h-screen items-center justify-center">Loading Analytics...</div></Layout>;

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-10">
          <h1 className="text-hero mb-3">Mastery Dashboard</h1>
          <p className="text-gray-400">Track your progress and maintain your practice consistency.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="flex flex-col items-center justify-center overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-8 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/20" />
                <div className="relative rounded-full bg-orange-500 p-4 shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                  <Flame className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="text-5xl font-black text-white">{stats?.streak || 0}</div>
              <div className="mt-1 text-sm font-bold uppercase tracking-wider text-orange-400">Day Solve Streak</div>
              <p className="mt-4 text-xs text-gray-400">Maintain your streak by solving 70%+ grade problems consecutive days.</p>
            </Card>
          </motion.div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 gap-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-accent-green/10 p-3"><Trophy className="text-accent-green" /></div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalSolved || 0}</div>
                  <div className="text-sm text-gray-400">Problems Solved</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-accent-cyan/10 p-3"><Target className="text-accent-cyan" /></div>
                <div>
                  <div className="text-2xl font-bold">{Object.keys(stats?.categoryStats || {}).length}</div>
                  <div className="text-sm text-gray-400">Concepts Explored</div>
                </div>
              </Card>
            </div>

            {/* Heatmap Section */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-accent-green" /> Yearly Practice Heatmap</div>
                <div className="text-xs text-gray-500">Last 365 Days</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {heatmapData.map((day, i) => (
                  <div
                    key={i}
                    title={day.date}
                    className={`h-3 w-3 rounded-[2px] transition-all duration-300 ${
                      day.active 
                        ? "bg-accent-green shadow-[0_0_8px_rgba(74,222,128,0.4)]" 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-3 text-[10px] text-gray-500">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-[1px] bg-gray-800" /> Inactive</div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-[1px] bg-accent-green" /> Successful Solve</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Categories & Recent Submissions */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Skill Breakdown */}
          <div>
            <h2 className="mb-4 text-xl font-bold">Concept Mastery</h2>
            <Card className="p-4">
              <div className="space-y-4">
                {Object.entries(stats?.categoryStats || {}).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-300">{cat}</span>
                      <span className="font-mono text-accent-green">{count} Solved</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / stats.totalSolved) * 100, 100)}%` }}
                        className="h-full bg-accent-green"
                      />
                    </div>
                  </div>
                ))}
                {(!stats?.categoryStats || Object.keys(stats.categoryStats).length === 0) && (
                  <div className="text-center py-6 text-gray-500">Solve problems to see your concept breakdown.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Feed */}
          <div>
            <h2 className="mb-4 text-xl font-bold">Recent Focused Practice</h2>
            <div className="space-y-3">
              {stats?.recentSubmissions.map(sub => (
                <Card key={sub._id} className="group cursor-pointer p-4 transition-all hover:border-gray-600 hover:bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-200">{sub.problemId?.title}</h3>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1">
                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-accent-cyan capitalize">{sub.problemId?.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-lg font-bold ${sub.grade >= 70 ? 'text-accent-green' : 'text-red-400'}`}>
                        {sub.grade}%
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-300" />
                    </div>
                  </div>
                </Card>
              ))}
              {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) && (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                  Your recent practice history will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
