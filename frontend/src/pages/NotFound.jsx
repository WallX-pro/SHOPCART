// pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
      <div>
        <div style={{ fontSize: "6rem", marginBottom: "1rem" }}>🛸</div>
        <h1 className="gradient-text" style={{ fontSize: "4rem", fontWeight: 800, marginBottom: "0.5rem" }}>404</h1>
        <h2 style={{ marginBottom: "1rem" }}>Page Not Found</h2>
        <p className="text-muted" style={{ marginBottom: "2rem" }}>
          This page drifted into deep space. Let&apos;s get you back.
        </p>
        <Link to="/home" className="btn btn-primary btn-lg">🏠 Go Home</Link>
      </div>
    </div>
  );
}
