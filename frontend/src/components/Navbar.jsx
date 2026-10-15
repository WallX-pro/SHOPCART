// components/Navbar.jsx
// Counts come from CartContext and WishlistContext — not local state or API calls.
// Logout calls AuthContext.logout() which sets user=null, causing Cart/Wishlist
// contexts to reset themselves via their useEffect([user]) hooks.

import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }       = useCart();
  const { wishlistCount }   = useWishlist();
  const navigate            = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to={user ? "/home" : "/login"} className="navbar-brand">
           ShopKart
        </Link>

        {/* Nav links — only visible when logged in */}
        {user && (
          <div className="navbar-links">
            <NavLink
              to="/home"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              🏠 <span>Home</span>
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              🏪 <span>Products</span>
            </NavLink>

            <NavLink
              to="/wishlist"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              id="nav-wishlist"
            >
              ❤️ <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="nav-badge">{wishlistCount}</span>
              )}
            </NavLink>

            <NavLink
              to="/cart"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              id="nav-cart"
            >
              🛒 <span>Cart</span>
              {cartCount > 0 && (
                <span className="nav-badge">{cartCount}</span>
              )}
            </NavLink>

            <NavLink
              to="/orders"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              📦 <span>Orders</span>
            </NavLink>

            <button
              className="nav-logout"
              onClick={handleLogout}
              id="btn-logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
