import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { BrainCircuit, Camera, CheckCircle2, Clock3, Code2, Mic, MicOff, Pause, Play, Send, ShieldCheck, Sparkles, Square, Video, VideoOff, Volume2, WifiOff } from "lucide-react";
import api from "../services/api";
import { SocketContext } from "../context/SocketContext";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const INTERVIEWERS = {
  technical: { name: "Maya Chen", role: "Technical interviewer", initials: "MC", accent: "from-cyan-400 to-blue-600", topics: "DSA · systems · databases" },
  behavioral: { name: "Elias Brooks", role: "Behavioral interviewer", initials: "EB", accent: "from-violet-400 to-fuchsia-600", topics: "projects · teamwork · communication" },
};

const recognitionSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
const clock = (value) => new Date(value || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function InterviewSession() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const type = params.get("type") || "technical";
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [meta, setMeta] = useState({ questionIndex: 0, totalQuestions: 0 });
  const [phase, setPhase] = useState("preparing");
  const [activeInterviewer, setActiveInterviewer] = useState("technical");
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState("");
  const [followUp, setFollowUp] = useState(null);
  const [code, setCode] = useState("# Explain your approach, then implement it here.\n");
  const [language, setLanguage] = useState("python");
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("Camera off");
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const silenceRef = useRef(null);
  const entriesEndRef = useRef(null);
  const sessionRef = useRef(null);
  const questionRef = useRef(null);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => entriesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [entries, draft]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (session?.startedAt && !paused) setElapsed(Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.startedAt, paused]);
  useEffect(() => () => { stopListening(); window.speechSynthesis?.cancel(); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  const addEntry = useCallback((entry) => setEntries((items) => [...items, { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), ...entry }]), []);
  const persistTranscript = useCallback(async (text, status = "partial") => {
    if (!sessionRef.current || !text.trim()) return;
    try { await api.post(`/interviews/${sessionRef.current.id}/transcripts`, { text, status, speaker: "candidate", questionId: questionRef.current?.id }); } catch { /* next final answer still remains usable */ }
  }, []);

  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.97;
    utterance.onstart = () => setPhase("speaking");
    utterance.onend = () => setPhase("ready");
    utterance.onerror = () => setPhase("ready");
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopListening = useCallback(() => {
    window.clearTimeout(silenceRef.current);
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setMic(false);
  }, []);

  const submitAnswer = useCallback(async (answer = draft) => {
    const current = questionRef.current;
    const activeSession = sessionRef.current;
    if (!activeSession || !current || !answer.trim() || paused) return;
    stopListening();
    setPhase("evaluating");
    await persistTranscript(answer, "final");
    addEntry({ speaker: "candidate", label: "You", text: answer });
    setDraft("");
    try {
      const response = await api.post(`/interviews/${activeSession.id}/questions/${current.id}/answer`, { answerText: answer, code: current.questionType === "coding" ? code : null, codeLanguage: current.questionType === "coding" ? language : null });
      const evaluation = response.data.evaluation;
      const acknowledgement = evaluation?.classification === "CORRECT"
        ? "That’s a strong explanation. Let’s test the edge of your reasoning."
        : evaluation?.classification === "PARTIALLY_CORRECT"
          ? "You have the main idea. Let’s make one distinction more precise."
          : "Thanks — let’s unpack that a little further.";
      addEntry({ speaker: "technical", label: INTERVIEWERS.technical.name, text: acknowledgement, subtle: true });
      speak(acknowledgement);
      const followUpResponse = await api.post(`/interviews/${activeSession.id}/questions/${current.id}/follow-up`);
      setFollowUp(followUpResponse.data.followUp);
      setPhase("follow_up");
      const followUpText = followUpResponse.data.followUp.followUpText;
      addEntry({ speaker: "technical", label: INTERVIEWERS.technical.name, text: followUpText });
      speak(followUpText);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || "We could not evaluate that answer. Your text is still here—please retry.");
      setPhase("ready");
    }
  }, [addEntry, code, draft, language, paused, persistTranscript, speak, stopListening]);

  const startListening = useCallback(async () => {
    if (paused) return;
    setError("");
    window.speechSynthesis?.cancel();
    if (!recognitionSupported) { setError("Live browser transcription is unavailable here. You can type and submit your answer."); return; }
    try {
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: camera });
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onstart = () => { setMic(true); setPhase("listening"); };
      recognition.onresult = (event) => {
        let next = "";
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const value = event.results[index][0].transcript;
          next += value;
          if (event.results[index].isFinal) finalText += value;
        }
        if (next) setDraft((previous) => `${previous} ${next}`.trim());
        if (finalText) persistTranscript(finalText, "partial");
        window.clearTimeout(silenceRef.current);
        silenceRef.current = window.setTimeout(() => {
          const currentDraft = document.querySelector("[data-interview-draft]")?.value || "";
          if (currentDraft.trim().length > 3) submitAnswer(currentDraft);
        }, 2100);
      };
      recognition.onerror = (event) => { if (event.error !== "aborted") setError("Microphone transcription paused. You can retry or submit by typing."); setMic(false); };
      recognition.onend = () => setMic(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError("Microphone permission was not granted. You can continue with typed responses.");
    }
  }, [camera, paused, persistTranscript, submitAnswer]);

  const submitFollowUp = async () => {
    if (!followUp || !draft.trim()) return;
    const answer = draft;
    addEntry({ speaker: "candidate", label: "You", text: answer });
    setDraft(""); setPhase("thinking");
    try {
      await api.post(`/interviews/follow-ups/${followUp.id}/answer`, { answerText: answer });
      setFollowUp(null);
      const result = await api.post(`/interviews/${session.id}/next`);
      if (result.data.isComplete || result.data.report) { setReport(result.data.report); setPhase("completed"); return; }
      const status = await api.get(`/interviews/${session.id}/current-question`);
      setQuestion(status.data.currentQuestion); setMeta(status.data);
      const interviewer = status.data.currentQuestion.questionType === "behavioral" ? "behavioral" : "technical";
      setActiveInterviewer(interviewer); setPhase("speaking");
      addEntry({ speaker: interviewer, label: INTERVIEWERS[interviewer].name, text: status.data.currentQuestion.questionText });
      speak(status.data.currentQuestion.questionText);
    } catch { setError("Could not advance the session. Please retry your follow-up."); setPhase("follow_up"); }
  };

  const toggleCamera = async () => {
    if (camera) { streamRef.current?.getVideoTracks().forEach((track) => track.stop()); setCamera(false); setCameraStatus("Camera off"); return; }
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const tracks = streamRef.current?.getAudioTracks() || [];
      streamRef.current = new MediaStream([...tracks, ...videoStream.getVideoTracks()]);
      if (videoRef.current) { videoRef.current.srcObject = streamRef.current; await videoRef.current.play(); }
      setCamera(true); setCameraStatus("On-device framing check");
    } catch { setError("Camera permission was not granted. No video is recorded or uploaded."); }
  };

  const finish = async () => {
    if (!session) return;
    stopListening(); window.speechSynthesis?.cancel(); setPhase("evaluating");
    try { const result = await api.post(`/interviews/${session.id}/finish`); setReport(result.data.report); setPhase("completed"); } catch { setError("Could not finish the interview. Please try again."); }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const create = await api.post("/interviews", { type, topics: type === "behavioral" ? ["Projects", "Communication", "Leadership"] : ["DSA", "DBMS", "System Design"], difficulty: "medium", duration: 30, questionCount: 8, isVoiceEnabled: true });
        const started = await api.post(`/interviews/${create.data.session.id}/start`);
        if (!alive) return;
        setSession(started.data.session); setQuestion(started.data.currentQuestion); setMeta(started.data);
        const interviewer = type === "behavioral" ? "behavioral" : "technical";
        setActiveInterviewer(interviewer); setPhase("speaking");
        const intro = `Welcome. I’m ${INTERVIEWERS[interviewer].name}. We’ll keep this practical and conversational. ${started.data.currentQuestion.questionText}`;
        addEntry({ speaker: interviewer, label: INTERVIEWERS[interviewer].name, text: intro }); speak(intro);
      } catch { if (alive) setError("The interview room could not be prepared. Check that the local API and PostgreSQL services are running."); }
    })();
    return () => { alive = false; };
  }, [addEntry, speak, type]);

  useEffect(() => {
    if (!socket || !session?.id) return;
    socket.emit("interview.join", session.id);
    const onPartial = ({ transcript }) => { if (transcript?.status === "final") return; };
    socket.on("interview.transcript_partial", onPartial);
    return () => socket.off("interview.transcript_partial", onPartial);
  }, [socket, session?.id]);

  const interviewer = INTERVIEWERS[activeInterviewer];
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const coding = question?.questionType === "coding" || type === "coding";

  return <div className="min-h-[calc(100vh-6rem)] -m-4 lg:-m-6 bg-[#07111f] text-slate-100 p-4 lg:p-6">
    <div className="mx-auto max-w-[1600px]">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950"><BrainCircuit size={22}/></div><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-cyan-300">Interview Intelligence</p><h1 className="text-lg font-semibold">Live interview room</h1></div></div>
        <div className="flex items-center gap-2 text-xs"><span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-slate-300"><Clock3 className="mr-1 inline h-3.5 w-3.5"/>{time}</span><span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2">Question {Math.min(meta.questionIndex + 1, meta.totalQuestions || 1)} / {meta.totalQuestions || "—"}</span><Button variant="danger" size="sm" onClick={finish}><Square className="h-3.5 w-3.5"/> End</Button></div>
      </header>
      {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
      <main className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="rounded-2xl border border-slate-800 bg-[#0b1728] p-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Your interview panel</p>
          {Object.entries(INTERVIEWERS).map(([key, person]) => <motion.div key={key} animate={{ opacity: activeInterviewer === key ? 1 : .48, scale: activeInterviewer === key ? 1 : .98 }} className={`mb-3 rounded-xl border p-3 ${activeInterviewer === key ? "border-cyan-400/45 bg-cyan-400/5" : "border-slate-800"}`}><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${person.accent} text-xs font-bold text-white`}>{person.initials}</div><div><p className="text-sm font-semibold">{person.name}</p><p className="text-xs text-slate-400">{person.role}</p></div>{activeInterviewer === key && <Volume2 className="ml-auto h-4 w-4 text-cyan-300"/>}</div><p className="mt-3 text-[11px] text-slate-500">{person.topics}</p></motion.div>)}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400"><ShieldCheck className="mb-2 h-4 w-4 text-emerald-400"/><p className="font-medium text-slate-300">Privacy first</p><p className="mt-1 leading-relaxed">Camera observations stay on this device unless you explicitly choose recording. No emotion, deception, or hiring inference.</p></div>
        </aside>
        <section className="min-w-0 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.13),transparent_38%),#0b1728] p-5 lg:p-7">
            <div className="mb-5 flex items-center justify-between"><Badge variant="primary">{question?.topic || "Preparing"}</Badge><span className="text-xs capitalize text-slate-400">{question?.difficulty || "medium"} · {phase.replace("_", " ")}</span></div>
            <AnimatePresence mode="wait"><motion.div key={question?.id || "loading"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><p className="text-[11px] font-bold uppercase tracking-[.16em] text-cyan-300">{interviewer.name} is asking</p><h2 className="mt-3 max-w-4xl text-xl font-medium leading-relaxed text-white lg:text-2xl">{question?.questionText || "Preparing your tailored question pool…"}</h2></motion.div></AnimatePresence>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400"><span className={`h-2 w-2 rounded-full ${phase === "speaking" ? "animate-pulse bg-cyan-300" : "bg-slate-600"}`}/>{phase === "speaking" ? "Speaking — begin talking anytime to interrupt" : phase === "evaluating" ? "Evaluating your answer securely" : phase === "listening" ? "Listening live" : "Ready when you are"}</div>
          </div>
          {coding && <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1728]"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><span className="flex items-center gap-2 text-sm font-medium"><Code2 className="h-4 w-4 text-cyan-300"/> Coding workspace</span><select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"><option value="python">Python</option><option value="javascript">JavaScript</option><option value="cpp">C++</option><option value="java">Java</option></select></div><Editor height="310px" language={language === "cpp" ? "cpp" : language} theme="vs-dark" value={code} onChange={(value) => setCode(value || "")} options={{ minimap: { enabled: false }, fontSize: 13 }}/></div>}
          <div className="rounded-2xl border border-slate-800 bg-[#0b1728] p-4"><textarea data-interview-draft value={draft} onChange={(e) => setDraft(e.target.value)} disabled={paused || phase === "evaluating"} placeholder={mic ? "Live transcript appears here…" : "Type an answer, or use the microphone. Explain your thinking, trade-offs, and edge cases."} className="min-h-[125px] w-full resize-none bg-transparent text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-600"/><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3"><span className="text-xs text-slate-500">{followUp ? "Follow-up response" : "Answer auto-saves as transcript"}</span><Button variant="primary" size="sm" disabled={!draft.trim() || phase === "evaluating"} onClick={followUp ? submitFollowUp : () => submitAnswer()}>{phase === "evaluating" ? "Thinking…" : <><Send className="h-3.5 w-3.5"/> Submit answer</>}</Button></div></div>
        </section>
        <aside className="flex min-h-[500px] flex-col rounded-2xl border border-slate-800 bg-[#0b1728] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Session transcript</p><span className="text-[11px] text-emerald-400">Saved</span></div><div className="flex-1 space-y-3 overflow-y-auto pr-1">{entries.map((entry) => <div key={entry.id} className={`rounded-xl p-3 text-xs ${entry.speaker === "candidate" ? "bg-slate-800/80" : "border border-cyan-400/10 bg-cyan-400/5"}`}><div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-400"><span>{entry.label}</span><span>{clock(entry.timestamp)}</span></div><p className="leading-relaxed text-slate-200">{entry.text}</p></div>)}{mic && <div className="rounded-xl border border-dashed border-cyan-400/30 p-3 text-xs text-cyan-200">Live: {draft || "Listening…"}</div>}<div ref={entriesEndRef}/></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${camera ? "block" : "hidden"}`}/>{!camera && <div className="flex aspect-video items-center justify-center text-xs text-slate-600"><VideoOff className="mr-2 h-4 w-4"/>{cameraStatus}</div>}</div></aside>
      </main>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b1728] px-4 py-3"><div className="flex gap-2"><button onClick={mic ? stopListening : startListening} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium ${mic ? "bg-rose-500 text-white" : "bg-cyan-400 text-slate-950"}`}>{mic ? <MicOff size={16}/> : <Mic size={16}/>}{mic ? "Stop listening" : "Start listening"}</button><button onClick={toggleCamera} className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-300">{camera ? <Video size={16}/> : <Camera size={16}/>}{camera ? "Camera on" : "Camera"}</button><button onClick={() => { setPaused(!paused); if (!paused) { stopListening(); window.speechSynthesis?.pause(); } else window.speechSynthesis?.resume(); }} className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-300">{paused ? <Play size={16}/> : <Pause size={16}/>}{paused ? "Resume" : "Pause"}</button></div><div className="flex items-center gap-2 text-xs text-slate-500"><Sparkles className="h-3.5 w-3.5 text-cyan-300"/> Server-controlled session <span className="mx-1 text-slate-700">·</span>{recognitionSupported ? "Live STT ready" : <><WifiOff className="h-3.5 w-3.5"/> Text fallback</>}</div></footer>
    </div>
    {report && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4"><motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0b1728] p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Interview complete</p><div className="mt-2 flex items-end gap-3"><span className="text-5xl font-semibold">{Math.round(report.overallScore || 0)}</span><span className="mb-2 text-slate-400">/ 100 overall</span></div><div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">{[["Technical",report.technicalScore],["Problem solving",report.problemSolvingScore],["Communication",report.communicationScore]].map(([label, score]) => <div key={label} className="rounded-xl bg-slate-900 p-3"><strong className="block text-lg text-cyan-200">{Math.round(score || 0)}</strong>{label}</div>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><Insight title="Strengths" items={report.strengths}/><Insight title="Recommended practice" items={report.recommendations || report.weaknesses}/></div><Button variant="primary" className="mt-6 w-full" onClick={() => navigate("/dashboard")}>Return to dashboard</Button></motion.div></div>}
  </div>;
}

function Insight({ title, items = [] }) { return <div className="rounded-xl border border-slate-800 p-4"><h3 className="mb-2 text-sm font-medium text-white">{title}</h3><ul className="space-y-2 text-xs leading-relaxed text-slate-400">{items.slice(0, 4).map((item, index) => <li key={index} className="flex gap-2"><CheckCircle2 className="mt-.5 h-3.5 w-3.5 shrink-0 text-cyan-300"/>{item}</li>)}</ul></div>; }
