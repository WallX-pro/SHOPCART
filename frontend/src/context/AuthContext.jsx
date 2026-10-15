// context/AuthContext.jsx
// Single source of truth for the current user session.
// On mount, calls GET /customers/me to restore session after page refresh.
// login() / logout() are called by pages — they update state + sync other contexts.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while the initial /me call is in-flight

  // Restore session on every page load / refresh
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/customers/me");
        setUser(data.customer);
      } catch {
        setUser(null); // 401 → not logged in
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Called by Login page after successful POST /customers/login
  const login = useCallback((customerData) => {
    setUser(customerData);
  }, []);

  // Called by Navbar logout button
  const logout = useCallback(async () => {
    try {
      await api.post("/customers/logout");
    } catch {
      // Even if the server call fails, clear local state so the UI updates
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
