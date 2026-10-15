// components/EmptyState.jsx

import { Link } from "react-router-dom";

export default function EmptyState({ icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary mt-md">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
