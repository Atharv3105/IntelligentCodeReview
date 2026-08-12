import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import CommandPalette from "./CommandPalette";

export default function Navbar() {
  const { logout, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/problems", label: "DSA Arena" },
    { path: "/sql", label: "SQL Lab" },
    { path: "/interviews", label: "AI Interviews" },
    { path: "/mock-tests", label: "Mock Tests" },
    { path: "/career", label: "Career & Resume" },
    { path: "/analytics", label: "Analytics" },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin" }] : [])
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="app-navbar sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="container-custom mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 font-black text-gray-950 shadow-lg shadow-emerald-500/20">
                AI
              </span>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-emerald-400 bg-clip-text text-transparent">
                Interview Intelligence
              </span>
            </Link>

            <div className="hidden items-center gap-1 xl:flex">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                    isActive(item.path)
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-all"
              >
                <span>Search</span>
                <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">Ctrl K</kbd>
              </button>

              {user?.name && (
                <span className="hidden rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs font-medium text-emerald-400 md:inline">
                  {user.name}
                </span>
              )}

              <button
                onClick={toggleTheme}
                className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:text-white"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              {user ? (
                <button onClick={handleLogout} className="hidden rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20 sm:inline-flex">
                  Logout
                </button>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link to="/login" className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-gray-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400">Get Started</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="rounded-lg bg-gray-900 border border-gray-800 p-2 text-gray-300 xl:hidden"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen ? (
                    <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-gray-800 pb-4 xl:hidden"
              >
                <div className="space-y-1 pt-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive(item.path)
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-gray-300 hover:bg-gray-800/60"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  ) : (
                    <div className="space-y-1 pt-2">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">
                        Login
                      </Link>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-gray-950">
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
}
