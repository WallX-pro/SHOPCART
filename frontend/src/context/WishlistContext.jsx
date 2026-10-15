// context/WishlistContext.jsx
// Wishlist state fetched once after login, reset on logout.
// Exposes isInWishlist() so ProductCard / ProductDetails can reflect state
// without making per-component API calls.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    if (user) {
      refreshWishlist();
    } else {
      setWishlistItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/wishlist");
      setWishlistItems(data.wishlist || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (productId) => {
    const { data } = await api.post(`/wishlist/${productId}`);
    setWishlistItems(data.wishlist || []);
    return data;
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    const { data } = await api.delete(`/wishlist/${productId}`);
    setWishlistItems(data.wishlist || []);
    return data;
  }, []);

  const isInWishlist = useCallback(
    (productId) => wishlistItems.some((item) => item._id === productId),
    [wishlistItems]
  );

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        error,
        wishlistCount,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => useContext(WishlistContext);
