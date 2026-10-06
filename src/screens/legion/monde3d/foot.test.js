import { describe, it, expect } from 'vitest';
import { visee, puissance, plongeon, tirerAuBut, compterTirs, tirsVide } from './foot';

describe('les tirs au but', () => {
  it('la visée va d’un poteau à l’autre, la puissance de 0 à 1', () => {
    for (let s = 0; s < 4; s += 0.05) {
      expect(visee(s)).toBeGreaterThanOrEqual(-1); expect(visee(s)).toBeLessThanOrEqual(1);
      expect(puissance(s)).toBeGreaterThanOrEqual(0); expect(puissance(s)).toBeLessThanOrEqual(1);
    }
  });

  it('le gardien plonge de façon fixe, et varie d’un tir à l’autre', () => {
    expect(plongeon(0)).toBe(plongeon(12));
    expect(new Set([0, 1, 2, 3, 4].map(plongeon)).size).toBeGreaterThan(1);
  });

  it('du côté opposé au plongeon, une bonne frappe fait but', () => {
    const g = plongeon(0); // 1 : il plonge à droite
    expect(tirerAuBut(-0.6, 0.6, 0).issue).toBe(g === 1 ? 'but' : 'arret');
  });

  it('du même côté : arrêt, sauf une frappe forte dans la lucarne', () => {
    expect(tirerAuBut(0.5, 0.6, 0).issue).toBe('arret');
    expect(tirerAuBut(0.85, 0.8, 0).issue).toBe('but');
  });

  it('trop large, trop haut, trop mou', () => {
    expect(tirerAuBut(0.97, 0.6, 0).issue).toBe('cote');
    expect(tirerAuBut(0, 0.97, 2).issue).toBe('dessus');
    expect(tirerAuBut(-0.6, 0.1, 0).issue).toBe('arret');
  });

  it('compte buts et séries', () => {
    let s = tirsVide();
    for (const issue of ['but', 'but', 'arret', 'but']) s = compterTirs(s, { issue });
    expect(s).toEqual({ buts: 3, tirs: 4, serie: 1, meilleureSerie: 2 });
  });
});
