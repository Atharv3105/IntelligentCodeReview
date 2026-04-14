import { useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * useProctoring Hook
 * 
 * Manages tab-switch detection, copy-paste blocking, and full-screen enforcement.
 * 
 * @param {string} attemptId - The ID of the current test attempt.
 * @param {object} settings - Proctoring settings (maxTabSwitches, allowCopy, etc.)
 */
export default function useProctoring(attemptId, settings = {}, disabled = false) {
  const { 
    maxTabSwitches = 3, 
    allowCopy = false, 
    enforceFullScreen = true 
  } = settings;

  const logViolation = useCallback(async (type, details = "") => {
    try {
      if (!attemptId) return;
      await api.post(`/assessments/attempt/${attemptId}/violation`, { type, details });
      console.warn(`Proctoring Violation Logged: ${type}`);
    } catch (err) {
      console.error("Failed to log proctoring violation:", err);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId || disabled) return;

    // 1. Detect Tab/Window Switching (Visibility & Focus)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("TAB_SWITCH", "User switched away from the test tab/window.");
      }
    };

    const handleBlur = () => {
      logViolation("WINDOW_BLUR", "User clicked out of the test window.");
    };

    // 2. Block Copy, Paste, and Context Menu
    const preventAction = (e) => {
      if (!allowCopy) {
        e.preventDefault();
        logViolation("RESTRICTED_ACTION", `User attempted ${e.type} action.`);
      }
    };

    // 3. Monitor Full-Screen Exit
    const handleFullScreenExit = () => {
      if (!document.fullscreenElement && enforceFullScreen) {
        logViolation("FULLSCREEN_EXIT", "User exited full-screen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenExit);
    
    if (!allowCopy) {
      document.addEventListener("copy", preventAction);
      document.addEventListener("paste", preventAction);
      document.addEventListener("cut", preventAction);
      document.addEventListener("contextmenu", preventAction);
    }

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenExit);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("contextmenu", preventAction);
    };
  }, [attemptId, logViolation, allowCopy, enforceFullScreen]);

  // Function to request full-screen (to be called on test start)
  const enterFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Critical: Failed to enter full-screen mode", err);
    }
  };

  return { enterFullScreen };
}
