// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, symlinkSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executant, assurer } from '../src/bac.js';
import { bacDossier } from './bac-dossier.js';
import { fauxFichiers } from './faux.js';

let dossiers = [];
afterEach(() => { for (const d of dossiers) rmSync(d, { recursive: true, force: true }); dossiers = []; });
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'atelier-essai-')); dossiers.push(d); return d; };

describe('le bac à sable, vu de la boucle', () => {
  it('repose les fichiers au réveil, lance, puis rapatrie ce que la commande a changé', async () => {
    const racine = tmp();
    const f = fauxFichiers({ 'README.md': 'a\n', 'src/x.js': 'x\n' });
    const etat = { sales: {} };
    const bac = executant({ sandbox: bacDossier(racine), etat, fichiers: f });
    const r = await bac.executer('echo nouveau > cree.txt && rm README.md && mkdir -p node_modules/p && echo 1 > node_modules/p/i.js');
    expect(r.code).toBe(0);
    expect(existsSync(join(racine, 'projet/src/x.js'))).toBe(true);
    expect(f.m.get('cree.txt')).toBe('nouveau\n');
    expect(f.m.has('README.md')).toBe(false);
    expect([...f.m.keys()].some((k) => k.startsWith('node_modules'))).toBe(false); // jamais rapatrié
    expect(r.fichiersChanges.sort()).toEqual(['README.md', 'cree.txt']);
  });

  it('n\'écrit pas à travers un lien symbolique qui sort du projet', async () => {
    const racine = tmp();
    const dehors = join(tmp(), 'cible.txt');
    writeFileSync(dehors, 'intact');
    const f = fauxFichiers({ 'a.txt': '1' });
    const etat = { sales: {} };
    const sandbox = bacDossier(racine);
    await assurer(sandbox, etat, f); // premier réveil : tout est posé
    symlinkSync(dehors, join(racine, 'projet/lien.txt'));
    await f.ecrire('lien.txt', 'piégé');
    etat.sales['lien.txt'] = 'ecrit';
    await assurer(sandbox, etat, f);
    expect(readFileSync(dehors, 'utf8')).toBe('intact');
  });
});
