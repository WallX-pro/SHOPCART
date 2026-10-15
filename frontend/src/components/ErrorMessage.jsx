// components/ErrorMessage.jsx

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <p className="error-msg">{message || "Something went wrong."}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
