import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { examAPI, rosterAPI } from "../services/examApi";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

// ── Exam type options ──────────────────────────────────────────────────────
const EXAM_TYPES     = ["CA1", "CA2", "Quiz", "Mock", "Practice"];
const YEARS          = ["FY", "SY", "TY", "Final Year"];
const DIVISIONS      = ["A", "B", "C", "D"];
const BRANCHES       = ["BEIT", "CS", "AIDS", "Mechanical", "Civil", "Electronics"];
const STATUS_COLORS  = {
  draft:     "bg-gray-500/15 text-gray-400 border-gray-500/30",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  live:      "bg-green-500/15 text-green-400 border-green-500/30",
  ended:     "bg-purple-500/15 text-purple-400 border-purple-500/30"
};
const GRADE_COLORS = {
  "O":"text-emerald-400","A+":"text-green-400","A":"text-teal-400",
  "B+":"text-blue-400","B":"text-indigo-400","C":"text-yellow-400","F":"text-red-400"
};
const TABS = ["Overview","Exams","Create Exam","Students","Results","Problem Bank"];

// ── Helper: download blob as file ──────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════╗
//  SUB-COMPONENTS                                                           ║
// ══════════════════════════════════════════════════════════════════════════╝

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ exams }) {
  const live  = exams.filter((e) => e.status === "live").length;
  const total = exams.length;
  const participants = exams.reduce((s, e) => s + (e.participantCount || 0), 0);

  const stats = [
    { label: "Total Exams",  value: total,        color: "from-indigo-500 to-indigo-300" },
    { label: "Live Now",     value: live,          color: "from-green-500 to-green-300"  },
    { label: "Participants", value: participants,   color: "from-teal-500 to-teal-300"   }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} hover>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-100">{s.value}</p>
            <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${s.color}`} />
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-200">Recent Exams</h3>
        {exams.slice(0, 5).map((e) => (
          <div key={e._id} className="flex items-center justify-between border-t border-gray-700/30 py-2.5 text-sm first:border-0">
            <span className="text-gray-300">{e.title}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[e.status]}`}>
              {e.status}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Exams Tab ─────────────────────────────────────────────────────────────
