import React, { useState } from "react";
import { Clock, CheckCircle2, ChevronRight, SlidersHorizontal, AlertCircle } from "lucide-react";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export default function MockTestArena() {
  const [activeTest, setActiveTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);

  // Configuration
  const [role, setRole] = useState("Software Engineer");
  const [duration, setDuration] = useState(30);
  const [isAdaptive, setIsAdaptive] = useState(true);

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const testRes = await api.post("/mock-tests", {
        targetRole: role,
        duration: parseInt(duration),
        questionCount: 10,
        isAdaptive,
      });

      const mockTest = testRes.data.mockTest;
      setActiveTest(mockTest);

      const startRes = await api.post(`/mock-tests/${mockTest.id}/start`);
      setAttempt(startRes.data.attempt);
      setQuestions(startRes.data.questions || mockTest.questions || []);
    } catch (err) {
      console.error("Failed to start test:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, selectedOption: optionIndex },
    }));
  };

  const handleSubmitTest = async () => {
    if (!attempt) return;
    setLoading(true);
    try {
      const answersArray = Object.values(answers);
      const res = await api.post(`/mock-tests/attempts/${attempt.id}/submit`, { answers: answersArray });
      setScoreReport(res.data);
    } catch (err) {
      console.error("Failed to submit test:", err);
    } finally {
      setLoading(false);
    }
  };

  if (scoreReport) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="p-8 text-center space-y-6">
          <Badge variant="success" className="uppercase font-bold">
            Test Submitted Successfully
          </Badge>

          <div>
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100 block my-2">{scoreReport.percentage}%</span>
            <span className="text-xs font-semibold text-slate-500">
              Earned {scoreReport.score} of {scoreReport.totalPoints} total points
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-left text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">Topic Breakdown</span>
            {Object.entries(scoreReport.topicScores || {}).map(([topic, score]) => (
              <div key={topic} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100">{topic}</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{score}%</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              setScoreReport(null);
              setActiveTest(null);
              setAttempt(null);
            }}
          >
            Take Another Test
          </Button>
        </Card>
      </div>
    );
  }

  if (attempt && questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Test Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase">Timed Assessment</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Question {currentIndex + 1} of {questions.length}
            </h2>
          </div>

          <Button variant="danger" size="sm" onClick={handleSubmitTest} loading={loading}>
            Submit Test
          </Button>
        </div>

        {/* Current Question */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="primary">{q.topic || "General"}</Badge>
            <span className="text-xs text-slate-400 uppercase">{q.difficulty}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">{q.questionText}</h3>

          {/* MCQ Options */}
          {q.options && q.options.length > 0 && (
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleOptionSelect(q.id, optIdx)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold transition-all border ${
                    answers[q.id]?.selectedOption === optIdx
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="font-bold mr-3">{String.fromCharCode(65 + optIdx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
          >
            Next Question <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Technical Mock Tests</h1>
        <p className="text-xs text-slate-500 mt-1">Configure timed, distraction-free technical exams with topic weighting.</p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Target Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="Software Engineer">Software Engineer</option>
            <option value="Backend Engineer">Backend Engineer</option>
            <option value="Full Stack Engineer">Full Stack Engineer</option>
            <option value="AI Engineer">AI Engineer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Exam Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="15">15 Minutes (Quick Test)</option>
            <option value="30">30 Minutes (Standard)</option>
            <option value="60">60 Minutes (Full Exam)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="adaptive-toggle"
            checked={isAdaptive}
            onChange={(e) => setIsAdaptive(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="adaptive-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            Enable Adaptive Difficulty (adjusts question difficulty dynamically based on accuracy)
          </label>
        </div>

        <Button variant="primary" className="w-full" onClick={handleStartTest} loading={loading}>
          Start Mock Assessment <ChevronRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
}
