import { describe, it, expect } from 'vitest';
import { parcelles } from './immeubles3d';

// Les 16 îlots du bord de la ville (ville3d.js : routes à ±78 et ±26, ±200 de côté).
const xs = [-200, -78, -26, 26, 78, 200], zs = [-200, -74, -22, 30, 82, 200];
const ilots = [];
for (let i = 0; i < 5; i += 1) for (let j = 0; j < 5; j += 1) {
  if (!(i === 0 || i === 4 || j === 0 || j === 4)) continue;
  ilots.push({ x0: xs[i] + (i ? 6 : 0), x1: xs[i + 1] - (i < 4 ? 6 : 0), z0: zs[j] + (j ? 6 : 0), z1: zs[j + 1] - (j < 4 ? 6 : 0) });
}
const dedans = (b, il) => b.x - b.w / 2 >= il.x0 + 4.4 && b.x + b.w / 2 <= il.x1 - 4.4 && b.z - b.d / 2 >= il.z0 + 4.4 && b.z + b.d / 2 <= il.z1 - 4.4;

describe('quartiers denses', () => {
  it('des centaines d\'immeubles à l\'ordinateur, moins au téléphone', () => {
    const l = parcelles(ilots);
    expect(l.length).toBeGreaterThan(200);
    expect(l.length).toBeLessThan(700);
    const m = parcelles(ilots, { mobile: true });
    expect(m.length).toBeLessThan(l.length);
    expect(m.length).toBeGreaterThan(60);
  });
  it('chaque immeuble reste dans son îlot, sur le trottoir près', () => {
    const l = parcelles(ilots);
    for (const b of l) expect(ilots.some((il) => dedans(b, il))).toBe(true);
  });
  it('deux immeubles ne se chevauchent jamais (ruelles)', () => {
    const l = parcelles(ilots);
    for (let a = 0; a < l.length; a += 1) for (let b = a + 1; b < l.length; b += 1) {
      const A = l[a], B = l[b];
      const recouvre = Math.abs(A.x - B.x) < (A.w + B.w) / 2 - 0.01 && Math.abs(A.z - B.z) < (A.d + B.d) / 2 - 0.01;
      expect(recouvre).toBe(false);
    }
  });
  it('des façades variées et des hauteurs plausibles, toujours les mêmes pour une même graine', () => {
    const l = parcelles(ilots);
    expect(new Set(l.map((b) => b.genre)).size).toBe(4);
    expect(new Set(l.map((b) => b.couleur)).size).toBeGreaterThan(8);
    expect(Math.min(...l.map((b) => b.h))).toBeGreaterThanOrEqual(8);
    expect(Math.max(...l.map((b) => b.h))).toBeLessThanOrEqual(101);
    expect(parcelles(ilots)).toEqual(l);
  });
});
