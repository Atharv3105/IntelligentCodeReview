import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";

const statGradientMap = {
  cyan: "from-cyan-500 to-cyan-300",
  green: "from-green-500 to-green-300",
  purple: "from-purple-500 to-purple-300",
  orange: "from-orange-500 to-orange-300"
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!data) return [];

    return [
      { title: "Total Submissions", value: data.totalSubmissions || 0, tone: "cyan" },
      { title: "Average Grade", value: (data.avgGrade || 0).toFixed(1), tone: "green" },
      { title: "Success Rate", value: `${(data.successRate || 0).toFixed(0)}%`, tone: "purple" },
      { title: "Active Users", value: data.activeUsers || 0, tone: "orange" }
    ];
  }, [data]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center text-gray-400">Loading analytics...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-8">
          <h1 className="text-hero">Admin Dashboard</h1>
          <p className="mt-2 text-gray-400">Platform usage and submission quality metrics.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} hover>
              <p className="text-sm text-gray-400">{stat.title}</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">{stat.value}</p>
              <div className="mt-4 h-1 rounded-full bg-gray-700/60">
                <div className={`h-full w-full rounded-full bg-gradient-to-r ${statGradientMap[stat.tone]}`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Grade Distribution</h2>
            <div className="space-y-3">
              {[
                { label: "90-100", count: data?.excellentCount || 0, color: "bg-green-500" },
                { label: "75-89", count: data?.goodCount || 0, color: "bg-blue-500" },
                { label: "60-74", count: data?.fairCount || 0, color: "bg-yellow-500" },
                { label: "<60", count: data?.poorCount || 0, color: "bg-red-500" }
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-200">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700/60">
                    <motion.div className={`h-full rounded-full ${item.color}`} initial={{ width: 0 }} animate={{ width: `${Math.min((item.count / 50) * 100, 100)}%` }} transition={{ duration: 0.5 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Problem Difficulty</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-400">Easy</span><span className="font-semibold">{data?.easyProblems || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Medium</span><span className="font-semibold">{data?.mediumProblems || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Hard</span><span className="font-semibold">{data?.hardProblems || 0}</span></div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Platform Health</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-400">System Uptime</span><span className="font-semibold text-green-400">99.9%</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Response Time</span><span className="font-semibold text-cyan-400">42ms</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">API Status</span><span className="font-semibold text-green-400">Operational</span></div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-400">New Submissions</span><span className="font-semibold">{data?.newSubmissionsToday || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">New Users</span><span className="font-semibold">{data?.newUsersToday || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-400">Avg Problems Solved</span><span className="font-semibold">{(data?.avgProblems || 0).toFixed(1)}</span></div>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
