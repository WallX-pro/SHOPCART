// components/ProtectedRoute.jsx
// Shows a full-page loader while AuthContext is restoring the session.
// Redirects to /login if not authenticated (preserving the attempted URL
// via `state` so login can redirect back after success).
// Public-only routes (Login/Register) should redirect to /home if user is logged in —
// that logic lives directly in those page components.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While checking session — show spinner, not a redirect
  if (loading) return <Loader fullPage />;

  // Not authenticated → send to login, remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated → render the child route
  return <Outlet />;
}
