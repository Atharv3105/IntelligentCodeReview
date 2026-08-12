import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useContext(AuthContext);

  // While checking/refreshing session, show a blank loading screen
  // instead of instantly redirecting to login
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white text-sm animate-pulse">II</div>
          <p className="text-xs text-slate-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}