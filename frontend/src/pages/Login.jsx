import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sun, Moon } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
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
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-[390px]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light tracking-tight" style={{ color: "var(--text-primary)" }}>
              Welcome <span className="font-bold">back</span>
            </h1>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
              Sign in to continue your interview prep workspace
            </p>
          </div>

          {/* Error */}
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Email Address
                </label>
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all"
                  style={{
                    background: "var(--bg-surface-2)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent border-none outline-none text-xs"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Password
                </label>
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all"
                  style={{
                    background: "var(--bg-surface-2)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none outline-none text-xs"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="cursor-pointer"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-60 mt-2"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--accent-glow)",
                }}
              >
                <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-blue-500 hover:underline">
                  Create account
                </Link>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
