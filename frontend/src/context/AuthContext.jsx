import { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

function parseToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id:       payload.id,
      name:     payload.name,
      role:     payload.role,
      // College identity fields (null for public users)
      prn:      payload.prn      || null,
      division: payload.division || null,
      year:     payload.year     || null,
      branch:   payload.branch   || null
    };
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [user, setUser]   = useState(parseToken(token));

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    setToken(res.data.accessToken);
    setUser(parseToken(res.data.accessToken));
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    api.post("/auth/logout").catch(() => {});
    setToken(null);
    setUser(null);
  };

  // Convenience role helpers
  const isTeacher  = user?.role === "teacher" || user?.role === "admin";
  const isAdmin    = user?.role === "admin";
  const isStudent  = user?.role === "student";
  const isCollege  = !!user?.prn; // has a PRN = college student

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isTeacher, isAdmin, isStudent, isCollege }}>
      {children}
    </AuthContext.Provider>
  );
}
