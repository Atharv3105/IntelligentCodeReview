import { useState, useEffect, useRef, useCallback } from "react";
import { examAPI } from "../services/examApi";

const TAB_WARN_THRESHOLD  = 2; // show "flagged" banner after this many
const FS_WARN_THRESHOLD   = 2;

/**
 * useAntiCheat — manages all anti-cheat event detection for ExamRoom
 * @param {{ examId: string, enabled: boolean }} options
 * @returns {{ tabSwitchCount, fullscreenExitCount, isFlagged, isFullscreen, requestFullscreen }}
 */
export default function useAntiCheat({ examId, enabled = true }) {
  const [tabSwitchCount,      setTabSwitchCount]      = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isFlagged,           setIsFlagged]           = useState(false);
  const [isFullscreen,        setIsFullscreen]         = useState(false);

  const logEvent = useCallback(async (event) => {
    if (!examId) return;
    try {
      const res = await examAPI.logEvent(examId, event);
      if (res.data.flagged) setIsFlagged(true);
    } catch { /* swallow — don't block exam */ }
  }, [examId]);

  // ── Request fullscreen ─────────────────────────────────────────────────
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen)            el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // ── Fullscreen change listener ────────────────────────────────────────
    const handleFullscreenChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) {
        setFullscreenExitCount((c) => {
          const next = c + 1;
          if (next > FS_WARN_THRESHOLD) setIsFlagged(true);
          return next;
        });
        logEvent("fullscreen_exit");
      }
    };

    // ── Tab / window visibility listener ──────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const next = c + 1;
          if (next > TAB_WARN_THRESHOLD) setIsFlagged(true);
          return next;
        });
        logEvent("tab_switch");
      }
    };

    document.addEventListener("fullscreenchange",       handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange",       handleVisibility);

    // Enter fullscreen on mount
    requestFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange",       handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange",       handleVisibility);
    };
  }, [enabled, logEvent, requestFullscreen]);

  return {
    tabSwitchCount,
    fullscreenExitCount,
    isFlagged,
    isFullscreen,
    requestFullscreen,
    logEvent
  };
}
