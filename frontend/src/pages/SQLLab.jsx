import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Table,
  Cpu,
} from "lucide-react";
import api from "../services/api";

function DiffBadge({ level }) {
  const map = {
    easy:   { bg: "rgba(52,211,153,0.12)", color: "#10b981", border: "rgba(52,211,153,0.25)" },
    medium: { bg: "rgba(251,191,36,0.12)", color: "#f59e0b", border: "rgba(251,191,36,0.25)" },
    hard:   { bg: "rgba(248,113,113,0.12)", color: "#ef4444", border: "rgba(248,113,113,0.25)" },
  };
  const norm = String(level || "easy").toLowerCase();
  const c = map[norm] || map.easy;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  );
}

export default function SQLLab() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get("/sql/challenges");
      const list = res.data.challenges || [];
      setChallenges(list);
      if (list.length > 0) {
        loadChallenge(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch SQL challenges:", err);
    }
  };

  const loadChallenge = async (id) => {
    try {
      const res = await api.get(`/sql/challenges/${id}`);
      const c = res.data.challenge;
      setSelectedChallenge(c);
      setQuery(c.solutionSQL || "SELECT * FROM Employee;");
      setResult(null);
      setExecutionError(null);
      setIsCorrect(null);
      setAiAdvice(null);
    } catch (err) {
      console.error("Failed to load SQL challenge:", err);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.topic && c.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDiff =
      selectedDifficulty === "All" ||
      c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchTopic =
      selectedTopic === "All" ||
      (c.topic && c.topic.toLowerCase().includes(selectedTopic.toLowerCase()));
    return matchSearch && matchDiff && matchTopic;
  });

  const allTopics = [
    "All",
    "Joins",
    "Aggregation",
    "Subqueries",
    "Window Functions",
    "Conditional",
  ];

  const handleExecute = async () => {
    if (!selectedChallenge) return;
    setLoading(true);
    setResult(null);
    setExecutionError(null);
    setIsCorrect(null);

    try {
      const res = await api.post("/sql/execute", {
        query,
        challengeId: selectedChallenge.id,
      });

      if (res.data.success && !res.data.error) {
        setResult(res.data);
        setIsCorrect(res.data.isCorrect);
        setExecutionError(null);
      } else {
        setResult(null);
        setExecutionError(res.data.error || "Query execution failed.");
      }
    } catch (err) {
      setExecutionError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to execute query in sandbox."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!query) return;
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await api.post("/sql/explain", {
        query,
        schema: selectedChallenge?.setupSQL || "",
        challengeId: selectedChallenge?.id,
      });
      setAiAdvice({ type: "explain", data: res.data.explanation });
    } catch (err) {
      console.error("SQL Explain failed:", err);
      setAiAdvice({
        type: "explain",
        data: err.response?.data?.error?.message || err.response?.data?.message || "AI explanation unavailable. Please check your connection.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!query) return;
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await api.post("/sql/optimize", {
        query,
        schema: selectedChallenge?.setupSQL || "",
        challengeId: selectedChallenge?.id,
      });
      setAiAdvice({ type: "optimize", data: res.data.explanation });
    } catch (err) {
      console.error("SQL Optimize failed:", err);
      setAiAdvice({
        type: "optimize",
        data: err.response?.data?.error?.message || err.response?.data?.message || "AI optimization analysis unavailable. Please check your connection.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-1.5"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Sandbox</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
            SQL Lab & <span className="font-bold">Database IDE</span>
          </h1>
        </div>
      </motion.div>

      {/* Main IDE Layout */}
      <div className="grid lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* Left: Challenges Selector (4 cols) */}
        <div
          className="lg:col-span-4 p-4 rounded-3xl border flex flex-col max-h-[720px] space-y-3 shadow-sm"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            <span>SQL Challenges ({filteredChallenges.length})</span>
          </div>

          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
            style={{
              background: "var(--bg-surface-2)",
              borderColor: "var(--glass-border)",
            }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Topic & Difficulty Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-full px-2.5 py-1 text-xs border focus:outline-none cursor-pointer"
              style={{
                background: "var(--bg-surface-2)",
                borderColor: "var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              <option value="All">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="rounded-full px-2.5 py-1 text-xs border focus:outline-none cursor-pointer"
              style={{
                background: "var(--bg-surface-2)",
                borderColor: "var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Topics" : t}
                </option>
              ))}
            </select>
          </div>

          {/* Challenge List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredChallenges.map((c, idx) => {
              const isSelected = selectedChallenge?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => loadChallenge(c.id)}
                  className="glass-row p-3 rounded-2xl border transition-all cursor-pointer text-xs"
                  style={{
                    background: isSelected ? "var(--accent-subtle)" : "transparent",
                    borderColor: isSelected ? "var(--accent)" : "var(--glass-border)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {c.title}
                    </span>
                    <DiffBadge level={c.difficulty} />
                  </div>
                  <span className="text-[11px] block truncate" style={{ color: "var(--text-tertiary)" }}>
                    {c.topic || "Joins & Queries"}
                  </span>
                </div>
              );
            })}
            {filteredChallenges.length === 0 && (
              <div className="text-center py-10 text-xs italic" style={{ color: "var(--text-tertiary)" }}>
                No SQL challenges match filters.
              </div>
            )}
          </div>
        </div>

        {/* Right: SQL Editor & Query Results Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Challenge Prompt */}
          {selectedChallenge && (
            <div
              className="p-5 rounded-3xl border space-y-2.5 shadow-sm"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  {selectedChallenge.topic}
                </span>
                <button
                  onClick={() => setShowSchema(!showSchema)}
                  className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showSchema ? "Hide Schema DDL" : "View Tables & Schema"}</span>
                </button>
              </div>

              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedChallenge.title}
              </h2>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                {selectedChallenge.description}
              </p>

              {showSchema && selectedChallenge.setupSQL && (
                <div
                  className="p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto text-emerald-400"
                  style={{ background: "var(--code-bg)" }}
                >
                  <span className="text-slate-500 font-bold block mb-1">Database Schema Setup:</span>
                  <pre>{selectedChallenge.setupSQL.trim()}</pre>
                </div>
              )}
            </div>
          )}

          {/* Monaco SQL Editor */}
          <div
            className="rounded-3xl border overflow-hidden flex flex-col shadow-md"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Editor Header */}
            <div
              className="px-4 py-2.5 flex items-center justify-between border-b text-xs"
              style={{ borderColor: "var(--glass-border)", background: "var(--bg-surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                  PostgreSQL Query Editor
                </span>
              </div>

              <button
                onClick={() => setQuery(selectedChallenge?.solutionSQL || "SELECT * FROM Employee;")}
                className="p-1.5 rounded-full border hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--glass-border)", color: "var(--text-tertiary)" }}
                title="Reset Query"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="min-h-[260px]">
              <Editor
                height="260px"
                language="sql"
                theme="vs-dark"
                value={query}
                onChange={(v) => setQuery(v || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Actions Footer */}
            <div
              className="p-3.5 border-t flex flex-wrap justify-between items-center gap-3"
              style={{ borderColor: "var(--glass-border)", background: "var(--bg-surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExplain}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    borderColor: "rgba(59,130,246,0.25)",
                    color: "#60a5fa",
                  }}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explain Query</span>
                </button>

                <button
                  onClick={handleOptimize}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    borderColor: "rgba(139,92,246,0.25)",
                    color: "#a78bfa",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize (AI)</span>
                </button>
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-60"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--accent-glow)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Query...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Query</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Explanation / Optimization Card */}
          {aiAdvice && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl border text-xs space-y-2.5"
              style={{
                background: "var(--glass-bg)",
                borderColor: "rgba(139,92,246,0.3)",
                boxShadow: "var(--glass-shadow)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-violet-400">
                <Sparkles className="w-4 h-4" />
                <span className="capitalize">AI {aiAdvice.type}</span>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs" style={{ color: "var(--text-secondary)" }}>
                {typeof aiAdvice.data === "string"
                  ? aiAdvice.data
                  : aiAdvice.data?.explanation || aiAdvice.data?.summary || JSON.stringify(aiAdvice.data, null, 2)}
              </div>
            </motion.div>
          )}

          {/* Execution Error Banner */}
          {executionError && (
            <div
              className="p-4 rounded-2xl border text-xs font-mono text-rose-500"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.3)",
              }}
            >
              <strong>PostgreSQL Error:</strong> {executionError}
            </div>
          )}

          {/* Execution Results Grid */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl border space-y-3"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Query Result Matches Expected Output!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <XCircle className="w-4 h-4" />
                      <span>Output Mismatch with Target Result</span>
                    </div>
                  )}
                </div>
                <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  Returned {(() => {
                    const r = Array.isArray(result?.rows) ? result.rows : Array.isArray(result?.result) ? result.result : Array.isArray(result) ? result : [];
                    return `${r.length} ${r.length === 1 ? "row" : "rows"}`;
                  })()}
                </span>
              </div>

              {(() => {
                const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result?.result) ? result.result : Array.isArray(result) ? result : [];
                if (rows.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs italic" style={{ color: "var(--text-tertiary)" }}>
                      Query executed successfully. 0 rows returned.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--glass-border)" }}>
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--glass-border)", background: "var(--bg-surface-2)" }}>
                          {Object.keys(rows[0]).map((col) => (
                            <th key={col} className="px-3.5 py-2 font-bold" style={{ color: "var(--text-primary)" }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="border-b last:border-0 hover:bg-slate-500/5 transition-colors"
                            style={{ borderColor: "var(--glass-border)" }}
                          >
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="px-3.5 py-2" style={{ color: "var(--text-secondary)" }}>
                                {val === null ? <span className="italic text-slate-500">NULL</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
