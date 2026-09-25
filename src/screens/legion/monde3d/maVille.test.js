// La ville de chacun : les bâtiments viennent des vraies boutiques et des vrais clients.
import { describe, it, expect } from 'vitest';
import { batirVille, prenom, MAX_CLIENTS } from './maVille';

describe('la ville de chacun', () => {
  const boutiques = [{ id: 's1', name: 'Maison Kora', slug: 'kora', avatar_url: 'a.jpg' }, { id: 's2', name: 'Atelier Neuf', slug: 'neuf' }];
  const articles = [{ shop_id: 's1' }, { shop_id: 's1' }, { shop_id: 's1' }, { shop_id: 's1', is_active: false }, { shop_id: 's2' }];
  const commandes = [
    { id: 1, shop_id: 's1', buyer_id: 'u1', buyer_name: 'awa MBALLA', delivered_at: '2026-09-20' },
    { id: 2, shop_id: 's1', buyer_id: 'u1', buyer_name: 'Awa Mballa', status: 'confirmed' },
    { id: 3, shop_id: 's1', buyer_id: 'test', buyer_name: 'Compte Test', delivered_at: '2026-09-21' },
    { id: 4, shop_id: 's1', guest_id: 'g1', buyer_name: 'Paul', status: 'cancelled' },
    { id: 5, shop_id: 's2', guest_id: 'g2', buyer_name: 'Ines Dia', status: 'pending' },
  ];
  const reels = new Set(['u1']);
  it('une boutique grandit avec ses commandes livrées et ses articles en ligne', () => {
    const v = batirVille({ boutiques, articles, commandes, reels });
    const kora = v.boutiques.find((b) => b.id === 's1');
    expect(kora).toMatchObject({ articles: 3, commandes: 2, livrees: 1, etages: 3, image: 'a.jpg' });
    expect(v.boutiques.find((b) => b.id === 's2').etages).toBe(1);
    expect(v.boutiques[0].id).toBe('s1'); // la plus active d'abord
  });
  it('un client par personne, prénom seulement ; ni comptes de test ni commandes annulées', () => {
    const v = batirVille({ boutiques, articles, commandes, reels });
    expect(v.clients.map((c) => c.prenom)).toEqual(['Awa', 'Ines']);
    expect(v.clients[0]).toMatchObject({ commandes: 2, livrees: 1, etages: 2 });
    expect(v.totalClients).toBe(2);
  });
  it('quelqu\'un qui arrive n\'a encore rien : pas de bâtiment inventé', () => {
    expect(batirVille({})).toEqual({ boutiques: [], clients: [], totalClients: 0 });
  });
  it('limite le nombre de maisons de clients affichées', () => {
    const beaucoup = Array.from({ length: 30 }, (_, i) => ({ id: i, shop_id: 's1', guest_id: `g${i}`, buyer_name: `Client${i}` }));
    expect(batirVille({ boutiques, commandes: beaucoup }).clients).toHaveLength(MAX_CLIENTS);
    expect(prenom('  jean-pierre  dupont ')).toBe('Jean-pierre');
  });
});
