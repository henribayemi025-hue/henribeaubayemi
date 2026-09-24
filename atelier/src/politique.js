// L'ATELIER — la politique des permissions, appliquée par l'OUTIL.
//
// C'est ici, et seulement ici, que se décide ce qu'un agent peut faire sans
// demander. La consigne donnée au modèle ne décide de rien : même si un
// fichier du projet, un ticket ou une page web « demandait » au modèle
// d'écrire sans permission, chaque appel d'outil repasse par `evaluer()`.
//
// V0 (plan du 24/09, section 1.8) : un seul mode d'action, DEMANDER.
// - Lire, lister, chercher : passent sans demander.
// - Écrire, supprimer, lancer une commande : une carte « Autoriser une fois /
//   Toujours pour cette commande (ou ce fichier) dans ce projet / Refuser ».
// - « Réfléchir d'abord » et « Présente-moi » : lecture seule, rien d'autre.
// Aucun mode automatique. Le mode vit dans le Worker (état du Durable
// Object), réglé par l'utilisateur authentifié ; aucun fichier ne le change.
//
// Ce module est pur (aucune dépendance) : il est testé tel quel
// (atelier/test/politique.test.js).

export const MODES = ['demander', 'reflechir', 'visite'];
export const OUTILS_LECTURE = ['lister', 'lire_fichier', 'chercher'];
export const OUTILS_ECRITURE = ['ecrire_fichier', 'supprimer_fichier'];
export const OUTILS_COMMANDE = ['commande'];

export function outilsPourMode(mode) {
  if (mode === 'demander') return [...OUTILS_LECTURE, ...OUTILS_ECRITURE, ...OUTILS_COMMANDE];
  return [...OUTILS_LECTURE];
}

// ——— La liste toujours refusée ———
// Inspirée de la liste par défaut du mode Auto de Claude Code (annexe A du
// plan). Elle ne remplace pas les vraies barrières (aucun secret dans le bac
// à sable, réseau limité, clic humain) : c'est une ceinture en plus. Même
// « Toujours » ne peut pas l'ouvrir.
// Un mot en position de commande (début, après ; & | ( ou après npx/sudo) :
// « cat vercel.json » ou « node src/service.js » ne sont pas visés.
const CMD = String.raw`(?:^|[;&|(]\s*|\bnpx\s+|\bsudo\s+|\bexec\s+|\benv\s+)`;
const enTete = (mots) => new RegExp(`${CMD}(?:${mots})(?:${String.raw`\s|$|[;&|)]`})`);

