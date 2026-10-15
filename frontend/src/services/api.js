// services/api.js
// Single Axios instance used by every component and context.
// withCredentials:true ensures the HttpOnly token cookie is sent on every request.
// The 401 interceptor clears stale auth state and redirects to /login —
// this handles both expired tokens and server-side session invalidation.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true, // send the HttpOnly cookie on every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: on 401, clear auth and redirect.
// We use window.location so all React state (including context) gets reset
// naturally on the fresh page load — no need to import every context here.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login") &&
      !window.location.pathname.includes("/register")
    ) {
      // Don't redirect in an infinite loop if already on login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
