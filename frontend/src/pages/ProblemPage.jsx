import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Lightbulb,
  ChevronLeft,
  Sparkles,
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Copy,
  Check,
  Zap,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import { getStarterCode } from "../utils/codeTemplates";

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
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  );
}

const LANGUAGES = [
  { id: "python", label: "Python 3", badge: "PY", desc: "Python 3.10" },
  { id: "javascript", label: "JavaScript", badge: "JS", desc: "Node.js 20" },
  { id: "cpp", label: "C++ 17", badge: "C++", desc: "GCC 11.2" },
  { id: "java", label: "Java 17", badge: "JAVA", desc: "OpenJDK 17" },
];

export default function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [codeMap, setCodeMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [aiReview, setAiReview] = useState(null);
  const [aiHint, setAiHint] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await api.get(`/problems/${id}`);
        const p = res.data.problem;
        setProblem(p);
        const starter = getStarterCode(p, selectedLanguage);
        setCode(starter);
        setCodeMap({ [selectedLanguage]: starter });
      } catch (err) {
        console.error("Failed to load problem:", err);
      }
    }
    fetchProblem();
  }, [id]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    const nextCode = codeMap[lang] || getStarterCode(problem, lang);
    setCode(nextCode);
    setCodeMap((prev) => ({
      ...prev,
      [selectedLanguage]: code,
      [lang]: nextCode,
    }));
  };

  const handleCodeChange = (val) => {
    const nextVal = val || "";
    setCode(nextVal);
    setCodeMap((prev) => ({
      ...prev,
      [selectedLanguage]: nextVal,
    }));
  };

  const handleResetCode = () => {
    const starter = getStarterCode(problem, selectedLanguage);
    setCode(starter);
    setCodeMap((prev) => ({
      ...prev,
      [selectedLanguage]: starter,
    }));
  };

  const handleAIReview = async (codeToReview) => {
    const targetCode = (codeToReview || code || "").trim();
    if (!targetCode) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/review-code", {
        code: targetCode,
        language: selectedLanguage,
        problemId: id,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
      });
      if (res.data?.review) {
        setAiReview(res.data.review);
      }
    } catch (err) {
      console.error("AI Review failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setResult(null);
    setSubmissionError("");

    try {
      const res = await api.post("/submissions", {
        problemId: id,
        code,
        language: selectedLanguage,
      });

      const submissionId = res.data.submissionId;

      // Poll submission outcome
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const subRes = await api.get(`/submissions/${submissionId}`);
          const sub = subRes.data.submission;
          if (sub.status === "completed" || sub.status === "failed" || attempts > 20) {
            clearInterval(interval);
            setResult(sub);
            setSubmitting(false);

            // Populate AI Review from backend submission feedback or trigger review
            if (sub.feedback) {
              setAiReview({
                overallScore: sub.feedback.overallScore || sub.feedback.score || (sub.passedTests === sub.totalTests ? 95 : 60),
                timeComplexity: sub.timeComplexity || sub.feedback.timeComplexity || sub.feedback.efficiency?.timeComplexity || "O(n)",
                spaceComplexity: sub.spaceComplexity || sub.feedback.spaceComplexity || sub.feedback.efficiency?.spaceComplexity || "O(1)",
                explanation: sub.feedback.explanation || sub.feedback.correctness?.feedback || "Evaluation complete.",
                strengths: sub.feedback.strengths || [],
                improvements: sub.feedback.improvements || sub.feedback.weaknesses || [],
                optimizedSnippet: sub.feedback.optimizedSnippet || sub.feedback.optimizedApproach || "",
              });
            } else {
              handleAIReview(code);
            }
          }
        } catch (pollErr) {
          clearInterval(interval);
          setSubmitting(false);
        }
      }, 1200);
    } catch (err) {
      setSubmissionError(err.response?.data?.error?.message || "Submission failed to start.");
      setSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    setAiLoading(true);
    try {
      const res = await api.post("/ai/hint", {
        problemId: id,
        problemDescription: problem?.description,
        currentCode: code,
        hintLevel,
      });
      if (res.data?.hint) {
        setAiHint(res.data.hint);
        setActiveTab("hints");
        setHintLevel((prev) => Math.min(prev + 1, 3));
      }
    } catch (err) {
      const fallback =
        (problem?.hints && problem.hints[hintLevel - 1]) ||
        problem?.hints?.[0] ||
        "Analyze the problem constraints and test boundary cases.";
      setAiHint({ hint: fallback, direction: "Algorithmic thinking" });
      setActiveTab("hints");
      setHintLevel((prev) => Math.min(prev + 1, 3));
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopySnippet = (snippet) => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (!problem) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="spinner-ios" />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Loading problem workspace...
        </span>
      </div>
    );
  }

  const allPassed = result && result.totalTests > 0 && result.passedTests === result.totalTests;
  const testResultsList = result?.testResults?.testResults || result?.testResults || [];

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/problems")}
            className="p-1.5 rounded-xl border transition-colors cursor-pointer"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
            #{problem.problemNumber || 1}
          </span>
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {problem.title}
          </h1>
          <DiffBadge level={problem.difficulty} />
        </div>

        {problem.expectedComplexity && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full font-mono border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--glass-border)", color: "var(--text-secondary)" }}>
              Time: {problem.expectedComplexity.time}
            </span>
            <span className="px-2.5 py-1 rounded-full font-mono border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--glass-border)", color: "var(--text-secondary)" }}>
              Space: {problem.expectedComplexity.space}
            </span>
          </div>
        )}
      </motion.div>

      {/* Main Split IDE Workspace */}
      <div className="grid lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* Left Column: Problem Details, Hints & Test Cases */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Tab buttons */}
          <div
            className="flex items-center gap-1 p-1 rounded-full border w-fit"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
            }}
          >
            {[
              { id: "description", label: "Description" },
              { id: "hints", label: "Hints" },
              { id: "testcases", label: "Test Cases" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: isActive ? "var(--accent-glow)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div
            className="flex-1 p-5 rounded-3xl border overflow-y-auto max-h-[560px] text-xs leading-relaxed space-y-4 shadow-sm"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            {activeTab === "description" && (
              <div className="space-y-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {problem.description}
                </div>

                {problem.constraints && problem.constraints.length > 0 && (
                  <div
                    className="p-3.5 rounded-2xl border space-y-1.5"
                    style={{
                      background: "var(--bg-surface-2)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    <span className="font-bold block" style={{ color: "var(--text-primary)" }}>
                      Constraints:
                    </span>
                    <ul className="list-disc list-inside space-y-1" style={{ color: "var(--text-secondary)" }}>
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {problem.topics && problem.topics.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {problem.topics.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{
                          background: "var(--bg-surface-2)",
                          borderColor: "var(--glass-border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "hints" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    Problem Hints & Guides
                  </span>
                  <button
                    onClick={handleGetHint}
                    disabled={aiLoading}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      borderColor: "rgba(245,158,11,0.3)",
                      color: "#f59e0b",
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Get AI Hint (Lvl {hintLevel})</span>
                  </button>
                </div>

                {aiHint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl border text-xs space-y-1.5"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      borderColor: "rgba(245,158,11,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Contextual AI Hint</span>
                    </div>
                    <p style={{ color: "var(--text-primary)" }}>{aiHint.hint}</p>
                    {aiHint.direction && (
                      <p className="italic text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        Direction: {aiHint.direction}
                      </p>
                    )}
                  </motion.div>
                )}

                {(problem.hints || []).map((h, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border space-y-1"
                    style={{
                      background: "var(--bg-surface-2)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    <span className="font-bold text-blue-500 block">Hint {i + 1}</span>
                    <p style={{ color: "var(--text-secondary)" }}>{h}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "testcases" && (
              <div className="space-y-3">
                {(problem.testCases || []).map((tc, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border space-y-1 font-mono text-[11px]"
                    style={{
                      background: "var(--bg-surface-2)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    <span className="font-bold block text-[10px] uppercase" style={{ color: "var(--text-tertiary)" }}>
                      Test Case {i + 1} ({tc.category || "public"})
                    </span>
                    <div>
                      <span className="text-blue-500 font-semibold">Input:</span> {tc.input}
                    </div>
                    <div>
                      <span className="text-emerald-500 font-semibold">Expected:</span> {tc.expectedOutput}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Results */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            className="rounded-3xl border overflow-hidden flex flex-col flex-1 shadow-md"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* macOS Editor Top Bar */}
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
                {/* Custom Language Selector */}
                <div className="relative" ref={langMenuRef}>
                  <button
                    type="button"
                    onClick={() => setLangMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full px-3 py-1 font-semibold text-xs border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: "var(--glass-bg)",
                      borderColor: langMenuOpen ? "var(--accent)" : "var(--glass-border)",
                      color: "var(--text-primary)",
                      boxShadow: langMenuOpen ? "0 0 12px rgba(59, 130, 246, 0.25)" : "none",
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={langMenuOpen}
                  >
                    <span
                      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase"
                      style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                    >
                      {LANGUAGES.find((l) => l.id === selectedLanguage)?.badge || selectedLanguage.toUpperCase()}
                    </span>
                    <span>{LANGUAGES.find((l) => l.id === selectedLanguage)?.label || selectedLanguage}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                        langMenuOpen ? "rotate-180 text-blue-400" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {langMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl p-1.5 z-50 overflow-hidden"
                        style={{
                          background: "#0f172a",
                          borderColor: "rgba(255, 255, 255, 0.14)",
                          boxShadow: "0 12px 36px -4px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                          backdropFilter: "blur(20px)",
                        }}
                        role="listbox"
                      >
                        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                          Select Language
                        </div>
                        {LANGUAGES.map((lang) => {
                          const isSelected = selectedLanguage === lang.id;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => {
                                handleLanguageChange(lang.id);
                                setLangMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600/20 text-blue-400 font-semibold"
                                  : "text-slate-200 hover:bg-slate-800 hover:text-white"
                              }`}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-300"
                                  }`}
                                >
                                  {lang.badge}
                                </span>
                                <div>
                                  <div className="text-xs">{lang.label}</div>
                                  <div className="text-[10px] text-slate-400">{lang.desc}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={handleResetCode}
                className="p-1.5 rounded-full border hover:scale-105 transition-all cursor-pointer"
                style={{ borderColor: "var(--glass-border)", color: "var(--text-tertiary)" }}
                title="Reset Starter Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="min-h-[380px] flex-1">
              <Editor
                height="100%"
                language={selectedLanguage}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Bottom Action Controls */}
            <div
              className="p-3.5 border-t flex flex-wrap justify-between items-center gap-3"
              style={{ borderColor: "var(--glass-border)", background: "var(--bg-surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGetHint}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    borderColor: "rgba(245,158,11,0.25)",
                    color: "#f59e0b",
                  }}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Hint (Lvl {hintLevel})</span>
                </button>

                <button
                  onClick={() => handleAIReview()}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    borderColor: "rgba(139,92,246,0.25)",
                    color: "#a78bfa",
                  }}
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>AI Code Review</span>
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-60"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--accent-glow)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Solution...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Solution</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Code Review Box */}
          {aiReview && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl border text-xs space-y-3.5 shadow-lg"
              style={{
                background: "var(--glass-bg)",
                borderColor: "rgba(139,92,246,0.3)",
                boxShadow: "var(--glass-shadow)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-violet-400">
                  <Brain className="w-4 h-4" />
                  <span>AI Code Review & Complexity</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Score: {aiReview.overallScore || aiReview.score || 85}/100
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {aiReview.timeComplexity || "O(n)"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {aiReview.spaceComplexity || "O(1)"}
                  </span>
                </div>
              </div>

              {aiReview.explanation && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {aiReview.explanation}
                </p>
              )}

              {/* Strengths & Improvements */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {aiReview.strengths && aiReview.strengths.length > 0 && (
                  <div className="p-3 rounded-2xl border space-y-1.5" style={{ background: "var(--bg-surface-2)", borderColor: "var(--glass-border)" }}>
                    <span className="font-bold text-emerald-400 block text-[11px]">Key Strengths</span>
                    <ul className="space-y-1 list-disc list-inside text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {aiReview.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReview.improvements && aiReview.improvements.length > 0 && (
                  <div className="p-3 rounded-2xl border space-y-1.5" style={{ background: "var(--bg-surface-2)", borderColor: "var(--glass-border)" }}>
                    <span className="font-bold text-amber-400 block text-[11px]">Recommended Improvements</span>
                    <ul className="space-y-1 list-disc list-inside text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {aiReview.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {aiReview.optimizedSnippet && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold block text-[11px]" style={{ color: "var(--text-primary)" }}>
                      💡 Optimized Implementation
                    </span>
                    <button
                      onClick={() => handleCopySnippet(aiReview.optimizedSnippet)}
                      className="px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                      style={{ background: "var(--bg-surface-2)", borderColor: "var(--glass-border)", color: "var(--text-secondary)" }}
                    >
                      {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet ? "Copied!" : "Copy Snippet"}</span>
                    </button>
                  </div>
                  <pre
                    className="p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto text-emerald-400 border"
                    style={{ background: "var(--code-bg)", borderColor: "var(--glass-border)" }}
                  >
                    {aiReview.optimizedSnippet}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {submissionError && (
            <div
              className="p-4 rounded-2xl border text-xs font-mono text-rose-500 flex items-center gap-2"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.3)",
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
