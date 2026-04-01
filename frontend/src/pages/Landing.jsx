import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = [
  {
    title: "Structured Python Practice",
    description: "Solve problems across arrays, graphs, dynamic programming, and more with curated difficulty levels."
  },
  {
    title: "AI Review Workflow",
    description: "Get explanations, complexity feedback, and practical improvement suggestions after every submission."
  },
  {
    title: "Progress Tracking",
    description: "Monitor your performance history and benchmark your consistency over time."
  },
  {
    title: "Leaderboard Ranking",
    description: "Compete with peers and climb ranks with quality-focused scoring."
  }
];

const stats = [
  { number: "500+", label: "Coding Problems" },
  { number: "100K+", label: "Active Users" },
  { number: "10M+", label: "Solutions Reviewed" },
  { number: "24/7", label: "Feedback Availability" }
];

export default function Landing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Layout>
      <motion.section
        className="section-padding"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-hero mb-4">
            Practice for Interviews with
            <span className="gradient-text"> Intelligent Code Feedback</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            Build strong problem-solving habits through guided practice, AI-assisted reviews, and measurable progress.
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Button variant="primary" size="lg" onClick={() => navigate("/problems")}>Continue Solving</Button>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={() => navigate("/register")}>Create Account</Button>
                <Button variant="secondary" size="lg" onClick={() => navigate("/login")}>Sign In</Button>
              </>
            )}
          </div>

          <Card className="mx-auto max-w-3xl text-left">
            <pre className="overflow-x-auto text-sm text-green-400">
              <code>{`def choose_platform():\n    return "Practice, review, improve, repeat"`}</code>
            </pre>
          </Card>
        </div>
      </motion.section>

      <section className="pb-12">
        <div className="container-custom">
          <div className="mb-8 text-center">
            <h2 className="text-section-title mb-3">Why Teams and Learners Use IntelliCode</h2>
            <p className="mx-auto max-w-2xl text-gray-400">A single workflow from problem solving to actionable review.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} hover className="h-full">
                <h3 className="mb-2 text-lg font-semibold text-gray-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <p className="mb-1 text-2xl font-bold gradient-text">{stat.number}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
