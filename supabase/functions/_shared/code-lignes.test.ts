import { describe, it, expect } from 'vitest';
import { morceauNumerote, motCherche, fichiersALire } from './code-lignes.ts';

describe('morceauNumerote', () => {
  const texte = ['un', 'deux', 'trois', 'quatre', 'cinq'].join('\n') + '\n';
  it('numérote chaque ligne depuis le début du fichier', () => {
    const m = morceauNumerote(texte);
    expect(m.contenu.split('\n')[0]).toBe('1│ un');
    expect(m.derniere_ligne).toBe(5);
    expect(m.suite).toBeNull();
  });
  it('garde les vrais numéros pour un morceau du milieu, sans couper de ligne', () => {
    const m = morceauNumerote(texte, texte.indexOf('trois'), 8);
    expect(m.premiere_ligne).toBe(3);
    expect(m.contenu).toBe('3│ trois');
    expect(m.suite).toBe(texte.indexOf('quatre'));
  });
});

describe('motCherche', () => {
  it('retrouve le mot sous un autre nom ou dans la seule valeur texte', () => {
    expect(motCherche({ mot: 'Checkout' })).toBe('checkout');
    expect(motCherche({ requete: 'money' })).toBe('money');
    expect(motCherche({ terme: 'prix' })).toBe('prix');
    expect(motCherche({})).toBe('');
  });
});

describe('fichiersALire', () => {
  it('lit le code avant les tests et la documentation, sans relire', () => {
    const f = ['src/a.test.jsx', 'docs/x.md', 'src/a.jsx', 'src/b.jsx'];
    expect(fichiersALire(f, new Set(['src/b.jsx']))).toEqual(['src/a.jsx', 'docs/x.md']);
  });
});