const REFUS = [
  // Exécuter un script téléchargé ou décodé.
  [/\|\s*(?:sudo\s+)?(?:env\s+(?:\S+=\S*\s+)*)?(?:ba|z|da|k|c|tc|fi|a)?sh\b/, 'envoyer un texte dans un interpréteur de commandes (« … | sh »)'],
  [/\|\s*(?:sudo\s+)?(?:python[0-9.]*|node|perl|ruby|php)\s*(?:-\s*)?(?:$|[;&|)])/, 'exécuter un texte reçu par un tuyau (« … | python »)'],
  [/(?:^|[^\w])(?:ba|z)?sh\s+<\(\s*(?:curl|wget)\b/, 'exécuter un script téléchargé'],
  [/\$\(\s*(?:curl|wget)\b|`\s*(?:curl|wget)\b/, 'exécuter un script téléchargé'],
  [/(?:^|[;&|(]\s*)eval\b/, '« eval » (exécution de texte arbitraire)'],
  // Effacer le système ou le dossier personnel.
  [/--no-preserve-root/, 'effacer tout le système'],
  // Minage de cryptomonnaie.
  [/\b(?:xmrig|minerd|cpuminer|cgminer|bfgminer|ethminer|nbminer|t-rex|lolminer|phoenixminer|teamredminer|nanominer|gminer|srbminer)\b|stratum\+(?:tcp|ssl|tls)|nicehash|cryptonight|\brandomx\b/i, 'minage de cryptomonnaie'],
  // Faire sortir le code : seul le Worker enverra, après Confirmer (V1).
  [/\bgit(?:\s+-[a-zA-Z]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+push\b/, '« git push » depuis le bac à sable (en V0, on exporte en .zip)'],
  [/\bgit\s+remote\s+(?:add|set-url|rename)\b/, 'changer les dépôts distants de git'],
  [/\bgit\s+config\b[^;&|]*(?:credential|insteadof|sshcommand|core\.hookspath)/i, 'toucher aux identifiants ou aux crochets de git'],
  [/(?:^|[;&|(]\s*)gh\s/, 'l\'outil GitHub en ligne de commande'],
  // Lire l'environnement des autres processus.
  [/\/proc\/[^\s]*\/environ/, 'lire l\'environnement des processus'],
  // Ouvrir un tunnel vers l'extérieur.
  [/\b(?:cloudflared|ngrok|localtunnel|frpc|tailscale|zrok|serveo|pinggy|chisel)\b|localhost\.run|\blt\s+--port\b|\bbore\s+local\b/i, 'ouvrir un tunnel vers Internet'],
  [/\bssh\b[^;&|]*\s-[a-zA-Z]*[RLD]/, 'ouvrir un tunnel SSH'],
  [/\b(?:nc|ncat|netcat)\b[^;&|]*\s-[a-zA-Z]*[lec]/, 'ouvrir un port ou une porte dérobée (netcat)'],
  [/\bsocat\b/, 'relayer le réseau (socat)'],
  // Publier ou déployer : interdit en V0.
  [/\bnpm\s+(?:publish|login|adduser|token|owner|deprecate|unpublish)\b|\b(?:yarn|pnpm)\s+publish\b/, 'publier un paquet npm'],
  [/\b(?:twine|flit)\s+(?:upload|publish)\b|\bpoetry\s+publish\b|\bcargo\s+publish\b|\bgem\s+push\b/, 'publier un paquet'],
  [enTete('wrangler|vercel|netlify|firebase|flyctl|fly|heroku'), 'déployer (interdit en V0)'],
  [/\bsupabase\s+(?:db\s+push|functions\s+deploy|link|login)\b/, 'toucher à une vraie base ou la déployer'],
  // Casser la machine ou la faire durer.
  [/:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, 'bombe de processus'],
  [/\bmkfs(?:\.\w+)?\b|\bdd\b[^;&|]*\bof=\/dev\/|>\s*\/dev\/(?:sd|nvme|vd|xvd)/, 'écrire sur un disque'],
  [enTete('shutdown|reboot|halt|poweroff|crontab|systemctl|service|at|batch'), 'toucher au système ou planifier une tâche'],
  [enTete('nohup|setsid|disown|screen|tmux|daemonize'), 'laisser tourner un processus après la commande'],
  [/(?:^|[^&>])&(?![&>])\s*(?:$|[;)]|\s+\S)/, 'lancer un processus en arrière-plan (« & »)'],
  [enTete('docker|podman|chroot|nsenter|unshare|mount|insmod|modprobe'), 'sortir de l\'isolement'],
  // Écrire hors du projet par une redirection.
  [/(?:^|[^<=\-])>>?\s*(?!\/dev\/null\b|\/tmp\/|\/workspace\/projet(?:\/|\s|$))\/\S*/, 'écrire hors du dossier du projet'],
  [/\btee\s+(?:-a\s+)?(?!\/dev\/null\b|\/tmp\/|\/workspace\/projet\/)\//, 'écrire hors du dossier du projet'],
];

// « rm -r » sur une cible hors du projet : on regarde les mots un à un.
const CIBLES_INTERDITES = new Set(['/', '/*', '~', '~/', '~/*', '$HOME', '$HOME/', '$HOME/*', '..', '../', '../*', '/workspace', '/workspace/', '/workspace/*', '*', '.*']);
function rmDangereux(commande) {
  for (const morceau of commande.split(/[;&|()]+/)) {
    const mots = morceau.trim().split(/\s+/);
    const i = mots.findIndex((m) => m === 'rm' || m.endsWith('/rm'));
    if (i < 0) continue;
    const reste = mots.slice(i + 1);
    const recursif = reste.some((m) => /^-[a-zA-Z]*[rR]/.test(m) || m === '--recursive');
    const cibles = reste.filter((m) => !m.startsWith('-'));
    if (cibles.some((c) => CIBLES_INTERDITES.has(c) || (c.startsWith('/') && !c.startsWith('/workspace/projet/') && !c.startsWith('/tmp/')) || c.startsWith('~') || c.startsWith('$HOME') || c.startsWith('../'))) {
      return recursif ? 'effacer des dossiers hors du projet (« rm -r »)' : 'effacer des fichiers hors du projet';
    }
  }
  return null;
}

export function normaliserCommande(c) {
  return String(c ?? '').replace(/\s+/g, ' ').trim();
}

// Rend la raison du refus, ou null si la commande n'est pas dans la liste.
export function commandeInterdite(commande) {
  const c = normaliserCommande(commande);
  if (!c) return 'commande vide';
  if (c.length > 2000) return 'commande trop longue';
  if (/[\0\r]/.test(c)) return 'caractères de contrôle';
  for (const [re, raison] of REFUS) if (re.test(c)) return raison;
  return rmDangereux(c);
}

// ——— Les chemins ———
// Tout se passe dans /workspace/projet. On rend un chemin RELATIF propre, ou
// une erreur. Pas de « .. », pas de chemin absolu ailleurs, pas de .git.
export const RACINE = '/workspace/projet';
export function cheminSur(brut) {
  if (typeof brut !== 'string') return { erreur: 'chemin manquant' };
  let p = brut.trim().replace(/\\/g, '/');
  if (!p) return { erreur: 'chemin vide' };
  if (p.length > 300) return { erreur: 'chemin trop long' };
  if (/[\0\n\r]/.test(p)) return { erreur: 'caractères interdits dans le chemin' };
  if (p === RACINE) p = '.';
  else if (p.startsWith(RACINE + '/')) p = p.slice(RACINE.length + 1);
  else if (p.startsWith('/')) return { erreur: `chemin hors du projet (${brut})` };
  if (p.startsWith('~')) return { erreur: `chemin hors du projet (${brut})` };
  const parts = [];
  for (const s of p.split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') return { erreur: `« .. » interdit (${brut})` };
    parts.push(s);
  }
  if (parts.includes('.git')) return { erreur: 'le dossier .git n\'est pas modifiable par l\'agent' };
  return { chemin: parts.join('/') };
}

// ——— Le réseau qu'une commande va probablement utiliser (pour la carte) ———
// Ce n'est qu'une indication pour l'humain : la vraie barrière est la liste
// des domaines autorisés du bac à sable (index.js, AtelierSandbox).
export function reseauProbable(commande) {
  const c = normaliserCommande(commande);
  const hotes = new Set();
  if (/\b(?:npm|pnpm|yarn)\s+(?:i|install|add|ci|create|update|upgrade|dlx)\b|\bnpx\s+\S/.test(c)) hotes.add('registry.npmjs.org');
  if (/\b(?:pip3?|uv\s+pip|python[0-9.]*\s+-m\s+pip)\s+install\b|\bpoetry\s+(?:add|install)\b|\buv\s+(?:add|sync)\b/.test(c)) { hotes.add('pypi.org'); hotes.add('files.pythonhosted.org'); }
  if (/\bgit\s+(?:clone|fetch|pull|ls-remote)\b/.test(c)) { hotes.add('github.com'); }
  return [...hotes];
}

// ——— Le réseau du bac à sable (plan, annexe A) ———
// Internet est fermé ; seuls ces domaines passent, et en LECTURE seulement.
// Appliqué par le relais de sortie de Cloudflare (index.js), hors du bac à
// sable : une commande ne peut pas le changer.
export const HOTES_PERMIS = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org', 'github.com', 'codeload.github.com'];

// GET, HEAD, OPTIONS seulement. Une exception : le « git clone » de GitHub
// lit par un POST vers …/git-upload-pack. L'envoi (git-receive-pack) et
// toute publication (npm publish est un PUT) sont refusés.
export function sortiePermise(methode, url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (!HOTES_PERMIS.includes(u.hostname)) return false;
  if (['GET', 'HEAD', 'OPTIONS'].includes(String(methode).toUpperCase())) return true;
  return String(methode).toUpperCase() === 'POST' && u.hostname === 'github.com' && /\/git-upload-pack$/.test(u.pathname);
}

// ——— Les règles « Toujours » ———
export function regleCorrespond(regles, outil, args) {
  const actives = (regles || []).filter((r) => !r.revoquee_le);
  if (outil === 'commande') {
    const c = normaliserCommande(args?.commande);
    return actives.find((r) => r.portee === 'commande' && r.regle === c) || null;
  }
  if (OUTILS_ECRITURE.includes(outil)) {
    const { chemin } = cheminSur(args?.chemin);
    return chemin ? actives.find((r) => r.portee === 'fichier' && r.regle === chemin) || null : null;
  }
  return null;
}

// La règle à créer quand l'humain clique « Toujours ».
export function regleDepuis(outil, args) {
  if (outil === 'commande') {
    const c = normaliserCommande(args?.commande);
    if (!c || commandeInterdite(c)) return null;
    return { portee: 'commande', regle: c };
  }
  if (OUTILS_ECRITURE.includes(outil)) {
    const { chemin } = cheminSur(args?.chemin);
    return chemin ? { portee: 'fichier', regle: chemin } : null;
  }
  return null;
}

// ——— La décision ———
// { decision: 'auto' | 'demander' | 'refuser', raison, ... }
export function evaluer(outil, args, { mode = 'demander', regles = [] } = {}) {
  if (!MODES.includes(mode)) return { decision: 'refuser', raison: `mode inconnu (${mode})` };
  if (OUTILS_LECTURE.includes(outil)) {
    if (outil !== 'chercher' || args?.chemin) {
      const { erreur } = cheminSur(args?.chemin ?? '.');
      if (erreur) return { decision: 'refuser', raison: erreur };
    }
    return { decision: 'auto', raison: 'lecture' };
  }
  if (![...OUTILS_ECRITURE, ...OUTILS_COMMANDE].includes(outil)) return { decision: 'refuser', raison: `outil inconnu (${outil})` };
  if (mode !== 'demander') return { decision: 'refuser', raison: 'mode lecture seule : rien ne se modifie ni ne s\'exécute' };

  if (outil === 'commande') {
    const commande = normaliserCommande(args?.commande);
    const interdite = commandeInterdite(commande);
    if (interdite) return { decision: 'refuser', raison: `toujours refusé : ${interdite}`, liste: true, commande };
    const regle = regleCorrespond(regles, outil, args);
    if (regle) return { decision: 'auto', raison: 'règle « Toujours » de ce projet', regle, commande };
    return { decision: 'demander', raison: 'commande', commande, reseau: reseauProbable(commande) };
  }

  const { chemin, erreur } = cheminSur(args?.chemin);
  if (erreur) return { decision: 'refuser', raison: erreur };
  if (outil === 'ecrire_fichier') {
    if (typeof args?.contenu !== 'string') return { decision: 'refuser', raison: 'contenu manquant' };
    if (args.contenu.length > 400_000) return { decision: 'refuser', raison: 'fichier trop gros (400 000 caractères au plus)' };
  }
  const regle = regleCorrespond(regles, outil, args);
  if (regle) return { decision: 'auto', raison: 'règle « Toujours » de ce projet', regle, chemin };
  return { decision: 'demander', raison: outil === 'ecrire_fichier' ? 'modification de fichier' : 'suppression de fichier', chemin };
}

// Trois échecs identiques d'affilée : on s'arrête (plan, 1.4).
export function signatureEchec(outil, args, erreur) {
  return `${outil}|${JSON.stringify(args ?? {})}|${String(erreur ?? '').slice(0, 200)}`;
}
