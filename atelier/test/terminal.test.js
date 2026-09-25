// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { enveloppe, lireDossier, retenir } from '../src/terminal.js';

describe('terminal : cd tient, historique', () => {
  it('relit le dossier atteint, seulement dans le projet', () => {
    expect(lireDossier('a\nb\n__ATELIER_DOSSIER__/workspace/projet/src/lib\n')).toEqual({ sortie: 'a\nb', dossier: 'src/lib' });
    expect(lireDossier('__ATELIER_DOSSIER__/workspace/projet\n', 'src')).toEqual({ sortie: '', dossier: '' });
    expect(lireDossier('x\n__ATELIER_DOSSIER__/etc\n', 'src').dossier).toBe('');
    expect(lireDossier('x\n__ATELIER_DOSSIER__/workspace/projet-autre\n', 'src').dossier).toBe('');
    expect(lireDossier('sans marque', 'src')).toEqual({ sortie: 'sans marque', dossier: 'src' });
  });

  it('dans un vrai shell : repart du dossier courant, garde le code de sortie', () => {
    // Le même texte, joué par bash, en remplaçant la racine par un dossier temporaire.
    const tmp = execFileSync('mktemp', ['-d']).toString().trim();
    execFileSync('mkdir', ['-p', `${tmp}/src/lib`]);
    const jouer = (cmd, dossier) => {
      const script = enveloppe(cmd, dossier).replaceAll('/workspace/projet', tmp);
      try { return { out: execFileSync('bash', ['-c', script]).toString(), code: 0 }; } catch (e) { return { out: e.stdout.toString(), code: e.status }; }
    };
    const a = jouer('cd src', '');
    expect(lireDossier(a.out.replaceAll(tmp, '/workspace/projet')).dossier).toBe('src');
    const b = jouer('cd lib && pwd', 'src');
    expect(b.out).toContain(`${tmp}/src/lib`);
    const c = jouer('ls /nulle-part-du-tout', 'src');
    expect(c.code).not.toBe(0);
    expect(lireDossier(jouer('true', 'dossier-disparu').out.replaceAll(tmp, '/workspace/projet')).dossier).toBe('');
  });

  it('historique : 50 au plus, sans doublon, le plus récent à la fin', () => {
    expect(retenir(['ls', 'npm test'], 'ls')).toEqual(['npm test', 'ls']);
    expect(retenir(Array.from({ length: 60 }, (_, i) => `c${i}`), 'x')).toHaveLength(50);
  });
});
