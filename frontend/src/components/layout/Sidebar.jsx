import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Code2, Database, Cpu, Layers, Bot, Terminal,
  MessageSquare, UserCheck, FileCheck2, SlidersHorizontal,
  FileText, Compass, BarChart3, History, User, Settings,
  ChevronDown, ChevronRight, PanelLeft,
} from "lucide-react";

const navGroups = [
  {
    id: "main",
    items: [{ label: "Home", path: "/dashboard", icon: Home }],
  },
  {
    id: "practice",
    label: "Practice",
    items: [
      { label: "DSA Arena", path: "/problems", icon: Code2 },
      { label: "SQL Lab", path: "/sql", icon: Database },
      { label: "Core CS", path: "/subjects", icon: Cpu },
      { label: "System Design", path: "/subjects?topic=System Design", icon: Layers },
    ],
  },
  {
    id: "interviews",
    label: "Interviews",
    items: [
      { label: "Technical AI", path: "/interviews?type=technical", icon: Bot },
      { label: "Coding Session", path: "/interviews?type=coding", icon: Terminal },
      { label: "Behavioral", path: "/interviews?type=behavioral", icon: MessageSquare },
      { label: "HR Round", path: "/interviews?type=hr", icon: UserCheck },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    items: [
      { label: "Mock Tests", path: "/mock-tests", icon: FileCheck2 },
      { label: "Adaptive", path: "/mock-tests?mode=adaptive", icon: SlidersHorizontal },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      { label: "Resume ATS", path: "/career?tab=resume", icon: FileText },
      { label: "AI Coach", path: "/career?tab=coach", icon: Bot },
      { label: "Roadmap", path: "/career?tab=plan", icon: Compass },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { label: "Analytics", path: "/analytics", icon: BarChart3 },
      { label: "History", path: "/submissions", icon: History },
    ],
  },
];

const bottomItems = [
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [open, setOpen] = useState({
    practice: true, interviews: true, assessments: false, career: false, insights: false,
  });

  const isActive = (path) => {
    const fullPath = location.pathname + location.search;
    if (path.includes("?")) {
      return fullPath === path;
    }
    return location.pathname === path && (!location.search || location.pathname === "/dashboard" || location.pathname === "/problems" || location.pathname === "/sql");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 232 }}
      transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.85 }}
      className="h-screen sticky top-0 flex flex-col z-30 overflow-hidden will-change-[width]"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* ── Logo ───────────────────────────── */}
      <div
        className="h-[60px] flex items-center justify-between px-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm flex-shrink-0 shadow-md shadow-blue-500/20"
                >
                  II
                </motion.div>
                <div className="leading-none min-w-0">
                  <span className="text-[13px] font-bold text-primary block truncate">Interview</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] block" style={{ color: "var(--brand-blue)" }}>
                    Intelligence
                  </span>
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.16 }}
              className="mx-auto"
            >
              <Link to="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20"
                >
                  II
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <PanelLeft className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <div className="flex justify-center py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* ── Navigation ─────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {navGroups.map((group) => {
          if (group.id === "main") {
            return group.items.map((item) => (
              <NavItem key={item.path} item={item} active={isActive(item.path)} collapsed={collapsed} />
            ));
          }

          const isOpen = open[group.id];
          return (
            <div key={group.id} className="space-y-0.5">
              {/* Section label */}
              {!collapsed && (
                <motion.button
                  onClick={() => setOpen((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  whileHover={{ x: 1 }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
                  style={{ color: "var(--text-disabled)" }}
                >
                  <span>{group.label}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 0 : -90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.span>
                </motion.button>
              )}

              <AnimatePresence initial={false}>
                {(isOpen || collapsed) && (
                  <motion.div
                    key={group.id + "-items"}
                    initial={collapsed ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="space-y-0.5">
                      {group.items.map((item, idx) => (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.035 }}
                        >
                          <NavItem item={item} active={isActive(item.path)} collapsed={collapsed} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Bottom ──────────────────────────── */}
      <div className="p-2 space-y-0.5 flex-shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {bottomItems.map((item) => (
          <NavItem key={item.path} item={item} active={isActive(item.path)} collapsed={collapsed} />
        ))}
      </div>
    </motion.aside>
  );
}

/* ── NavItem ──────────────────────────────────── */
function NavItem({ item, active, collapsed }) {
  const Icon = item.icon;
  return (
    <Link to={item.path} title={collapsed ? item.label : undefined} className="relative block">
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors"
        style={{
          color: active ? "var(--brand-blue)" : "var(--text-tertiary)",
        }}
      >
        {/* Active pill */}
        {active && (
          <motion.div
            layoutId="sidebar-pill"
            className="absolute inset-0 rounded-xl nav-active-bg"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        {/* Hover bg (non-active) */}
        {!active && (
          <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: "var(--bg-surface-2)" }}
          />
        )}

        <span className="relative z-10 flex-shrink-0">
          <Icon className="w-[15px] h-[15px]" />
        </span>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -4, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -4, width: 0 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 truncate leading-none font-semibold"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Active left stripe */}
        {active && (
          <motion.span
            layoutId="sidebar-stripe"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ background: "var(--brand-blue)" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
      </motion.div>
    </Link>
  );
}
