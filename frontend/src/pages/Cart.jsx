// pages/Cart.jsx
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { useState } from "react";

export default function Cart() {
  const { cartItems, loading, error, subtotal, updateQuantity, removeFromCart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  const handleQty = async (productId, newQty, stock) => {
    if (newQty < 1 || newQty > stock || updatingId) return;
    setUpdatingId(productId);
    try { await updateQuantity(productId, newQty); }
    catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const handleRemove = async (productId) => {
    setUpdatingId(productId);
    try { await removeFromCart(productId); }
    finally { setUpdatingId(null); }
  };

  if (loading) return <Loader fullPage text="Loading cart…" />;
  if (error)   return <ErrorMessage message={error} onRetry={refreshCart} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🛒 My Cart</h1>
        <p>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</p>
      </div>

      {cartItems.length === 0 ? (
        <EmptyState icon="🛒" title="Your cart is empty" description="Add some products to get started." actionLabel="Browse Products" actionTo="/products" />
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div>
            {cartItems.map(({ product, quantity }) => (
              <div key={product._id} className="cart-item">
                <img src={product.image} alt={product.name} className="cart-item-img"
                  onError={(e) => { e.target.src = "https://placehold.co/90x90/273338/9CB080?text=SK"; }} />

                <div>
                  <p style={{ fontWeight: 600 }}>{product.name}</p>
                  <p className="text-muted text-sm">{product.category}</p>
                  <p className="product-price" style={{ fontSize: "1rem", margin: "4px 0" }}>
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => handleQty(product._id, quantity - 1, product.stock)}
                      disabled={quantity <= 1 || updatingId === product._id}>−</button>
                    <span className="qty-value">{quantity}</span>
                    <button className="qty-btn" onClick={() => handleQty(product._id, quantity + 1, product.stock)}
                      disabled={quantity >= product.stock || updatingId === product._id}>+</button>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                    ₹{(product.price * quantity).toLocaleString("en-IN")}
                  </p>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(product._id)}
                    disabled={updatingId === product._id}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="order-summary-box">
            <h3 style={{ marginBottom: "1rem" }}>Order Summary</h3>
            <div className="order-summary-row">
              <span>Items ({cartItems.reduce((s, i) => s + i.quantity, 0)})</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="order-summary-row">
              <span>Shipping</span><span className="text-success">FREE</span>
            </div>
            <div className="order-summary-row total">
              <span>Total</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: "1.5rem" }}
              onClick={() => navigate("/checkout")} id="btn-checkout">
              Proceed to Checkout →
            </button>
            <Link to="/products" className="btn btn-ghost btn-full btn-sm" style={{ marginTop: "0.75rem" }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
