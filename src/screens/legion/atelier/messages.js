// Les messages du Worker de l'atelier sont écrits en français (C4, relevé du
// 25/09 : « messages de l'atelier en français sur un compte anglais »). Ici,
// on les rend dans la langue du compte. Un message inconnu reste tel quel.
const ANGLAIS = [
  [/^Connecte-toi à Léo\.$/, 'Sign in to Léo.'],
  [/^L'atelier est réservé pour l'instant\.$/, 'The workshop is reserved for now.'],
  [/^non authentifié$/, 'Not signed in.'],
  [/^origine non permise$/, 'This address is not allowed.'],
  [/^route inconnue$/, 'Unknown address.'],
  [/^Donne un nom au projet\.$/, 'Give the project a name.'],
  [/^(\d+) projets au plus en V0\.$/, (m) => `${m[1]} projects at most for now.`],
  [/^Tu n'es pas membre de cette entreprise\.$/, "You're not a member of this company."],
  [/^projet introuvable$/, 'Project not found.'],
  [/^Ce projet appartient à une autre entreprise\.$/, 'This project belongs to another company.'],
  [/^Non permis\.$/, 'Not allowed.'],
  [/^fichier introuvable$/, 'File not found.'],
  [/^L'agent travaille : attends ou appuie sur Stop avant de modifier un fichier\.$/, 'The agent is working: wait, or press Stop before editing a file.'],
  [/^L'agent travaille : attends ou appuie sur Stop avant de taper une commande\.$/, 'The agent is working: wait, or press Stop before typing a command.'],
  [/^contenu manquant$/, 'Missing content.'],
  [/^commande vide$/, 'Empty command.'],
  [/^Toujours refusé : (.+)$/, (m) => `Always refused: ${m[1]}`],
  [/^Plafond de la session atteint \((.+) \$\)\.$/, (m) => `Session limit reached ($${m[1]}).`],
  [/^L'agent travaille déjà\.$/, 'The agent is already working.'],
  [/^Mode inconnu/, 'Unknown mode.'],
  [/^Arrête d'abord le travail en cours\.$/, 'Stop the current work first.'],
  [/^point introuvable$/, 'Restore point not found.'],
  [/^texte à chercher manquant$/, 'Nothing to search for.'],
  [/^Erreur : (.+)$/, (m) => `Error: ${m[1]}`],
];

export function messageAtelier(texte, langue = 'fr') {
  const t = String(texte ?? '');
  if (!langue || String(langue).startsWith('fr')) return t;
  for (const [motif, rendu] of ANGLAIS) {
    const m = t.match(motif);
    if (m) return typeof rendu === 'function' ? rendu(m) : rendu;
  }
  return t;
}
