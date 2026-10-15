// pages/OrderDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchOrder = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Order not found");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [id]); // eslint-disable-line

  if (loading) return <Loader fullPage />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchOrder} />;
  if (!order)  return null;

  const statusClass = order.paymentStatus === "PAID" ? "status-paid" : order.paymentStatus === "FAILED" ? "status-failed" : "status-pending";

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>← Back to Orders</button>

      <div className="page-header">
        <h1>Order Details</h1>
        <p className="text-muted text-sm">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
      </div>

      {/* Status row */}
      <div className="card mb-lg" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="text-muted text-sm">Order ID</p>
          <p style={{ fontWeight: 600, fontSize: "0.85rem", wordBreak: "break-all" }}>{order._id}</p>
        </div>
        <span className={`status-badge ${statusClass}`}>{order.paymentStatus}</span>
      </div>

      {/* Items */}
      <div className="card mb-lg">
        <h3 style={{ marginBottom: "1rem" }}>Items</h3>
        <div className="order-items-list">
          {order.items.map((item, i) => (
            <div key={i} className="order-item-row">
              <img src={item.image} alt={item.name} className="order-item-img"
                onError={(e) => { e.target.src = "https://placehold.co/60x60/273338/9CB080?text=SK"; }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{item.name}</p>
                <p className="text-muted text-sm">Qty: {item.quantity}</p>
              </div>
              <p style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="flex-between">
          <span className="font-bold">Total</span>
          <span className="text-accent font-bold" style={{ fontSize: "1.2rem" }}>
            ₹{order.totalAmount?.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Shipping */}
      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Shipping Address</h3>
        <p>{order.shippingAddress.fullName}</p>
        <p className="text-muted">{order.shippingAddress.phone}</p>
        <p className="text-muted">{order.shippingAddress.addressLine1}</p>
        <p className="text-muted">{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
      </div>
    </div>
  );
}
