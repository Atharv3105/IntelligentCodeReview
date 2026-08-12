import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { ArrowRight, Eye, EyeOff, User, Mail, Lock, CheckCircle2 } from "lucide-react";

const fields = [
  { label: "Full Name", name: "name", type: "text", icon: User, placeholder: "Jane Doe" },
  { label: "Email", name: "email", type: "email", icon: Mail, placeholder: "you@example.com" },
  { label: "Password", name: "password", type: "password", icon: Lock, placeholder: "Minimum 6 characters" },
  { label: "Confirm Password", name: "confirmPassword", type: "password", icon: Lock, placeholder: "Re-enter password" },
];

export default function Register() {
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
    setLoading(true); setError(""); setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await api.post("/auth/register", { name: form.name, email: form.email, password: form.password });
      setSuccess(res.data.message || "Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient text-slate-100 font-sans flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0 grid-pattern opacity-30" />

      {/* Nav */}
      <nav className="relative z-20 glass-dark border-b border-white/[0.05] h-[60px] px-6 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-[11px] shadow-md shadow-blue-500/30">II</div>
          <span className="text-sm font-bold text-white/90">Interview Intelligence</span>
        </Link>
      </nav>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Header */}
          <div className="text-center mb-7">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white text-xl mx-auto mb-5 shadow-xl shadow-violet-500/30"
            >
              II
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create account</h1>
            <p className="text-sm text-slate-400 mt-1.5">Start your interview preparation</p>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl px-4 py-3 text-sm text-rose-300 flex items-center gap-2"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                <span className="w-4 h-4 rounded-full bg-rose-500/30 flex-shrink-0 flex items-center justify-center text-rose-400 text-[10px] font-black">!</span>
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form card */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(13,17,23,0.85)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
            }}
          >
            <form onSubmit={register} className="space-y-3.5">
              {fields.map((field, idx) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + idx * 0.07 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs font-bold text-slate-400 block">{field.label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type={field.type === "password" && showPass ? "text" : field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                      {field.type === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 30px rgba(139,92,246,0.35)" } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.30)",
                  }}
                >
                  {loading ? (
                    <motion.svg animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </motion.svg>
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <div className="pt-1 text-center text-xs text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
                Sign in →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
