import { describe, it, expect } from 'vitest';
import { construireArbre, langageDe, dollars } from './arbre';

describe('atelier : arbre des dossiers', () => {
  it('range dossiers puis fichiers, triés', () => {
    const a = construireArbre([{ chemin: 'src/b.js', taille: 1 }, { chemin: 'README.md', taille: 2 }, { chemin: 'src/a/x.js', taille: 3 }, { chemin: 'index.html', taille: 4 }]);
    expect(a.dossiers.map((d) => d.nom)).toEqual(['src']);
    expect(a.fichiers.map((f) => f.nom)).toEqual(['index.html', 'README.md']);
    expect(a.dossiers[0].dossiers[0].chemin).toBe('src/a');
    expect(a.dossiers[0].fichiers[0].chemin).toBe('src/b.js');
  });
  it('reconnaît les langages', () => {
    expect(langageDe('a/b.jsx')).toBe('js');
    expect(langageDe('main.py')).toBe('py');
    expect(langageDe('Makefile')).toBe('texte');
  });
  it('affiche des dollars US, sans supposer la monnaie de la personne', () => {
    expect(dollars(0.0123, 'en')).toBe('$0.0123');
    expect(dollars(1, 'en')).toBe('$1.00');
  });
});
