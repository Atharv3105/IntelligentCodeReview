import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Code2,
  Database,
  BookOpen,
  Mic,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Compass,
} from "lucide-react";

export function BottomDock() {
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial collapsed state from localStorage (default: false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dock_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleToggle = (collapsedState) => {
    setIsCollapsed(collapsedState);
    try {
      localStorage.setItem("dock_collapsed", String(collapsedState));
    } catch {}
  };

  const items = [
    { id: "dashboard", path: "/dashboard", label: "Home", icon: Home },
    { id: "problems", path: "/problems", label: "DSA", icon: Code2, matchPrefix: "/problem" },
    { id: "sql", path: "/sql", label: "SQL", icon: Database },
    { id: "subjects", path: "/subjects", label: "Theory", icon: BookOpen },
    { id: "interviews", path: "/interviews", label: "Interview", icon: Mic },
    { id: "career", path: "/career", label: "Career", icon: Briefcase },
  ];

  const activeItem =
    items.find(
      (item) =>
        location.pathname === item.path ||
        (item.matchPrefix && location.pathname.startsWith(item.matchPrefix))
    ) || items[0];

  const ActiveIcon = activeItem?.icon || Compass;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 ${
        isCollapsed ? "bottom-3" : "bottom-5"
      }`}
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* ── Collapsed State: Minimal Floating Capsule ── */
          <motion.button
            key="collapsed-dock"
            initial={{ y: 16, opacity: 0, scale: 0.88 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            onClick={() => handleToggle(false)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-2xl group cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
            title="Expand Navigation Dock"
            aria-label="Expand navigation dock"
          >
            <div className="flex items-center gap-1.5">
              <ActiveIcon className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold tracking-tight text-slate-200">
                {activeItem.label}
              </span>
            </div>

            <div className="w-px h-3 bg-slate-700/60 mx-0.5" />

            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
              <span>Dock</span>
              <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </motion.button>
        ) : (
          /* ── Expanded State: Full Navigation Dock ── */
          <motion.div
            key="expanded-dock"
            initial={{ y: 24, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="flex items-center gap-1 p-1.5 rounded-full border shadow-2xl"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            {items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.matchPrefix && location.pathname.startsWith(item.matchPrefix));
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 24 }}
                  className="relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-full transition-colors group cursor-pointer focus:outline-none"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDockCapsule"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "var(--accent-subtle)",
                        border: "1px solid var(--accent-glow)",
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  )}

                  <Icon className="w-4 h-4 relative z-10 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-medium tracking-tight mt-0.5 relative z-10">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Divider */}
            <div className="h-5 w-px mx-1 bg-slate-700/40" style={{ background: "var(--glass-border)" }} />

            {/* Collapse Button */}
            <motion.button
              onClick={() => handleToggle(true)}
              whileHover={{ scale: 1.15, y: -1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              className="flex items-center justify-center p-2 rounded-full cursor-pointer focus:outline-none text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Collapse Dock (Free Screen Space)"
              aria-label="Collapse navigation dock"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BottomDock;
