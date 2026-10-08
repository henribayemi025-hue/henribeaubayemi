import { describe, it, expect } from 'vitest';
import { nouvellePoursuite, avancerPoursuite, infraction, etoiles, POLICE, pointRoute, cheminRoutes, departPolice, pasAgent, AGENT } from './poursuite';

// Le joueur roule tout droit vers +z à v m/s pendant s secondes.
function rouler(p, j, v, s, dt = 1 / 30) {
  const ev = [];
  for (let t = 0; t < s; t += dt) {
    j.z += v * dt; j.vitesse = v;
    const r = avancerPoursuite(p, j, dt);
    p = r.p; ev.push(...r.evenements);
  }
  return { p, ev };
}

describe('la police', () => {
  it('rouler sagement ne fait rien monter', () => {
    const { p, ev } = rouler(nouvellePoursuite(), { x: 0, z: 0, auVolant: true }, 15, 20);
    expect(etoiles(p)).toBe(0);
    expect(p.police).toBe(null);
    expect(ev).toEqual([]);
  });

  it('rouler trop vite fait monter les étoiles, et la police arrive derrière, sur notre chemin', () => {
    const { p, ev } = rouler(nouvellePoursuite(), { x: 0, z: 0, auVolant: true }, 33, 4); // ≈ 119 km/h
    expect(etoiles(p)).toBeGreaterThanOrEqual(1);
    expect(ev.some((e) => e.type === 'police' && e.arrive)).toBe(true);
    expect(p.police.x).toBe(0); // sur la trace : même axe que le joueur
    expect(p.police.z).toBeLessThan(33 * 4);
  });

  it('une infraction (passant bousculé) donne une étoile ; on la sème en allant plus vite qu’elle, assez longtemps', () => {
    let p = infraction(nouvellePoursuite(), 'pieton');
    expect(etoiles(p)).toBe(1);
    const j = { x: 0, z: 0, auVolant: true };
    // Un départ pour poser la trace, puis on file à 30 m/s (≈ 108 km/h, plus vite que la police à 1 étoile).
    ({ p } = rouler(p, j, 10, 1));
    let semee = null;
    for (let t = 0; t < 40 && !semee; t += 1 / 30) {
      j.z += 1; j.vitesse = 30;
      const r = avancerPoursuite(p, j, 1 / 30);
      p = r.p;
      if (r.evenements.some((e) => e.type === 'police' && e.semee)) semee = t;
    }
    expect(semee).not.toBe(null);
    expect(p.police).toBe(null);
    expect(etoiles(p)).toBe(0);
  });

  it('à l’arrêt, rattrapé : arrestation, et tout repart à zéro', () => {
    let p = infraction(infraction(nouvellePoursuite(), 'pieton'), 'choc');
    const j = { x: 0, z: 0, auVolant: true };
    ({ p } = rouler(p, j, 15, 3));
    const r = rouler(p, j, 0, 15);
    expect(r.ev.some((e) => e.type === 'police' && e.arrete)).toBe(true);
    expect(etoiles(r.p)).toBe(0);
  });

  it('descendre de voiture loin d’elle : elle s’arrête où on a laissé la voiture, et finit par nous perdre', () => {
    let p = infraction(nouvellePoursuite(), 'pieton');
    const j = { x: 0, z: 0, auVolant: true };
    ({ p } = rouler(p, j, 15, 4));
    j.auVolant = false;
    const ev = [];
    for (let t = 0; t < 30; t += 1 / 30) { j.x += 3 / 30; j.vitesse = 3; const r = avancerPoursuite(p, j, 1 / 30); p = r.p; ev.push(...r.evenements); }
    expect(ev.some((e) => e.type === 'police' && e.semee)).toBe(true);
  });

  it('la trace reste bornée', () => {
    const { p } = rouler(infraction(nouvellePoursuite(), 'pieton'), { x: 0, z: 0, auVolant: true }, 30, 60);
    expect(p.trace.length).toBeLessThanOrEqual(POLICE.traceMax);
  });
});

