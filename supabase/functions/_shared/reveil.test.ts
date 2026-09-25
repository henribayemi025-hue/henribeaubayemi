import { describe, it, expect } from 'vitest';
import { decideReveil, heuresDe, graine, fuseauDe, heureLocale } from './reveil';

const MAINTENANT = new Date('2026-09-25T10:00:00Z');
const ilYA = (h) => new Date(MAINTENANT.getTime() - h * 3_600_000).toISOString();
const ada = { id: 'ada-1', nom: 'Ada', personnalite: 'Elle relit tout deux fois.' };
const tache = (extra = {}) => ({ id: 't1', priorite: 'moyenne', created_at: ilYA(3), assigne_a: 'ada-1', ...extra });
const ctx = (extra = {}) => ({ heure_locale: 10, jour: 5, taches: [tache()], ...extra });

describe('heuresDe', () => {
  it('est stable pour un même agent, et lit la personnalité', () => {
    expect(heuresDe(ada)).toEqual(heuresDe({ ...ada }));
    expect(heuresDe({ id: 'x', personnalite: 'Matinal, il arrive avant tout le monde.' })).toMatchObject({ debut: 6, fin: 15, style: 'matinal' });
    expect(heuresDe({ id: 'x', personnalite: 'Couche-tard, ses meilleures idées viennent la nuit.' })).toMatchObject({ debut: 13, fin: 22, style: 'tardif' });
    const h = heuresDe({ id: 'quelqu-un' });
    expect(h.debut).toBeGreaterThanOrEqual(7); expect(h.debut).toBeLessThanOrEqual(10); expect(h.fin - h.debut).toBe(9);
  });
  it('graine : reproductible, entre 0 et 1', () => {
    expect(graine('abc')).toBe(graine('abc')); expect(graine('abc')).not.toBe(graine('abd'));
    expect(graine('zzz')).toBeGreaterThanOrEqual(0); expect(graine('zzz')).toBeLessThan(1);
  });
});

describe('decideReveil', () => {
  it('travaille dans ses heures quand une tâche l’attend', () => {
    const { debut } = heuresDe(ada);
    const d = decideReveil(ada, ctx({ heure_locale: debut + 1 }), MAINTENANT);
    expect(d).toMatchObject({ travaille: true, etat: 'travaille' });
    expect(d.raison).toMatch(/heures|tâche/);
  });
  it('sans tâche : disponible le jour, dort la nuit', () => {
    expect(decideReveil(ada, ctx({ taches: [] }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'attend' });
    expect(decideReveil(ada, ctx({ taches: [], heure_locale: 2 }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'dort' });
  });
  it('souffle deux heures après un livrable, 45 minutes si urgent', () => {
    const fatigue = { ...ada, dernier_livrable_le: ilYA(1) };
    expect(decideReveil(fatigue, ctx(), MAINTENANT)).toMatchObject({ travaille: false, etat: 'pause' });
    expect(decideReveil(fatigue, ctx({ taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ travaille: true });
    expect(decideReveil({ ...ada, dernier_livrable_le: ilYA(0.5) }, ctx({ taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ etat: 'pause' });
  });
  it('l’urgent réveille à toute heure, même le dimanche ; le haut jusqu’à 23 h', () => {
    expect(decideReveil(ada, ctx({ heure_locale: 3, taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ travaille: true });
    expect(decideReveil(ada, ctx({ jour: 0, taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ travaille: true });
    expect(decideReveil(ada, ctx({ jour: 0 }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'fin_de_journee' });
    expect(decideReveil(ada, ctx({ heure_locale: 22, taches: [tache({ priorite: 'haute' })] }), MAINTENANT)).toMatchObject({ travaille: true });
    expect(decideReveil(ada, ctx({ heure_locale: 3, taches: [tache({ priorite: 'haute' })] }), MAINTENANT)).toMatchObject({ travaille: false });
  });
  it('plafond atteint : attend ; neuf collègues au travail : attend, sauf urgent', () => {
    expect(decideReveil(ada, ctx({ depense_mois_eur: 5, plafond_mois_eur: 5 }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'attend' });
    expect(decideReveil(ada, ctx({ agents_deja_au_travail: 9 }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'attend' });
    expect(decideReveil(ada, ctx({ agents_deja_au_travail: 9, taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ travaille: true });
    expect(decideReveil(ada, ctx({ depense_mois_eur: 5, plafond_mois_eur: 5, taches: [tache({ priorite: 'urgente' })] }), MAINTENANT)).toMatchObject({ travaille: false });
  });
  it('réunion dans le quart d’heure : attend', () => {
    const dans10 = new Date(MAINTENANT.getTime() + 10 * 60_000).toISOString();
    expect(decideReveil(ada, ctx({ reunions_a_venir: [dans10] }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'attend' });
    const dans40 = new Date(MAINTENANT.getTime() + 40 * 60_000).toISOString();
    expect(decideReveil(ada, ctx({ reunions_a_venir: [dans40] }), MAINTENANT)).toMatchObject({ travaille: true });
  });
  it('hors de ses heures : reprend demain, sauf le réveil soudain (1/10, reproductible) pour une tâche de plus de douze heures', () => {
    const { fin } = heuresDe(ada);
    expect(decideReveil(ada, ctx({ heure_locale: fin + 1 }), MAINTENANT)).toMatchObject({ travaille: false, etat: 'fin_de_journee' });
    const vieille = tache({ created_at: ilYA(30) });
    // Sur cent agents différents, environ un sur dix se réveille — jamais tous, jamais aucun.
    let reveils = 0;
    for (let i = 0; i < 100; i += 1) if (decideReveil({ id: `agent-${i}` }, { heure_locale: 20, jour: 3, taches: [{ ...vieille, assigne_a: `agent-${i}` }] }, MAINTENANT).travaille) reveils += 1;
    expect(reveils).toBeGreaterThan(2); expect(reveils).toBeLessThan(25);
    const a = decideReveil({ id: 'agent-7' }, { heure_locale: 20, jour: 3, taches: [{ ...vieille, assigne_a: 'agent-7' }] }, MAINTENANT);
    expect(decideReveil({ id: 'agent-7' }, { heure_locale: 20, jour: 3, taches: [{ ...vieille, assigne_a: 'agent-7' }] }, MAINTENANT)).toEqual(a);
  });
  it('ne compte que ses propres tâches, pas celles déjà livrées', () => {
    expect(decideReveil(ada, ctx({ taches: [tache({ assigne_a: 'autre' })] }), MAINTENANT)).toMatchObject({ etat: 'attend' });
    expect(decideReveil(ada, ctx({ taches: [tache({ livre_le: ilYA(1) })] }), MAINTENANT)).toMatchObject({ etat: 'attend' });
  });
});

describe('fuseau et heure locale', () => {
  it('connaît les marchés courants et retombe sur UTC', () => {
    expect(fuseauDe('CM')).toBe(1); expect(fuseauDe('ca')).toBe(-5); expect(fuseauDe('IN')).toBe(5.5); expect(fuseauDe(null)).toBe(0); expect(fuseauDe('ZZ')).toBe(0);
    expect(heureLocale(new Date('2026-09-25T23:30:00Z'), 'CM')).toEqual({ heure: 0, jour: 6 });
    expect(heureLocale(new Date('2026-09-25T10:00:00Z'), 'CA')).toEqual({ heure: 5, jour: 5 });
  });
});
