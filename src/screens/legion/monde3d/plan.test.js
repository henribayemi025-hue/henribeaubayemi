import { describe, it, expect } from 'vitest';
import { modelePlan, pointIlot, angleFleche, dansCadre, CADRES } from './plan';

const il = { x0: 32, x1: 72, z0: -72, z1: -32 };
describe('plan de la ville', () => {
  it('pose la personne sur le trottoir du bord le plus proche du centre, tournée vers l\'îlot', () => {
    const p = pointIlot(il);
    expect(p.x).toBeCloseTo(33.6); // bord ouest (x0 = 32 est le plus proche de 0)… ou nord
    expect(p.z).toBeCloseTo(-52);
    // regarde vers le centre de l'îlot (+x) : atan2(dx>0, 0) = π/2, moins π
    expect(p.yaw).toBeCloseTo(Math.PI / 2 - Math.PI);
  });
  it('rassemble les lieux réservés, le siège, l\'aéroport et la campagne', () => {
    const m = modelePlan({ routes: { x: [-78, -26, 26, 78], z: [-74, -22, 30, 82], largeur: 12 }, emprises: [{ x: 50, z: -50, w: 10, d: 12, h: 30 }], reserves: { boutiques: il, heliport: { x0: 84, x1: 200, z0: -20, z1: 24 } }, chantiers: [{ id: 'p1', nom: 'Site', x: 0, z: 45 }] });
    expect(m.lieux.map((l) => l.cle)).toEqual(['siege', 'boutiques', 'heliport', 'aeroport', 'campagne']);
    expect(m.immeubles[0]).toEqual({ x0: 45, z0: -56, w: 10, d: 12, h: 30 });
    expect(m.chantiers).toHaveLength(1);
    // l'aéroport s'atteint par l'est, au-delà de la ville
    const a = m.lieux.find((l) => l.cle === 'aeroport');
    expect(a.aller.x).toBeGreaterThan(200);
    // On arrive tourné vers le quartier, pas vers la ville (regard = yaw + π, vers +x quand yaw = π/2 - π).
    const regardX = (yaw) => Math.sin(yaw + Math.PI);
    expect(regardX(a.aller.yaw)).toBeGreaterThan(0.99); // l'aéroport est à l'est
    const c = m.lieux.find((l) => l.cle === 'campagne');
    expect(regardX(c.aller.yaw)).toBeLessThan(-0.99); // la campagne (et le ruisseau) à l'ouest
  });
  it('flèche : rotation 0 regarde vers le bas du plan (+z)', () => {
    expect(angleFleche(0)).toBe(-0);
    expect(angleFleche(Math.PI / 2)).toBeCloseTo(-90);
  });
  it('cadres', () => {
    expect(dansCadre(CADRES.ville, 0, 0)).toBe(true);
    expect(dansCadre(CADRES.ville, 400, 0)).toBe(false);
    expect(dansCadre(CADRES.tout, 400, 0)).toBe(true);
  });
});