describe('la police, à pied (A8)', () => {
  const routes = { x: [-78, -26, 26, 78], z: [-74, -22, 30, 82], borne: 196 };

  it('le point de rue le plus proche', () => {
    expect(pointRoute({ x: -20, z: 5 }, routes)).toMatchObject({ x: -26, z: 5, axe: 'z' });
    expect(pointRoute({ x: 3, z: 27 }, routes)).toMatchObject({ x: 3, z: 30, axe: 'x' });
  });

  it('le chemin suit les rues, tourne aux carrefours, et ne coupe jamais un îlot', () => {
    const ch = cheminRoutes({ x: -26, z: -60 }, { x: 15, z: 34 }, routes); // rue x=-26 → rue z=30
    const surUneRue = (p) => routes.x.some((x) => Math.abs(p.x - x) < 0.01) || routes.z.some((z) => Math.abs(p.z - z) < 0.01);
    expect(ch.every(surUneRue)).toBe(true);
    expect(ch[ch.length - 1]).toMatchObject({ x: 15, z: 30 });
    for (let i = 1; i < ch.length; i += 1) expect(Math.hypot(ch[i].x - ch[i - 1].x, ch[i].z - ch[i - 1].z)).toBeLessThanOrEqual(POLICE.pas + 1e-6);
    // Deux rues parallèles : on passe par une transversale.
    const ch2 = cheminRoutes({ x: -26, z: 0 }, { x: 24, z: 5 }, routes);
    expect(ch2.every(surUneRue)).toBe(true);
    expect(ch2.some((p) => Math.abs(p.z + 22) < 0.01 || Math.abs(p.z - 30) < 0.01)).toBe(true);
  });

  it('elle part de notre rue, à distance, côté centre', () => {
    const d = departPolice({ x: -22, z: 100 }, routes);
    expect(d).toEqual({ x: -26, z: 40 });
  });

  it('un passant touché à pied : la police arrive par la rue et arrête si l’on ne bouge plus ; cachés, on la sème', () => {
    let p = infraction(nouvellePoursuite(), 'touche');
    expect(etoiles(p)).toBe(1);
    const j = { x: -22, z: 0, vitesse: 0, auVolant: false };
    p = { ...p, trace: cheminRoutes(departPolice(j, routes), j, routes) };
    let ev = [];
    for (let t = 0; t < 10; t += 1 / 30) { const r = avancerPoursuite(p, j, 1 / 30); p = r.p; ev.push(...r.evenements); if (!p.police && ev.some((e) => e.arrete)) break; }
    expect(ev.some((e) => e.type === 'police' && e.arrive)).toBe(true);
    expect(ev.some((e) => e.type === 'police' && e.arrete)).toBe(true);

    // Même chose, mais on file se cacher au fond d'une ruelle : pas d'arrestation, semée.
    p = { ...infraction(infraction(nouvellePoursuite(), 'touche'), 'tir'), trace: cheminRoutes(departPolice(j, routes), j, routes) };
    ev = [];
    for (let t = 0; t < 20; t += 1 / 30) { const r = avancerPoursuite(p, { ...j, cache: t > 1.5 }, 1 / 30); p = r.p; ev.push(...r.evenements); }
    expect(ev.some((e) => e.arrete)).toBe(false);
    expect(ev.some((e) => e.type === 'police' && e.semee)).toBe(true);
  });
});

describe("l'agent de police à pied (A8)", () => {
  it('il court vers nous ; à l’arrêt, il nous attrape ; en courant, on le distance', () => {
    let a = { x: 0, z: 0 };
    const j = { x: 0, z: 20, vitesse: 0 };
    let r;
    for (let t = 0; t < 6; t += 1 / 30) { r = pasAgent(a, j, 1 / 30); a = r; if (r.attrape) break; }
    expect(r.attrape).toBe(true);
    // On court à 5,4 m/s : l'écart grandit.
    a = { x: 0, z: 0 };
    const k = { x: 0, z: 10, vitesse: 5.4 };
    for (let t = 0; t < 5; t += 1 / 30) { k.z += 5.4 / 30; r = pasAgent(a, k, 1 / 30); a = r; }
    expect(r.attrape).toBe(false);
    expect(r.d).toBeGreaterThan(10);
    expect(AGENT.vitesse).toBeLessThan(5.4);
  });
});
