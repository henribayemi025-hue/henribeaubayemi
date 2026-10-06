import { describe, it, expect } from 'vitest';
import { nouvellePoursuite, avancerPoursuite, infraction, etoiles, POLICE } from './poursuite';

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
