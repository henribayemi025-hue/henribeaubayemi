import { describe, it, expect } from 'vitest';
import { lignesTaches } from './TachesFond';

describe('tâches de code des agents dans l’atelier', () => {
  it('ne garde que les tâches de code, avec agent, statut et lien sûr', () => {
    const l = lignesTaches([
      { id: '1', auteur_id: 'a', created_at: 'x', meta: { action: { type: 'modifier_code', valeur: 'Corriger le bouton', statut: 'faite', fusion: 'https://github.com/o/r/pull/3', branche: 'leo/bouton' } } },
      { id: '2', auteur_id: 'a', meta: { action: { type: 'creer_visuel', valeur: 'affiche' } } },
      { id: '3', auteur_id: 'b', created_at: 'y', meta: { action: { type: 'modifier_code', valeur: 'x', statut: 'en_cours', fusion: 'javascript:alert(1)' } } },
    ], { a: 'Ada' });
    expect(l.map((x) => x.id)).toEqual(['1', '3']);
    expect(l[0]).toMatchObject({ agent: 'Ada', statut: 'faite', fusion: 'https://github.com/o/r/pull/3', branche: 'leo/bouton' });
    expect(l[1].fusion).toBeNull();
    expect(l[1].agent).toBe('—');
  });
});
