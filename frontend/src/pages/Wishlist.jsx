// pages/Wishlist.jsx
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

export default function Wishlist() {
  const { wishlistItems, loading, error, removeFromWishlist, refreshWishlist } = useWishlist();
  const navigate = useNavigate();

  if (loading) return <Loader fullPage text="Loading wishlist…" />;
  if (error)   return <ErrorMessage message={error} onRetry={refreshWishlist} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>❤️ My Wishlist</h1>
        <p>{wishlistItems.length} saved item{wishlistItems.length !== 1 ? "s" : ""}</p>
      </div>

      {wishlistItems.length === 0 ? (
        <EmptyState icon="🤍" title="Your wishlist is empty" description="Save items you love and find them here." actionLabel="Browse Products" actionTo="/products" />
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-card-img-wrap">
                <img src={product.image} alt={product.name} className="product-card-img"
                  onError={(e) => { e.target.src = "https://placehold.co/400x300/273338/9CB080?text=ShopKart"; }} />
              </div>
              <div className="product-card-body">
                <span className="product-category">{product.category}</span>
                <p className="product-name">{product.name}</p>
                <p className="product-price">₹{product.price.toLocaleString("en-IN")}</p>
                <p className={`product-stock ${product.stock === 0 ? "out" : ""}`}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                </p>
              </div>
              <div className="product-card-actions">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/products/${product._id}`)}>
                  View Details
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removeFromWishlist(product._id)} id={`btn-remove-wish-${product._id}`}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
