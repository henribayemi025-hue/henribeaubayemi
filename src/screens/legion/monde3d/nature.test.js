import { describe, it, expect } from 'vitest';
import { axeRuisseau, distanceAxe, dansEau, placerGalets, placerRochers, placerTouffes, placerRoseaux, placerArbres, placePont, BANDE, SOURCE, MARE, surButte, alea } from './nature';

const pts = axeRuisseau();

describe('le ruisseau de la campagne', () => {
  it('part du tunnel côté ville et finit à la mare, sans sortir de la bande entre la route et les champs', () => {
    expect(pts[0].x).toBeCloseTo(SOURCE.x, 5);
    expect(pts.at(-1).x).toBeLessThan(MARE.x + 6);
    for (const p of pts) {
      expect(p.z - p.l).toBeGreaterThan(BANDE.z0);
      expect(p.z + p.l).toBeLessThan(BANDE.z1);
      expect(p.l).toBeGreaterThan(1.5);
    }
    // La distance parcourue croît d'un point à l'autre.
    for (let i = 1; i < pts.length; i += 1) expect(pts[i].s).toBeGreaterThan(pts[i - 1].s);
  });

  it('sait dire si un point est dans l’eau', () => {
    const p = pts[60];
    expect(dansEau(pts, p.x, p.z)).toBe(true);
    expect(dansEau(pts, p.x, p.z + p.l + 3)).toBe(false);
    expect(dansEau(pts, MARE.x, MARE.z)).toBe(true);
    expect(distanceAxe(pts, p.x, p.z).d).toBeLessThan(0.01);
  });

  it('ne pose ni herbe, ni arbre, ni roseau dans l’eau ou sur la butte du tunnel', () => {
    for (const t of placerTouffes(pts, 800)) { expect(dansEau(pts, t.x, t.z, 0.2)).toBe(false); expect(surButte(t.x, t.z, -0.5)).toBe(false); }
    for (const a of placerArbres(pts, 30)) expect(dansEau(pts, a.x, a.z, 1.9)).toBe(false);
    for (const r of placerRoseaux(pts, 200)) expect(dansEau(pts, r.x, r.z)).toBe(false);
  });

  it('pose surtout les galets dans le lit, à demi immergés', () => {
    const g = placerGalets(pts, 300);
    expect(g.length).toBe(300);
    const dedans = g.filter((x) => x.eau).length;
    expect(dedans / g.length).toBeGreaterThan(0.55);
    for (const x of g) { expect(x.x).toBeGreaterThan(BANDE.x0); expect(x.x).toBeLessThan(BANDE.x1); }
  });

  it('laisse libre le passage du pont de bois', () => {
    const pont = placePont(pts);
    expect(pont.longueur).toBeGreaterThan(6);
    expect(placerRochers(pts, 20, 11, pont).every((r) => Math.abs(r.x - pont.x) >= 4)).toBe(true);
    expect(placerArbres(pts, 30, 9, pont).every((a) => Math.abs(a.x - pont.x) >= 5)).toBe(true);
  });

  it('garde le même plan d’une visite à l’autre', () => {
    expect(placerGalets(pts, 20)).toEqual(placerGalets(pts, 20));
    const a = alea(42), b = alea(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
