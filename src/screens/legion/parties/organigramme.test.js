// L'organigramme : le chef d'abord, son équipe sous lui ; personne ne se perd.
import { describe, it, expect } from 'vitest';
import { rangerEquipe } from './organigramme';

const noms = (l) => l.map(({ a, niveau }) => `${a.nom}:${niveau}`);

describe('organigramme : ranger une équipe', () => {
  it('sans chef ni grade : le directeur, puis les autres par nom', () => {
    const r = rangerEquipe([{ id: 1, nom: 'Zoé' }, { id: 2, nom: 'Alpha', est_directeur: true }, { id: 3, nom: 'Boussole' }]);
    expect(noms(r)).toEqual(['Alpha:0', 'Boussole:0', 'Zoé:0']);
  });
  it('chef puis équipe, par grade ; au-delà de deux niveaux on reste à 2', () => {
    const r = rangerEquipe([
      { id: 's', nom: 'Sami', grade: 'stagiaire', chef_id: 'm' },
      { id: 'm', nom: 'Maya', grade: 'manager', chef_id: 'd' },
      { id: 'd', nom: 'Dora', est_directeur: true },
      { id: 'j', nom: 'Jo', grade: 'junior', chef_id: 'm' },
      { id: 'x', nom: 'Xa', grade: 'alternant', chef_id: 's' },
    ]);
    expect(noms(r)).toEqual(['Dora:0', 'Maya:1', 'Jo:2', 'Sami:2', 'Xa:2']);
  });
  it('un chef hors du département ou une boucle ne fait disparaître personne', () => {
    const r = rangerEquipe([{ id: 1, nom: 'A', chef_id: 2 }, { id: 2, nom: 'B', chef_id: 1 }, { id: 3, nom: 'C', chef_id: 99 }]);
    expect(r).toHaveLength(3);
    expect(new Set(r.map((x) => x.a.nom))).toEqual(new Set(['A', 'B', 'C']));
  });
});
