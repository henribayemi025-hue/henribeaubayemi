// « Ma commande » montre le message de Finjaro (0233, Beau 06/10 : « si on
// envoie un message à un acheteur, c'est via Finjaro »), et rien quand il
// n'y en a pas.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

let reponse = null;
vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn(() => Promise.resolve({ data: reponse, error: null })) },
  storageUrl: () => '',
  storageThumbUrl: () => '',
}));
vi.mock('../../components/Price', () => ({ CashPrice: () => <span>prix</span> }));
vi.mock('../../components/AppHeader', () => ({ AppHeader: ({ title }) => <h1>{title}</h1> }));

import MaCommande from './MaCommande';

const commande = (messages) => ({
  id: 'c1', order_no: 'FJ-TEST01', status: 'priced', delivery_method: 'pickup',
  created_at: '2026-10-01T10:00:00Z', total_fcfa: 15000, prenom: 'Awa',
  shop: { name: 'Boutique', slug: 'boutique', country: 'CM' },
  items: [{ name: 'Robe', qty: 1, price_fcfa: 15000, price_pending: false }],
  messages,
});

function ouvrir() {
  return render(
    <MemoryRouter initialEntries={['/ma-commande/c1']}>
      <Routes><Route path="/ma-commande/:id" element={<MaCommande />} /></Routes>
    </MemoryRouter>,
  );
}

describe('Ma commande — message de Finjaro', () => {
  beforeEach(() => { reponse = null; });

  it('affiche le message de Finjaro en haut de la page', async () => {
    reponse = commande([{ texte: 'Bonjour Awa, la boutique a fixé son prix.', created_at: '2026-10-06T08:00:00Z' }]);
    ouvrir();
    expect(await screen.findByText('Bonjour Awa, la boutique a fixé son prix.')).toBeTruthy();
    expect(screen.getByText('Message de Finjaro')).toBeTruthy();
  });

  it("n'affiche rien quand Finjaro n'a pas écrit", async () => {
    reponse = commande([]);
    ouvrir();
    expect(await screen.findByText('#FJ-TEST01')).toBeTruthy();
    expect(screen.queryByText('Message de Finjaro')).toBeNull();
  });
});
