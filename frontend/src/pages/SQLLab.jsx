import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Database, Play, RotateCcw, Sparkles, CheckCircle2, AlertTriangle, Table } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function SQLLab() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

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
      setSelectedChallenge(res.data.challenge);
      setQuery(res.data.challenge.solutionSQL || "SELECT * FROM Employee;");
      setResult(null);
      setExecutionError(null);
      setIsCorrect(null);
      setAiAdvice("");
    } catch (err) {
      console.error("Failed to load SQL challenge:", err);
    }
  };

  const handleExecute = async () => {
    if (!selectedChallenge) return;
    setLoading(true);
    setExecutionError(null);
    setResult(null);
    setAiAdvice("");

    try {
      const res = await api.post("/sql/execute", {
        challengeId: selectedChallenge.id,
        query,
      });

      setResult(res.data.result);
      setExecutionError(res.data.error);
      setIsCorrect(res.data.isCorrect);
      setExecutionTime(res.data.executionTime);
    } catch (err) {
      setExecutionError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = () => {
    if (!selectedChallenge) return;
    setAiAdvice(selectedChallenge.explanation || "This query joins the Employee table with itself to compare manager salaries.");
  };

  const handleOptimize = () => {
    setAiAdvice("Optimization Tip: Ensure an index exists on `managerId` and `salary` for faster join filtering.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <Badge variant="primary" className="mb-1">
            PostgreSQL Sandbox
          </Badge>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">SQL Lab & Database IDE</h1>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="grid lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left: Schema & Challenges Panel (4 cols) */}
        <Card className="lg:col-span-4 p-4 flex flex-col max-h-[650px]">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Database className="w-4 h-4 text-blue-600" />
            <span>SQL Challenges</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {challenges.map((c) => (
              <div
                key={c.id}
                onClick={() => loadChallenge(c.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all border text-xs ${
                  selectedChallenge?.id === c.id
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold truncate">{c.title}</span>
                  <Badge variant="neutral" className="text-[10px] uppercase">
                    {c.difficulty}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 block truncate">{c.topic || "Joins & Queries"}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: SQL Editor & Query Results Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Challenge Prompt */}
          {selectedChallenge && (
            <Card className="p-5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{selectedChallenge.topic}</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedChallenge.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{selectedChallenge.description}</p>
            </Card>
          )}

          {/* Monaco SQL Editor */}
          <Card className="overflow-hidden p-0 flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">PostgreSQL Query Window</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleExplain}>
                  Explain
                </Button>
                <Button variant="ghost" size="sm" onClick={handleOptimize}>
                  Optimize
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setQuery(selectedChallenge?.solutionSQL || "")}>
                  Reset
                </Button>
                <Button variant="primary" size="sm" onClick={handleExecute} loading={loading}>
                  Run Query <Play className="w-3 h-3 ml-1 fill-current" />
                </Button>
              </div>
            </div>

            <div className="min-h-[220px]">
              <Editor
                height="220px"
                language="sql"
                theme="vs-dark"
                value={query}
                onChange={(v) => setQuery(v || "")}
                options={{ minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>
          </Card>

          {/* AI Explain / Optimize Advice */}
          {aiAdvice && (
            <Card className="p-4 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900 text-xs text-violet-900 dark:text-violet-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>SQL Insight</span>
              </div>
              <p>{aiAdvice}</p>
            </Card>
          )}

          {/* Results Grid */}
          <Card className="p-5 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Query Output Grid</span>
              {executionTime !== null && <span className="font-mono text-slate-400">Execution: {executionTime}ms</span>}
            </div>

            {executionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-mono text-rose-700 dark:text-rose-300">
                {executionError}
              </div>
            )}

            {isCorrect === true && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3">
                ✓ Query output matches expected result!
              </div>
            )}

            {result && Array.isArray(result) && result.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      {Object.keys(result[0]).map((key) => (
                        <th key={key} className="p-2.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200/60 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="p-2.5 font-mono text-slate-800 dark:text-slate-200">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result && Array.isArray(result) && result.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Query executed cleanly. 0 rows returned.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
