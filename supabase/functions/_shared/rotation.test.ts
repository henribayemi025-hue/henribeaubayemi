import { describe, it, expect } from 'vitest';
import { ordreDePassage, tachesDansLOrdre, attendUneReponse, derniersPassages } from './rotation';

describe('ordreDePassage', () => {
  const agents = ['alpha', 'claudinette', 'vigie', 'plume', 'rigo'].map((id) => ({ id }));

  it("le jamais servi passe en tête, puis celui servi il y a le plus longtemps", () => {
    const servi = new Map([
      ['alpha', '2026-10-01T14:33:00.000Z'],
      ['claudinette', '2026-10-01T14:32:00.000Z'],
      ['vigie', '2026-10-01T14:32:30.000Z'],
      ['plume', '2026-09-26T06:30:00.000Z'],
    ]);
    expect(ordreDePassage(agents, servi).map((a) => a.id)).toEqual(['rigo', 'plume', 'claudinette', 'vigie', 'alpha']);
  });

  it("à égalité (personne servi), garde l'ordre de la liste", () => {
    expect(ordreDePassage(agents, new Map()).map((a) => a.id)).toEqual(['alpha', 'claudinette', 'vigie', 'plume', 'rigo']);
  });

  it('le cas du 02/10 : les 6 premiers servis hier, les autres au 26/09 — les oubliés passent devant', () => {
    const liste = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'b1', 'b2', 'b3'].map((id) => ({ id }));
    const servi = new Map([
      ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id) => [id, '2026-10-01T14:33:00.000Z']),
      ...['b1', 'b2', 'b3'].map((id) => [id, '2026-09-26T06:30:00.000Z']),
    ]);
    expect(ordreDePassage(liste, servi).slice(0, 3).map((a) => a.id)).toEqual(['b1', 'b2', 'b3']);
  });
});

describe('tachesDansLOrdre', () => {
  const t = (id, created_at, meta = {}) => ({ id, created_at, meta });

  it("une tâche jamais rendue passe avant une plus ancienne déjà rendue (bloquée)", () => {
    const liste = [
      t('vieille-bloquee', '2026-09-20T12:00:00Z', { livre_le: '2026-09-26T06:00:00Z', essais: 8 }),
      t('neuve', '2026-09-28T12:00:00Z'),
    ];
    expect(tachesDansLOrdre(liste).map((x) => x.id)).toEqual(['neuve', 'vieille-bloquee']);
  });

  it('une tâche ratée trois fois passe après les autres', () => {
    const liste = [t('ratee', '2026-09-20T12:00:00Z', { essais: 3 }), t('ok', '2026-09-25T12:00:00Z', { essais: 1 })];
    expect(tachesDansLOrdre(liste).map((x) => x.id)).toEqual(['ok', 'ratee']);
  });

  it("à situation égale : urgente, puis haute, puis l'ancienneté", () => {
    const liste = [
      t('moyenne-vieille', '2026-09-20T12:00:00Z', { priorite: 'moyenne' }),
      t('haute', '2026-09-25T12:00:00Z', { priorite: 'haute' }),
      t('urgente', '2026-09-27T12:00:00Z', { priorite: 'urgente' }),
      t('moyenne-recente', '2026-09-26T12:00:00Z'),
    ];
    expect(tachesDansLOrdre(liste).map((x) => x.id)).toEqual(['urgente', 'haute', 'moyenne-vieille', 'moyenne-recente']);
  });

  it('une tâche renvoyée par le fondateur après livraison redevient à faire', () => {
    const renvoyee = t('renvoyee', '2026-09-20T12:00:00Z', { livre_le: '2026-09-26T06:00:00Z', renvoye_le: '2026-09-27T08:00:00Z' });
    expect(attendUneReponse(renvoyee)).toBe(false);
    expect(tachesDansLOrdre([t('neuve', '2026-09-28T12:00:00Z'), renvoyee])[0].id).toBe('renvoyee');
  });

  it("ne modifie pas la liste reçue", () => {
    const liste = [t('b', '2026-09-28T12:00:00Z'), t('a', '2026-09-20T12:00:00Z')];
    tachesDansLOrdre(liste);
    expect(liste.map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('derniersPassages', () => {
  it('prend le plus récent entre livrable et prise, quel que soit le format de date', () => {
    const servi = derniersPassages(
      [{ auteur_id: 'alpha', created_at: '2026-10-01 14:33:00.722217+00' }],
      [{ assigne_a: 'alpha', meta: { travaille_depuis: '2026-10-01T14:31:49.856Z' } },
        { assigne_a: 'plume', meta: { travaille_depuis: '2026-09-26T15:30:15.883Z' } },
        { assigne_a: null, meta: { travaille_depuis: '2026-10-02T00:00:00Z' } }],
    );
    expect(servi.get('alpha')).toBe('2026-10-01T14:33:00.722Z');
    expect(servi.get('plume')).toBe('2026-09-26T15:30:15.883Z');
    expect(servi.size).toBe(2);
  });
});
