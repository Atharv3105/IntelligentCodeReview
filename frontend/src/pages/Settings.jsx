import React, { useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import api from "../services/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Settings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dataMessage, setDataMessage] = useState("");

  const handleClearMemory = async () => {
    if (!confirm("Are you sure you want to clear your stored candidate memory?")) return;
    try {
      await api.delete("/career/memory");
      setDataMessage("Candidate memory cleared.");
      setTimeout(() => setDataMessage(""), 3000);
    } catch (err) {
      console.error("Failed to clear memory:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage platform preferences, theme, voice interaction, and data privacy.</p>
      </div>

      {dataMessage && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-700 dark:text-blue-300">
          {dataMessage}
        </div>
      )}

      {/* Appearance */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">Appearance</h3>
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">Color Theme</span>
            <span className="text-slate-500">Switch between light and dark visual modes</span>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Current: {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </Button>
        </div>
      </Card>

      {/* Voice */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">Voice & Interaction</h3>
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">AI Interviewer Voice</span>
            <span className="text-slate-500">Enable speech-to-text during interviews</span>
          </div>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">Data & Privacy</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">Candidate Memory</span>
              <span className="text-slate-500">Clear stored weakness patterns and memory history</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleClearMemory}>
              Clear Memory
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
