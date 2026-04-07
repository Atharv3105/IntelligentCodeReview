import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function Navbar() {
  const { logout, user, isTeacher, isAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/learn",       label: "Learn",       emoji: "📚" },
    { path: "/problems",    label: "Practice",    emoji: "🧩" },
    { path: "/exams",       label: "Exams",       emoji: "📝" },
    { path: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
    { path: "/submissions", label: "History",     emoji: "📋" },
    ...(isTeacher ? [{ path: "/teacher", label: "Teacher Panel", emoji: "👨‍🏫" }] : []),
    ...(isAdmin   ? [{ path: "/admin",   label: "Admin",         emoji: "⚙️"  }] : [])
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  // Role badge for the user avatar
  const roleBadge = user?.role === "teacher"
    ? "👨‍🏫 Teacher"
    : user?.role === "admin"
    ? "⚙️ Admin"
    : user?.prn
    ? `🎓 ${user.year || "Student"} ${user.division ? `• Div ${user.division}` : ""}`
    : "Student";

  return (
    <motion.nav
      className="app-navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="container-custom">
        <div className="flex h-[76px] items-center justify-between gap-4">
          {/* ── Brand ─────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-teal-500 to-sky-500 font-bold text-white shadow-sm">
              Py
            </span>
            <div className="hidden sm:block">
              <span className="text-lg font-bold">PyMastery</span>
              <span className="ml-1 text-xs text-gray-500">MGM JNEC</span>
            </div>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────────────── */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-green-400/15 text-accent-green"
                    : "text-gray-300 hover:bg-gray-800/65 hover:text-gray-100"
                }`}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* ── Right Side Controls ───────────────────────────────── */}
          <div className="flex items-center gap-2">
            {user?.name && (
              <div className="hidden flex-col items-end md:flex">
                <span className="rounded-md app-toolbar px-3 py-1 text-sm font-medium">
                  {user.name}
                </span>
                <span className="px-3 text-[10px] text-gray-500">{roleBadge}</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="rounded-lg app-toolbar px-3 py-2 text-sm"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {user ? (
              <button onClick={handleLogout} className="hidden btn-secondary text-sm sm:inline-flex">
                Logout
              </button>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login"    className="btn-secondary text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg app-toolbar p-2 lg:hidden"
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

        {/* ── Mobile Dropdown ────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-700/30 pb-4 lg:hidden"
            >
              <div className="space-y-1 pt-3">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive(item.path)
                        ? "bg-green-400/15 text-accent-green"
                        : "text-gray-300 hover:bg-gray-800/65 hover:text-gray-100"
                    }`}
                  >
                    <span className="mr-2">{item.emoji}</span>
                    {item.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <div className="px-3 py-1 text-xs text-gray-500">{roleBadge}</div>
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-800/80"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-1 pt-2">
                    <Link to="/login"    onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/80">Login</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-gradient-to-r from-accent-green to-accent-cyan px-3 py-2 text-sm font-semibold text-gray-950">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
