// La Finia commune (0202, Beau 24/09 : « oui Finia commune ») — ce que
// Finia SAIT, validé par un humain, partagé par toutes les applications.
//
// Même principe que competencesPour (competences.ts) pour les agents de
// Léo : on ne verse pas tout le savoir dans la consigne, seulement les
// quelques savoirs dont les mots touchent le plus la question, avec une
// longueur bornée — le coût reste petit, et un savoir hors sujet ne vient
// pas brouiller la réponse. À égalité, le plus récemment validé.
//
// La liste des savoirs actifs est gardée 5 minutes par instance : un savoir
// que Beau vient de confirmer sert au plus tard 5 minutes après.
// deno-lint-ignore no-explicit-any
type Service = any;
export type Portee = 'marketplace' | 'accounting' | 'leo';
type Savoir = { id: string; titre: string; texte: string; langue: string; valide_le: string | null };

const sans = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const mots = (s: string) => new Set(sans(s).split(/[^a-z0-9]+/).filter((m) => m.length > 3));

const cache = new Map<string, { quand: number; liste: Savoir[] }>();
const DUREE_MS = 5 * 60_000;

async function actifs(service: Service, portee: Portee): Promise<Savoir[]> {
  const c = cache.get(portee);
  if (c && Date.now() - c.quand < DUREE_MS) return c.liste;
  const { data, error } = await service.from('ia_savoirs_communs').select('id, titre, texte, langue, valide_le')
    .eq('actif', true).in('portee', [portee, 'toutes']).order('valide_le', { ascending: false, nullsFirst: false }).limit(200);
  // Sans la migration 0202 (table absente), Finia répond comme avant.
  if (error) { console.error('savoirs:', error.message); return c?.liste || []; }
  const liste = (data || []) as Savoir[];
  cache.set(portee, { quand: Date.now(), liste });
  return liste;
}

// Les savoirs utiles pour CETTE question. Un savoir qui ne partage aucun mot
// avec la question n'est pas pris : mieux vaut rien qu'un hors-sujet. La
// langue sert à départager (un savoir écrit dans la langue de la personne
// passe devant), pas à exclure : Finia sait traduire.
export async function savoirsPour(service: Service, portee: Portee, question: string, langue = '', n = 4, longueur = 600): Promise<Array<{ titre: string; texte: string }>> {
  if (!question?.trim()) return [];
  const liste = await actifs(service, portee);
  if (!liste.length) return [];
  const cible = mots(question);
  const l = sans(langue).slice(0, 2);
  return liste
    .map((s, i) => {
      const m = mots(`${s.titre} ${s.texte.slice(0, 800)}`);
      let note = 0;
      for (const x of cible) if (m.has(x)) note += 1;
      return { s, note: note + (note && l && s.langue === l ? 0.5 : 0), i };
    })
    .filter((x) => x.note >= 1)
    .sort((a, b) => b.note - a.note || a.i - b.i)
    .slice(0, n)
    .map(({ s }) => ({ titre: s.titre.slice(0, 120), texte: s.texte.slice(0, longueur) }));
}

// Le bloc ajouté à la consigne. Vide quand il n'y a rien : la consigne reste
// alors exactement celle d'avant.
export function blocSavoirs(savoirs: Array<{ titre: string; texte: string }>): string {
  if (!savoirs.length) return '';
  return `

CE QUE L'ÉQUIPE FINJARO A VÉRIFIÉ ET VALIDÉ (savoir commun, à utiliser quand la
question s'y rapporte ; c'est plus sûr que ce que tu supposes, mais ce n'est pas
un texte à réciter mot pour mot) :
${savoirs.map((s) => `- ${s.titre} : ${s.texte}`).join('\n')}`;
}
