import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { ArrowRight, Eye, EyeOff, User, Mail, Lock, CheckCircle2, Sun, Moon } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

const fields = [
  { label: "Full Name", name: "name", type: "text", icon: User, placeholder: "Jane Doe" },
  { label: "Email", name: "email", type: "email", icon: Mail, placeholder: "you@example.com" },
  { label: "Password", name: "password", type: "password", icon: Lock, placeholder: "Minimum 6 characters" },
  { label: "Confirm Password", name: "confirmPassword", type: "password", icon: Lock, placeholder: "Re-enter password" },
];

export default function Register() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccess(res.data.message || "Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Registration failed."
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans flex flex-col relative"
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Floating Header */}
      <nav className="relative z-20 h-[64px] px-6 flex items-center justify-between border-b" style={{ borderColor: "var(--glass-border)" }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}
          >
            II
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Interview Intelligence
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border cursor-pointer transition-colors"
          style={{
            background: "var(--glass-bg)",
            borderColor: "var(--glass-border)",
            color: "var(--text-secondary)",
          }}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>

      {/* Form Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-[400px]"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
              Create <span className="font-bold">account</span>
            </h1>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
              Start your interview preparation and code review journey
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 rounded-2xl px-4 py-3 text-xs text-rose-500 flex items-center gap-2 border"
                style={{ background: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.25)" }}
              >
                <span>⚠ {error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 rounded-2xl px-4 py-3 text-xs text-emerald-400 flex items-center gap-2 border"
                style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)" }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Card */}
          <div
            className="rounded-3xl p-7 space-y-4 border shadow-xl"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
              backdropFilter: "blur(24px)",
            }}
          >
            <form onSubmit={register} className="space-y-3.5">
              {fields.map((f) => {
                const Icon = f.icon;
                const isPass = f.type === "password";
                return (
                  <div key={f.name}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
                      {f.label}
                    </label>
                    <div
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all"
                      style={{
                        background: "var(--bg-surface-2)",
                        borderColor: "var(--glass-border)",
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      <input
                        type={isPass ? (showPass ? "text" : "password") : f.type}
                        name={f.name}
                        required
                        value={form[f.name]}
                        onChange={handleChange}
                        placeholder={f.placeholder}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        style={{ color: "var(--text-primary)" }}
                      />
                      {isPass && f.name === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="cursor-pointer"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-60 mt-4"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--accent-glow)",
                }}
              >
                <span>{loading ? "Creating account..." : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-500 hover:underline">
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
