// LES TÂCHES CITÉES (02/10) : Rigo (Qualité) devait juger 15 livrables dont
// la tâche donnait les identifiants, et a tout renvoyé — « livrable non
// consultable » : aucun outil ne lit une tâche ou un livrable. Comme pour la
// recherche guidée, on ne laisse pas ce choix au modèle : une tâche qui cite
// des identifiants de tâches de LA MÊME entreprise reçoit leur texte et leur
// dernier livrable. Vaut pour toutes les entreprises (relire, reprendre,
// comparer), jamais au-delà de la sienne.

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
export const MAX_CITES = 20;

export function identifiantsCites(texte: string, saufId = ''): string[] {
  const vus = new Set<string>();
  for (const m of String(texte || '').matchAll(UUID)) {
    const id = m[0].toLowerCase();
    if (id !== saufId.toLowerCase()) vus.add(id);
    if (vus.size >= MAX_CITES) break;
  }
  return [...vus];
}

export type Cite = { id: string; texte: string; agent?: string; statut?: string; livrable?: string | null; livre_le?: string | null };

// Le bloc tient dans `max` caractères : chaque livrable garde sa part, le début d'abord.
export function blocCites(cites: Cite[], max = 24_000): string {
  if (!cites.length) return '';
  const part = Math.max(400, Math.floor(max / cites.length) - 300);
  const lignes = cites.map((c) => {
    const tete = `### Tâche ${c.id}${c.agent ? ` (${c.agent})` : ''}${c.statut ? ` — statut ${c.statut}` : ''}\nIntitulé : ${String(c.texte || '').slice(0, 300)}`;
    if (!c.livrable) return `${tete}\nLivrable : AUCUN (rien n'a été livré pour cette tâche).`;
    const l = String(c.livrable);
    return `${tete}\nLivrable${c.livre_le ? ` du ${c.livre_le.slice(0, 10)}` : ''} :\n${l.length > part ? `${l.slice(0, part)}… (coupé)` : l}`;
  });
  return `\n\nLES TÂCHES CITÉES DANS TA TÂCHE, avec leur livrable (lus à l'instant dans l'entreprise ; c'est la matière à relire, ne dis pas qu'elle est inaccessible) :\n${lignes.join('\n\n')}`;
}
