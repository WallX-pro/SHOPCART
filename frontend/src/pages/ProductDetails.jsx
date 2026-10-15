// pages/ProductDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [cartStatus, setCartStatus] = useState("idle");
  const [wishStatus, setWishStatus] = useState("idle");
  const [cartMsg, setCartMsg]   = useState("");

  const fetchProduct = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load product");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProduct(); }, [id]); // eslint-disable-line

  const handleAddToCart = async () => {
    if (cartStatus === "loading") return;
    setCartStatus("loading"); setCartMsg("");
    try {
      await addToCart(product._id);
      setCartStatus("done"); setCartMsg("Added to cart!");
      setTimeout(() => setCartStatus("idle"), 2000);
    } catch (err) {
      setCartMsg(err.response?.data?.message || "Failed to add");
      setCartStatus("idle");
    }
  };

  const handleWishlist = async () => {
    if (wishStatus === "loading") return;
    setWishStatus("loading");
    try {
      if (isInWishlist(product._id)) await removeFromWishlist(product._id);
      else await addToWishlist(product._id);
    } catch (err) {
      if (err.response?.status !== 409) console.error(err);
    } finally { setWishStatus("idle"); }
  };

  if (loading) return <Loader fullPage />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchProduct} />;
  if (!product) return null;

  const outOfStock = product.stock === 0;
  const inWishlist = isInWishlist(product._id);

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>← Back</button>

      <div className="product-detail-layout">
        <div>
          <img src={product.image} alt={product.name} className="product-detail-img"
            onError={(e) => { e.target.src = "https://placehold.co/600x450/273338/9CB080?text=ShopKart"; }} />
        </div>

        <div>
          <span className="product-category">{product.category}</span>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.8rem" }}>{product.name}</h1>
          <p className="product-detail-price">₹{product.price.toLocaleString("en-IN")}</p>
          <p className={`product-stock ${outOfStock ? "out" : ""}`} style={{ marginBottom: "1.5rem" }}>
            {outOfStock ? "❌ Out of stock" : `✅ ${product.stock} units available`}
          </p>
          <p className="product-detail-desc">{product.description}</p>

          {cartMsg && (
            <div className={`alert ${cartStatus === "done" ? "alert-success" : "alert-error"}`}>
              {cartMsg}
            </div>
          )}

          <div className="product-detail-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAddToCart}
              disabled={outOfStock || cartStatus === "loading"}
              id="btn-add-to-cart"
            >
              {outOfStock ? "Out of Stock" : cartStatus === "loading" ? "Adding…" : cartStatus === "done" ? "✓ Added to Cart" : "🛒 Add to Cart"}
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={handleWishlist}
              disabled={wishStatus === "loading"}
              id="btn-wishlist"
            >
              {wishStatus === "loading" ? "⏳ Saving…" : inWishlist ? "❤️ In Wishlist" : "🤍 Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
