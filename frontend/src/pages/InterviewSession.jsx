import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Clock, Send, Play, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import api from "../services/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";

export default function InterviewSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get("type") || "technical";

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionMeta, setQuestionMeta] = useState({ questionIndex: 0, totalQuestions: 5 });
  const [interviewerState, setInterviewerState] = useState("idle"); // idle, listening, thinking, speaking, evaluating

  const [answerText, setAnswerText] = useState("");
  const [code, setCode] = useState("// Write your solution here\n");
  const [codeLanguage, setCodeLanguage] = useState("python");

  const [followUp, setFollowUp] = useState(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const transcriptEndRef = useRef(null);

  useEffect(() => {
    async function initInterview() {
      setLoading(true);
      setSession(null);
      setCurrentQuestion(null);
      setReport(null);
      setTranscript([]);
      try {
        const createRes = await api.post("/interviews", {
          type: typeParam,
          topics: typeParam === "coding" ? ["DSA", "Algorithms"] : ["DSA", "SQL", "System Design"],
          difficulty: "medium",
          duration: 30,
          questionCount: 5,
        });

        const newSession = createRes.data.session;
        setSession(newSession);

        const startRes = await api.post(`/interviews/${newSession.id}/start`);
        setCurrentQuestion(startRes.data.question);
        setQuestionMeta({
          questionIndex: startRes.data.questionIndex,
          totalQuestions: startRes.data.totalQuestions,
        });

        setTranscript([
          {
            role: "assistant",
            text: `Welcome to your ${typeParam} interview session. I am your AI interviewer. Let's begin with the first question.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (err) {
        console.error("Failed to initialize interview:", err);
      } finally {
        setLoading(false);
      }
    }

    initInterview();
  }, [typeParam]);

  const fetchCurrentQuestion = async (sessionId) => {
    try {
      const res = await api.get(`/interviews/${sessionId}/current-question`);
      if (res.data.isComplete) {
        finishInterview(sessionId);
      } else {
        setCurrentQuestion(res.data.currentQuestion);
        setQuestionMeta({ questionIndex: res.data.questionIndex, totalQuestions: res.data.totalQuestions });
        setInterviewerState("speaking");
        appendTranscript("Interviewer", res.data.currentQuestion.questionText);
        if (res.data.currentQuestion.starterCode) {
          setCode(res.data.currentQuestion.starterCode.python || "// Write solution");
        }
      }
    } catch (err) {
      console.error("Error fetching question:", err);
    }
  };

  const appendTranscript = (sender, message) => {
    setTranscript((prev) => [...prev, { sender, message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !session) return;
    setLoading(true);
    setInterviewerState("thinking");

    const payload = {
      answerText: typeParam === "coding" ? answerText : answerText,
      code: typeParam === "coding" ? code : null,
      codeLanguage: typeParam === "coding" ? codeLanguage : null,
    };

    appendTranscript("You", answerText || code);

    try {
      await api.post(`/interviews/${session.id}/questions/${currentQuestion.id}/answer`, payload);
      setInterviewerState("evaluating");

      try {
        const followUpRes = await api.post(`/interviews/${session.id}/questions/${currentQuestion.id}/follow-up`);
        setFollowUp(followUpRes.data.followUp);
        setInterviewerState("speaking");
        appendTranscript("Interviewer (Follow-up)", followUpRes.data.followUp.followUpText);
      } catch {
        handleNextQuestion();
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!followUp) return;
    setLoading(true);
    setInterviewerState("thinking");

    appendTranscript("You (Follow-up)", followUpAnswer);

    try {
      await api.post(`/interviews/follow-ups/${followUp.id}/answer`, { answerText: followUpAnswer });
      setFollowUp(null);
      setFollowUpAnswer("");
      handleNextQuestion();
    } catch (err) {
      console.error("Error submitting follow-up:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    setLoading(true);
    setAnswerText("");
    setFollowUp(null);
    try {
      const res = await api.post(`/interviews/${session.id}/next`);
      if (res.data.isComplete || res.data.report) {
        setReport(res.data.report || res.data.session?.report);
      } else {
        fetchCurrentQuestion(session.id);
      }
    } catch (err) {
      console.error("Error advancing:", err);
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async (sessionId) => {
    setLoading(true);
    setInterviewerState("evaluating");
    try {
      const res = await api.post(`/interviews/${sessionId || session.id}/finish`);
      setReport(res.data.report);
      setInterviewerState("idle");
    } catch (err) {
      console.error("Error finishing interview:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <Badge variant="primary" className="mb-1 capitalize">
            {typeParam} Simulation
          </Badge>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Technical Interview Environment</h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Question {questionMeta.questionIndex + 1} of {questionMeta.totalQuestions}</span>
          </div>

          <Button variant="danger" size="sm" onClick={() => finishInterview(session?.id)}>
            End Interview
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Interviewer Presence & Transcript */}
        <div className="lg:col-span-5 space-y-6">
          {/* Professional Interviewer Portrait */}
          <Card className="p-6 text-center flex flex-col items-center justify-center min-h-[260px] relative">
            <div className="relative mb-4">
              <motion.div
                animate={
                  interviewerState === "speaking"
                    ? { scale: [1, 1.05, 1] }
                    : interviewerState === "thinking"
                    ? { rotate: [0, 5, -5, 0] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 rounded-full bg-slate-800 border-4 border-blue-500/40 flex items-center justify-center text-3xl font-black text-white shadow-md overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center">
                  👔
                </div>
              </motion.div>

              <Badge
                variant={
                  interviewerState === "speaking" ? "primary" : interviewerState === "thinking" ? "intelligence" : "neutral"
                }
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 uppercase text-[10px]"
              >
                {interviewerState}
              </Badge>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Senior Technical Interviewer</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {interviewerState === "speaking"
                ? "Asking question..."
                : interviewerState === "thinking"
                ? "Evaluating technical logic..."
                : "Listening to candidate..."}
            </p>

            {/* Audio Waveform Indicator */}
            <div className="flex items-center gap-1 mt-4 h-4">
              {[30, 70, 40, 90, 60, 80, 50].map((h, idx) => (
                <motion.div
                  key={idx}
                  animate={interviewerState === "speaking" ? { height: [`${h * 0.2}%`, `${h}%`, `${h * 0.2}%`] } : { height: "20%" }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.1 }}
                  className="w-1 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          </Card>

          {/* Transcript Box */}
          <Card className="p-4 flex flex-col max-h-[300px]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Transcript</h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
              {transcript.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl ${
                    item.sender.includes("Interviewer")
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px] opacity-75 mb-1">
                    <span>{item.sender}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{item.message}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </Card>
        </div>

        {/* Right Column: Question & Candidate Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {/* Question Box */}
          {currentQuestion && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="primary">{currentQuestion.topic || "Technical Topic"}</Badge>
                <span className="text-xs text-slate-400 uppercase">{currentQuestion.difficulty}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </Card>
          )}

          {/* Follow-up Probing Card */}
          {followUp && (
            <Card className="p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Follow-Up Question
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{followUp.followUpText}</p>
              <textarea
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                placeholder="Explain your logic for this follow-up..."
                className="w-full h-24 rounded-xl p-3 text-xs focus:outline-none transition-all"
                style={{
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <Button
                variant="primary"
                size="sm"
                className="mt-3 w-full"
                onClick={handleFollowUpSubmit}
                loading={loading}
                disabled={!followUpAnswer.trim()}
              >
                Submit Follow-Up Response
              </Button>
            </Card>
          )}

          {/* Solution Editor / Response Area */}
          {!followUp && (
            <div className="space-y-4">
              {typeParam === "coding" ? (
                <Card className="overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Solution Editor</span>
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="rounded px-2.5 py-1 text-xs font-semibold focus:outline-none"
                      style={{
                        background: "var(--bg-surface-2)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                  <Editor
                    height="280px"
                    language={codeLanguage}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{ minimap: { enabled: false }, fontSize: 13 }}
                  />
                </Card>
              ) : (
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Structure your answer clearly. Address trade-offs, edge cases, and core reasoning..."
                  className="w-full min-h-[220px] rounded-2xl p-4 text-xs focus:outline-none transition-all resize-none"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              )}

              <Button variant="primary" className="w-full" onClick={handleAnswerSubmit} loading={loading}>
                Submit Answer & Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Report Modal */}
      <Modal isOpen={!!report} onClose={() => navigate("/dashboard")} title="Interview Performance Evaluation">
        {report && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block">{Math.round(report.overallScore || 0)}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Overall</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{Math.round(report.technicalScore || 0)}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Technical</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">{Math.round(report.problemSolvingScore || 0)}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Reasoning</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-2xl font-black text-violet-600 dark:text-violet-400 block">{Math.round(report.communicationScore || 0)}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Clarity</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-2">Strengths</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  {(report.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 uppercase mb-2">Areas to Improve</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  {(report.weaknesses || []).map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
