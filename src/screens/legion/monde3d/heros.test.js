import { describe, it, expect } from 'vitest';
import { nouveauHeros, avancerHeros, solSous, repousser, viser, viserLarge, HEROS } from './heros';

const bornes = { x0: -500, x1: 500, z0: -190, z1: 190 };
const tour = { x0: 10, x1: 20, z0: -5, z1: 5, h: 40 };
const repos = { avant: 0, cote: 0, yaw: 0, pitch: 0.25, saute: false, sauteFront: false, rapide: false, grappin: false };
const pas = (h, p, e, n, boites = [tour]) => { let r; for (let i = 0; i < n; i += 1) r = avancerHeros(h, p, { ...repos, ...e }, 1 / 30, boites, bornes); return r; };

describe('mode héros', () => {
  it('court vite au sol : l\'avant suit la caméra', () => {
    const h = nouveauHeros(), p = { x: 0, y: 0, z: 0 };
    pas(h, p, { avant: 1 }, 30); // yaw 0 : l'avant est vers -z
    expect(p.z).toBeCloseTo(-HEROS.course, 0);
    expect(p.x).toBeCloseTo(0);
  });
  it('super-saut puis retombe sur la rue', () => {
    const h = nouveauHeros(), p = { x: 0, y: 0, z: 0 };
    pas(h, p, { sauteFront: true }, 1);
    let haut = 0;
    for (let i = 0; i < 60; i += 1) { pas(h, p, {}, 1); haut = Math.max(haut, p.y); }
    expect(haut).toBeGreaterThan(5);
    expect(p.y).toBe(0);
    expect(h.enAir).toBe(false);
  });
  it('deuxième appui en l\'air : il vole, et reste en l\'air sans rien toucher', () => {
    const h = nouveauHeros(), p = { x: 0, y: 0, z: 0 };
    pas(h, p, { sauteFront: true }, 1);
    pas(h, p, {}, 10);
    pas(h, p, { sauteFront: true }, 1);
    expect(h.vol).toBe(true);
    const y = p.y;
    pas(h, p, {}, 60);
    expect(p.y).toBeGreaterThan(y - 1);
  });
  it('se pose sur un toit, ne traverse pas les murs', () => {
    expect(solSous(15, 0, 41, [tour])).toBe(40);
    expect(solSous(15, 0, 10, [tour])).toBe(0);
    const p = repousser({ x: 11, y: 5, z: 0 }, [tour]);
    expect(p.x).toBeCloseTo(10 - HEROS.rayon);
  });
  it('le grappin s\'accroche au mur visé, et la corde retient', () => {
    const vise = viser({ x: 0, y: 2, z: 0 }, { x: 1, y: 0, z: 0 }, [tour]);
    expect(vise.x).toBeCloseTo(10);
    expect(viser({ x: 0, y: 2, z: 0 }, { x: -1, y: 0, z: 0 }, [tour])).toBeNull();
    // Un rayon qui passe juste à côté (une ruelle) : l'aide à la visée accroche quand même.
    expect(viser({ x: 0, y: 2, z: 6 }, { x: 1, y: 0, z: 0 }, [tour])).toBeNull();
    expect(viserLarge({ x: 0, y: 2, z: 6 }, { x: 1, y: 0, z: 0 }, [tour])).not.toBeNull();
    const h = nouveauHeros(), p = { x: 0, y: 2, z: 0 };
    pas(h, p, { grappin: true, vise: { x: 10, y: 30, z: 0 } }, 90);
    expect(h.grappin).not.toBeNull();
    expect(Math.hypot(p.x - 10, p.y - 30, p.z)).toBeLessThanOrEqual(h.grappin.L + 0.5); // le mur peut repousser un peu
    pas(h, p, { grappin: false }, 1);
    expect(h.grappin).toBeNull();
  });
  it('le grappin hisse jusqu\'en haut et pose sur le toit', () => {
    const h = nouveauHeros(), p = { x: 0, y: 0, z: 0 };
    const vise = { ...viser({ x: 0, y: 2, z: 0 }, { x: 1, y: 0.3, z: 0 }, [tour]) };
    let r;
    for (let i = 0; i < 400 && !(p.y >= tour.h - 0.01 && !h.enAir); i += 1) r = avancerHeros(h, p, { ...repos, grappin: true, vise }, 1 / 30, [tour], bornes);
    expect(p.y).toBeCloseTo(tour.h, 1);
    expect(h.enAir).toBe(false);
    expect(r).toBeTruthy();
  });
});
