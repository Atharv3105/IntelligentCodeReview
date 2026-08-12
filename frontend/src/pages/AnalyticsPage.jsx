import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Award, Flame, Calendar } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export default function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [timeRange, setTimeRange] = useState("30days");
  const [dashboard, setDashboard] = useState(null);
  const [skillGraph, setSkillGraph] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashRes, skillRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/analytics/skills"),
      ]);

      setDashboard(dashRes.data.dashboard);
      setSkillGraph(skillRes.data.skillGraph || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading analytics insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Performance Insights & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Calm visualizations of skill trajectory, consistency, and interview performance.</p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
          {[
            { id: "7days", label: "7 Days" },
            { id: "30days", label: "30 Days" },
            { id: "3months", label: "3 Months" },
            { id: "all", label: "All Time" },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className="px-3 py-1 text-xs font-bold rounded-lg transition-all"
              style={{
                background: timeRange === range.id ? "var(--bg-surface)" : "transparent",
                color: timeRange === range.id ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: timeRange === range.id ? "var(--shadow-sm)" : "none",
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections Tab Navigation */}
      <div className="flex gap-2 pb-2 overflow-x-auto text-xs" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {["overview", "skills", "interviews", "consistency"].map((section) => {
          const active = activeSection === section;
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="px-4 py-2 rounded-xl font-bold capitalize transition-all"
              style={{
                background: active ? "rgba(59,130,246,0.1)" : "transparent",
                border: `1px solid ${active ? "rgba(59,130,246,0.35)" : "transparent"}`,
                color: active ? "var(--brand-blue)" : "var(--text-tertiary)",
              }}
            >
              {section}
            </button>
          );
        })}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 text-center">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 block">{dashboard?.readinessScore || 72}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Interview Readiness</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">{dashboard?.totalSolved || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Problems Solved</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-3xl font-black text-violet-600 dark:text-violet-400 block">{dashboard?.totalInterviews || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Interviews Completed</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-3xl font-black text-amber-500 block">{dashboard?.streak || 3} 🔥</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Day Streak</span>
            </Card>
          </div>
        </div>
      )}

      {/* Skills Trajectory Section */}
      {(activeSection === "skills" || activeSection === "overview") && (
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Skill Category Trajectory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillGraph.map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{cat.category}</span>
                  <Badge variant="primary">{cat.overallMastery}% Mastery</Badge>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${cat.overallMastery}%` }} />
                </div>

                <div className="space-y-1.5 pt-2">
                  {cat.skills.map((s, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>{s.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{s.mastery}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
