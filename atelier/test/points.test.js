// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { creerPoint, restaurerPoint, supprimerPoint, listePoints, POINTS_MAX } from '../src/points.js';

// Un faux stockage (comme celui d'un Durable Object) et des fichiers qui y vivent.
function monter(initial) {
  const m = new Map();
  const stockage = {
    m,
    async get(k) { return m.get(k); },
    async put(k, v) { m.set(k, v); },
    async delete(k) { (Array.isArray(k) ? k : [k]).forEach((x) => m.delete(x)); },
    async list({ prefix }) { return new Map([...m].filter(([k]) => k.startsWith(prefix))); },
  };
  const e = { index: {} };
  const f = {
    async liste() { return Object.keys(e.index).sort().map((chemin) => ({ chemin, taille: e.index[chemin] })); },
    async lire(c) { return c in e.index ? m.get(`f:p:${c}`) : null; },
    async ecrire(c, v) { m.set(`f:p:${c}`, v); e.index[c] = v.length; },
    async supprimer(c) { m.delete(`f:p:${c}`); delete e.index[c]; },
  };
  return { stockage, e, f, init: Promise.all(Object.entries(initial).map(([c, v]) => f.ecrire(c, v))) };
}

describe('les points de retour', () => {
  it('reviennent exactement à la photo, et le retour lui-même peut être annulé', async () => {
    const x = monter({ 'index.html': 'v1', 'style.css': 'a' });
    await x.init;
    const n = await creerPoint(x.stockage, 'p', x.e, x.f, { nom: 'Avant la refonte' });
    await x.f.ecrire('index.html', 'v2');
    await x.f.ecrire('nouveau.js', 'x');
    await x.f.supprimer('style.css');

    const r = await restaurerPoint(x.stockage, 'p', x.e, x.f, n, { nomAvant: 'Avant le retour' });
    expect(r).toEqual({ remis: 2, retires: 1 });
    expect(Object.keys(x.e.index).sort()).toEqual(['index.html', 'style.css']);
    expect(await x.f.lire('index.html')).toBe('v1');

    // Un point « auto » a été posé juste avant : il ramène la version 2.
    const auto = listePoints(x.e)[0];
    expect(auto).toMatchObject({ nom: 'Avant le retour', auto: true, fichiers: 2 });
    await restaurerPoint(x.stockage, 'p', x.e, x.f, auto.n, { nomAvant: 'x' });
    expect(await x.f.lire('index.html')).toBe('v2');
    expect(await x.f.lire('nouveau.js')).toBe('x');
    expect(await x.f.lire('style.css')).toBe(null);
  });

  it(`en garde ${POINTS_MAX} au plus, et efface ce qui part`, async () => {
    const x = monter({ 'a.txt': '1' });
    await x.init;
    for (let i = 0; i < POINTS_MAX + 2; i += 1) await creerPoint(x.stockage, 'p', x.e, x.f, { nom: `p${i}` });
    expect(x.e.points).toHaveLength(POINTS_MAX);
    expect(x.e.points.at(-1).nom).toBe('p2');
    expect([...x.stockage.m.keys()].filter((k) => k.startsWith('r:p:1:'))).toEqual([]);
  });

  it('un point supprimé disparaît du stockage ; un point inconnu ne restaure rien', async () => {
    const x = monter({ 'a.txt': '1' });
    await x.init;
    const n = await creerPoint(x.stockage, 'p', x.e, x.f, {});
    expect(await supprimerPoint(x.stockage, 'p', x.e, n)).toBe(true);
    expect([...x.stockage.m.keys()].some((k) => k.startsWith('r:'))).toBe(false);
    expect(await restaurerPoint(x.stockage, 'p', x.e, x.f, 99)).toBe(null);
  });
});
