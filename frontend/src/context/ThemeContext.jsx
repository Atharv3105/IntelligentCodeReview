import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext();

const THEME_KEY = "iip-theme";

function getInitialTheme() {
  // Respect saved preference first
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Default to dark — this platform is designed dark-first
  return "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  // Also apply directly to body background for instant paint
  document.body.style.background = theme === "dark" ? "#060912" : "#f7f8fa";
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    // Apply synchronously before first render to avoid flash
    if (typeof document !== "undefined") applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
