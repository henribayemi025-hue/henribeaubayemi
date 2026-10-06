import { describe, it, expect } from 'vitest';
import { QUARTIERS, BORNES, borner, distanceAuQuartier, aCharger, quartierDe, avionAuDecollage, PISTE } from './carte';

describe('la grande carte', () => {
  it('l’aéroport à l’est, la campagne à l’ouest, hors de la ville (±200 m)', () => {
    expect(quartierDe(300, 0)).toBe('aeroport');
    expect(quartierDe(-300, 0)).toBe('campagne');
    expect(quartierDe(0, 0)).toBe(null);
    for (const q of QUARTIERS) expect(Math.min(Math.abs(q.x0), Math.abs(q.x1))).toBeGreaterThanOrEqual(200);
  });

  it('on charge à l’approche, on défait loin, sans clignoter entre les deux', () => {
    const vide = new Set();
    expect(aCharger(vide, 0, 0).charger).toEqual([]);
    expect(aCharger(vide, 100, 0).charger).toEqual(['aeroport']);
    const charge = new Set(['aeroport']);
    expect(aCharger(charge, 0, 0).defaire).toEqual([]); // entre 150 et 260 m : on garde
    expect(aCharger(charge, -100, 0)).toEqual({ charger: ['campagne'], defaire: ['aeroport'] });
  });

  it('la distance à un quartier est nulle dedans', () => {
    expect(distanceAuQuartier(QUARTIERS[0], 300, 10)).toBe(0);
    expect(distanceAuQuartier(QUARTIERS[0], 106, 0)).toBe(100);
  });

  it('on ne sort pas de la carte', () => {
    expect(borner(9999, -9999)).toEqual({ x: BORNES.x1, z: BORNES.z0 });
    expect(borner(10, 20)).toEqual({ x: 10, z: 20 });
  });

  it('l’avion roule, décolle à mi-piste, monte, puis disparaît', () => {
    expect(avionAuDecollage(0)).toMatchObject({ z: PISTE.z0, y: 0, visible: true });
    expect(avionAuDecollage(10).y).toBe(0);
    const haut = avionAuDecollage(20);
    expect(haut.y).toBeGreaterThan(5);
    expect(avionAuDecollage(40).visible).toBe(false);
  });
});
