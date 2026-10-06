import { describe, it, expect } from 'vitest';
import { jauge, zone, tirer, compter, scoreVide, ballon, DUREE_VOL, PERIODE } from './basket';

describe('le basket', () => {
  it('la jauge monte puis redescend, et reste entre 0 et 1', () => {
    expect(jauge(0)).toBe(0);
    expect(jauge(PERIODE / 2)).toBeCloseTo(1);
    expect(jauge(PERIODE)).toBeCloseTo(0);
    for (let t = -3; t < 5; t += 0.07) { const v = jauge(t); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });

  it('de loin, la zone est plus haute et plus petite', () => {
    const pres = zone(1), loin = zone(9);
    expect(loin.centre).toBeGreaterThan(pres.centre);
    expect(loin.a - loin.de).toBeLessThan(pres.a - pres.de);
    expect(loin.a).toBeLessThanOrEqual(1);
  });

  it('dans la zone : panier, 2 points de près, 3 au-delà de 6,75 m', () => {
    expect(tirer(zone(3).centre, 3)).toEqual({ reussi: true, points: 2, ecart: 0 });
    expect(tirer(zone(8).centre, 8)).toMatchObject({ reussi: true, points: 3 });
  });

  it('hors zone : raté, trop court ou trop long', () => {
    expect(tirer(0, 4).ecart).toBeLessThan(0);
    expect(tirer(1, 2).ecart).toBeGreaterThan(0);
    expect(tirer(0, 4).points).toBe(0);
  });

  it('compte les points et les séries', () => {
    let s = scoreVide();
    s = compter(s, { reussi: true, points: 2 });
    s = compter(s, { reussi: true, points: 3 });
    s = compter(s, { reussi: false, points: 0 });
    s = compter(s, { reussi: true, points: 2 });
    expect(s).toEqual({ points: 7, tirs: 4, reussis: 3, serie: 1, meilleureSerie: 2 });
  });

  it('le ballon part des mains, monte, et arrive dans le cercle (ou à côté si raté)', () => {
    const depart = { x: 0, y: 2, z: 0 }, cercle = { x: 6, y: 3.05, z: 0 };
    expect(ballon(depart, cercle, 0)).toEqual(depart);
    const fin = ballon(depart, cercle, DUREE_VOL);
    expect(fin.x).toBeCloseTo(6); expect(fin.y).toBeCloseTo(3.05);
    expect(ballon(depart, cercle, DUREE_VOL / 2).y).toBeGreaterThan(3.05);
    expect(ballon(depart, cercle, DUREE_VOL, -0.2).x).toBeLessThan(6); // trop court
    expect(ballon(depart, cercle, DUREE_VOL, 0.2).x).toBeGreaterThan(6); // trop long
  });
});
