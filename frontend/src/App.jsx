import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import SocketProvider from "./context/SocketContext";
import ThemeProvider from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Existing pages
import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import ProblemList   from "./pages/ProblemList";
import ProblemPage   from "./pages/ProblemPage";
import MySubmissions from "./pages/MySubmissions";
import Leaderboard   from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";

// New pages
import LearningHub   from "./pages/LearningHub";
import ExamList      from "./pages/ExamList";
import ExamRoom      from "./pages/ExamRoom";
import ExamResults   from "./pages/ExamResults";
import TeacherPanel  from "./pages/TeacherPanel";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                {/* ── Public ──────────────────────────────────── */}
                <Route path="/"         element={<Landing />} />
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── Practice ────────────────────────────────── */}
                <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
                <Route path="/problem/:id" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />

                {/* ── Learning Hub ─────────────────────────────── */}
                <Route path="/learn" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />

                {/* ── CA Exams ─────────────────────────────────── */}
                <Route path="/exams"            element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
                <Route path="/exam/:id"         element={<ProtectedRoute><ExamRoom /></ProtectedRoute>} />
                <Route path="/exam/:id/results" element={<ProtectedRoute><ExamResults /></ProtectedRoute>} />

                {/* ── Teacher Panel ────────────────────────────── */}
                <Route path="/teacher" element={<ProtectedRoute><TeacherPanel /></ProtectedRoute>} />

                {/* ── Existing Dashboard ───────────────────────── */}
                <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
