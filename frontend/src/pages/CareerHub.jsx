import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Bot, GitBranch, Compass, User, Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function CareerHub() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "coach";
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Coach State
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachHistory, setCoachHistory] = useState([]);
  const [coachLoading, setCoachLoading] = useState(false);

  // Resume State
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // GitHub State
  const [githubUsername, setGithubUsername] = useState("");
  const [githubAnalysis, setGithubAnalysis] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);

  // Candidate Memory
  const [memory, setMemory] = useState({ targetRole: "Software Engineer", preferredLanguage: "python", strengths: [], weaknesses: [] });

  // Study Plan
  const [studyPlan, setStudyPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    fetchMemory();
  }, []);

  const fetchMemory = async () => {
    try {
      const res = await api.get("/career/memory");
      if (res.data.memory) setMemory(res.data.memory);
    } catch (err) {
      console.error("Error fetching memory:", err);
    }
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;
    setCoachLoading(true);
    const q = coachQuestion;
    setCoachQuestion("");
    setCoachHistory((prev) => [...prev, { sender: "You", message: q }]);

    try {
      const res = await api.post("/career/coach", { question: q });
      setCoachHistory((prev) => [...prev, { sender: "Career Coach", message: res.data.response }]);
    } catch (err) {
      setCoachHistory((prev) => [...prev, { sender: "Career Coach", message: "Failed to respond. Please try again." }]);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post("/career/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const analyzeRes = await api.post("/career/resume/analyze", {
        resumeId: uploadRes.data.resume.id,
        targetRole: memory.targetRole || "Software Engineer",
      });

      setResumeAnalysis(analyzeRes.data.analysis);
    } catch (err) {
      console.error("Resume analysis failed:", err);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleGitHubAnalyze = async () => {
    if (!githubUsername.trim()) return;
    setGithubLoading(true);
    try {
      const res = await api.post("/career/github/analyze", { githubUsername });
      setGithubAnalysis(res.data.analysis);
    } catch (err) {
      console.error("GitHub analysis failed:", err);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGeneratePlan = async (duration = 7) => {
    setPlanLoading(true);
    try {
      const res = await api.post("/ai/study-plan", { duration, targetRole: memory.targetRole || "Software Engineer" });
      setStudyPlan(res.data.studyPlan);
    } catch (err) {
      console.error("Plan generation failed:", err);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Career & Preparation Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Personalized roadmaps, resume ATS reviews, GitHub profile analysis, and candidate memory.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "coach", label: "Career Coach", icon: Bot },
          { id: "resume", label: "Resume ATS Review", icon: FileText },
          { id: "github", label: "GitHub Profile", icon: GitBranch },
          { id: "plan", label: "Personalized Roadmap", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COACH */}
      {activeTab === "coach" && (
        <Card className="p-6 flex flex-col min-h-[500px]">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Technical Career Mentor</h3>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-2 mb-4">
            {coachHistory.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">
                Ask your coach anything about technical roadmaps, interview preparation strategy, or role expectations!
              </div>
            ) : (
              coachHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl text-xs ${
                    item.sender === "You"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ml-12"
                      : "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50 mr-12"
                  }`}
                >
                  <span className="font-bold block text-[10px] opacity-75 uppercase mb-1">{item.sender}</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{item.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCoachSubmit} className="flex gap-2">
            <input
              type="text"
              value={coachQuestion}
              onChange={(e) => setCoachQuestion(e.target.value)}
              placeholder="Ask about roadmaps, trade-offs, or interview strategy..."
              className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <Button type="submit" variant="primary" loading={coachLoading} disabled={!coachQuestion.trim()}>
              Send
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: RESUME */}
      {activeTab === "resume" && (
        <div className="grid md:grid-cols-12 gap-6">
          <Card className="md:col-span-5 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload Resume</h3>
            <p className="text-xs text-slate-500">Upload PDF, DOCX, or TXT format. Analyzed locally on your PC.</p>

            <label className="flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to select resume file</span>
              <input type="file" onChange={handleResumeUpload} accept=".pdf,.docx,.txt" className="hidden" />
            </label>

            {resumeUploading && <p className="text-xs text-blue-600 text-center">Analyzing resume content...</p>}
          </Card>

          <Card className="md:col-span-7 p-6 min-h-[300px]">
            {resumeAnalysis ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">ATS Score Estimate</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{resumeAnalysis.atsScore}%</span>
                </div>

                <div>
                  <span className="font-bold text-emerald-600 uppercase block mb-1">Strong Sections</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {(resumeAnalysis.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-amber-600 uppercase block mb-1">Missing Expected Skills</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {(resumeAnalysis.missingSkills || []).map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-slate-400">Upload a resume to see ATS score and skill gap recommendations.</div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: GITHUB */}
      {activeTab === "github" && (
        <Card className="p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">GitHub Profile Analyzer</h3>
          <div className="flex gap-2 max-w-lg">
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="Enter GitHub username..."
              className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <Button variant="primary" size="sm" onClick={handleGitHubAnalyze} loading={githubLoading}>
              Analyze
            </Button>
          </div>

          {githubAnalysis && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{githubAnalysis.summary}</p>
              <div>
                <span className="font-bold text-blue-600 uppercase block mb-1">Top Languages</span>
                <div className="flex gap-2">
                  {(githubAnalysis.topLanguages || []).map((l, idx) => (
                    <Badge key={idx} variant="primary">{l}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: PLAN */}
      {activeTab === "plan" && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Personalized Roadmap</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleGeneratePlan(7)} loading={planLoading}>7-Day Plan</Button>
              <Button size="sm" variant="outline" onClick={() => handleGeneratePlan(14)} loading={planLoading}>14-Day Plan</Button>
            </div>
          </div>

          {studyPlan ? (
            <div className="space-y-2">
              {(studyPlan.items || []).map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-600 mr-2">Day {item.dayNumber}:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                    {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
                  </div>
                  <Badge variant="neutral">{item.estimatedTime || 30} mins</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-slate-400">Click above to generate a day-by-day roadmap based on your stored weaknesses.</div>
          )}
        </Card>
      )}
    </div>
  );
}
