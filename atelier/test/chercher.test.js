// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { chercherDans } from '../src/boucle.js';
import { fauxFichiers } from './faux.js';

const f = () => fauxFichiers({
  'index.html': '<h1>Bonjour</h1>\n<p>bonjour encore</p>\n',
  'src/app.js': "const a = 1;\nconsole.log('BONJOUR');\n",
  'src/vide.js': '',
});

describe('chercher dans tout le projet', () => {
  it('trouve chaque ligne, sans tenir compte des majuscules, avec son numéro', async () => {
    const r = await chercherDans(f(), 'bonjour');
    expect(r.complet).toBe(true);
    expect(r.trouves).toEqual([
      { chemin: 'index.html', ligne: 1, extrait: '<h1>Bonjour</h1>' },
      { chemin: 'index.html', ligne: 2, extrait: '<p>bonjour encore</p>' },
      { chemin: 'src/app.js', ligne: 2, extrait: "console.log('BONJOUR');" },
    ]);
  });

  it('se limite à un dossier quand on le donne', async () => {
    const r = await chercherDans(f(), 'bonjour', 'src');
    expect(r.trouves.map((x) => x.chemin)).toEqual(['src/app.js']);
  });

  it('dit quand la liste est coupée', async () => {
    const r = await chercherDans(f(), 'bonjour', '.', 2);
    expect(r.trouves).toHaveLength(2);
    expect(r.complet).toBe(false);
  });

  it('un texte vide ne trouve rien', async () => {
    expect((await chercherDans(f(), '  ')).trouves).toEqual([]);
  });
});
