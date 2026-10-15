// components/ProductCard.jsx

import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useState } from "react";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart }                   = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [cartStatus, setCartStatus]         = useState("idle"); // idle | loading | done
  const [wishStatus, setWishStatus]         = useState("idle"); // idle | loading
  const [cartError, setCartError]           = useState("");

  const inWishlist = isInWishlist(product._id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (outOfStock || cartStatus === "loading") return;
    setCartStatus("loading");
    setCartError("");
    try {
      await addToCart(product._id);
      setCartStatus("done");
      setTimeout(() => setCartStatus("idle"), 2000);
    } catch (err) {
      setCartError(err.response?.data?.message || "Failed to add");
      setCartStatus("idle");
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (wishStatus === "loading") return;
    setWishStatus("loading");
    try {
      if (inWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (err) {
      // 409 = already in wishlist — treat as success
      if (err.response?.status !== 409) {
        console.error(err);
      }
    } finally {
      setWishStatus("idle");
    }
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/products/${product._id}`)}
      role="article"
      aria-label={product.name}
    >
      <div className="product-card-img-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img"
          onError={(e) => { e.target.src = "https://placehold.co/400x300/273338/9CB080?text=ShopKart"; }}
        />
      </div>

      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <p className="product-name">{product.name}</p>
        <p className="product-price">₹{product.price.toLocaleString("en-IN")}</p>
        <p className={`product-stock ${outOfStock ? "out" : ""}`}>
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </p>
        {cartError && <p className="field-error">{cartError}</p>}
      </div>

      <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1 }}
          onClick={handleAddToCart}
          disabled={outOfStock || cartStatus === "loading"}
          id={`btn-add-cart-${product._id}`}
        >
          {outOfStock
            ? "Out of Stock"
            : cartStatus === "loading"
            ? "Adding…"
            : cartStatus === "done"
            ? "✓ Added"
            : "Add to Cart"}
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleWishlist}
          disabled={wishStatus === "loading"}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          id={`btn-wish-${product._id}`}
          style={{ minWidth: 36 }}
        >
          {wishStatus === "loading" ? "⏳" : inWishlist ? "❤️" : "🤍"}
        </button>
      </div>
    </div>
  );
}
