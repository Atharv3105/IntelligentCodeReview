import React, { useState, useEffect } from "react";
import { History, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get("/submissions/my");
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (filter === "All") return true;
    if (filter === "Coding") return s.language !== "sql";
    if (filter === "SQL") return s.language === "sql";
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Practice & Session History</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Review past code submissions, interview evaluations, and test results.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit text-xs font-bold" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
        {["All", "Coding", "SQL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg transition-all"
            style={{
              background: filter === f ? "var(--bg-surface)" : "transparent",
              color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: filter === f ? "var(--shadow-sm)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History Items */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-16 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Loading history records...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}>No session history found.</div>
        ) : (
          filtered.map((sub) => (
            <Card
              key={sub.id}
              onClick={() => setSelectedSub(sub)}
              className="p-4 flex items-center justify-between hover:border-blue-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold uppercase" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                  {sub.language || "code"}
                </div>
                <div>
                  <h3 className="text-sm font-bold transition-colors" style={{ color: "var(--text-primary)" }}>
                    {sub.problem?.title || "DSA Practice Attempt"}
                  </h3>
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(sub.createdAt).toLocaleDateString()} • {sub.language}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant={sub.status === "completed" ? "success" : "error"} className="capitalize">
                  {sub.status === "completed" ? `Score: ${sub.grade || 100}%` : "Failed"}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Session Details Modal */}
      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Session Details">
        {selectedSub && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>{selectedSub.problem?.title || "Practice Solution"}</span>
              <Badge variant={selectedSub.status === "completed" ? "success" : "error"}>{selectedSub.status}</Badge>
            </div>

            <div>
              <span className="font-bold uppercase block mb-1" style={{ color: "var(--text-tertiary)" }}>Submitted Code ({selectedSub.language})</span>
              <pre className="p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60" style={{ background: "var(--bg-surface-3)", color: "var(--text-primary)" }}>
                {selectedSub.code}
              </pre>
            </div>

            {selectedSub.feedback && (
              <div className="p-4 rounded-xl space-y-1" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <span className="font-bold" style={{ color: "var(--brand-blue)" }}>AI Feedback</span>
                <p style={{ color: "var(--text-secondary)" }}>{JSON.stringify(selectedSub.feedback)}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
