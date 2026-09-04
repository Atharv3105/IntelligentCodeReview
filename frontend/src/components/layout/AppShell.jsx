import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomDock } from "./BottomDock";
import CommandPalette from "../CommandPalette";

export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen font-sans relative"
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
        <main
          className="flex-1 p-5 md:p-8 pb-28 overflow-y-auto"
          style={{ background: "var(--bg-app)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -4 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Apple iOS Floating Island Bottom Dock */}
      <BottomDock />

      {/* Command Palette */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
