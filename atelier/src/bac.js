// Le BAC À SABLE, vu de la boucle : « exécute cette commande ».
//
// La copie qui fait foi des fichiers du projet est celle du Worker (le
// Durable Object). Le bac à sable est un exécutant JETABLE : il s'endort
// après quelques minutes sans travail (et perd alors son disque), et on le
// remet d'aplomb avant chaque commande. Conséquences :
// - lire, lister, chercher, écrire : le bac à sable ne démarre même pas ;
// - une commande : on (re)pose les fichiers, on lance, puis on rapatrie ce
//   que la commande a changé ;
// - node_modules et consorts ne sont pas rapatriés : après une veille, il
//   faut relancer l'installation (c'est dit à l'agent).
//
// `sandbox` est l'objet rendu par getSandbox() du SDK Cloudflare
// (@cloudflare/sandbox 0.12.10 : exec, writeFile, readFile, mkdir,
// deleteFile, exists, killAllProcesses) — ou un faux, pour les essais.

import { RACINE } from './politique.js';

const TEMOIN = '/workspace/.atelier-pret';
const EXCLUS = ['node_modules', '.git', '.venv', '__pycache__', 'dist', 'build', '.next', '.cache'];
const TAILLE_MAX = 300_000; // octets par fichier rapatrié
const NB_MAX = 1000;

export async function empreinte(texte) {
  const h = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texte));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const guillemets = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// Remet le bac à sable d'aplomb : tout reposer s'il sort de veille, sinon
// seulement ce qui a changé depuis (etat.sales).
export async function assurer(sandbox, etat, fichiers) {
  const present = await sandbox.exists(TEMOIN).then((r) => !!r?.exists).catch(() => false);
  if (!present) {
    await sandbox.mkdir(RACINE, { recursive: true });
    for (const f of await fichiers.liste()) {
      const contenu = await fichiers.lire(f.chemin);
      if (contenu == null) continue;
      const dossier = f.chemin.includes('/') ? f.chemin.slice(0, f.chemin.lastIndexOf('/')) : '';
      if (dossier) await sandbox.mkdir(`${RACINE}/${dossier}`, { recursive: true });
      await sandbox.writeFile(`${RACINE}/${f.chemin}`, contenu);
    }
    await sandbox.writeFile(TEMOIN, new Date().toISOString());
    etat.sales = {};
    return { restaure: true };
  }
  const sales = Object.entries(etat.sales || {});
  if (sales.length) {
    // Un lien symbolique posé par une commande ne doit pas faire écrire
    // hors du projet : on vérifie où mène chaque chemin avant d'écrire.
    const r = await sandbox.exec(`realpath -m -- ${sales.map(([c]) => guillemets(`${RACINE}/${c}`)).join(' ')}`);
    const reels = String(r.stdout || '').split('\n');
    for (let i = 0; i < sales.length; i++) {
      const [chemin, quoi] = sales[i];
      const reel = reels[i] || '';
      if (!reel.startsWith(`${RACINE}/`)) continue;
      if (quoi === 'supprime') await sandbox.deleteFile(reel).catch(() => {});
      else {
        const contenu = await fichiers.lire(chemin);
        if (contenu == null) continue;
        const dossier = reel.slice(0, reel.lastIndexOf('/'));
        await sandbox.mkdir(dossier, { recursive: true });
        await sandbox.writeFile(reel, contenu);
      }
    }
  }
  etat.sales = {};
  return { restaure: false };
}

// Rapatrie ce qu'une commande a créé, changé ou supprimé.
export async function synchroniser(sandbox, fichiers) {
  const exclus = EXCLUS.map((d) => `-not -path './${d}/*' -not -path '*/${d}/*'`).join(' ');
  const r = await sandbox.exec(`cd ${RACINE} && find . -type f ${exclus} -size -${Math.floor(TAILLE_MAX / 1024)}k -print0 | head -z -n ${NB_MAX} | xargs -0 -r sha1sum`);
  const dansLeBac = new Map();
  for (const ligne of String(r.stdout || '').split('\n')) {
    const m = /^([0-9a-f]{40}) {2}\.\/(.+)$/.exec(ligne);
    if (m) dansLeBac.set(m[2], m[1]);
  }
  const changes = [];
  const chezNous = await fichiers.liste();
  const connus = new Set(chezNous.map((f) => f.chemin));
  for (const [chemin, h] of dansLeBac) {
    const actuel = connus.has(chemin) ? await fichiers.lire(chemin) : null;
    if (actuel != null && (await empreinte(actuel)) === h) continue;
    const lu = await sandbox.readFile(`${RACINE}/${chemin}`).catch(() => null);
    if (!lu || lu.isBinary || lu.encoding === 'base64') continue; // V0 : fichiers texte seulement
    await fichiers.ecrire(chemin, lu.content, { depuisLeBac: true });
    changes.push(chemin);
  }
  for (const f of chezNous) {
    if (dansLeBac.has(f.chemin) || f.taille >= TAILLE_MAX) continue;
    if (f.chemin.split('/').some((s) => EXCLUS.includes(s))) continue;
    if (dansLeBac.size >= NB_MAX) break; // liste tronquée : on ne supprime rien
    await fichiers.supprimer(f.chemin, { depuisLeBac: true });
    changes.push(f.chemin);
  }
  return changes;
}

// L'exécutant donné à la boucle.
export function executant({ sandbox, etat, fichiers, veilleSecondes = 600, horloge = () => Date.now() }) {
  return {
    async executer(commande, { signal } = {}) {
      const debut = horloge();
      await assurer(sandbox, etat, fichiers);
      let r;
      try {
        r = await sandbox.exec(commande, {
          cwd: RACINE,
          timeout: 120_000,
          signal,
          // npm n'a pas besoin de parler à son service d'audit (requête POST,
          // refusée par le relais de sortie, qui n'autorise que la lecture).
          env: { npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false', CI: '1' },
        });
      } catch (e) {
        r = { exitCode: 124, stdout: '', stderr: `La commande n'a pas abouti : ${e.message}` };
      }
      let changes = [];
      try { changes = await synchroniser(sandbox, fichiers); } catch (e) { r.stderr = `${r.stderr || ''}\n(rapatriement des fichiers impossible : ${e.message})`; }
      const fin = horloge();
      // Le conteneur est facturé tant qu'il tourne : la durée de la commande,
      // plus l'attente depuis la commande précédente (s'il ne dormait pas).
      const ecart = etat.bacDerniereFin ? Math.min(Math.max(0, (debut - etat.bacDerniereFin) / 1000), veilleSecondes) : 0;
      etat.bacDerniereFin = fin;
      return { code: r.exitCode ?? 1, stdout: r.stdout || '', stderr: r.stderr || '', secondes: (fin - debut) / 1000 + ecart, fichiersChanges: changes };
    },
  };
}
