// Le relief des immeubles tombe sur le dessin des façades.
import { describe, it, expect } from 'vitest';
import { lelong, parTuile, hauteurs, faces, reliefTour, nouveauRelief } from './relief3d';

describe('relief des immeubles', () => {
  it('les meneaux reviennent tous les 1,85 m, décalés comme la tuile', () => {
    const s = lelong(10, 29.6, 0, 1.73, 1.85);
    expect(s[0]).toBeCloseTo(1.73);
    expect(s[1] - s[0]).toBeCloseTo(1.85);
    expect(lelong(10, 29.6, 0.125, 1.73, 1.85)[0]).toBeCloseTo(((1.73 - 3.7) % 1.85 + 1.85) % 1.85);
  });
  it('deux balcons par tuile de résidence, jamais à cheval sur un angle', () => {
    const s = parTuile(24, 11.9, 0, [2.95, 8.82], 2.3);
    expect(s.map((x) => +x.toFixed(2))).toEqual([2.95, 8.82, 14.85, 20.72]);
    expect(parTuile(4, 11.9, 0, [2.95, 8.82], 2.3)).toEqual([]);
  });
  it('un étage tous les 3,2 m, ni au ras du sol ni dans le toit', () => {
    expect(hauteurs(10, 0.75, 3.2, 2.5, 1.5)).toEqual([3.95, 7.15].map((x) => expect.closeTo(x, 5)));
  });
  it('les faces pointent vers dehors', () => {
    for (const f of faces(10, 6)) expect(f.o[0] * f.n[0] + f.o[1] * f.n[1]).toBeGreaterThan(0);
  });
  it('une tour de résidence reçoit balcons, garde-corps, piliers et toiture', () => {
    const acc = nouveauRelief();
    reliefTour(acc, { nom: 'residence', bx: 50, bz: -40, w: 14, d: 12, hc: 30, base: 5, du: 0, h: 35 });
    expect(acc.balcons.length).toBeGreaterThan(20);
    expect(acc.gardes.length).toBe(acc.balcons.length);
    expect(acc.piliers.residence).toHaveLength(4);
    expect(acc.clims.length).toBeGreaterThanOrEqual(2);
    expect(acc.meneaux).toHaveLength(0);
  });
});
