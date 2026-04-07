import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { examAPI } from "../services/examApi";
import api from "../services/api";
import ExamTimer from "../components/ExamTimer";
import ExamProblemNav from "../components/ExamProblemNav";
import useAntiCheat from "../hooks/useAntiCheat";

// ── Anti-Cheat Warning Modal ────────────────────────────────────────────────
function AntiCheatModal({ type, count, onDismiss, onReenter, isFlagged }) {
  if (!type) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 max-w-md rounded-2xl border border-red-500/30 bg-gray-900 p-6 shadow-2xl"
      >
        <div className="mb-3 text-3xl text-center">{isFlagged ? "🚨" : "⚠️"}</div>
        <h3 className={`mb-2 text-center text-xl font-bold ${isFlagged ? "text-red-400" : "text-yellow-400"}`}>
          {isFlagged ? "Exam Flagged!" : type === "tab" ? "Tab Switch Detected!" : "Left Fullscreen!"}
        </h3>
        <p className="text-center text-sm text-gray-400 mb-1">
          {isFlagged
            ? "Your exam has been flagged for review. Your teacher will be notified. Continue your exam honestly."
            : type === "tab"
            ? `You switched tabs or windows. This is attempt ${count}.`
            : `You exited fullscreen. Please return to fullscreen. This is warning ${count}.`}
        </p>
        <p className="text-center text-xs text-gray-600 mb-5">
          {!isFlagged && `Warning ${count}/3 — exam will be flagged after 3 violations.`}
        </p>
        <div className="flex gap-3">
          {type !== "tab" && (
            <button onClick={onReenter} className="flex-1 rounded-lg bg-accent-green/20 py-2.5 text-sm font-semibold text-accent-green hover:bg-accent-green/30 transition-colors">
              ↩ Return to Fullscreen
            </button>
          )}
          <button onClick={onDismiss} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${type === "tab" ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Submit Confirmation Modal ───────────────────────────────────────────────
function SubmitModal({ onConfirm, onCancel, submitting }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
      >
        <div className="mb-3 text-3xl text-center">📤</div>
        <h3 className="mb-2 text-center text-xl font-bold text-gray-100">Submit Exam?</h3>
        <p className="text-center text-sm text-gray-400 mb-5">
          You cannot make changes after submission. Make sure you have attempted all problems.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={submitting} className="flex-1 btn-secondary text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 btn-primary text-sm">
            {submitting ? "Submitting..." : "Yes, Submit All"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ExamRoom ───────────────────────────────────────────────────────────
export default function ExamRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [attempt,          setAttempt]          = useState(null);
  const [problems,         setProblems]         = useState([]);
  const [currentIndex,     setCurrentIndex]     = useState(0);
  const [timeRemaining,    setTimeRemaining]     = useState(0);
  const [code,             setCode]             = useState({});       // { [problemId]: code string }
  const [submitting,       setSubmitting]        = useState(false);
  const [submittingProblem, setSubmittingProblem] = useState(false);
  const [showSubmitModal,  setShowSubmitModal]  = useState(false);
  const [antiCheatModal,   setAntiCheatModal]   = useState(null);    // { type, count }

  // ── Anti-Cheat ──────────────────────────────────────────────────────────
  const {
    tabSwitchCount, fullscreenExitCount, isFlagged,
    isFullscreen, requestFullscreen
  } = useAntiCheat({ examId: id, enabled: true });

  // Show modal on tab switch
  const prevTabCount = useRef(0);
  const prevFsCount  = useRef(0);
  useEffect(() => {
    if (tabSwitchCount > prevTabCount.current) {
      prevTabCount.current = tabSwitchCount;
      setAntiCheatModal({ type: "tab", count: tabSwitchCount });
    }
  }, [tabSwitchCount]);
  useEffect(() => {
    if (fullscreenExitCount > prevFsCount.current) {
      prevFsCount.current = fullscreenExitCount;
      setAntiCheatModal({ type: "fullscreen", count: fullscreenExitCount });
    }
  }, [fullscreenExitCount]);

  // ── Block external paste on the exam container ─────────────────────────
  useEffect(() => {
    const handlePaste = (e) => {
      // Allow paste within Monaco (target is monaco's textarea)
      if (e.target?.closest?.(".monaco-editor")) return;
      e.preventDefault();
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // ── Load attempt ─────────────────────────────────────────────────────────
  const loadAttempt = useCallback(async () => {
    try {
      // Try to get existing attempt; if none, start a new one
      let res;
      try {
        res = await examAPI.getMyAttempt(id);
      } catch {
        // No attempt yet — start one
        await examAPI.startAttempt(id);
        res = await examAPI.getMyAttempt(id);
      }

      const { attempt: att, problems: probs, timeRemainingSeconds } = res.data;

      // If already submitted, redirect to results
      if (att.status !== "in_progress") {
        navigate(`/exam/${id}/results`, { replace: true });
        return;
      }

      setAttempt(att);
      setProblems(probs);
      setTimeRemaining(timeRemainingSeconds);

      // Restore saved code from localStorage
      const savedCode = {};
      probs.forEach((ps) => {
        const key = `exam_${att._id}_${ps.problemId}`;
        savedCode[ps.problemId] = localStorage.getItem(key) || ps.problem?.starterCode || "";
      });
      setCode(savedCode);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load exam. It may not be live yet.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadAttempt(); }, [loadAttempt]);

  // ── Auto-save code to localStorage ───────────────────────────────────────
  const handleCodeChange = (value) => {
    const ps = problems[currentIndex];
    if (!ps || !attempt) return;
    const key = `exam_${attempt._id}_${ps.problemId}`;
    localStorage.setItem(key, value || "");
    setCode((prev) => ({ ...prev, [ps.problemId]: value || "" }));
  };

  // ── Submit single problem via existing submission flow ────────────────────
  const handleSubmitProblem = async () => {
    const ps = problems[currentIndex];
    if (!ps || !attempt) return;
    setSubmittingProblem(true);

    try {
      const currentCode = code[ps.problemId] || "";
      // Use the existing submission API
      const subRes = await api.post("/submissions", {
        problemId:     ps.problemId,
        code:          currentCode,
        examAttemptId: attempt._id
      });

      // Watch for result
      const submissionId = subRes.data._id || subRes.data.submissionId;
      if (submissionId) {
        // Poll for result (max 30s)
        let pollCount = 0;
        const poll = setInterval(async () => {
          pollCount++;
          try {
            const r = await api.get(`/submissions/${submissionId}`);
            const sub = r.data;
            if (sub.status === "completed" || sub.status === "error" || pollCount > 30) {
              clearInterval(poll);
              // Update attempt's problem submission tracking
              setProblems((prev) => prev.map((p, i) =>
                i === currentIndex
                  ? { ...p, submissionId: submissionId, marksAwarded: sub.grade || 0 }
                  : p
              ));
            }
          } catch { clearInterval(poll); }
        }, 1000);
      }
    } catch (err) {
      console.error("Submit problem error:", err);
    } finally {
      setSubmittingProblem(false);
    }
  };

  // ── Final submit all ──────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      await examAPI.submit(id, {
        problemResults: problems.map((ps) => ({
          problemId:    ps.problemId,
          submissionId: ps.submissionId || null,
          marksAwarded: ps.marksAwarded || 0
        }))
      });
      // Clean up localStorage
      problems.forEach((ps) => {
        localStorage.removeItem(`exam_${attempt._id}_${ps.problemId}`);
      });
      navigate(`/exam/${id}/results`);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
      setShowSubmitModal(false);
      setSubmitting(false);
    }
  };

  const currentPS      = problems[currentIndex];
  const currentProblem = currentPS?.problem;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-accent-green mx-auto mb-4" />
          <p>Loading exam environment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Cannot Enter Exam</h2>
          <p className="text-gray-400 text-sm mb-5">{error}</p>
          <button onClick={() => navigate("/exams")} className="btn-secondary text-sm">
            ← Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 text-gray-100">
      {/* ── Header Bar ──────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div>
          <h1 className="font-bold text-gray-100 leading-tight">{attempt?.examId?.title || "Exam"}</h1>
          <p className="text-xs text-gray-500">{problems.length} Problems</p>
        </div>

        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="rounded-lg bg-yellow-500/15 px-3 py-1.5 text-xs font-medium text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25"
            >
              ⛶ Enter Fullscreen
            </button>
          )}

          {isFlagged && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/30 animate-pulse">
              🚨 FLAGGED
            </span>
          )}

          <ExamTimer totalSeconds={timeRemaining} onExpire={handleFinalSubmit} />

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary text-sm"
            disabled={submitting}
          >
            Submit All
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Nav Sidebar */}
        <aside className="w-52 flex-shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-3">
          <ExamProblemNav
            problems={problems}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
        </aside>

        {/* Middle: Problem Statement */}
        <div className="w-[38%] flex-shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/40 p-5">
          {currentProblem ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Q{currentIndex + 1}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  currentProblem.difficulty === "Easy"   ? "bg-green-500/15 text-green-400" :
                  currentProblem.difficulty === "Medium" ? "bg-yellow-500/15 text-yellow-400" :
                                                           "bg-red-500/15 text-red-400"
                }`}>
                  {currentProblem.difficulty}
                </span>
                <span className="ml-auto text-xs text-gray-500">{currentPS?.marks || currentPS?.maxMarks || 10} marks</span>
              </div>
              <h2 className="mb-3 text-lg font-bold text-gray-100">{currentProblem.title}</h2>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {currentProblem.description}
              </div>
              {currentProblem.hints?.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">💡 Hints</summary>
                  <ul className="mt-2 space-y-1 text-xs text-gray-400">
                    {currentProblem.hints.map((h, i) => <li key={i}>• {h}</li>)}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No problem selected.</p>
          )}
        </div>

        {/* Right: Monaco Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-blue-500/15 px-2 py-0.5 text-blue-400 font-mono">Python 3</span>
              <span>Auto-saved</span>
            </div>
            <button
              onClick={handleSubmitProblem}
              disabled={submittingProblem}
              className="rounded-lg bg-accent-green/20 px-4 py-1.5 text-sm font-semibold text-accent-green border border-accent-green/30 hover:bg-accent-green/30 transition-colors disabled:opacity-50"
            >
              {submittingProblem ? "Running..." : "▶ Run & Submit"}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              language="python"
              theme="vs-dark"
              value={currentPS ? (code[currentPS.problemId] || currentProblem?.starterCode || "") : ""}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                padding: { top: 12 }
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {antiCheatModal && (
          <AntiCheatModal
            type={antiCheatModal.type}
            count={antiCheatModal.count}
            isFlagged={isFlagged}
            onReenter={() => { requestFullscreen(); setAntiCheatModal(null); }}
            onDismiss={() => setAntiCheatModal(null)}
          />
        )}
        {showSubmitModal && (
          <SubmitModal
            onConfirm={handleFinalSubmit}
            onCancel={() => setShowSubmitModal(false)}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
