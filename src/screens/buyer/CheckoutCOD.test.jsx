// Test basique "passation de commande" (paiement à la livraison) — couvre la
// demande QA du cycle de maintenance staging. Toutes les dépendances externes
// (Supabase, auth, panier, réglages, toasts, notifications) sont mockées: on
// vérifie que soumettre la commande envoie exactement les bonnes lignes à
// `orders`/`order_items`, pas le rendu visuel.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const insertOrders = vi.fn(() => ({
  select: () => ({
    single: () => Promise.resolve({ data: { id: 'order-1', order_no: 'ABCD1234', shop_id: 'shop-1' }, error: null }),
  }),
}));
const insertOrderItems = vi.fn(() => Promise.resolve({ data: null, error: null }));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => {
      if (table === 'orders') return { insert: insertOrders };
      if (table === 'order_items') return { insert: insertOrderItems };
      if (table === 'shops') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'shop-1', name: 'Boutique Test', offers_delivery: false, delivery_fee_fcfa: 0, country: 'CM' }, error: null }) }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
    },
    functions: { invoke: vi.fn() },
  },
}));

const clearShop = vi.fn();
vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({
    items: [{ id: 'p1', name: 'Robe test', price_fcfa: 15000, qty: 2, shop_id: 'shop-1' }],
    clearShop,
  }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'buyer-1' } }),
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ country: 'CM' }),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock('../../lib/notify', () => ({ pushNotify: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'fr' } }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ shopId: 'shop-1' }),
  useNavigate: () => vi.fn(),
}));

import CheckoutCOD from './CheckoutCOD';

beforeEach(() => {
  insertOrders.mockClear();
  insertOrderItems.mockClear();
  clearShop.mockClear();
});

describe('CheckoutCOD — passation de commande', () => {
  it('crée la commande avec le bon total et vide le panier de cette boutique', async () => {
    render(<CheckoutCOD />);

    const payButton = await screen.findByText('checkout.payOnDelivery');
    fireEvent.click(payButton);

    await waitFor(() => expect(insertOrders).toHaveBeenCalledTimes(1));

    const orderPayload = insertOrders.mock.calls[0][0];
    expect(orderPayload.buyer_id).toBe('buyer-1');
    expect(orderPayload.shop_id).toBe('shop-1');
    expect(orderPayload.subtotal_fcfa).toBe(30000); // 15000 x 2
    expect(orderPayload.total_fcfa).toBe(30000); // ramassage: pas de frais de livraison
    expect(orderPayload.payment_status).toBe('cod');

    await waitFor(() => expect(insertOrderItems).toHaveBeenCalledTimes(1));
    const itemsPayload = insertOrderItems.mock.calls[0][0];
    expect(itemsPayload).toEqual([{ order_id: 'order-1', product_id: 'p1', name: 'Robe test', price_fcfa: 15000, qty: 2 }]);

    await waitFor(() => expect(clearShop).toHaveBeenCalledWith('shop-1'));
  });
});
