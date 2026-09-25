import { describe, it, expect } from 'vitest';
import { hauteurTour, tours, auTravail, QUOTIDIEN, joursRestants, aLaDate, bornesFrise } from './ville';

const M = Date.parse('2026-09-25T12:00:00Z');
const il = (min) => new Date(M - min * 60_000).toISOString();

describe('la Ville de Léo', () => {
  it('compte rendues, restantes et avancement', () => {
    const t = [{ meta: { statut: 'fait' } }, { termine_le: il(5) }, { meta: { statut: 'revue' } }, { meta: { statut: 'a_faire' } }];
    const h = hauteurTour({ fin: '2026-10-30' }, t, M);
    expect(h).toMatchObject({ rendues: 3, restantes: 1, total: 4, termine: false, enRetard: false });
    expect(h.avancement).toBeCloseTo(0.75);
  });

  it('une fenêtre ne s’allume que pour une tâche prise il y a moins de 10 min et pas rendue', () => {
    expect(auTravail({ meta: { travaille_depuis: il(3) } }, M)).toBe(true);
    expect(auTravail({ meta: { travaille_depuis: il(12) } }, M)).toBe(false);
    expect(auTravail({ meta: { travaille_depuis: il(5), livre_le: il(1) } }, M)).toBe(false);
    // rendue avant d'être reprise : de nouveau au travail
    expect(auTravail({ meta: { travaille_depuis: il(2), livre_le: il(30) } }, M)).toBe(true);
    expect(auTravail({ meta: {} }, M)).toBe(false);
  });

  it('le même agent sur deux tâches ne compte qu’une fois', () => {
    const t = [{ assigne_a: 'a', meta: { travaille_depuis: il(1) } }, { assigne_a: 'a', meta: { travaille_depuis: il(2) } }, { assigne_a: 'b', meta: { travaille_depuis: il(4) } }];
    expect(hauteurTour({ fin: '2026-10-01' }, t, M).agentsAuTravail).toBe(2);
  });

  it('un agent éteint n’allume jamais de fenêtre, même avec une prise récente', () => {
    const t = [{ assigne_a: 'a', meta: { travaille_depuis: il(1) } }, { assigne_a: 'b', meta: { travaille_depuis: il(2) } }];
    expect(hauteurTour({ fin: '2026-10-01' }, t, M, new Set(['a'])).agents).toEqual(['b']);
    expect(tours([], t, M, new Set(['a', 'b']))[0].agentsAuTravail).toBe(0);
  });

  it('fini quand toutes les tâches sont rendues ou le projet marqué fini ; en retard si la fin est passée', () => {
    expect(hauteurTour({ fin: '2026-10-01' }, [{ meta: { statut: 'fait' } }], M).termine).toBe(true);
    expect(hauteurTour({ fin: '2026-10-01', statut: 'fini' }, [{ meta: {} }], M).termine).toBe(true);
    expect(hauteurTour({ fin: '2026-09-20' }, [{ meta: {} }], M).enRetard).toBe(true);
    expect(hauteurTour({ fin: '2026-09-25' }, [{ meta: {} }], M).enRetard).toBe(false); // le jour de la fin compte encore
    expect(hauteurTour({ fin: 'pas une date' }, [{ meta: {} }], M).enRetard).toBe(false);
    expect(hauteurTour({ fin: '2026-10-01' }, [], M)).toMatchObject({ termine: false, avancement: 0 });
  });

  it('range les tâches par projet ; sans projet ou projet disparu : « Au quotidien »', () => {
    const projets = [{ id: 'p2', debut: '2026-09-20', fin: '2026-10-20' }, { id: 'p1', debut: '2026-09-01', fin: '2026-10-01' }];
    const t = [{ meta: { projet_id: 'p1' } }, { meta: { projet_id: 'x' } }, { meta: {} }, { meta: { projet_id: 'p2', statut: 'fait' } }];
    const l = tours(projets, t, M);
    expect(l.map((x) => x.id)).toEqual(['p1', 'p2', QUOTIDIEN]);
    expect(l.find((x) => x.id === QUOTIDIEN).total).toBe(2);
    expect(tours(projets, [], M).some((x) => x.id === QUOTIDIEN)).toBe(false);
  });

  it('jours restants', () => {
    expect(joursRestants({ fin: '2026-09-25' }, M)).toBe(1);
    expect(joursRestants({ fin: '2026-09-20' }, M)).toBeLessThan(0);
    expect(joursRestants({}, M)).toBeNull();
  });
});

describe('la 4D : la ville à une date passée', () => {
  const maintenant = Date.parse('2026-09-25T12:00:00');
  const projets = [
    { id: 'p1', nom: 'Boutique', created_at: '2026-09-01T09:00:00', statut: 'fini' },
    { id: 'p2', nom: 'Salon', created_at: '2026-09-20T09:00:00' },
  ];
  const taches = [
    { id: 1, created_at: '2026-09-02T09:00:00', meta: { projet_id: 'p1', statut: 'fait', livre_le: '2026-09-05T10:00:00' } },
    { id: 2, created_at: '2026-09-02T09:00:00', termine_le: '2026-09-15T10:00:00', meta: { projet_id: 'p1' } },
    { id: 3, created_at: '2026-09-10T09:00:00', meta: { projet_id: 'p1', statut: 'fait' } }, // rendue, sans date
    { id: 4, created_at: '2026-09-21T09:00:00', meta: { projet_id: 'p2', statut: 'a_faire' } },
  ];
  it('ne montre que ce qui existait ce jour-là', () => {
    const { projets: ps, taches: ts } = aLaDate(projets, taches, Date.parse('2026-09-12T12:00:00'), maintenant);
    expect(ps.map((p) => p.id)).toEqual(['p1']);
    expect(ps[0].statut).toBe('en_cours'); // « fini » n'a pas de date
    const t = tours(ps, ts, Date.parse('2026-09-12T12:00:00'))[0];
    expect([t.rendues, t.total, t.termine]).toEqual([1, 3, false]);
  });
  it('une tâche rendue sans date ne compte comme rendue qu\'aujourd\'hui', () => {
    const { taches: ts } = aLaDate(projets, taches, Date.parse('2026-09-24T12:00:00'), maintenant);
    expect(ts.find((t) => t.id === 3).meta.statut).toBe('a_faire');
    expect(aLaDate(projets, taches, maintenant, maintenant).taches).toBe(taches);
  });
  it('la frise va du premier projet à aujourd\'hui', () => {
    const b = bornesFrise(projets, taches, maintenant);
    expect(b.jours).toBe(24);
    expect(bornesFrise([], [], maintenant).jours).toBe(0);
  });
});
