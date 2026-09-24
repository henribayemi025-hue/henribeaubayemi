// Un faux bac à sable qui parle comme le Sandbox SDK (exists, mkdir,
// writeFile, readFile, deleteFile, exec), mais dans un dossier temporaire
// de cette machine. « /workspace » y devient ce dossier. Pour les essais de
// src/bac.js et la démonstration locale : jamais en production.

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';

export function bacDossier(racine) {
  const reel = (p) => String(p).replace(/^\/workspace/, racine);
  const retour = (t) => String(t).split(racine).join('/workspace');
  return {
    async exists(p) { return { exists: existsSync(reel(p)) }; },
    async mkdir(p) { mkdirSync(reel(p), { recursive: true }); },
    async writeFile(p, c) { mkdirSync(dirname(reel(p)), { recursive: true }); writeFileSync(reel(p), c); },
    async readFile(p) { return { content: readFileSync(reel(p), 'utf8'), encoding: 'utf-8', isBinary: false }; },
    async deleteFile(p) { rmSync(reel(p), { force: true }); },
    async exec(commande, o = {}) {
      const c = String(commande).replace(/(^|[\s'"])\/workspace/g, `$1${racine}`);
      try {
        const stdout = execSync(c, { cwd: o.cwd ? reel(o.cwd) : racine, env: { ...process.env, ...(o.env || {}) }, stdio: ['ignore', 'pipe', 'pipe'], shell: '/bin/bash' }).toString();
        return { exitCode: 0, stdout: retour(stdout), stderr: '' };
      } catch (e) {
        return { exitCode: e.status ?? 1, stdout: retour(e.stdout || ''), stderr: retour(e.stderr || '') };
      }
    },
  };
}
