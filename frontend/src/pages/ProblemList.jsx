import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Card } from "../components/ui/Card";
import { DifficultyBadge } from "../components/ui/Badge";

const difficultyOptions = ["All", "Easy", "Medium", "Hard"];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [concept, setConcept] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/problems", { params: { limit: 200 } })
      .then((res) => {
        const payload = res.data;

        if (Array.isArray(payload)) {
          setProblems(payload);
        } else if (Array.isArray(payload.problems)) {
          setProblems(payload.problems);
        } else if (Array.isArray(payload.data)) {
          setProblems(payload.data);
        } else {
          setProblems([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load problems:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const conceptOptions = useMemo(() => {
    const unique = [...new Set(problems.map((p) => p.concept).filter(Boolean))].sort();
    return ["All", ...unique];
  }, [problems]);

  const filteredProblems = useMemo(
    () =>
      problems.filter((problem) => {
        const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase().trim());
        const matchesDifficulty = difficulty === "All" || problem.difficulty === difficulty;
        const matchesConcept = concept === "All" || problem.concept === concept;
        return matchesSearch && matchesDifficulty && matchesConcept;
      }),
    [problems, search, difficulty, concept]
  );

  const counts = useMemo(() => {
    const total = filteredProblems.length;
    const easy = filteredProblems.filter((p) => p.difficulty === "Easy").length;
    const medium = filteredProblems.filter((p) => p.difficulty === "Medium").length;
    const hard = filteredProblems.filter((p) => p.difficulty === "Hard").length;
    return { total, easy, medium, hard };
  }, [filteredProblems]);

  return (
    <Layout>
      <section className="section-padding">
        <div className="mb-8">
          <h1 className="text-hero">Problem Explorer</h1>
          <p className="mt-2 max-w-2xl text-gray-400">Find challenges by difficulty and concept, then submit your best solution for review.</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total", value: counts.total },
            { label: "Easy", value: counts.easy },
            { label: "Medium", value: counts.medium },
            { label: "Hard", value: counts.hard }
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold gradient-text">{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card className="mb-8 p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-100">Filters</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Search</label>
              <input
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-gray-100 outline-none focus:border-green-400"
                placeholder="Search by title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">Difficulty</label>
              <select
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-gray-100 outline-none focus:border-green-400"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All levels" : option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-400">Concept</label>
              <select
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-gray-100 outline-none focus:border-green-400"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
              >
                {conceptOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading problems...</div>
        ) : filteredProblems.length === 0 ? (
          <Card className="py-16 text-center">
            <h3 className="text-xl font-semibold text-gray-200">No matching problems</h3>
            <p className="mt-2 text-gray-400">Try changing your filter combination.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Showing {filteredProblems.length} problem{filteredProblems.length !== 1 ? "s" : ""}</p>

            <AnimatePresence mode="popLayout">
              {filteredProblems.map((problem, idx) => (
                <motion.div key={problem._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <Link to={`/problem/${problem._id}`}>
                    <Card hover className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-sm font-bold text-accent-green">#{idx + 1}</span>
                          <h4 className="truncate text-lg font-semibold text-gray-100">{problem.title}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <DifficultyBadge difficulty={problem.difficulty || "Easy"} />
                          {problem.concept && <span className="rounded-md bg-gray-700/40 px-2 py-1 text-xs text-gray-300">{problem.concept}</span>}
                          {problem.tags?.length > 0 && <span className="text-xs text-gray-400">{problem.tags.slice(0, 2).join(" • ")}</span>}
                        </div>
                      </div>

                      <span className="text-gray-400">View</span>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </Layout>
  );
}
