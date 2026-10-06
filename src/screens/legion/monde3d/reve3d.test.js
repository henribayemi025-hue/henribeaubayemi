import { describe, it, expect } from 'vitest';
import { pointCouloir, toursDuParc, sautDauphin, COULOIRS } from './reve3d';

describe('le monde de rêve', () => {
  it('chaque couloir est une boucle fermée, au-dessus des toits ordinaires', () => {
    for (const c of COULOIRS) {
      const a = pointCouloir(c, 0), b = pointCouloir(c, 1);
      expect(a.x).toBeCloseTo(b.x); expect(a.z).toBeCloseTo(b.z);
      for (let u = 0; u < 1; u += 0.05) expect(pointCouloir(c, u).y).toBeGreaterThan(40);
    }
  });

  it('le parc se suspend entre les deux plus hautes tours proches', () => {
    const tours = [{ bx: 0, bz: 40, h: 90 }, { bx: 40, bz: 40, h: 80 }, { bx: 300, bz: 0, h: 200 }, { bx: 10, bz: 40, h: 120 }];
    const p = toursDuParc(tours);
    expect(p.d).toBeGreaterThanOrEqual(25);
    expect(p.h).toBe(80); // la tour à 300 m est trop loin ; celle à 10 m de la première, trop proche
    expect(toursDuParc([{ bx: 0, bz: 0, h: 50 }])).toBe(null);
  });

  it('le dauphin saute puis replonge', () => {
    expect(sautDauphin(0.35 * 4.5 * 0.5).y).toBeGreaterThan(1);
    expect(sautDauphin(4.5 * 0.8).dans).toBe(false);
  });
});
