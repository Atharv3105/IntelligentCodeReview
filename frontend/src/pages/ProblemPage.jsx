import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { SocketContext } from "../context/SocketContext";
import { ThemeContext } from "../context/ThemeContext";
import api from "../services/api";
import Layout from "../components/Layout";
import SubmissionProgress from "../components/SubmissionProgress";
import GradeCard from "../components/GradeCard";
import CodeDiffView from "../components/CodeDiffView";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const tabs = [
  { id: "description", label: "Description" },
  { id: "hints", label: "Hints" },
  { id: "testcases", label: "Test Cases" }
];

export default function ProblemPage() {
  const { id } = useParams();
  const socket = useContext(SocketContext);
  const { isDark } = useContext(ThemeContext);

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [submissionError, setSubmissionError] = useState("");
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/problems/${id}`).then((res) => {
      setProblem(res.data);
      setCode(res.data.starterCode || "");
    });
  }, [id]);

  const monacoTheme = isDark ? "vs-dark" : "vs-light";

  const complexitySummary = useMemo(() => {
    if (!result) return null;
    return {
      estimated: result?.complexity?.estimatedComplexity || result?.feedback?.time_complexity,
      loops: result?.complexity?.loopCount,
      recursion: result?.complexity?.recursionDetected
    };
  }, [result]);

  useEffect(() => {
    if (!socket) return;

    const onSubmissionUpdate = (data) => {
      setProgress(data.progress || 0);
      setStage(data.stage || "");

      if (data.result) {
        setResult(data.result);
        setActiveSubmissionId(null);
      }

      if (data.error) {
        setSubmissionError(data.error);
        setActiveSubmissionId(null);
      }
    };

    socket.on("submissionUpdate", onSubmissionUpdate);
    return () => socket.off("submissionUpdate", onSubmissionUpdate);
  }, [socket]);

  useEffect(() => {
    if (!activeSubmissionId) return undefined;

    const pollSubmission = async () => {
      try {
        const fallback = await api.get("/submissions/my");
        const sub = (fallback.data || []).find((item) => item?._id === activeSubmissionId) || null;

        if (!sub) {
          setSubmissionError("Submission not found.");
          setActiveSubmissionId(null);
          return;
        }

        const status = (sub?.status || "").toLowerCase();

        if (status === "completed") {
          setProgress(100);
          setStage("COMPLETED");
          if (sub.result) setResult(sub.result);
          setActiveSubmissionId(null);
          return;
        }

        if (status === "failed") {
          setStage("FAILED");
          setSubmissionError(sub.error || "Submission failed.");
          setActiveSubmissionId(null);
          return;
        }

        setStage("QUEUED");
        setProgress((p) => (p < 15 ? 15 : p));
      } catch (err) {
        setSubmissionError(err?.response?.data?.message || "Unable to fetch submission status.");
        setActiveSubmissionId(null);
      }
    };

    pollSubmission();
    pollRef.current = setInterval(pollSubmission, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeSubmissionId]);

  const submit = async () => {
    try {
      setResult(null);
      setProgress(0);
      setStage("QUEUED");
      setSubmissionError("");

      const res = await api.post("/submissions", { problemId: id, code });
      const submissionId = res.data.submissionId;

      if (socket) socket.emit("joinSubmission", submissionId);

      setActiveSubmissionId(submissionId);
    } catch (err) {
      setSubmissionError(err?.response?.data?.message || "Failed to submit code.");
    }
  };

  const getDifficultyColor = (difficulty) => {
    const diff = difficulty?.toLowerCase();
    if (diff === "hard") return "error";
    if (diff === "medium") return "warning";
    return "success";
  };

  if (!problem) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center text-gray-400">Loading problem...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-6">
          <h1 className="text-hero mb-3">{problem.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getDifficultyColor(problem.difficulty)}>{problem.difficulty || "Easy"}</Badge>
            <Badge variant="info">{problem.concept || "General"}</Badge>
            <Badge variant="info">{problem.category || "Algorithms"}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <Card className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      activeTab === tab.id
                        ? "bg-green-400/20 text-accent-green"
                        : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="min-h-[320px]">
              {activeTab === "description" && (
                <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{problem.description}</p>
              )}

              {activeTab === "hints" && (
                <div className="space-y-2">
                  {(problem.hints || []).length ? (
                    (problem.hints || []).map((hint, idx) => (
                      <div key={idx} className="rounded-lg bg-gray-800/50 p-3 text-sm text-gray-300">
                        {hint}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No hints available for this problem yet.</p>
                  )}
                </div>
              )}

              {activeTab === "testcases" && (
                <div className="space-y-3">
                  {(problem.testCases || []).map((testCase, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-3 text-sm">
                      <div className="text-gray-300"><span className="font-semibold text-accent-green">Input:</span> {testCase.input}</div>
                      <div className="mt-1 text-gray-300"><span className="font-semibold text-accent-cyan">Expected:</span> {testCase.expectedOutput}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {submissionError && (
              <div className="rounded-lg border border-red-500/45 bg-red-500/15 p-3 text-sm text-red-300">
                {submissionError}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">AI Review Result</h2>

                <GradeCard grade={result.grade} />

                <Card>
                  <h3 className="mb-2 text-lg font-semibold">Code Explanation</h3>
                  <p className="leading-relaxed text-gray-300">{result.feedback?.explanation || "No explanation available."}</p>
                </Card>

                <Card>
                  <h3 className="mb-3 text-lg font-semibold">Complexity Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-800/50 p-3 text-gray-300">Time: {result.feedback?.time_complexity || complexitySummary?.estimated || "N/A"}</div>
                    <div className="rounded-lg bg-gray-800/50 p-3 text-gray-300">Space: {result.feedback?.space_complexity || "N/A"}</div>
                    <div className="rounded-lg bg-gray-800/50 p-3 text-gray-300">Loops: {complexitySummary?.loops ?? "N/A"}</div>
                    <div className="rounded-lg bg-gray-800/50 p-3 text-gray-300">Recursion: {complexitySummary?.recursion ? "Detected" : "Not Detected"}</div>
                  </div>
                </Card>

                <Card>
                  <h3 className="mb-3 text-lg font-semibold">Recommended Improvements</h3>
                  <ul className="space-y-2">
                    {(result.feedback?.recommended_improvements || ["No recommendations available."]).map((item, idx) => (
                      <li key={idx} className="rounded-lg bg-gray-800/50 p-3 text-sm text-gray-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>

                {result.feedback?.optimized_version && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold">Optimized Version</h3>
                    <CodeDiffView original={code} improved={result.feedback?.optimized_version || ""} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-green-400/15 px-3 py-1 text-sm font-medium text-accent-green">Python 3</span>
              <Button variant="outline" onClick={() => setCode(problem.starterCode || "")}>Reset</Button>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="h-[580px]">
                <Editor
                  height="100%"
                  theme={monacoTheme}
                  defaultLanguage="python"
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineHeight: 22,
                    padding: { top: 16 }
                  }}
                />
              </div>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">{progress > 0 && <SubmissionProgress progress={progress} stage={stage} />}</div>
              <Button onClick={submit} disabled={!code}>Submit Solution</Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
