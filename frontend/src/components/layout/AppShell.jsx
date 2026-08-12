import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import CommandPalette from "../CommandPalette";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.26,
};

export function AppShell({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{
        background: "var(--bg-app)",
        color: "var(--text-primary)",
      }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Column */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ background: "var(--bg-app)" }}
      >
        <TopBar onOpenSearch={() => setSearchOpen(true)} />

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname + location.search}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={pageTransition}
            className="flex-1 p-6 md:p-8 overflow-y-auto"
            style={{ background: "var(--bg-app)" }}
          >
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
