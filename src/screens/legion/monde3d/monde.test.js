// Le monde 3D : qui est où, sur les vraies données uniquement.
import { describe, it, expect } from 'vitest';
import { traitsDe, corpsDe, quiOuEst, repondre, RECEPTIONNISTE } from './monde';

const MAINTENANT = Date.parse('2026-09-25T10:00:00Z');
const il = (min) => new Date(MAINTENANT - min * 60000).toISOString();
const agents = [
  { id: 'a', nom: 'Alpha', actif: true, apparence: { description: 'A confident man in his 40s' } },
  { id: 'b', nom: 'Ada Nkemba', actif: true, apparence: { description: 'A young Black woman developer' } },
  { id: 'c', nom: 'Rigo', actif: true },
  { id: 'd', nom: 'Foulée', actif: false },
  { id: 'h', nom: 'Beau', user_id: 'u1' },
];

describe('monde 3D', () => {
  it('le corps suit le portrait, toujours le même, jamais celui de la réceptionniste', () => {
    expect(traitsDe(agents[1])).toEqual({ g: 'f', teint: 'fonce' });
    const c = corpsDe(agents[1]);
    expect(c.g).toBe('f');
    expect(c.id).not.toBe(RECEPTIONNISTE);
    expect(corpsDe(agents[0]).g).toBe('m');
    expect(corpsDe(agents[2]).id).toBe(corpsDe(agents[2]).id);
  });

  it('personne en réunion ni au bureau sans activité réelle', () => {
    const ou = quiOuEst({ agents, messages: [], taches: [], maintenant: MAINTENANT });
    expect(ou.reunion).toBeNull();
    expect(ou.auBureau).toEqual([]);
  });

  it('réunion vivante, bureau récent, agent éteint absent', () => {
    const messages = [
      { auteur_id: 'a', created_at: il(3), texte: 'Point produit\nsuite', meta: { reunion: { id: 'r1', ordre: 1 } } },
      { auteur_id: 'c', created_at: il(2), texte: 'Je relis', meta: { reunion: { id: 'r1', ordre: 2 } } },
      { auteur_id: 'b', created_at: il(4), texte: 'Je code la palette' },
      { auteur_id: 'd', created_at: il(1), texte: 'je dors' },
      { auteur_id: 'b', user_id: 'u1', created_at: il(1), texte: 'humain' },
    ];
    const ou = quiOuEst({ agents, messages, taches: [], maintenant: MAINTENANT });
    expect(ou.reunion.participants).toEqual(['a', 'c']);
    expect(ou.reunion.parle).toBe('c');
    expect(ou.reunion.sujet).toBe('Point produit');
    expect(ou.auBureau.map((x) => x.id)).toEqual(['b']);
  });

  it('une réunion close ou vieille de plus d une heure n est plus en cours', () => {
    const closes = [
      { auteur_id: 'a', created_at: il(5), texte: 'x', meta: { reunion: { id: 'r1' } } },
      { auteur_id: 'a', created_at: il(4), texte: 'CR', meta: { reunion: { id: 'r1', fin: true } } },
      { auteur_id: 'c', created_at: il(90), texte: 'y', meta: { reunion: { id: 'r2' } } },
    ];
    expect(quiOuEst({ agents, messages: closes, maintenant: MAINTENANT }).reunion).toBeNull();
  });

  it('à leur poste : tâche ouverte, pas rendue, agent allumé ; dernière réunion', () => {
    const taches = [
      { assigne_a: 'c', texte: 'Relire la fiche', meta: { statut: 'a_faire' } },
      { assigne_a: 'b', texte: 'Déjà rendue', meta: { statut: 'revue' } },
      { assigne_a: 'd', texte: 'Veille', meta: { statut: 'a_faire' } },
    ];
    const messages = [{ auteur_id: 'a', created_at: il(200), texte: 'Compte rendu — Budget du mois\nsuite', meta: { reunion: { id: 'r9', fin: true } } }];
    const ou = quiOuEst({ agents, messages, taches, maintenant: MAINTENANT });
    expect(ou.aLeurPoste.map((x) => x.id)).toEqual(['c']);
    expect(ou.derniereReunion.sujet).toBe('Budget du mois');
  });

  it('la réceptionniste répond avec les vraies données', () => {
    const ou = { reunion: { participants: ['a'], sujet: 'Budget' }, auBureau: [{ id: 'b', tache: 'Palette Ctrl+K' }] };
    expect(repondre('Qui est en réunion ?', { agents, ou }).aller).toBe('reunion');
    expect(repondre('où est Ada ?', { agents, ou }).texte).toMatch(/Ada Nkemba travaille/);
    expect(repondre('et Foulée ?', { agents, ou }).texte).toMatch(/en veille/);
    expect(repondre('Rigo ?', { agents, ou }).texte).toMatch(/rien fait/);
    expect(repondre('bonjour', { agents, ou, nomEntreprise: 'Finjaro' }).texte).toMatch(/Finjaro/);
  });
});
