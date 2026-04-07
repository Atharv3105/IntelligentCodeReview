import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Layout from "../components/Layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

const YEARS     = ["FY", "SY", "TY", "Final Year"];
const DIVISIONS = ["A", "B", "C", "D"];
const BRANCHES  = ["BEIT", "CS", "AIDS", "Mechanical", "Civil", "Electronics", "Other"];

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    prn: "", division: "", year: "", branch: ""
  });
  const [showCollegeFields, setShowCollegeFields] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
        prn:      formData.prn      || undefined,
        division: formData.division || undefined,
        year:     formData.year     || undefined,
        branch:   formData.branch   || undefined
      };

      const response = await api.post("/auth/register", payload);
      setSuccess(response.data.message || "Account created. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Email may already exist.");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
              <p className="mt-2 text-sm text-gray-400">
                Start your Python mastery journey. JNEC students can link their PRN for CA exams.
              </p>
            </div>

            {error   && <div className="mb-4 rounded-lg border border-red-500/45 bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}
            {success && <div className="mb-4 rounded-lg border border-green-500/45 bg-green-500/15 p-3 text-sm text-green-300">{success}</div>}

            <Card className="space-y-4">
              <form onSubmit={register} className="space-y-4">
                {/* ── Core Fields ─────────────────────────────────── */}
                <Input label="Full Name"        type="text"     name="name"            value={formData.name}            onChange={handleChange} placeholder="Jane Doe"             required />
                <Input label="Email"            type="email"    name="email"           value={formData.email}           onChange={handleChange} placeholder="you@example.com"      required />
                <Input label="Password"         type="password" name="password"        value={formData.password}        onChange={handleChange} placeholder="Minimum 6 characters" required />
                <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password"    required />

                {/* ── College / PRN toggle ─────────────────────────── */}
                <button
                  type="button"
                  onClick={() => setShowCollegeFields((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-600 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-accent-green hover:text-accent-green"
                >
                  <span>🎓 MGM JNEC Student? Add your PRN</span>
                  <span className="text-xs">{showCollegeFields ? "▲ Hide" : "▼ Show"}</span>
                </button>

                <AnimatePresence>
                  {showCollegeFields && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 rounded-lg border border-gray-700/40 bg-gray-800/40 p-4">
                        <p className="text-xs text-gray-500">Optional — enables CA exam access & tracking for JNEC students</p>

                        <Input label="PRN / Roll Number" type="text" name="prn" value={formData.prn} onChange={handleChange} placeholder="e.g. 22BEIT001" />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-400">Year</label>
                            <select name="year" value={formData.year} onChange={handleChange}
                              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-accent-green focus:outline-none">
                              <option value="">Select Year</option>
                              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-400">Division</label>
                            <select name="division" value={formData.division} onChange={handleChange}
                              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-accent-green focus:outline-none">
                              <option value="">Select Div</option>
                              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400">Branch</label>
                          <select name="branch" value={formData.branch} onChange={handleChange}
                            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-accent-green focus:outline-none">
                            <option value="">Select Branch</option>
                            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="border-t border-gray-700/40 pt-3 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent-green hover:text-accent-cyan">
                  Sign in
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
