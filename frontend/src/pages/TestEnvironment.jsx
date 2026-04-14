import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Editor from "@monaco-editor/react";
import useProctoring from "../hooks/useProctoring";
import { ThemeContext } from "../context/ThemeContext";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Timer, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send, Upload, Monitor, FileText } from "lucide-react";

export default function TestEnvironment() {
  const { id: assessmentId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext);

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0); // 0 = Info, 1 = Content
  const [codingIndex, setCodingIndex] = useState(0); // For Paginated Coding Tests
  const [codingCodes, setCodingCodes] = useState({}); // problemId -> code
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);

  // Initialize Proctoring (Disabled for Document Submissions)
  const { enterFullScreen } = useProctoring(attempt?._id, assessment?.settings, assessment?.type === 'DOCUMENT');

  const fetchAttempt = useCallback(async () => {
    try {
      const res = await api.post(`/assessments/${assessmentId}/start`);
      setAttempt(res.data);
      
      const aRes = await api.get(`/assessments/admin/all`); 
      const found = aRes.data.find(a => a._id === assessmentId);
      setAssessment(found);

      const startTime = new Date(res.data.startTime);
      const durationMs = found.duration * 60 * 1000;
      const elapsed = Date.now() - startTime.getTime();
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setTimeRemaining(remaining);

    } catch (err) {
      console.error("Test Initialization Error:", err);
      navigate("/assessments");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, navigate]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  useEffect(() => {
    if (timeRemaining <= 0 || !attempt) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, attempt]);

  const handleAutoSubmit = useCallback(() => {
    if (!isSubmitting) submitTest();
  }, [isSubmitting]);

  const submitTest = async (external = false) => {
    setIsSubmitting(true);
    try {
      if (assessment.type === 'DOCUMENT' && file) {
          const formData = new FormData();
          formData.append("file", file);
          await api.post(`/assessments/attempt/${attempt._id}/upload`, formData);
      } else {
          await api.post(`/assessments/attempt/${attempt._id}/submit`, { isExternalSubmitted: external });
      }
      
      document.exitFullscreen().catch(() => {});
      navigate("/assessments");
    } catch (err) {
      console.error("Submission Error:", err);
      alert("Submission failed. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !assessment) return <div className="flex h-screen items-center justify-center font-mono text-gray-500">SYNCHRONIZING SECURE SESSION...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-accent-green/30">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 p-4 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded bg-accent-green/10 px-2 py-1 text-[10px] font-black text-accent-green uppercase">Secure Sandbox</span>
            <h1 className="text-sm font-bold truncate max-w-[200px]">{assessment.title}</h1>
            <Badge className="bg-white/5 text-gray-400 border-white/10 uppercase text-[9px]">{assessment.type}</Badge>
          </div>

          <div className={`flex items-center gap-3 rounded-xl px-4 py-2 font-mono text-xl font-black ${timeRemaining < 60 ? 'animate-pulse text-red-500' : 'text-accent-green'}`}>
            <Timer className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>

          <Button variant="outline" size="sm" onClick={() => submitTest()} disabled={isSubmitting} className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white">
            FORCE FINISH
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {currentSection === 0 ? (
            <motion.div key="intro" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <Card className="max-w-2xl mx-auto p-10 bg-gray-900/40 border-white/5">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green">
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Secure Protocol</h2>
                  <p className="text-gray-500">Proctoring environment initialized for {assessment.type} session.</p>
                </div>

                <div className="space-y-4 mb-8">
                  {assessment.type !== 'DOCUMENT' ? (
                    <>
                      <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <p className="text-sm">Tab switching and copy-pasting are strictly blocked.</p>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                        <div className="h-2 w-2 rounded-full bg-accent-green" />
                        <p className="text-sm">Session will auto-terminate if violations exceed limits.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                        <div className="h-2 w-2 rounded-full bg-accent-green" />
                        <p className="text-sm">Document submission mode: Proctoring alerts are relaxed.</p>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                        <div className="h-2 w-2 rounded-full bg-accent-green" />
                        <p className="text-sm">Ensure your file is ready for upload before commencing.</p>
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={() => { enterFullScreen(); setCurrentSection(1); }} className="w-full h-16 text-lg font-black bg-accent-green text-gray-950 hover:bg-green-400">
                  I AGREE & COMMENCE
                </Button>
              </Card>
            </motion.div>
          ) : assessment.type === 'MCQ' ? (
            /* SECURE GOOGLE FORM IFRAME */
            <motion.div key="mcq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                <div className="rounded-3xl border border-white/5 overflow-hidden bg-white/5 h-[700px] relative">
                    <iframe 
                        src={assessment.externalUrl} 
                        className="w-full h-full"
                        title="Google Form"
                    />
                </div>
                <Card className="p-6 bg-accent-green/5 border-accent-green/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white">Finished with the form?</h3>
                            <p className="text-xs text-gray-500">Please ensure you have clicked "Submit" inside the Google Form before finishing here.</p>
                        </div>
                        <Button onClick={() => submitTest(true)} className="bg-accent-green text-gray-950 hover:bg-green-400 font-black px-8">MARK AS FINISHED</Button>
                    </div>
                </Card>
            </motion.div>
          ) : assessment.type === 'DOCUMENT' ? (
            /* DOCUMENT UPLOAD ZONE */
            <motion.div key="doc" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl mx-auto">
                <Card className="p-10 border-white/5 bg-gray-900/40 text-center">
                    <FileText className="h-16 w-16 text-accent-green mx-auto mb-6 opacity-40" />
                    <h2 className="text-2xl font-black mb-2 uppercase">Submit Documentation</h2>
                    <p className="text-xs text-gray-500 mb-10 font-mono italic">Upload your finalized PDF or Report file.</p>
                    
                    <div className={`p-10 border-2 border-dashed rounded-3xl transition-all ${file ? 'border-accent-green bg-accent-green/5' : 'border-white/10 hover:border-white/20'}`}>
                        <input 
                            type="file" 
                            id="doc-upload"
                            className="hidden" 
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <label htmlFor="doc-upload" className="cursor-pointer">
                            {file ? (
                                <div className="space-y-4">
                                    <CheckCircle className="h-10 w-10 text-accent-green mx-auto" />
                                    <div>
                                        <div className="font-bold text-white truncate max-w-xs">{file.name}</div>
                                        <div className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-[9px] h-6">Change File</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Upload className="h-10 w-10 text-gray-700 mx-auto" />
                                    <div className="font-bold text-gray-400 uppercase text-xs tracking-widest">Click to select file</div>
                                </div>
                            )}
                        </label>
                    </div>

                    <Button 
                        disabled={!file || isSubmitting}
                        onClick={() => submitTest()}
                        className="w-full mt-10 h-14 bg-white text-black font-black uppercase text-sm shadow-xl"
                    >
                        {isSubmitting ? "Uploading..." : "Submit File & End Session"}
                    </Button>
                </Card>
            </motion.div>
          ) : (
            /* PAGINATED CODING EXAM */
            <motion.div key={`coding-${codingIndex}`} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Problem Description */}
                    <div className="h-[600px] overflow-y-auto rounded-3xl bg-white/[0.02] p-8 border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">{assessment.problems[codingIndex]?.title}</h2>
                            <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30">
                                {assessment.problems[codingIndex]?.difficulty}
                            </Badge>
                        </div>
                        <div className="prose prose-invert text-gray-400">
                            <p className="whitespace-pre-wrap">{assessment.problems[codingIndex]?.description}</p>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="h-[600px] overflow-hidden rounded-3xl border border-white/5 bg-gray-950">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme={isDark ? "vs-dark" : "light"}
                            value={codingCodes[assessment.problems[codingIndex]?._id] || assessment.problems[codingIndex]?.starterCode?.python || ""}
                            onChange={(val) => setCodingCodes(prev => ({ ...prev, [assessment.problems[codingIndex]?._id]: val }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 20 },
                                contextmenu: false,
                                quickSuggestions: false 
                            }}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <Button 
                        variant="ghost" 
                        disabled={codingIndex === 0} 
                        onClick={() => setCodingIndex(prev => prev - 1)}
                        className="gap-2 text-gray-500"
                    >
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    
                    <div className="flex gap-4 items-center">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Problem {codingIndex + 1} of {assessment.problems.length}</span>
                        {codingIndex === assessment.problems.length - 1 ? (
                            <Button onClick={() => submitTest()} disabled={isSubmitting} className="gap-2 bg-accent-green text-gray-950 font-black px-8">
                                <Send className="h-4 w-4" /> FINISH TEST
                            </Button>
                        ) : (
                            <Button onClick={() => setCodingIndex(prev => prev + 1)} className="gap-2 bg-white/5 text-white hover:bg-white/10">
                                Next Problem <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Security Persistence Layer Indicator */}
      <div className="fixed bottom-0 left-0 h-1 bg-accent-green transition-all" style={{ width: `${((codingIndex + 1) / (assessment.problems?.length || 1)) * 100}%` }} />
    </div>
  );
}

