// Conduire : la voiture avance, tourne, freine, et ne traverse ni les trottoirs ni les autres.
import { describe, it, expect } from 'vitest';
import { piloter, heurterBlocs, heurterVehicules, portiere, kmh, VOITURE } from './conduite';

const depart = { x: 0, z: 0, cap: 0, vitesse: 0 };
const rouler = (e, entrees, s) => { let x = e; for (let k = 0; k < s * 60; k += 1) x = piloter(x, entrees, 1 / 60); return x; };

describe('conduire', () => {
  it('accélère tout droit vers l\'avant, sans dépasser la vitesse maxi', () => {
    const e = rouler(depart, { gaz: 1 }, 3);
    expect(e.z).toBeGreaterThan(15);
    expect(Math.abs(e.x)).toBeLessThan(1e-9);
    expect(rouler(e, { gaz: 1 }, 30).vitesse).toBeLessThanOrEqual(VOITURE.max);
  });
  it('freine jusqu\'à l\'arrêt, puis recule lentement', () => {
    const lance = rouler(depart, { gaz: 1 }, 3);
    const arret = rouler(lance, { gaz: -1 }, 1.5);
    expect(Math.abs(arret.vitesse)).toBeLessThan(lance.vitesse);
    const recul = rouler(arret, { gaz: -1 }, 6);
    expect(recul.vitesse).toBeLessThan(0);
    expect(recul.vitesse).toBeGreaterThanOrEqual(-VOITURE.arriere);
  });
  it('tourne à droite quand on braque à droite', () => {
    const e = rouler({ ...depart, vitesse: 8 }, { gaz: 0.3, volant: 1 }, 1);
    expect(e.x).toBeLessThan(-0.5); // cap 0 = +z : la droite est vers -x
  });
  it('à l\'arrêt, braquer ne fait pas tourner', () => {
    expect(rouler(depart, { volant: 1 }, 1).cap).toBe(0);
  });
  it('s\'arrête contre un trottoir au lieu de le traverser', () => {
    const bloc = { x0: -10, x1: 10, z0: 6, z1: 20 };
    let e = { ...depart, vitesse: 15 };
    let choc = 0;
    for (let k = 0; k < 120; k += 1) { e = heurterBlocs(piloter(e, { gaz: 1 }, 1 / 60), [bloc]); choc = Math.max(choc, e.choc); }
    expect(e.z + VOITURE.demiLong).toBeLessThanOrEqual(6.01);
    expect(choc).toBeGreaterThan(10);
  });
  it('ne traverse pas une voiture de la circulation', () => {
    const e = heurterVehicules({ ...depart, z: 0, vitesse: 5 }, [{ x: 0, z: 2.5, rayon: 1.1 }]);
    expect(e.z).toBeLessThan(0);
    expect(e.choc).toBe(5);
  });
  it('on descend à gauche du conducteur', () => {
    const p = portiere(depart);
    expect(p.x).toBeCloseTo(1.8); // cap 0 = +z : la gauche est vers +x
    expect(kmh(-10)).toBe(36);
  });
});
