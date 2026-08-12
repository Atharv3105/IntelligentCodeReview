import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import AuthProvider, { AuthContext } from "./context/AuthContext";
import SocketProvider from "./context/SocketContext";
import ThemeProvider from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppShell } from "./components/layout/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProblemList from "./pages/ProblemList";
import ProblemPage from "./pages/ProblemPage";
import SQLLab from "./pages/SQLLab";
import InterviewSession from "./pages/InterviewSession";
import MockTestArena from "./pages/MockTestArena";
import CareerHub from "./pages/CareerHub";
import SubjectPractice from "./pages/SubjectPractice";
import AnalyticsPage from "./pages/AnalyticsPage";
import MySubmissions from "./pages/MySubmissions";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Redirect already-logged-in users away from login/register
function AuthAwareRedirect({ children }) {
  const { user, initializing } = useContext(AuthContext);
  if (initializing) return null; // wait silently, no flash
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// Wrap protected page in AppShell
function Shell({ children }) {
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login"    element={<AuthAwareRedirect><Login /></AuthAwareRedirect>} />
      <Route path="/register" element={<AuthAwareRedirect><Register /></AuthAwareRedirect>} />

      {/* ── Protected (each wrapped in ProtectedRoute + AppShell) ── */}
      <Route path="/dashboard"   element={<ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>} />
      <Route path="/problems"    element={<ProtectedRoute><Shell><ProblemList /></Shell></ProtectedRoute>} />
      <Route path="/problem/:id" element={<ProtectedRoute><Shell><ProblemPage /></Shell></ProtectedRoute>} />
      <Route path="/sql"         element={<ProtectedRoute><Shell><SQLLab /></Shell></ProtectedRoute>} />
      <Route path="/interviews"  element={<ProtectedRoute><Shell><InterviewSession /></Shell></ProtectedRoute>} />
      <Route path="/mock-tests"  element={<ProtectedRoute><Shell><MockTestArena /></Shell></ProtectedRoute>} />
      <Route path="/career"      element={<ProtectedRoute><Shell><CareerHub /></Shell></ProtectedRoute>} />
      <Route path="/subjects"    element={<ProtectedRoute><Shell><SubjectPractice /></Shell></ProtectedRoute>} />
      <Route path="/analytics"   element={<ProtectedRoute><Shell><AnalyticsPage /></Shell></ProtectedRoute>} />
      <Route path="/submissions" element={<ProtectedRoute><Shell><MySubmissions /></Shell></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Shell><Leaderboard /></Shell></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><Shell><Profile /></Shell></ProtectedRoute>} />
      <Route path="/settings"    element={<ProtectedRoute><Shell><Settings /></Shell></ProtectedRoute>} />
      <Route path="/admin"       element={<ProtectedRoute><Shell><AdminDashboard /></Shell></ProtectedRoute>} />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
