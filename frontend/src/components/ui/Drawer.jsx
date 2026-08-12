import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function Drawer({ isOpen, onClose, title, children, side = "right" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: side === "right" ? "100%" : "-100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: side === "right" ? "100%" : "-100%", opacity: 0.6 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 36,
              mass: 0.9,
            }}
            className={`fixed top-0 ${side === "right" ? "right-0" : "left-0"} z-50 h-full w-full max-w-md flex flex-col`}
            style={{
              background: "var(--bg-surface)",
              borderLeft: side === "right" ? "1px solid var(--border-main)" : "none",
              borderRight: side === "left" ? "1px solid var(--border-main)" : "none",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <motion.h2
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </motion.h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Drawer Body */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="flex-1 overflow-y-auto p-6"
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
