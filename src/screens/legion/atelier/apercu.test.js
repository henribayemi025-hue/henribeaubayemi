import { describe, it, expect } from 'vitest';
import { pageDeDepart, dependances, assembler } from './apercu';

describe('aperçu de l’atelier', () => {
  it('choisit index.html', () => {
    expect(pageDeDepart(['a.html', 'index.html', 'style.css'])).toBe('index.html');
    expect(pageDeDepart(['site/index.html', 'b.html'])).toBe('site/index.html');
    expect(pageDeDepart(['main.py'])).toBe(null);
  });
  it('trouve les .css et .js locaux, pas ceux du web', () => {
    const html = '<link rel="stylesheet" href="style.css"><link rel="icon" href="x.png"><link rel="stylesheet" href="https://cdn/x.css"><script src="./js/app.js"></script>';
    expect(dependances('index.html', html)).toEqual(['style.css', 'js/app.js']);
    expect(dependances('site/index.html', '<script src="../a.js"></script>')).toEqual(['a.js']);
  });
  it('remplace les fichiers par leur contenu', () => {
    const html = '<head><link rel="stylesheet" href="style.css" /></head><body><script src="script.js"></script></body>';
    const doc = assembler('index.html', html, { 'style.css': 'body{color:red}', 'script.js': 'let a = "</script>";' });
    expect(doc).toContain('<style>\nbody{color:red}\n</style>');
    expect(doc).toContain('<\\/script>');
    expect(doc).not.toContain('href="style.css"');
  });
  it('prête un stockage à la page, avant ses scripts', () => {
    const doc = assembler('index.html', '<html><head><title>x</title></head><body><script src="a.js"></script></body></html>', { 'a.js': 'localStorage.setItem(1,2)' });
    expect(doc.indexOf('localStorage')).toBeLessThan(doc.indexOf('<title>'));
  });
  it('laisse tel quel ce qui manque', () => {
    const html = '<link rel="stylesheet" href="absent.css">';
    expect(assembler('index.html', html, {})).toContain(html);
  });
});
