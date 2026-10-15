// context/CartContext.jsx
// Single source of truth for the shopping cart.
// Fetched once after login; every mutation updates from the server response
// so the Navbar count and Cart page are always in sync.
// cartCount and subtotal are DERIVED — never stored — to prevent stale data.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Fetch cart whenever user logs in or changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]); // reset on logout
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/cart");
      setCartItems(data.cart || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId) => {
    const { data } = await api.post(`/cart/${productId}`);
    setCartItems(data.cart || []);
    return data;
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCartItems(data.cart || []);
    return data;
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const { data } = await api.patch(`/cart/${productId}`, { quantity });
    setCartItems(data.cart || []);
    return data;
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Derived values — computed fresh on every render, never stored
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal  = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        cartCount,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
