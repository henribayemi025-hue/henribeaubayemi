// Tests basiques du panier — logique pure, aucun réseau. Couvre la demande
// QA "ajout au panier" du cycle de maintenance staging.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './useCart';

const product = { id: 'p1', name: 'Robe test', price_fcfa: 15000, images: ['x.webp'], shop_id: 's1', shop_name: 'Boutique Test' };

beforeEach(() => {
  localStorage.clear();
});

describe('useCart', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('adds a product and sums quantities on repeat add', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    act(() => result.current.add(product, 1));
    act(() => result.current.add(product, 2));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(3);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(15000 * 3);
  });

  it('setQty updates the quantity and never goes below 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    act(() => result.current.add(product, 1));
    act(() => result.current.setQty('p1', 5));
    expect(result.current.items[0].qty).toBe(5);
    act(() => result.current.setQty('p1', 0));
    expect(result.current.items[0].qty).toBe(1); // clamped, not removed — remove() is for deletion
  });

  it('remove and clear empty the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    act(() => result.current.add(product, 1));
    act(() => result.current.remove('p1'));
    expect(result.current.items).toHaveLength(0);

    act(() => result.current.add(product, 1));
    act(() => result.current.clear());
    expect(result.current.items).toHaveLength(0);
  });

  it('persists to localStorage so a guest keeps their cart on reload', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    act(() => result.current.add(product, 2));
    const stored = JSON.parse(localStorage.getItem('finjaro_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].qty).toBe(2);
  });
});
