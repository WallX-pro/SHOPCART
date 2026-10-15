// pages/OrderSuccess.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="page success-page">
      <div className="card success-card">
        <div className="success-icon">🎉</div>
        <h1 className="gradient-text">Order Placed!</h1>
        <p style={{ margin: "1rem 0 0.5rem" }}>
          Your payment was successful and your order is confirmed.
        </p>

        {order && (
          <div style={{ margin: "1.5rem 0", textAlign: "left", width: "100%" }}>
            <div className="order-summary-row">
              <span className="text-muted">Order ID</span>
              <span style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{order._id}</span>
            </div>
            <div className="order-summary-row">
              <span className="text-muted">Total</span>
              <span className="text-accent font-bold">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
            </div>
            <div className="order-summary-row">
              <span className="text-muted">Status</span>
              <span className="status-badge status-paid">✅ {order.paymentStatus}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
          <Link to="/orders" className="btn btn-primary">View My Orders</Link>
          <Link to="/products" className="btn btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
