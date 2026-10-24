import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "../api/cartApi";
import { parseApiError } from "../utils/apiErrors";
import { useAuth } from "./AuthContext";

const EMPTY_CART = {
  items: [], total_quantity: 0, subtotal: "0.00", gst_percent: "0", tax_amount: "0.00", total: "0.00", has_issues: false,
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const isCustomer = user?.role === "customer";
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    const { data } = await getCart();
    setCart(data);
    return data;
  }, []);

  // Load the cart when a customer logs in; clear it on logout.
  useEffect(() => {
    if (!isCustomer) { setCart(EMPTY_CART); return undefined; }
    let cancelled = false;
    setLoading(true);
    getCart()
      .then((res) => !cancelled && setCart(res.data))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [isCustomer, user?.id]);

  // Runs one cart request, stores the returned cart, and reports errors as toasts.
  const run = useCallback(async (request, successMessage) => {
    try {
      const { data } = await request();
      setCart(data);
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      toast.error(message || Object.values(fieldErrors)[0] || "Could not update the cart.");
      return false;
    }
  }, []);

  const addItem = useCallback((payload, name) => run(() => addCartItem(payload), `${name} added to cart`), [run]);
  const updateQuantity = useCallback((id, quantity) => run(() => updateCartItem(id, quantity)), [run]);
  const removeItem = useCallback((id) => run(() => removeCartItem(id), "Item removed"), [run]);

  const value = useMemo(
    () => ({ cart, loading, itemCount: cart.total_quantity, addItem, updateQuantity, removeItem, refreshCart }),
    [cart, loading, addItem, updateQuantity, removeItem, refreshCart]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};