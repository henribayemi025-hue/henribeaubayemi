// Le terminal de l'humain (suite du 25/09) : un « cd » tient d'une commande à
// l'autre, comme dans un vrai terminal, et les dernières commandes restent
// (flèche du haut). Chaque commande repart du dossier courant du projet ; le
// dossier atteint est relu à la fin, et seulement s'il reste DANS le projet.

import { RACINE } from './politique.js';

const MARQUE = '__ATELIER_DOSSIER__';
const guillemets = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

// La commande, lancée depuis le dossier courant, qui rend à la fin le dossier atteint.
export function enveloppe(commande, dossier = '') {
  const depart = dossier ? `${RACINE}/${dossier}` : RACINE;
  // Dans un sous-shell : le bac à sable garde UNE session shell ouverte ; un
  // « exit » au niveau de la session la tuerait (vu le 25/09 : la commande ne
  // rendait jamais la main).
  return `(\ncd ${guillemets(depart)} 2>/dev/null || cd ${guillemets(RACINE)}\n{ ${commande}\n}\n__code=$?\nprintf '\\n${MARQUE}%s\\n' "$PWD"\nexit $__code\n)`;
}

// La sortie sans la marque, et le nouveau dossier (relatif au projet ; '' = la racine).
export function lireDossier(stdout, avant = '') {
  const texte = String(stdout || '');
  const i = texte.lastIndexOf(MARQUE);
  if (i < 0) return { sortie: texte, dossier: avant };
  const pwd = texte.slice(i + MARQUE.length).split('\n')[0].trim();
  const sortie = texte.slice(0, i).replace(/\n$/, '');
  if (pwd === RACINE) return { sortie, dossier: '' };
  if (!pwd.startsWith(`${RACINE}/`) || pwd.includes('/../')) return { sortie, dossier: '' };
  return { sortie, dossier: pwd.slice(RACINE.length + 1) };
}

export function retenir(historique = [], commande) {
  const h = historique.filter((c) => c !== commande);
  h.push(commande);
  return h.slice(-50);
}
