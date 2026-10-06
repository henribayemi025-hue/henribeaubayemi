import { describe, it, expect } from 'vitest';
import { grouper, surligner } from './recherche';

describe('recherche dans le projet', () => {
  it('range les lignes par fichier, dans l’ordre reçu', () => {
    const g = grouper([
      { chemin: 'a.js', ligne: 1, extrait: 'x' },
      { chemin: 'b.js', ligne: 4, extrait: 'y' },
      { chemin: 'a.js', ligne: 9, extrait: 'z' },
    ]);
    expect(g.map((x) => x.chemin)).toEqual(['a.js', 'b.js']);
    expect(g[0].lignes.map((l) => l.ligne)).toEqual([1, 9]);
  });

  it('met en valeur chaque occurrence, majuscules comprises', () => {
    expect(surligner('Bonjour et bonjour', 'BONJOUR')).toEqual([
      { texte: 'Bonjour', trouve: true },
      { texte: ' et ', trouve: false },
      { texte: 'bonjour', trouve: true },
    ]);
    expect(surligner('rien', '')).toEqual([{ texte: 'rien', trouve: false }]);
  });
});