function ExamsTab({ exams, onRefresh, onViewResults, onExportPDF }) {
  const handlePublish = async (exam, nextStatus) => {
    try { await examAPI.publish(exam._id, nextStatus); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || "Failed"); }
  };
  const handleDelete = async (exam) => {
    if (!confirm(`Delete "${exam.title}"?`)) return;
    try { await examAPI.remove(exam._id); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || "Failed to delete"); }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-3 font-medium">Exam</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Students</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/30">
          {exams.map((e) => (
            <tr key={e._id} className="text-gray-300 hover:bg-gray-800/30 transition-colors">
              <td className="py-3 pr-4 font-medium text-gray-100">{e.title}</td>
              <td className="py-3 pr-4">
                <span className="rounded-full bg-gray-700/40 px-2 py-0.5 text-xs">{e.type}</span>
              </td>
              <td className="py-3 pr-4">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[e.status]}`}>
                  {e.status}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {e.scheduledStart ? new Date(e.scheduledStart).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="py-3 pr-4">{e.participantCount || 0}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1.5">
                  {e.status === "draft"     && <button onClick={() => handlePublish(e, "scheduled")} className="rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/25">Schedule</button>}
                  {e.status === "scheduled" && <button onClick={() => handlePublish(e, "live")}      className="rounded bg-green-500/15 px-2 py-1 text-xs text-green-400 hover:bg-green-500/25">Go Live</button>}
                  {e.status === "live"      && <button onClick={() => handlePublish(e, "ended")}     className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-400 hover:bg-red-500/25">End</button>}
                  {e.status !== "draft"     && <button onClick={() => onViewResults(e._id)}           className="rounded bg-indigo-500/15 px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/25">Results</button>}
                  {e.status !== "draft"     && <button onClick={() => onExportPDF(e._id, e.title)}    className="rounded bg-purple-500/15 px-2 py-1 text-xs text-purple-400 hover:bg-purple-500/25">PDF</button>}
                  {e.status !== "live"      && <button onClick={() => handleDelete(e)}                className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-500 hover:bg-red-500/20">Delete</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {exams.length === 0 && <div className="py-12 text-center text-gray-600">No exams yet. Create one from the "Create Exam" tab.</div>}
    </div>
  );
}

// ── Create Exam Tab (multi-step form) ─────────────────────────────────────
function CreateExamTab({ onCreated }) {
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [allProblems, setAllProblems] = useState([]);
  const [form, setForm] = useState({
    title: "", type: "CA1", subject: "Python Programming", description: "",
    durationMinutes: 90, totalMarks: 30, passingMarks: 18,
    targetYear: "", targetDivision: [], targetBranch: "",
    problems: [],    // [{problemId, marks}]
    scheduledStart: "", scheduledEnd: "",
    shuffleProblems: true, instructions: "", resultsReleased: true
  });

  useEffect(() => {
    api.get("/problems").then((r) => setAllProblems(r.data?.problems || r.data || [])).catch(() => {});
  }, []);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const toggleDiv = (div) => update("targetDivision",
    form.targetDivision.includes(div)
      ? form.targetDivision.filter((d) => d !== div)
      : [...form.targetDivision, div]
  );
  const addProblem = (p) => {
    if (!form.problems.find((x) => x.problemId === p._id))
      update("problems", [...form.problems, { problemId: p._id, marks: p.maxMarks || 10, title: p.title }]);
  };
  const removeProblem = (id) => update("problems", form.problems.filter((p) => p.problemId !== id));

  const handleCreate = async () => {
    setSaving(true);
    try {
      await examAPI.create({
        ...form,
        problems: form.problems.map(({ problemId, marks }) => ({ problemId, marks })),
        totalMarks: form.problems.reduce((s, p) => s + (p.marks || 0), 0)
      });
      onCreated();
      setForm({ title:"",type:"CA1",subject:"Python Programming",description:"",durationMinutes:90,totalMarks:30,passingMarks:18,targetYear:"",targetDivision:[],targetBranch:"",problems:[],scheduledStart:"",scheduledEnd:"",shuffleProblems:true,instructions:"",resultsReleased:true });
      setStep(1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create exam");
    } finally { setSaving(false); }
  };

  const steps = ["Basics", "Audience", "Problems", "Schedule"];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicators */}
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i+1)} className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${step === i+1 ? "bg-accent-green text-gray-950" : step > i+1 ? "bg-accent-green/20 text-accent-green" : "bg-gray-800 text-gray-500"}`}>
            {i+1}. {s}
          </button>
        ))}
      </div>

      <Card>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <Input label="Exam Title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. CA-1 — Python Fundamentals" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Type</label>
                  <select value={form.type} onChange={(e) => update("type", e.target.value)} className="input-base w-full">
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="Duration (min)" type="number" value={form.durationMinutes} onChange={(e) => update("durationMinutes", +e.target.value)} />
              </div>
              <Input label="Instructions" value={form.instructions} onChange={(e) => update("instructions", e.target.value)} placeholder="Exam rules and instructions..." />
              <div className="flex items-center justify-end gap-3">
                <Button variant="primary" onClick={() => setStep(2)}>Next: Audience →</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Target Year (optional)</label>
                  <select value={form.targetYear} onChange={(e) => update("targetYear", e.target.value)} className="input-base w-full">
                    <option value="">All Years</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Branch (optional)</label>
                  <select value={form.targetBranch} onChange={(e) => update("targetBranch", e.target.value)} className="input-base w-full">
                    <option value="">All Branches</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-gray-400">Divisions</label>
                <div className="flex gap-2">
                  {DIVISIONS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDiv(d)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${form.targetDivision.includes(d) ? "bg-accent-green/20 text-accent-green border border-accent-green/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-600">Leave blank for all divisions</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>Next: Problems →</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-700/40 bg-gray-800/30 p-2">
                <p className="mb-2 text-xs text-gray-500">Problem Bank — click to add</p>
                {allProblems.map((p) => (
                  <button key={p._id} type="button" onClick={() => addProblem(p)}
                    disabled={!!form.problems.find((x) => x.problemId === p._id)}
                    className="mb-1 flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-sm hover:bg-gray-700/40 disabled:opacity-40">
                    <span>{p.title}</span>
                    <span className={`text-xs ${p.difficulty === "Easy" ? "text-green-400" : p.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{p.difficulty}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Selected ({form.problems.length})</p>
                {form.problems.map((p) => (
                  <div key={p.problemId} className="flex items-center gap-3 rounded-lg border border-gray-700/30 bg-gray-800/30 px-3 py-2">
                    <span className="flex-1 text-sm text-gray-200">{p.title}</span>
                    <input type="number" value={p.marks} min={1} max={100}
                      onChange={(e) => update("problems", form.problems.map((x) => x.problemId === p.problemId ? {...x, marks: +e.target.value} : x))}
                      className="w-16 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-center text-xs text-gray-200" />
                    <span className="text-xs text-gray-500">marks</span>
                    <button onClick={() => removeProblem(p.problemId)} className="text-red-500 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {form.problems.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No problems added yet.</p>}
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="shuffle" checked={form.shuffleProblems}
                  onChange={(e) => update("shuffleProblems", e.target.checked)} className="rounded" />
                <label htmlFor="shuffle" className="text-sm text-gray-300">Shuffle problem order per student</label>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                <Button variant="primary" onClick={() => setStep(4)}>Next: Schedule →</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date & Time" type="datetime-local" value={form.scheduledStart} onChange={(e) => update("scheduledStart", e.target.value)} />
                <Input label="End Date & Time"   type="datetime-local" value={form.scheduledEnd}   onChange={(e) => update("scheduledEnd",   e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Passing Marks" type="number" value={form.passingMarks} onChange={(e) => update("passingMarks", +e.target.value)} />
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="results" checked={form.resultsReleased}
                    onChange={(e) => update("resultsReleased", e.target.checked)} className="rounded" />
                  <label htmlFor="results" className="text-sm text-gray-300">Show results instantly</label>
                </div>
              </div>
              <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 p-3 text-sm text-gray-400">
                <strong className="text-gray-200">Summary:</strong> {form.title || "Untitled"} • {form.type} •
                {form.problems.length} problems • {form.problems.reduce((s,p)=>s+p.marks,0)} total marks •
                {form.durationMinutes} min
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
                <Button variant="primary" onClick={handleCreate} disabled={saving || !form.title || form.problems.length === 0}>
                  {saving ? "Creating..." : "✓ Create Exam"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

// ── Results Tab ───────────────────────────────────────────────────────────
function ResultsTab({ exams, onExportPDF }) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadResults = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await examAPI.getResults(examId);
      setResults(res.data);
    } catch { setResults(null); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={selectedExamId} onChange={(e) => { setSelectedExamId(e.target.value); loadResults(e.target.value); }}
          className="input-base flex-1">
          <option value="">Select an exam to view results</option>
          {exams.filter((e) => e.status !== "draft").map((e) => (
            <option key={e._id} value={e._id}>{e.title}</option>
          ))}
        </select>
        {selectedExamId && <button onClick={() => onExportPDF(selectedExamId, "")} className="btn-secondary text-sm">📄 Export PDF</button>}
      </div>

      {loading && <div className="py-12 text-center text-gray-500">Loading results...</div>}

      {results && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total",     value: results.stats.total     },
              { label: "Submitted", value: results.stats.submitted },
              { label: "Passed",    value: results.stats.passed    },
              { label: "Avg Score", value: results.stats.average   },
              { label: "Flagged",   value: results.stats.flagged   }
            ].map((s) => (
              <Card key={s.label} className="text-center py-3">
                <p className="text-2xl font-bold text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">PRN</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Div</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Grade</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {results.attempts.map((a) => (
                  <tr key={a._id} className={`transition-colors ${a.flagged ? "bg-amber-500/5" : "hover:bg-gray-800/30"}`}>
                    <td className="py-2.5 pr-3 font-bold text-gray-400">#{a.rank || "—"}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-gray-500">{a.studentId?.prn || "—"}</td>
                    <td className="py-2.5 pr-3 font-medium text-gray-200">{a.studentId?.name || "—"}</td>
                    <td className="py-2.5 pr-3 text-gray-400">{a.studentId?.division || "—"}</td>
                    <td className="py-2.5 pr-3 font-bold text-gray-100">{a.totalScore}/{results.exam.totalMarks}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`font-bold ${GRADE_COLORS[a.grade] || "text-gray-400"}`}>{a.grade || "—"}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs capitalize text-gray-500">{a.status}</td>
                    <td className="py-2.5">{a.flagged ? <span className="text-amber-400">⚠ Flagged</span> : <span className="text-gray-600">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────
function StudentsTab() {
  const [rosters, setRosters] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [batchName, setBatchName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { rosterAPI.list().then((r) => setRosters(r.data)).catch(() => {}); }, []);

  const handleImport = async () => {
    if (!batchName || !csvText) return alert("Please provide batch name and CSV data");
    const lines = csvText.trim().split("\n").slice(1); // skip header
    const students = lines.map((l) => {
      const [prn, name, email] = l.split(",").map((s) => s.trim());
      return { prn, name, email };
    }).filter((s) => s.prn);

    setSaving(true);
    try {
      await rosterAPI.create({ batchName, students });
      const res = await rosterAPI.list();
      setRosters(res.data);
      setShowImport(false);
      setCsvText(""); setBatchName("");
    } catch { alert("Import failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200">Class Rosters</h3>
        <button onClick={() => setShowImport(!showImport)} className="btn-secondary text-sm">
          {showImport ? "Cancel" : "📥 Import Roster"}
        </button>
      </div>

      <AnimatePresence>
        {showImport && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <Card className="space-y-3">
              <p className="text-xs text-gray-500">CSV format: <code>prn,name,email</code> (one student per line)</p>
              <Input label="Batch Name" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="SY-BEIT-A-2024-25" />
              <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={5}
                placeholder={"prn,name,email\n22BEIT001,Riya Sharma,riya@example.com\n22BEIT002,Arjun Patil,arjun@example.com"}
                className="input-base w-full resize-y font-mono text-xs" />
              <Button variant="primary" onClick={handleImport} disabled={saving} className="w-full">
                {saving ? "Importing..." : "Import Students"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {rosters.map((r) => (
        <Card key={r._id}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-200">{r.batchName}</h4>
            <span className="text-xs text-gray-500">{r.students?.length || 0} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="pb-2 text-left font-medium">PRN</th>
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Email</th>
                  <th className="pb-2 text-left font-medium">Linked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/20">
                {(r.students || []).map((s, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-mono">{s.prn}</td>
                    <td className="py-1.5 pr-4 text-gray-300">{s.name}</td>
                    <td className="py-1.5 pr-4 text-gray-500">{s.email || "—"}</td>
                    <td className="py-1.5">{s.userId ? <span className="text-green-400">✓</span> : <span className="text-gray-600">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
      {rosters.length === 0 && !showImport && <div className="py-12 text-center text-gray-600">No rosters yet. Import one above.</div>}
    </div>
  );
}

// ── Problem Bank Tab ──────────────────────────────────────────────────────
function ProblemBankTab() {
  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/problems").then((r) => setProblems(r.data?.problems || r.data || [])).catch(()=>{});
  }, []);

  const filtered = problems.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.concept?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Search problems..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Link to="/problems" className="btn-secondary text-sm whitespace-nowrap">+ Add Problems</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs">
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Concept</th>
              <th className="pb-3 font-medium">Difficulty</th>
              <th className="pb-3 font-medium">Max Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {filtered.map((p) => (
              <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 pr-4 font-medium text-gray-200">{p.title}</td>
                <td className="py-2.5 pr-4 text-gray-400 text-xs">{p.concept}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs font-semibold ${p.difficulty === "Easy" ? "text-green-400" : p.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"}`}>
                    {p.difficulty}
                  </span>
                </td>
                <td className="py-2.5 text-gray-400">{p.maxMarks || 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════╗
//  MAIN TEACHER PANEL                                                        ║
// ══════════════════════════════════════════════════════════════════════════╝
export default function TeacherPanel() {
  const { isTeacher } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("Overview");
  const [exams,     setExams]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  const loadExams = useCallback(async () => {
    try {
      const res = await examAPI.list();
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch { setExams([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  const handleExportPDF = async (examId, title) => {
    try {
      const res = await examAPI.exportPDF(examId);
      downloadBlob(res.data, `${title || examId}_Results.pdf`);
    } catch { alert("PDF export failed"); }
  };

  if (!isTeacher) {
    return (
      <Layout>
        <div className="section-padding flex items-center justify-center">
          <Card className="max-w-sm text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-400">Teacher or Admin access required.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-6">
          <h1 className="text-hero">👨‍🏫 Teacher Panel</h1>
          <p className="mt-1 text-gray-400">Manage exams, students, and CA results for MGM JNEC.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-gray-700/40 bg-gray-800/30 p-1">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab ? "bg-accent-green text-gray-950 shadow-sm" : "text-gray-400 hover:text-gray-200"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}}>
            {activeTab === "Overview"     && <OverviewTab exams={exams} />}
            {activeTab === "Exams"        && <ExamsTab exams={exams} onRefresh={loadExams} onViewResults={() => setActiveTab("Results")} onExportPDF={handleExportPDF} />}
            {activeTab === "Create Exam"  && <CreateExamTab onCreated={() => { loadExams(); setActiveTab("Exams"); }} />}
            {activeTab === "Students"     && <StudentsTab />}
            {activeTab === "Results"      && <ResultsTab exams={exams} onExportPDF={handleExportPDF} />}
            {activeTab === "Problem Bank" && <ProblemBankTab />}
          </motion.div>
        </AnimatePresence>
      </section>
    </Layout>
  );
}
