import { describe, expect, it } from 'vitest';
import { rechercher, decouper, scoreFlou } from './palette';

// Les cas d'Ada (tests-palette.js), repris.
const F = ['index.html', 'style.css', 'script.js', 'src/app.js', 'src/panier.js', 'README.md'].map((label) => ({ type: 'fichier', label }));
const A = ['Présente-moi comment ça marche', 'Exporter en .zip', 'Nouveau terminal', 'Mode Tout autoriser', 'Stop'].map((label) => ({ type: 'action', label }));
const E = [...F, ...A];
const premier = (q) => rechercher(q, E)[0]?.label;

describe('palette : recherche floue (cas d’Ada)', () => {
  it('requête vide : tout, dans l’ordre', () => expect(rechercher('', E).map((r) => r.label)).toEqual(E.map((e) => e.label)));
  it('index, app, pan, readme', () => {
    expect(premier('index')).toBe('index.html');
    expect(premier('app')).toBe('src/app.js');
    expect(premier('pan')).toBe('src/panier.js');
    expect(premier('readme')).toBe('README.md');
  });
  it('lettres dans l’ordre mais pas collées : idx → index.html, positions i,d,x', () => {
    expect(premier('idx')).toBe('index.html');
    expect(scoreFlou('idx', 'index.html').positions).toEqual([0, 2, 4]);
  });
  it('accents ignorés, espaces ignorés', () => {
    expect(premier('presente')).toBe('Présente-moi comment ça marche');
    expect(premier('ca marche')).toBe('Présente-moi comment ça marche');
  });
  it('« > » : seulement les actions', () => {
    expect(rechercher('>', E).every((r) => r.type === 'action')).toBe(true);
    expect(rechercher('>zip', E)[0].label).toBe('Exporter en .zip');
    expect(rechercher('>term', E)[0].label).toBe('Nouveau terminal');
  });
  it('rien ne correspond : liste vide ; au plus 50', () => {
    expect(rechercher('zzz', E)).toEqual([]);
    const beaucoup = Array.from({ length: 80 }, (_, i) => ({ type: 'fichier', label: `f${i}.js` }));
    expect(rechercher('f', beaucoup)).toHaveLength(50);
  });
  it('gras : les lettres trouvées, texte complet gardé', () => {
    const m = decouper('src/app.js', scoreFlou('app', 'src/app.js').positions);
    expect(m.map((x) => x.texte).join('')).toBe('src/app.js');
    expect(m.find((x) => x.gras).texte).toBe('app');
  });
});
