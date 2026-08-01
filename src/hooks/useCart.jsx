import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartCtx = createContext(null);
const KEY = 'finjaro_cart';

// Une ligne de panier = un produit DANS UNE VARIANTE précise (taille/couleur).
// La même robe en M et en XL fait deux lignes — sinon la boutique reçoit
// « Robe × 2 » sans savoir quelles tailles préparer.
function lineKey(id, size, color) {
  return `${id}::${size || ''}::${color || ''}`;
}

// Cart persists in localStorage so guests can shop; grouped by shop for COD checkout.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY)) || [];
      // Rétrocompat: les paniers d'avant les variantes n'ont pas de `key`.
      return stored.map((i) => ({ ...i, key: i.key || lineKey(i.id, i.size, i.color) }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Drives the confirmation mini-drawer: bumps a nonce on every add so the
  // drawer re-opens even when the same product is added twice.
  const [justAdded, setJustAdded] = useState(null);
  const dismissJustAdded = useCallback(() => setJustAdded(null), []);

  const add = useCallback((product, qty = 1, variant = {}) => {
    const size = variant.size || null;
    const color = variant.color || null;
    const key = lineKey(product.id, size, color);
    const line = {
      key,
      id: product.id,
      name: product.name,
      price_fcfa: product.price_fcfa,
      image: product.images?.[0] || null,
      shop_id: product.shop_id,
      shop_name: product.shop_name || '',
      size,
      color,
      qty,
    };
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, line];
    });
    setJustAdded({ item: line, n: Date.now() });
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)).filter((i) => i.qty > 0)
    );
  }, []);

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const clearShop = useCallback(
    (shopId) => setItems((prev) => prev.filter((i) => i.shop_id !== shopId)),
    []
  );

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price_fcfa * i.qty, 0), [items]);

  const value = { items, add, setQty, remove, clear, clearShop, count, subtotal, justAdded, dismissJustAdded };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
