import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Play, Check, RotateCcw, Lightbulb, ChevronLeft, Sparkles, Brain, Loader2 } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  // AI state
  const [aiReview, setAiReview] = useState(null);
  const [aiHint, setAiHint] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await api.get(`/problems/${id}`);
        const p = res.data.problem;
        setProblem(p);
        const starter = p.starterCode?.[selectedLanguage] || "def solution():\n    pass";
        setCode(starter);
      } catch (err) {
        console.error("Failed to load problem:", err);
      }
    }
    fetchProblem();
  }, [id]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (problem?.starterCode?.[lang]) {
      setCode(problem.starterCode[lang]);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setResult(null);
    setSubmissionError("");
    setAiReview(null);

    try {
      const res = await api.post("/submissions", {
        problemId: id,
        code,
        language: selectedLanguage,
      });

      const submissionId = res.data.submissionId;

      // Poll for completion
      const interval = setInterval(async () => {
        try {
          const subRes = await api.get(`/submissions/${submissionId}`);
          const sub = subRes.data.submission;
          if (sub.status === "completed" || sub.status === "failed") {
            clearInterval(interval);
            setResult(sub);
            setSubmitting(false);
            // Auto-trigger AI feedback after submission
            handleAIReview(code);
          }
        } catch (pollErr) {
          clearInterval(interval);
          setSubmitting(false);
        }
      }, 1500);
    } catch (err) {
      setSubmissionError(err.response?.data?.error?.message || "Submission failed.");
      setSubmitting(false);
    }
  };

  const handleAIReview = async (codeToReview) => {
    if (!(codeToReview || code).trim()) return;
    setAiLoading(true);
    setAiReview(null);
    try {
      const res = await api.post("/ai/review-code", {
        code: codeToReview || code,
        language: selectedLanguage,
        problemId: id,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
      });
      setAiReview(res.data.review);
    } catch (err) {
      console.error("AI Review failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetHint = async () => {
    setAiLoading(true);
    setAiHint(null);
    try {
      const res = await api.post("/ai/hint", {
        problemDescription: problem?.description,
        currentCode: code,
        hintLevel,
      });
      setAiHint(res.data.hint);
      setHintLevel((prev) => Math.min(prev + 1, 3));
    } catch (err) {
      console.error("AI Hint failed:", err);
    } finally {
      setAiLoading(false);
    }
  };


  if (!problem) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading problem workspace...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/problems")} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-bold text-slate-400">#{problem.problemNumber || 1}</span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{problem.title}</h1>
          <Badge variant={problem.difficulty === "easy" ? "success" : problem.difficulty === "medium" ? "warning" : "error"}>
            {problem.difficulty}
          </Badge>
        </div>
      </div>

      {/* Main Split IDE Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Problem Details & Test Cases */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
            {["description", "hints", "testcases"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="flex-1 p-5 overflow-y-auto max-h-[500px] text-xs leading-relaxed space-y-4">
            {activeTab === "description" && (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{problem.description}</p>
                {problem.constraints && problem.constraints.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Constraints:</span>
                    <ul className="list-disc list-inside text-slate-500 space-y-1">
                      {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "hints" && (
              <div className="space-y-3">
                {(problem.hints || []).map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Hint {i + 1}</span>
                    <p>{h}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "testcases" && (
              <div className="space-y-3">
                {(problem.testCases || []).map((tc, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
                    <span className="font-bold text-slate-500 block">Test Case {i + 1}</span>
                    <div><span className="font-mono text-blue-600">Input:</span> {tc.input}</div>
                    <div><span className="font-mono text-emerald-600">Expected:</span> {tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Code Editor & Execution Results */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="overflow-hidden p-0 flex flex-col flex-1">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 dark:text-slate-400">Solution</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-lg px-2.5 py-1 font-semibold text-xs focus:outline-none"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++ 17</option>
                  <option value="java">Java 17</option>
                </select>
              </div>

              <button
                onClick={() => setCode(problem.starterCode?.[selectedLanguage] || "")}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Reset Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-h-[350px] flex-1">
              <Editor
                height="100%"
                language={selectedLanguage}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{ minimap: { enabled: false }, fontSize: 13 }}
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetHint}
                  loading={aiLoading}
                  title={`Get Hint (Level ${hintLevel}/3)`}
                >
                  <Lightbulb className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                  Hint {hintLevel > 1 ? `(Lvl ${hintLevel - 1})` : ""}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAIReview()}
                  loading={aiLoading}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-500" />
                  AI Review
                </Button>
              </div>
              <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                Submit Solution <Play className="w-3.5 h-3.5 ml-1 fill-current" />
              </Button>
            </div>
          </Card>

          {/* AI Hint Panel */}
          {aiHint && (
            <Card className="p-4 border-yellow-200 dark:border-yellow-900/60 bg-yellow-50/60 dark:bg-yellow-950/20 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-yellow-800 dark:text-yellow-300">
                <Lightbulb className="w-4 h-4" />
                <span>AI Hint — Level {hintLevel - 1}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{aiHint.hint}</p>
              {aiHint.direction && (
                <p className="text-slate-500 dark:text-slate-400 italic">Direction: {aiHint.direction}</p>
              )}
            </Card>
          )}

          {/* AI Code Review Panel */}
          {aiLoading && (
            <Card className="p-4 text-xs flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              <span>NVIDIA AI is analyzing your code...</span>
            </Card>
          )}
          {aiReview && !aiLoading && (
            <Card className="p-4 border-violet-200 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-violet-800 dark:text-violet-300">
                  <Brain className="w-4 h-4" />
                  <span>NVIDIA AI Code Review</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={aiReview.overallScore >= 80 ? "success" : aiReview.overallScore >= 60 ? "warning" : "error"}>
                    Score: {aiReview.overallScore}/100
                  </Badge>
                  <Badge variant="neutral">{aiReview.timeComplexity}</Badge>
                </div>
              </div>
              {aiReview.explanation && (
                <p className="text-slate-700 dark:text-slate-300">{aiReview.explanation}</p>
              )}
              {aiReview.strengths?.length > 0 && (
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">✓ Strengths</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                    {aiReview.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {aiReview.improvements?.length > 0 && (
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">⚡ Improvements</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                    {aiReview.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {aiReview.optimizedSnippet && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">💡 Optimization Idea</span>
                  <pre className="bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono text-[11px]">{aiReview.optimizedSnippet}</pre>
                </div>
              )}
            </Card>
          )}

          {/* Submission Results */}
          {result && (
            <Card className="p-5 space-y-3 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Accepted</Badge>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Passed {result.passedTests} / {result.totalTests} Test Cases
                  </span>
                </div>
                <span className="font-mono text-slate-500">Runtime: {result.runtime || 12}ms</span>
              </div>
            </Card>
          )}

          {submissionError && (
            <Card className="p-4 border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 font-mono">
              {submissionError}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
