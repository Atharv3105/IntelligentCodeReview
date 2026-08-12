import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import CommandPalette from "../CommandPalette";

export function AppShell() {
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
        <main
          className="flex-1 p-6 md:p-8 overflow-y-auto"
          style={{ background: "var(--bg-app)" }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
