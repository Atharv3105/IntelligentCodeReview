import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import SubmissionCard from "../components/SubmissionCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function MySubmissions() {
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/submissions/my")
      .then((res) => {
        setSubs(res.data);
        setError("");
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load submissions.");
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: subs.length,
    completed: subs.filter((s) => s.status?.toLowerCase() === "completed").length,
    avgGrade:
      subs.length > 0
        ? (subs.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0) / subs.length).toFixed(1)
        : 0
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-8">
          <h1 className="text-hero">My Submissions</h1>
          <p className="mt-2 text-gray-400">Review your submission history and monitor improvement trends.</p>
        </div>

        {!loading && !error && subs.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center"><p className="text-sm text-gray-400">Total</p><p className="mt-1 text-2xl font-bold gradient-text">{stats.total}</p></Card>
            <Card className="text-center"><p className="text-sm text-gray-400">Completed</p><p className="mt-1 text-2xl font-bold gradient-text">{stats.completed}</p></Card>
            <Card className="text-center"><p className="text-sm text-gray-400">Avg Grade</p><p className="mt-1 text-2xl font-bold gradient-text">{stats.avgGrade}%</p></Card>
          </div>
        )}

        {loading && <div className="py-16 text-center text-gray-400">Loading submissions...</div>}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/45 bg-red-500/15 p-4 text-sm text-red-300">{error}</div>
        )}

        {!loading && !error && subs.length === 0 && (
          <Card className="py-14 text-center">
            <h3 className="text-xl font-semibold text-gray-200">No submissions yet</h3>
            <p className="mx-auto mt-2 max-w-md text-gray-400">Start solving problems to build your submission history.</p>
            <div className="mt-5">
              <Button onClick={() => (window.location.href = "/problems")}>Go to Problems</Button>
            </div>
          </Card>
        )}

        {!loading && !error && subs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {subs
                .slice()
                .reverse()
                .map((submission) => (
                  <motion.div key={submission._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <SubmissionCard submission={submission} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </Layout>
  );
}
