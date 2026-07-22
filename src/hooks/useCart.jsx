import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartCtx = createContext(null);
const KEY = 'finjaro_cart';

// Cart persists in localStorage so guests can shop; grouped by shop for COD checkout.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price_fcfa: product.price_fcfa,
          image: product.images?.[0] || null,
          shop_id: product.shop_id,
          shop_name: product.shop_name || '',
          qty,
        },
      ];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)).filter((i) => i.qty > 0)
    );
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const clearShop = useCallback(
    (shopId) => setItems((prev) => prev.filter((i) => i.shop_id !== shopId)),
    []
  );

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price_fcfa * i.qty, 0), [items]);

  const value = { items, add, setQty, remove, clear, clearShop, count, subtotal };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
