import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, LogOut, User, Shield, Flame, Bell } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import api from "../../services/api";

const breadcrumbs = {
  "/dashboard": "Home",
  "/problems": "Practice → DSA Arena",
  "/sql": "Practice → SQL Lab",
  "/subjects": "Practice → Core CS",
  "/interviews": "Interviews",
  "/mock-tests": "Assessments → Mock Tests",
  "/career": "Career Hub",
  "/analytics": "Insights → Analytics",
  "/submissions": "Insights → History",
  "/profile": "Profile",
  "/settings": "Settings",
  "/admin": "Admin",
};

export function TopBar({ onOpenSearch }) {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (user) {
      api.get("/analytics/dashboard")
        .then((res) => {
          if (res.data?.dashboard?.streak !== undefined) {
            setStreak(res.data.dashboard.streak);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const crumb = breadcrumbs[location.pathname] || "Interview Intelligence";

  return (
    <header
      className="h-[60px] sticky top-0 z-20 glass flex items-center justify-between px-5 gap-4"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* ── Breadcrumb ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.16 }}
          className="text-[13px] font-semibold flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          {crumb.split(" → ").map((part, i, arr) => (
            <span key={i}>
              <span className={i === arr.length - 1 ? "text-primary" : ""} style={i === arr.length - 1 ? { color: "var(--text-primary)" } : {}}>
                {part}
              </span>
              {i < arr.length - 1 && (
                <span className="mx-1.5" style={{ color: "var(--border-main)" }}>›</span>
              )}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Search ──────────────────────── */}
      <motion.button
        onClick={onOpenSearch}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center gap-2.5 flex-1 max-w-xs px-3.5 py-2 rounded-xl text-[13px] transition-all"
        style={{
          background: "var(--bg-surface-2)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-tertiary)",
        }}
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-disabled)" }} />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd
          className="hidden sm:block text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-surface-3)", color: "var(--text-disabled)", border: "1px solid var(--border-subtle)" }}
        >
          ⌘K
        </kbd>
      </motion.button>

      {/* ── Right Controls ──────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          onClick={() => navigate("/analytics")}
          title="View your study streaks & analytics"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-105"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.15)",
            color: "#f59e0b",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            🔥
          </motion.span>
          <span>{streak > 0 ? `${streak}-day streak` : "Start streak"}</span>
        </motion.div>

        {/* Notifications (decorative) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="relative p-2 rounded-xl transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Bell className="w-[15px] h-[15px]" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--brand-blue)" }}
          />
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92, rotate: 30 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="p-2 rounded-xl transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Sun className="w-[15px] h-[15px]" />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Moon className="w-[15px] h-[15px]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Avatar + Menu */}
        <div className="relative">
          <motion.button
            onClick={() => setUserMenuOpen((v) => !v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 p-1 rounded-xl transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black ring-2 ring-offset-1"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                ringColor: "var(--brand-blue)",
                ringOffsetColor: "var(--bg-surface)",
              }}
            >
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </div>
          </motion.button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: -6 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl py-1.5 z-50 text-[13px] overflow-hidden"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-main)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div
                    className="px-4 py-2.5 mb-1"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <span className="font-bold block" style={{ color: "var(--text-primary)" }}>{user?.name || "User"}</span>
                    <span className="text-[11px] truncate block" style={{ color: "var(--text-tertiary)" }}>{user?.email}</span>
                  </div>

                  {[
                    { label: "Your Profile", path: "/profile", icon: User },
                    ...(user?.role === "admin" ? [{ label: "Admin Panel", path: "/admin", icon: Shield }] : []),
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Icon className="w-4 h-4" style={{ color: "var(--text-disabled)" }} />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}

                  <div style={{ borderTop: "1px solid var(--border-subtle)" }} className="mt-1">
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => { setUserMenuOpen(false); logout(); navigate("/login"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 transition-colors text-left"
                      style={{ color: "#f43f5e" }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
