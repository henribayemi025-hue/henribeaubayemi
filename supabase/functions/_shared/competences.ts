// Les compétences qu'un agent lit pour CE travail (24/09).
//
// Avant, chaque agent recevait ses 4 plus anciennes fiches : tout ce que
// Mentor ajoutait ensuite (le vestiaire d'entraînement de Beau) était
// ignoré. Maintenant on charge toutes ses fiches actives et on garde celles
// dont les mots touchent le plus le message, la tâche ou le sujet ; à égalité,
// la plus ancienne. Le nombre et la longueur restent petits : le coût aussi.
// deno-lint-ignore no-explicit-any
type Service = any;
type Fiche = { nom: string; description: string | null; contenu: string | null; created_at: string };

const sans = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const mots = (s: string) => new Set(sans(s).split(/[^a-z0-9]+/).filter((m) => m.length > 3));

export async function competencesPour(service: Service, agentId: string, sujet: string, n = 4, longueur = 2500): Promise<Array<{ nom: string; texte: string }>> {
  const { data } = await service.from('legion_competences').select('nom, description, contenu, created_at')
    .eq('agent_id', agentId).eq('actif', true).order('created_at').limit(40);
  const fiches = (data || []) as Fiche[];
  const cible = mots(sujet);
  const note = (f: Fiche) => {
    const m = mots(`${f.nom} ${f.description || ''} ${String(f.contenu || '').slice(0, 600)}`);
    let s = 0;
    for (const x of cible) if (m.has(x)) s += 1;
    return s;
  };
  return fiches
    .map((f, i) => ({ f, s: note(f), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map(({ f }) => ({ nom: f.nom, texte: String(f.contenu || f.description || '').slice(0, longueur) }));
}
