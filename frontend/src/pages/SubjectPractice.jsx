import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Loader2, CheckCircle2, ArrowRight, Brain } from "lucide-react";
import api from "../services/api";

function Chip({ label, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-all"
      style={{
        border: `1px solid ${active ? "var(--accent)" : "var(--glass-border)"}`,
        background: active ? "var(--accent-subtle)" : "var(--glass-bg)",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        backdropFilter: "blur(12px)",
      }}
    >
      {label}
    </motion.button>
  );
}

export default function SubjectPractice() {
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get("topic");

  const [subject, setSubject] = useState(topicParam || "DBMS");
  const [difficulty, setDifficulty] = useState("medium");
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subjects = ["DBMS", "Operating Systems", "Computer Networks", "OOP", "System Design"];

  useEffect(() => {
    if (topicParam && subjects.includes(topicParam)) {
      setSubject(topicParam);
      setQuestion(null);
      setUserAnswer("");
      setEvaluation(null);
      setError("");
    }
  }, [topicParam]);

  const handleGenerateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setUserAnswer("");
    setEvaluation(null);
    setError("");
    try {
      const res = await api.post("/ai/generate-question", {
        topic: subject,
        difficulty,
        questionType: "short_answer",
      });
      if (res.data.question) {
        setQuestion(res.data.question);
      } else {
        setError("AI returned an empty question. Please try again.");
      }
    } catch (err) {
      console.error("Failed to generate question:", err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to generate question. Verify backend and AI API connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!question || !userAnswer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const qText = question.title || question.description || (typeof question === "string" ? question : JSON.stringify(question));
      const res = await api.post("/ai/evaluate-concept", {
        topic: subject,
        question: qText,
        answer: userAnswer,
        difficulty,
      });
      if (res.data.evaluation) {
        setEvaluation(res.data.evaluation);
      } else {
        setError("AI evaluation returned empty response. Please try again.");
      }
    } catch (err) {
      console.error("Failed to evaluate answer:", err);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Evaluation failed. Please verify AI gateway connectivity."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Core CS Theory Arena</span>
        </div>
        <h1 className="text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
          Subject <span className="font-bold">Practice & Theory Lab</span>
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          Sharpen conceptual fundamentals across DBMS, Operating Systems, Computer Networks, OOP, and System Design with adaptive AI questions.
        </p>
      </motion.div>

      {/* Subject Filter + Controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {subjects.map((sub) => (
            <Chip
              key={sub}
              label={sub}
              active={subject === sub}
              onClick={() => setSubject(sub)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border focus:outline-none cursor-pointer"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button
            onClick={handleGenerateQuestion}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-60"
            style={{
              background: "var(--accent)",
              boxShadow: "var(--accent-glow)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Question</span>
                <Sparkles className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl p-4 text-xs flex items-start gap-3 text-rose-500 border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <span className="font-bold">⚠</span>
          <div>
            <p className="font-bold mb-0.5">AI Question Generation Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Workspace */}
      {question ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="rounded-3xl p-6 sm:p-8 border space-y-6 shadow-xl"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
              >
                {subject}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold font-mono" style={{ color: "var(--text-tertiary)" }}>
                {question.difficulty || difficulty}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-normal leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {question.title || question.description}
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Your Technical Answer
            </label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Explain the technical concepts, trade-offs, and architecture in detail..."
              className="w-full min-h-[160px] rounded-2xl p-4 text-xs resize-none focus:outline-none transition-all border font-mono"
              style={{
                background: "var(--bg-surface-2)",
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={loading || !userAnswer.trim()}
            className="w-full py-3 rounded-full text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
            style={{
              background: "var(--accent)",
              boxShadow: "var(--accent-glow)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <span>Submit Answer for AI Evaluation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {evaluation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 space-y-4 text-xs border"
              style={{
                background: evaluation.score >= 70 ? "rgba(16,185,129,0.06)" : evaluation.score >= 50 ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)",
                borderColor: evaluation.score >= 70 ? "rgba(16,185,129,0.25)" : evaluation.score >= 50 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold" style={{ color: evaluation.score >= 70 ? "#34d399" : evaluation.score >= 50 ? "#fbbf24" : "#f87171" }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Evaluation Score</span>
                </div>
                <span className="text-xl font-bold font-mono" style={{ color: evaluation.score >= 70 ? "#34d399" : evaluation.score >= 50 ? "#fbbf24" : "#f87171" }}>
                  {evaluation.score}/100
                </span>
              </div>

              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {evaluation.feedback}
              </p>

              {evaluation.strengths?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-emerald-400 block">✓ Key Strengths:</span>
                  <ul className="space-y-1 pl-2 text-emerald-300">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.improvements?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-amber-400 block">⚡ Areas for Improvement:</span>
                  <ul className="space-y-1 pl-2 text-amber-300">
                    {evaluation.improvements.map((imp, idx) => (
                      <li key={idx}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.modelAnswer && (
                <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--glass-border)" }}>
                  <span className="font-bold block" style={{ color: "var(--accent)" }}>💡 Reference Model Answer:</span>
                  <p className="leading-relaxed p-3 rounded-xl font-mono text-[11px]" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                    {evaluation.modelAnswer}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl p-16 text-center text-xs border shadow-sm flex flex-col items-center justify-center gap-3"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            color: "var(--text-tertiary)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
            <Brain className="w-6 h-6" />
          </div>
          <p className="max-w-sm leading-relaxed">
            Select a subject above and click <strong>"Generate Question"</strong> to begin practicing core CS concepts.
          </p>
        </motion.div>
      )}
    </div>
  );
}
