import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
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

function AppRoutes() {
  const location = useLocation();
  const publicPaths = ["/", "/login", "/register"];
  const isPublic = publicPaths.includes(location.pathname);

  if (isPublic) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
        <Route path="/problem/:id" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
        <Route path="/sql" element={<ProtectedRoute><SQLLab /></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
        <Route path="/mock-tests" element={<ProtectedRoute><MockTestArena /></ProtectedRoute>} />
        <Route path="/career" element={<ProtectedRoute><CareerHub /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><SubjectPractice /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </AppShell>
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
