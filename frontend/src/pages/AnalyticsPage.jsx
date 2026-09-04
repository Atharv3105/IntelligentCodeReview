import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, Award, Flame, Calendar, Sparkles, CheckCircle2, Target } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

function ActivityHeatmap({ heatmap = {} }) {
  // Generate days for past 16 weeks (112 days)
  const days = [];
  const today = new Date();
  for (let i = 111; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({
      date: key,
      dayOfWeek: d.getDay(),
      count: heatmap[key] || 0,
    });
  }

  const totalActiveDays = Object.keys(heatmap).length;
  const totalContributions = Object.values(heatmap).reduce((sum, c) => sum + c, 0);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Practice Consistency Heatmap</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalContributions} total actions logged across {totalActiveDays} active practice days.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-end sm:self-auto">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-800" />
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-400/40" />
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" />
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
          {days.map((d) => {
            const levelClass =
              d.count === 0
                ? "bg-slate-100 dark:bg-slate-800/60"
                : d.count === 1
                ? "bg-blue-400/40"
                : d.count === 2
                ? "bg-blue-500/70"
                : "bg-blue-600";
            return (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} activities`}
                className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${levelClass}`}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
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

  const readinessScore = dashboard?.readinessScore ?? 0;
  const streak = dashboard?.streak ?? 0;
  const totalSolved = dashboard?.totalSolved ?? 0;
  const totalInterviews = dashboard?.totalInterviews ?? 0;
  const recentInterviews = dashboard?.recentInterviews || [];

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
      {(activeSection === "overview" || activeSection === "consistency") && (
        <div className="space-y-6">
          {activeSection === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 text-center">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400 block">{readinessScore}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Interview Readiness</span>
              </Card>

              <Card className="p-5 text-center">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">{totalSolved}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Problems Solved</span>
              </Card>

              <Card className="p-5 text-center">
                <span className="text-3xl font-black text-violet-600 dark:text-violet-400 block">{totalInterviews}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Interviews Completed</span>
              </Card>

              <Card className="p-5 text-center">
                <span className="text-3xl font-black text-amber-500 block">{streak} 🔥</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Day Streak</span>
              </Card>
            </div>
          )}

          <ActivityHeatmap heatmap={dashboard?.heatmap || {}} />
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
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.attempts > 0 && (
                          <span className="text-[10px] text-slate-400">({s.attempts} attempts)</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{s.mastery}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interviews Section */}
      {activeSection === "interviews" && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Mock Interview History & Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Summary reports and scoring across your completed interview rounds.</p>
            </div>
            <button
              onClick={() => navigate("/interviews")}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer"
            >
              Start New Mock Round →
            </button>
          </div>

          {recentInterviews.length > 0 ? (
            <div className="space-y-2">
              {recentInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                      {iv.type || "Technical"} Round
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(iv.createdAt).toLocaleDateString()} • State: {iv.state}
                    </p>
                  </div>
                  {iv.report?.overallScore !== undefined && (
                    <Badge variant="primary" className="text-sm font-bold">
                      {iv.report.overallScore}/100
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <p>No interview sessions completed yet.</p>
              <button
                onClick={() => navigate("/interviews")}
                className="text-xs font-semibold text-blue-500 hover:underline"
              >
                Launch your first AI mock interview →
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
