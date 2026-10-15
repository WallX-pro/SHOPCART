// pages/Checkout.jsx — full Razorpay implementation in Milestone 6
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const INITIAL = { fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "" };

function loadRazorpay() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id  = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { user }                    = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const navigate                    = useNavigate();

  const [form, setForm]         = useState(INITIAL);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [processing, setProcessing] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())     e.fullName     = "Full name is required";
    if (!/^\d{10}$/.test(form.phone)) e.phone    = "Phone must be 10 digits";
    if (!form.addressLine1.trim()) e.addressLine1 = "Address is required";
    if (!form.city.trim())         e.city         = "City is required";
    if (!form.state.trim())        e.state        = "State is required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Pincode must contain 6 digits";
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
    setApiError("");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (cartItems.length === 0)   { setApiError("Your cart is empty"); return; }

    setProcessing(true);
    setApiError("");

    try {
      const rzLoaded = await loadRazorpay();
      if (!rzLoaded) { setApiError("Failed to load payment gateway. Please try again."); setProcessing(false); return; }

      const { data } = await api.post("/orders/create-payment-order", { shippingAddress: form });

      const options = {
        key:      data.key,
        amount:   data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name:     "ShopKart",
        description: "Order Payment",
        prefill: { name: user.fullName, email: user.email, contact: user.phone },
        theme:   { color: "#9CB080" },

        handler: async (response) => {
          try {
            const verify = await api.post("/orders/verify-payment", {
              shopKartOrderId:    data.shopKartOrderId,
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            clearCart();
            navigate(`/order-success/${verify.data.order._id}`);
          } catch (err) {
            setApiError(err.response?.data?.message || "Payment verification failed");
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: () => { setProcessing(false); },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (response) => {
        try { await api.post("/orders/payment-failed", { shopKartOrderId: data.shopKartOrderId }); } catch {}
        setApiError(`Payment failed: ${response.error.description}. Your cart is safe — try again.`);
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to create order");
      setProcessing(false);
    }
  };

  const Field = ({ name, label, placeholder, type = "text" }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`checkout-${name}`}>{label}</label>
      <input id={`checkout-${name}`} name={name} type={type}
        className={`form-input ${errors[name] ? "error" : ""}`}
        placeholder={placeholder} value={form[name]} onChange={handleChange} />
      {errors[name] && <span className="field-error">⚠ {errors[name]}</span>}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header"><h1>💳 Checkout</h1><p>Enter your shipping details</p></div>

      {apiError && <div className="alert alert-error mb-lg">⚠️ {apiError}</div>}

      <div className="checkout-layout">
        {/* Shipping Form */}
        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>📦 Shipping Address</h3>
            <Field name="fullName" label="Full Name" placeholder="Recipient name" />
            <Field name="phone" label="Phone" placeholder="10-digit mobile" type="tel" />
            <Field name="addressLine1" label="Address" placeholder="House no, Street, Area" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field name="city" label="City" placeholder="Mumbai" />
              <Field name="state" label="State" placeholder="Maharashtra" />
            </div>
            <Field name="pincode" label="Pincode" placeholder="6-digit pincode" />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={processing} id="btn-place-order">
            {processing ? "Processing…" : "🔒 Place Order & Pay"}
          </button>
        </form>

        {/* Order Summary */}
        <div className="order-summary-box">
          <h3 style={{ marginBottom: "1rem" }}>Order Summary</h3>
          {cartItems.map(({ product, quantity }) => (
            <div key={product._id} className="order-summary-row">
              <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {product.name} × {quantity}
              </span>
              <span>₹{(product.price * quantity).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="order-summary-row total">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-muted text-sm" style={{ marginTop: "0.75rem", textAlign: "center" }}>
            🔒 Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
