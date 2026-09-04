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

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login"    element={<AuthAwareRedirect><Login /></AuthAwareRedirect>} />
      <Route path="/register" element={<AuthAwareRedirect><Register /></AuthAwareRedirect>} />

      {/* ── Protected Persistent Layout ── */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/problems"    element={<ProblemList />} />
        <Route path="/problem/:id" element={<ProblemPage />} />
        <Route path="/sql"         element={<SQLLab />} />
        <Route path="/interviews"  element={<InterviewSession />} />
        <Route path="/mock-tests"  element={<MockTestArena />} />
        <Route path="/career"      element={<CareerHub />} />
        <Route path="/subjects"    element={<SubjectPractice />} />
        <Route path="/analytics"   element={<AnalyticsPage />} />
        <Route path="/submissions" element={<MySubmissions />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/settings"    element={<Settings />} />
        <Route path="/admin"       element={<AdminDashboard />} />
      </Route>

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
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
