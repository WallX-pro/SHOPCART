// pages/Orders.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function statusClass(status) {
  if (status === "PAID" || status === "DELIVERED") return "status-paid";
  if (status === "FAILED") return "status-failed";
  if (status === "PLACED" || status === "CONFIRMED" || status === "SHIPPED") return "status-placed";
  return "status-pending";
}

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) return <Loader fullPage text="Loading orders…" />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchOrders} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>📦 My Orders</h1>
        <p>{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="You have not placed any orders yet" description="Start shopping and your orders will appear here." actionLabel="Start Shopping" actionTo="/products" />
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="flex-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p className="text-muted text-sm">Order ID</p>
                <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{order._id}</p>
              </div>
              <span className={`status-badge ${statusClass(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>

            <div className="flex-between" style={{ marginTop: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p className="text-muted text-sm">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
                <p style={{ fontWeight: 700 }} className="text-accent">₹{order.totalAmount?.toLocaleString("en-IN")}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="text-muted text-sm">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm" style={{ marginTop: "0.25rem" }}>View Details →</Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
