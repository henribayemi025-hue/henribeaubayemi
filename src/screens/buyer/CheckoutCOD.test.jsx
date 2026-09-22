// Test « passation de commande » (paiement à la livraison). Toutes les
// dépendances externes (Supabase, auth, panier, réglages, toasts,
// notifications) sont mockées: on vérifie ce qui part au serveur, pas le
// rendu visuel.
//
// La commande passe désormais par UN appel atomique `place_order`
// (migration 0042) au lieu de deux insertions séparées. Le montant n'est
// plus envoyé par le client — il est recalculé côté serveur — donc le test
// vérifie que les bonnes LIGNES de panier partent, et non un total.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const rpc = vi.fn(() =>
  Promise.resolve({ data: [{ id: 'order-1', order_no: 'ABCD1234', shop_id: 'shop-1', total_fcfa: 30000 }], error: null })
);

// La boutique du test: reglable, parce que le parcours « livraison » n'existe
// que si elle la propose — et c'est justement celui ou l'acheteuse se bloque.
const BOUTIQUE = { id: 'shop-1', name: 'Boutique Test', offers_delivery: false, delivery_fee_fcfa: 0, country: 'CM' };
function boutiqueLivre(oui) { BOUTIQUE.offers_delivery = oui; BOUTIQUE.delivery_fee_fcfa = oui ? 1000 : 0; }

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => rpc(...args),
    from: (table) => {
      if (table === 'shops') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: { ...BOUTIQUE }, error: null }) }),
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
    items: [{ id: 'p1', name: 'Robe test', price_fcfa: 15000, qty: 2, shop_id: 'shop-1', size: 'M', color: null }],
    clearShop,
  }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'buyer-1' } }),
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({ country: 'CM' }),
}));

const toastError = vi.fn();
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ error: toastError, success: vi.fn() }),
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
  rpc.mockClear();
  clearShop.mockClear();
  toastError.mockClear();
  boutiqueLivre(false);
  rpc.mockImplementation(() =>
    Promise.resolve({ data: [{ id: 'order-1', order_no: 'ABCD1234', shop_id: 'shop-1', total_fcfa: 30000 }], error: null })
  );
});

describe('CheckoutCOD — passation de commande', () => {
  it('envoie les lignes du panier à place_order et vide le panier de cette boutique', async () => {
    render(<CheckoutCOD />);

    fireEvent.click(await screen.findByText('checkout.payOnDelivery'));
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));

    const [fn, args] = rpc.mock.calls[0];
    expect(fn).toBe('place_order');
    expect(args.p_shop_id).toBe('shop-1');
    expect(args.p_method).toBe('pickup');
    expect(args.p_payment_status).toBe('cod');
    // Les articles partent par référence (id + quantité + variante): aucun
    // prix n'est envoyé, le serveur les relit lui-même.
    expect(args.p_items).toEqual([{ product_id: 'p1', qty: 2, size: 'M', color: null }]);
    expect(JSON.stringify(args)).not.toContain('15000');

    await waitFor(() => expect(clearShop).toHaveBeenCalledWith('shop-1'));
  });

  it('ne vide PAS le panier quand le serveur refuse la commande', async () => {
    // Exactement le bug corrigé: un article du panier n'existe plus. Avant,
    // l'erreur était avalée, le panier vidé et « commande passée » affiché.
    rpc.mockImplementation(() => Promise.resolve({ data: null, error: { message: 'product_missing' } }));

    render(<CheckoutCOD />);
    fireEvent.click(await screen.findByText('checkout.payOnDelivery'));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('checkout.errProductMissing'));
    expect(clearShop).not.toHaveBeenCalled();
    expect(screen.queryByText('checkout.successTitle')).toBeNull();
  });
});

// Le 22/09, une acheteuse réelle a atteint cet écran deux fois en deux jours
// sans jamais commander, puis a cliqué pour joindre la vendeuse la minute
// suivante. Le bouton restait vif alors que le formulaire de livraison était
// incomplet, et le clic sortait en SILENCE: les messages rouges apparaissent
// au-dessus, dans le formulaire, alors que la barre de boutons est collée en
// bas. Sur 390 px, elle ne les voit pas. « J'appuie, il ne se passe rien. »
describe('CheckoutCOD — livraison: le refus doit se voir', () => {
  async function passerEnLivraison() {
    boutiqueLivre(true);
    render(<CheckoutCOD />);
    fireEvent.click(await screen.findByText('checkout.delivery'));
  }

  it('désactive le bouton tant que les champs obligatoires manquent', async () => {
    await passerEnLivraison();
    const bouton = screen.getByText('checkout.payOnDelivery').closest('button');
    expect(bouton.disabled).toBe(true);
  });

  it('le clic ne part pas au serveur tant que le formulaire est incomplet', async () => {
    await passerEnLivraison();
    // Un bouton desactive n'emet plus d'evenement: c'est precisement la
    // protection. Le message reste comme filet pour tout chemin qui
    // appellerait `submit` autrement.
    fireEvent.click(screen.getByText('checkout.payOnDelivery'));
    await new Promise((r) => setTimeout(r, 50));
    expect(rpc).not.toHaveBeenCalled();
  });

  it('une espace ne vaut pas une adresse: le bouton reste desactive', async () => {
    await passerEnLivraison();
    const remplir = (id, v) => fireEvent.change(document.getElementById(id), { target: { value: v } });
    remplir('co-name', 'Blanche');
    remplir('co-phone', '699411208');
    remplir('co-address', '   ');
    remplir('co-city', 'Yaounde');
    const bouton = screen.getByText('checkout.payOnDelivery').closest('button');
    await new Promise((r) => setTimeout(r, 50));
    expect(bouton.disabled).toBe(true);
  });

  it('accepte un numéro écrit avec des points — « 6.99.41.12.08 »', async () => {
    await passerEnLivraison();
    const remplir = (label, valeur) =>
      fireEvent.change(document.getElementById(label), { target: { value: valeur } });
    remplir('co-name', 'Blanche');
    remplir('co-phone', '6.99.41.12.08');
    remplir('co-address', 'Rue 1234');
    remplir('co-city', 'Yaoundé');

    const bouton = screen.getByText('checkout.payOnDelivery').closest('button');
    await waitFor(() => expect(bouton.disabled).toBe(false));

    fireEvent.click(bouton);
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    expect(rpc.mock.calls[0][1].p_buyer_phone).toBe('6.99.41.12.08');
  });
});
