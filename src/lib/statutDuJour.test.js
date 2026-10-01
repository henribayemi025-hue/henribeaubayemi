import { describe, it, expect } from 'vitest';
import { choisirArticles, prixAffiche } from './statutDuJour';

const art = (i, extra = {}) => ({ id: String(i), name: `A${i}`, price_fcfa: 1000, images: [`p${i}.jpg`], ...extra });

describe('statut du jour', () => {
  it('ne garde que les articles avec photo', () => {
    expect(choisirArticles([art(1), { id: 'x', images: [] }, art(2)]).map((a) => a.id)).toEqual(['1', '2']);
  });

  it('change de sélection d’un jour à l’autre, pas dans la journée', () => {
    const liste = Array.from({ length: 12 }, (_, i) => art(i));
    const lundi = choisirArticles(liste, new Date('2026-10-05T08:00:00Z')).map((a) => a.id);
    const lundiSoir = choisirArticles(liste, new Date('2026-10-05T20:00:00Z')).map((a) => a.id);
    const mardi = choisirArticles(liste, new Date('2026-10-06T08:00:00Z')).map((a) => a.id);
    expect(lundi).toHaveLength(3);
    expect(lundiSoir).toEqual(lundi);
    expect(mardi).not.toEqual(lundi);
  });

  it('affiche le prix dans la monnaie de la boutique, jamais sans pays', () => {
    expect(prixAffiche(art(1), 'CM')).toMatch(/FCFA/);
    expect(prixAffiche(art(1), null)).toBeNull();
    expect(prixAffiche(art(1, { price_on_request: true }), 'CM')).toBeNull();
  });
});
