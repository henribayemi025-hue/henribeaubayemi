import { describe, it, expect } from 'vitest';
import { planDeLaSemaine, texteDuJour, ideeVideo, numeroDeSemaine, THEMES } from './semainePublications';

const art = (i, extra = {}) => ({ id: String(i), name: `Robe ${i}`, price_fcfa: 10000, images: [`p${i}.jpg`], ...extra });
// Un t() minimal : renvoie la clé et les valeurs, pour vérifier ce qui est passé.
const t = (cle, v = {}) => `${cle}|${Object.entries(v).map(([k, x]) => `${k}=${x}`).join('|')}`;

describe('semaine de publications', () => {
  it('sept publications, une par thème, du lundi au dimanche', () => {
    const plan = planDeLaSemaine(Array.from({ length: 10 }, (_, i) => art(i)), new Date('2026-10-08T10:00:00Z'));
    expect(plan.map((p) => p.jour)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(plan.map((p) => p.theme)).toEqual(THEMES);
    expect(new Set(plan.map((p) => p.article.id)).size).toBe(7);
  });

  it('ne garde que les articles avec photo, et rien sans article photographié', () => {
    expect(planDeLaSemaine([{ id: 'x', images: [] }])).toEqual([]);
    const plan = planDeLaSemaine([art(1), { id: 'x', images: [] }, art(2)]);
    expect(plan.every((p) => ['1', '2'].includes(p.article.id))).toBe(true);
  });

  it('change de semaine en semaine, pas dans la semaine', () => {
    const liste = Array.from({ length: 10 }, (_, i) => art(i));
    const lundi = planDeLaSemaine(liste, new Date('2026-10-05T08:00:00Z')).map((p) => p.article.id);
    const dimanche = planDeLaSemaine(liste, new Date('2026-10-11T20:00:00Z')).map((p) => p.article.id);
    const lundiSuivant = planDeLaSemaine(liste, new Date('2026-10-12T08:00:00Z')).map((p) => p.article.id);
    expect(numeroDeSemaine(new Date('2026-10-05T08:00:00Z'))).toBe(numeroDeSemaine(new Date('2026-10-11T20:00:00Z')));
    expect(dimanche).toEqual(lundi);
    expect(lundiSuivant).not.toEqual(lundi);
  });

  it('le prix suit la monnaie de la boutique, et disparaît sans pays', () => {
    const [item] = planDeLaSemaine([art(1)]);
    const avec = texteDuJour(item, { shop: { name: 'Kora', country: 'CM' }, lien: 'L', t });
    expect(avec).toMatch(/^semaine\.textes\.nouveaute\|/);
    expect(avec).toMatch(/prix= — 10[\s  ]?000 FCFA/);
    const sans = texteDuJour(item, { shop: { name: 'Kora', country: null }, lien: 'L', t });
    expect(sans).toMatch(/prix=\|/);
    const gb = texteDuJour(item, { shop: { name: 'Kora', country: 'GB' }, langue: 'en', lien: 'L', t });
    expect(gb).toMatch(/£/);
  });

  it("l'idée de vidéo : quatre plans, avec l'article du lundi", () => {
    const plan = planDeLaSemaine([art(1), art(2)], new Date('2026-10-05T08:00:00Z'));
    const v = ideeVideo(plan, t);
    expect(v).toHaveLength(4);
    expect(v[0].texte).toContain(`article=${plan[0].article.name}`);
  });
});
