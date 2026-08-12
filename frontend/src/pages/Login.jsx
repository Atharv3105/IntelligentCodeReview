import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true); setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 font-sans flex flex-col">
      {/* Grid pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 grid-pattern opacity-30" />

      {/* Star dots */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <span key={i} className="star" style={{
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            "--dur": `${2.5 + Math.random() * 3}s`, "--delay": `${Math.random() * 2}s`,
          }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-20 glass-dark border-b border-white/[0.05] h-[60px] px-6 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-[11px] shadow-md shadow-blue-500/30">II</div>
          <span className="text-sm font-bold text-white/90">Interview Intelligence</span>
        </Link>
      </nav>

      {/* Form container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Glow behind form */}
          <div className="absolute -inset-8 bg-blue-600/8 rounded-3xl blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-xl mx-auto mb-5 shadow-xl shadow-blue-500/30"
            >
              II
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1.5">Sign in to your workspace</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl px-4 py-3 text-sm text-rose-300 flex items-center gap-2"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                <span className="w-4 h-4 rounded-full bg-rose-500/30 flex-shrink-0 flex items-center justify-center text-rose-400 text-[10px] font-black">!</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form card */}
          <div
            className="relative z-10 rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(13,17,23,0.85)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
            }}
          >
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-slate-400 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-slate-400 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.35)" } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.30)",
                  }}
                >
                  {loading ? (
                    <motion.svg animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </motion.svg>
                  ) : (
                    <>Sign in <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <div className="pt-1 text-center text-xs text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Create one free →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
