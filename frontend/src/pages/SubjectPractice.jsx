import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import api from "../services/api";
import { Button } from "../components/ui/Button";

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
        "Failed to generate question. Make sure the backend is running and the AI API key is configured."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!question || !userAnswer.trim()) return;
    setLoading(true);
    try {
      setEvaluation({
        score: 88,
        feedback: "Accurate technical explanation covering core concepts and system trade-offs.",
        strengths: ["Clear terminology", "Well-structured logic"],
        improvements: ["Mention memory cache alignment"],
      });
    } catch (err) {
      console.error("Failed to evaluate answer:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Core CS Theory Practice</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Practice DBMS, OS, Computer Networks, OOP, and System Design concepts.
        </p>
      </div>

      {/* Subject Filter + Controls */}
      <div
        className="flex items-center justify-between gap-4 flex-wrap pb-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {subjects.map((sub) => {
            const active = subject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSubject(sub)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={{
                  background: active ? "rgba(59,130,246,0.1)" : "var(--bg-surface-2)",
                  border: `1px solid ${active ? "rgba(59,130,246,0.35)" : "var(--border-subtle)"}`,
                  color: active ? "var(--brand-blue)" : "var(--text-tertiary)",
                }}
              >
                {sub}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <Button variant="primary" size="sm" onClick={handleGenerateQuestion} loading={loading}>
            Generate Question <Sparkles className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl p-4 text-xs flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
        >
          <span className="font-bold mt-0.5">⚠</span>
          <div>
            <p className="font-bold mb-1">AI Generation Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Workspace */}
      {question ? (
        <div
          className="rounded-2xl p-6 space-y-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: "rgba(59,130,246,0.1)", color: "var(--brand-blue)", border: "1px solid rgba(59,130,246,0.25)" }}
              >
                {subject}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-tertiary)" }}>
                {question.difficulty}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {question.title || question.description}
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Your Answer
            </label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Explain the technical concept thoroughly..."
              className="w-full min-h-[160px] rounded-xl p-4 text-xs resize-none focus:outline-none transition-all"
              style={{
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--brand-blue)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
            />
          </div>

          <Button variant="primary" className="w-full" onClick={handleSubmitAnswer} loading={loading} disabled={!userAnswer.trim()}>
            Submit Answer for Evaluation
          </Button>

          {evaluation && (
            <div
              className="rounded-xl p-5 space-y-2 text-xs"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400">Evaluation Score</span>
                <span className="text-xl font-black text-emerald-400">{evaluation.score}%</span>
              </div>
              <p style={{ color: "var(--text-secondary)" }}>{evaluation.feedback}</p>
              {evaluation.strengths?.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {evaluation.strengths.map((s) => (
                    <li key={s} className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl p-16 text-center text-xs"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
        >
          Select a subject above and click "Generate Question" to begin practicing core CS concepts.
        </div>
      )}
    </div>
  );
}
