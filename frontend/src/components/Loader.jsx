// components/Loader.jsx

export default function Loader({ fullPage = false, text = "Loading..." }) {
  if (fullPage) {
    return (
      <div className="page-loader">
        <div className="loader-center">
          <div className="spinner" />
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{text}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="loader-center">
      <div className="spinner" />
      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{text}</span>
    </div>
  );
}
