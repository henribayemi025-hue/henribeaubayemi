// L'accueil ne montre que des articles avec un prix affiché (Beau, 05/10).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('./supabase', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

import { fetchProductPage, aPrixAffiche, HOME_PAGE_SIZE } from './homeCache';

const article = (i, prix) => ({ id: `a${i}`, price_fcfa: prix, price_on_request: prix == null, category: 'mode' });

describe('aPrixAffiche', () => {
  it('écarte le prix sur demande, le prix vide et les catégories sur devis', () => {
    expect(aPrixAffiche(article(1, 5000))).toBe(true);
    expect(aPrixAffiche(article(2, null))).toBe(false);
    expect(aPrixAffiche({ id: 'x', price_fcfa: 0 })).toBe(false);
    expect(aPrixAffiche({ id: 'y', price_fcfa: 9000000, category: 'immobilier_vente' })).toBe(false);
  });
});

describe('fetchProductPage', () => {
  beforeEach(() => rpc.mockReset());

  it('ne garde que les articles avec prix, et compte les lignes lues pour la suite', async () => {
    // Le catalogue « ailleurs » : 30 articles, un sur deux sans prix.
    const catalogue = Array.from({ length: 30 }, (_, i) => article(i, i % 2 ? null : 1000 + i));
    rpc.mockImplementation(async (nom, a = {}) => { if (nom !== 'home_feed_page') return { data: null, error: null }; const { p_limit, p_offset } = a; return ({ data: catalogue.slice(p_offset, p_offset + p_limit), error: null }); });
    const page = await fetchProductPage(null, null);
    expect(page.items.length).toBe(15);
    expect(page.items.every(aPrixAffiche)).toBe(true);
    expect(page.cursor.rest).toBe(30);
    expect(page.done).toBe(true);
  });

  it('remplit une page entière en un seul appel quand le catalogue le permet', async () => {
    const catalogue = Array.from({ length: 200 }, (_, i) => article(i, 2000));
    rpc.mockImplementation(async (nom, a = {}) => { if (nom !== 'home_feed_page') return { data: null, error: null }; const { p_limit, p_offset } = a; return ({ data: catalogue.slice(p_offset, p_offset + p_limit), error: null }); });
    const page = await fetchProductPage(null, null);
    expect(page.items.length).toBeGreaterThanOrEqual(HOME_PAGE_SIZE);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
