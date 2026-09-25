// Jarvis V0 (legion-jarvis) : ce que le modèle a compris, ramené à ce que
// l'écran sait vraiment faire. Un agent, une vue ou un salon qui n'existe
// pas ne passe jamais : l'intention redevient « inconnu ».

export const VUES = ['ville', 'immeuble', 'reunions', 'academie', 'organigramme', 'taches', 'atelier', 'connecteurs', 'accueil', 'frise', 'idees'];
const INTENTIONS = ['ouvrir_vue', 'parler_a', 'demander_rapport', 'creer_tache', 'question', 'refuse', 'inconnu'];

const plat = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Le nom exact de la liste, retrouvé malgré les accents, la casse et les
// petites fautes de dictée (« alfa » → « Alpha » ; « ada » → « Ada Nkemba »).
export function retrouver(nom: unknown, liste: string[]): string | null {
  const n = plat(nom);
  if (!n) return null;
  const exact = liste.find((x) => plat(x) === n);
  if (exact) return exact;
  const debut = liste.filter((x) => plat(x).split(' ')[0] === n.split(' ')[0]);
  if (debut.length === 1) return debut[0];
  // Comme on l'entend : « Alfa » = « Alpha », « Klodinette » ≈ « Claudinette ».
  const son = (x: string) => x.replace(/ph/g, 'f').replace(/th/g, 't').replace(/y/g, 'i').replace(/qu|c(?=[aou])|ck/g, 'k').replace(/(.)\1+/g, '$1');
  const cible = son(n.split(' ')[0]);
  const proche = liste.filter((x) => n.length >= 3 && distance(son(plat(x).split(' ')[0]), cible) <= 1);
  return proche.length === 1 ? proche[0] : null;
}

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

export type Intention = { intention: string; vue: string | null; agent: string | null; salon: string | null; texte: string | null; reponse: string };

export function intentionPropre(o: Record<string, unknown>, agents: string[], salons: string[]): Intention {
  let intention = INTENTIONS.includes(String(o.intention)) ? String(o.intention) : 'inconnu';
  const vue = VUES.includes(String(o.vue)) ? String(o.vue) : null;
  const agent = retrouver(o.agent, agents);
  const salon = retrouver(o.salon, salons);
  const texte = String(o.texte ?? '').trim().slice(0, 200) || null;
  if (intention === 'ouvrir_vue' && !vue && !salon) intention = 'inconnu';
  if ((intention === 'parler_a' || intention === 'demander_rapport') && !agent) intention = 'inconnu';
  if ((intention === 'creer_tache' || intention === 'question') && (!texte || texte.length < 3)) intention = 'inconnu';
  const reponse = String(o.reponse ?? '').trim().slice(0, 220) || (intention === 'inconnu' ? "Je n'ai pas compris. Tu redis ?" : 'Je m’en occupe.');
  return { intention, vue: intention === 'ouvrir_vue' ? vue : null, agent: ['parler_a', 'demander_rapport', 'creer_tache'].includes(intention) ? agent : null, salon, texte, reponse };
}
