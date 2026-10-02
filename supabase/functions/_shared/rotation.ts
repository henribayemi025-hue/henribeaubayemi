// Qui passe en premier, et sur quelle tâche (02/10).
//
// Constaté le 02/10 sur l'entreprise Finjaro : depuis le 26/09, seuls les six
// premiers agents de la liste (champ `ordre`) étaient encore pris. Un passage
// commence toujours par le haut de la liste ; quand il manque de temps ou que
// le serveur l'arrête (code 546), la tranche suivante ne part pas, et le
// passage d'après recommence… par les six mêmes. Les dix-sept autres n'avaient
// plus été réveillés une seule fois en six jours, avec 177 tâches en attente.
//
// Deuxième défaut : un agent reprenait toujours sa tâche la PLUS ANCIENNE, même
// déjà rendue (« bloqué : il me manque… ») ou ratée trois fois. Il refaisait la
// même en boucle (8 essais pour l'une d'elles) au lieu d'avancer sur les autres.
//
// Ici, deux règles pures, testées dans rotation.test.ts :
// - l'agent servi il y a le plus longtemps passe en premier (jamais servi =
//   tout en tête) ; à égalité, l'ordre de la liste ;
// - une tâche jamais rendue passe avant une tâche rendue en attente d'une
//   réponse, une tâche essayée moins de trois fois avant une tâche qui échoue ;
//   puis la priorité (urgente, haute), puis l'ancienneté.

export type AgentServi = { id: string };
export type TacheChoix = {
  id: string;
  created_at: string;
  meta?: { priorite?: string; livre_le?: string; renvoye_le?: string; essais?: number } | null;
};

// `servi` : pour chaque agent, la date (ISO) de son dernier passage — la plus
// récente entre son dernier livrable et sa dernière prise de tâche.
export function ordreDePassage<A extends AgentServi>(agents: A[], servi: Map<string, string>): A[] {
  return agents
    .map((a, rang) => ({ a, rang, quand: servi.get(a.id) || '' }))
    .sort((x, y) => (x.quand === y.quand ? x.rang - y.rang : x.quand < y.quand ? -1 : 1))
    .map((x) => x.a);
}

// Une tâche rendue puis renvoyée par le fondateur redevient « à faire ».
export function attendUneReponse(t: TacheChoix): boolean {
  const livre = t.meta?.livre_le;
  if (!livre) return false;
  const renvoye = t.meta?.renvoye_le;
  return !(renvoye && renvoye > livre);
}

const RANG_PRIORITE: Record<string, number> = { urgente: 0, haute: 1 };

export function tachesDansLOrdre<T extends TacheChoix>(taches: T[]): T[] {
  const cle = (t: T) => [
    attendUneReponse(t) ? 1 : 0,
    (t.meta?.essais || 0) >= 3 ? 1 : 0,
    RANG_PRIORITE[t.meta?.priorite || ''] ?? 2,
  ];
  return [...taches].sort((x, y) => {
    const a = cle(x);
    const b = cle(y);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return x.created_at < y.created_at ? -1 : x.created_at > y.created_at ? 1 : 0;
  });
}

// La date du dernier passage de chaque agent, à partir de ses livrables récents
// et de ses tâches (meta.travaille_depuis).
export function derniersPassages(
  livrables: Array<{ auteur_id: string; created_at: string }>,
  taches: Array<{ assigne_a: string | null; meta?: { travaille_depuis?: string } | null }>,
): Map<string, string> {
  const servi = new Map<string, string>();
  const noter = (id: string | null, brut?: string) => {
    // La base écrit « 2026-10-01 14:33:00.7+00 », le code « 2026-10-01T14:33:00.700Z » :
    // on ramène tout au même format avant de comparer des chaînes.
    const t = brut ? Date.parse(brut) : NaN;
    if (!id || Number.isNaN(t)) return;
    const quand = new Date(t).toISOString();
    const avant = servi.get(id);
    if (!avant || quand > avant) servi.set(id, quand);
  };
  for (const l of livrables) noter(l.auteur_id, l.created_at);
  for (const t of taches) noter(t.assigne_a, t.meta?.travaille_depuis);
  return servi;
}
