// pages/Home.jsx

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Home() {
  const { user }          = useAuth();
  const { cartCount }     = useCart();
  const { wishlistCount } = useWishlist();

  const initial = user?.fullName?.[0]?.toUpperCase() || "U";

  return (
    <div className="home-hero">
      <div className="hero-content">
        {/* Greeting chip */}
        <div className="hero-greeting">
          <span>👋</span>
          <span>Hello, {user?.fullName?.split(" ")[0]}!</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">
          Welcome to{" "}
          <span className="gradient-text">ShopKart</span>
        </h1>

        <p className="hero-desc">
          Discover thousands of products across Electronics, Fashion, Books
          and Home essentials — all in one place.
        </p>

        {/* CTA */}
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-lg" id="btn-browse">
            🛍️ Browse Products
          </Link>
          {cartCount > 0 && (
            <Link to="/cart" className="btn btn-secondary btn-lg">
              🛒 View Cart ({cartCount})
            </Link>
          )}
        </div>

        {/* User info card */}
        <div style={{ marginTop: "3rem" }}>
          <div className="user-card">
            <div className="user-avatar">{initial}</div>

            <div className="user-info-row">
              <span className="user-info-label">Name</span>
              <span className="user-info-value">{user?.fullName}</span>
            </div>
            <div className="user-info-row">
              <span className="user-info-label">Email</span>
              <span className="user-info-value">{user?.email}</span>
            </div>
            <div className="user-info-row">
              <span className="user-info-label">Phone</span>
              <span className="user-info-value">{user?.phone}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">{cartCount}</div>
            <div className="stat-label">Items in Cart</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{wishlistCount}</div>
            <div className="stat-label">Wishlist Items</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
}
