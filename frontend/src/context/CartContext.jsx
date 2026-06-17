import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const { data } = await cartAPI.get();
      setCart(data);
    } catch {
      setCart(null);
    }
  }, [user]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    try {
      const { data } = await cartAPI.wishlist();
      setWishlist(data);
    } catch {
      setWishlist([]);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  const addToCart = async (variantId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await cartAPI.addItem(variantId, quantity);
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    const { data } = await cartAPI.updateItem(itemId, quantity);
    setCart(data);
    return data;
  };

  const removeFromCart = async (itemId) => {
    const { data } = await cartAPI.removeItem(itemId);
    setCart(data);
    return data;
  };

  const applyCoupon = async (code) => {
    const { data } = await cartAPI.applyCoupon(code);
    setCart(data);
    return data;
  };

  const toggleWishlist = async (productId) => {
    const exists = wishlist.some((w) => w.product?.id === productId);
    if (exists) {
      await cartAPI.removeWishlist(productId);
    } else {
      await cartAPI.addWishlist(productId);
    }
    await fetchWishlist();
  };

  const isInWishlist = (productId) => wishlist.some((w) => w.product?.id === productId);

  return (
    <CartContext.Provider value={{
      cart, wishlist, loading, fetchCart, fetchWishlist,
      addToCart, updateCartItem, removeFromCart, applyCoupon,
      toggleWishlist, isInWishlist,
      cartCount: cart?.item_count || 0,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
