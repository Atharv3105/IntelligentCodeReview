import { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export const AuthContext = createContext();

function parseToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.id,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // True while we are checking/refreshing the session on startup
  const [initializing, setInitializing] = useState(true);

  // On mount: try to restore session from localStorage or silently refresh
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem("accessToken");
      const parsed = parseToken(stored);

      if (parsed) {
        // Token still valid — restore immediately
        setToken(stored);
        setUser(parsed);
      } else {
        // Token missing or expired — try to silently refresh using the cookie
        try {
          const res = await api.post("/auth/refresh");
          const newToken = res.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          setToken(newToken);
          setUser(parseToken(newToken));
        } catch {
          // Refresh failed — user needs to log in
          localStorage.removeItem("accessToken");
          setToken(null);
          setUser(null);
        }
      }

      setInitializing(false);
    };

    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const newToken = res.data.accessToken;
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
    setUser(parseToken(newToken));
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
  }, []);

  // Called by the api.js interceptor after a successful silent refresh
  const updateToken = useCallback((newToken) => {
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
    setUser(parseToken(newToken));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateToken, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}
