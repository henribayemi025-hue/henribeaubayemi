// LEGION — les agents répondent.
//
// Beau, 22/09 au soir: « c'est juste Alpha qui écrit, personne d'autre », puis
// « j'ai écrit, personne ne répond ». Trois défauts trouvés, corrigés ici:
//
//   1. LE MODÈLE RÉPONDAIT À VIDE dès que le fil devenait long. Même cause
//      que pour les visages: sur les modèles qui réfléchissent, la réflexion
//      se paie sur le budget de sortie et mange la réponse. Ses deux « salut à
//      tous » de 17 h 30 sont restés sans réponse à cause de ça.
//      → schéma de réponse imposé, réflexion bornée, budget doublé.
//
//   2. SEUL ALPHA RÉPONDAIT. Les agents de Finjaro n'avaient aucun
//      département: aucun salon n'avait de responsable, tout retombait sur le
//      premier directeur venu. (Réparé en base.) Et un « salut à tous » ne
//      faisait répondre qu'UNE personne. Maintenant, quand on s'adresse à
//      tout le monde, jusqu'à trois agents allumés répondent, chacun à son
//      tour, en lisant ce que les précédents viennent de dire.
//
//   3. ALPHA A INVENTÉ: « J'ai revu 80 % des écrans ». Il n'a rien revu, il
//      n'a accès à rien. Un agent qui prétend avoir fait un travail est pire
//      qu'un agent muet. La consigne l'interdit maintenant en toutes lettres.
//
// Garde-fous inchangés: un agent éteint ne répond pas (et on le dit); un
// message n'a qu'une série de réponses; un agent ne répond jamais à un agent.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
const TIMEOUT_MS = 25_000;
const CONTEXTE = 20;
const MAX_REPONDANTS = 3;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev') || host.endsWith('.workers.dev')) return true;
  return false;
}
function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// « À tout le monde »: un salut, ou un appel explicite à l'équipe.
const A_TOUS = /\b(tous|toutes|tout le monde|everyone|everybody|l'equipe|equipe|la team|all of you|hello|salut|bonjour|bonsoir|coucou|hi|hey)\b/;

type Agent = { id: string; cle: string; nom: string; poste: string; departement: string | null; mandat: string | null;
  personnalite: string | null; actif: boolean; est_directeur: boolean; user_id: string | null; autonomie: string; ordre: number };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    texte: { type: 'STRING' },
    genre: { type: 'STRING', enum: ['info', 'question', 'proposition'] },
    tache: { type: 'STRING' },
  },
  required: ['texte', 'genre', 'tache'],
};

function consigne(a: Agent, entreprise: { nom: string; projet: string | null }, salon: string, fil: string, auteur: string, collegues: string[]): string {
  return `Tu es ${a.nom}, ${a.poste}${a.departement ? ` au département ${a.departement}` : ''} chez « ${entreprise.nom} ».
${entreprise.projet ? `Le projet de l'entreprise: ${entreprise.projet}\n` : ''}Ton mandat: ${a.mandat || 'faire ton métier.'}
Ta personnalité: ${a.personnalite || 'Direct, précis.'}
Niveau d'autonomie: ${a.autonomie === 'autonome' ? 'tu agis et tu préviens' : a.autonomie === 'semi' ? 'tu agis sur ce qui ne coûte rien et tu rends compte' : 'tu proposes, le fondateur valide'}.

Tu es dans le salon « ${salon} ». Les derniers messages, du plus ancien au plus récent:
${fil}
${collegues.length ? `\nTes collègues ${collegues.join(', ')} viennent de répondre juste au-dessus: ne répète pas ce qu'ils ont dit, apporte autre chose ou sois bref.\n` : ''}
Réponds à ${auteur} comme un collègue, pas comme un assistant:
- dans la langue de son message (français par défaut), avec TA façon d'écrire;
- court: une à quatre phrases. Un simple salut appelle un salut court et vivant, pas un rapport;
- pas de formule creuse (« excellente question », « n'hésitez pas »), pas de liste numérotée pour un bonjour.

RÈGLE ABSOLUE — l'honnêteté:
- Tu n'as encore accès à AUCUN outil: ni au site, ni aux chiffres, ni aux e-mails, ni à Internet. Tu ne peux donc RIEN avoir vérifié, revu, mesuré, lu ou envoyé.
- Ne prétends JAMAIS avoir fait un travail (« j'ai revu », « j'ai analysé », « j'ai vérifié »). Dis ce que tu PROPOSES de faire, ou ce dont tu aurais besoin.
- Jamais de chiffre, de pourcentage ou de date que personne ne t'a donné.

"genre": "question" seulement si tu as vraiment besoin d'une réponse du fondateur pour avancer (ça fait sonner son téléphone); sinon "info" ou "proposition".
"tache": l'intitulé court d'une tâche précise que tu prends, ou "" s'il n'y en a pas. Un salut n'appelle aucune tâche.`;
}

async function demander(apiKey: string, texte: string): Promise<{ obj: Record<string, unknown>; modele: string } | { erreur: string }> {
  let derniere = 'aucun modèle joignable';
  for (const model of MODELS) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: texte }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 256 },
            responseMimeType: 'application/json',
            responseSchema: SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!resp.ok) { derniere = `${model}: HTTP ${resp.status} ${(await resp.text()).slice(0, 160)}`; console.error(derniere); continue; }
      const body = await resp.json();
      const txt = body?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!txt) { derniere = `${model}: réponse vide (${body?.candidates?.[0]?.finishReason ?? '?'})`; console.error(derniere); continue; }
      try {
        const obj = JSON.parse(txt);
        if (typeof obj.texte === 'string' && obj.texte.trim()) return { obj, modele: model };
        derniere = `${model}: texte vide`;
      } catch { derniere = `${model}: JSON illisible — ${txt.slice(0, 120)}`; console.error(derniere); }
    } catch (e) { derniere = `${model}: ${(e as Error).message}`; console.error(derniere); }
  }
  return { erreur: derniere };
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { message_id?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if (!corps.message_id) return json({ erreur: 'Message manquant.' }, 400);

  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: msg } = await personne.from('legion_messages')
    .select('id, entreprise_id, canal_id, auteur_id, texte, genre, meta').eq('id', corps.message_id).maybeSingle();
  if (!msg) return json({ erreur: 'Message inconnu, ou tu n\'es pas membre.' }, 403);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const { count: deja } = await service.from('legion_messages').select('id', { count: 'exact', head: true })
    .eq('canal_id', msg.canal_id).contains('meta', { reponse_a_id: msg.id });
  if ((deja ?? 0) > 0) return json({ deja: true, messages: [] });

  const [{ data: entreprise }, { data: salon }, { data: agents }] = await Promise.all([
    service.from('legion_entreprises').select('nom, projet').eq('id', msg.entreprise_id).single(),
    service.from('legion_canaux').select('id, cle, nom, prive_entre').eq('id', msg.canal_id).single(),
    service.from('legion_agents').select('id, cle, nom, poste, departement, mandat, personnalite, actif, est_directeur, user_id, autonomie, ordre')
      .eq('entreprise_id', msg.entreprise_id).order('ordre'),
  ]);
  if (!entreprise || !salon || !agents) return json({ erreur: 'Entreprise introuvable.' }, 404);

  const auteur = (agents as Agent[]).find((a) => a.id === msg.auteur_id);
  if (!auteur || !auteur.user_id) return json({ ignore: 'pas un humain', messages: [] });

  const machines = (agents as Agent[]).filter((a) => !a.user_id);
  const t = sansAccent(msg.texte);
  const nomSalon = sansAccent(salon.nom);
  const prive = Array.isArray(salon.prive_entre) && salon.prive_entre.length > 0;

  // Qui répond — la liste, dans l'ordre.
  let cibles: Agent[] = [];
  let endormi: Agent | null = null;

  if (prive) {
    const en_face = machines.find((a) => salon.prive_entre.includes(a.cle) && a.cle !== auteur.cle);
    if (en_face) cibles = [en_face];
  } else {
    const nommes = machines.filter((a) => t.includes('@' + sansAccent(a.nom)));
    if (nommes.length) {
      cibles = nommes.slice(0, MAX_REPONDANTS);
    } else {
      const duSalon = machines.filter((a) => sansAccent(a.departement || '') === nomSalon);
      // Dans « Direction » on parle à toute l'entreprise: les responsables des
      // départements répondent. Ailleurs, l'équipe du salon.
      const vivier = nomSalon === 'direction'
        ? [...duSalon.filter((a) => a.est_directeur), ...machines.filter((a) => a.est_directeur && !duSalon.includes(a)), ...duSalon.filter((a) => !a.est_directeur)]
        : [...duSalon.filter((a) => a.est_directeur), ...duSalon.filter((a) => !a.est_directeur)];
      const allumes = vivier.filter((a) => a.actif);
      if (A_TOUS.test(t)) {
        cibles = allumes.slice(0, MAX_REPONDANTS);
      } else {
        cibles = allumes.slice(0, 1);
      }
      if (!cibles.length) endormi = vivier[0] || machines.find((a) => a.est_directeur) || null;
    }
  }

  const allumees = cibles.filter((a) => a.actif);
  if (!allumees.length) {
    const qui = cibles[0] || endormi;
    return json({ dort: qui ? { id: qui.id, nom: qui.nom, poste: qui.poste } : null, messages: [] });
  }

  const nomDe = (id: string) => (agents as Agent[]).find((a) => a.id === id)?.nom || 'Quelqu\'un';
  const { data: fil } = await service.from('legion_messages')
    .select('auteur_id, texte, created_at, genre').eq('canal_id', msg.canal_id)
    .neq('genre', 'tache')
    .order('created_at', { ascending: false }).limit(CONTEXTE);
  const lignes = (fil || []).reverse().map((m) => `${nomDe(m.auteur_id)}: ${String(m.texte).slice(0, 500)}`);

  const ecrits: unknown[] = [];
  const ont_repondu: string[] = [];
  let pourquoi = '';

  for (const cible of allumees) {
    const r = await demander(apiKey, consigne(cible, entreprise, salon.nom, lignes.join('\n'), auteur.nom, ont_repondu));
    if ('erreur' in r) { pourquoi = pourquoi || r.erreur; continue; }
    const texte = String(r.obj.texte).trim().slice(0, 1200);
    const genre = ['info', 'question', 'proposition'].includes(String(r.obj.genre)) ? String(r.obj.genre) : 'info';
    const { data: ecrit, error } = await service.from('legion_messages').insert({
      entreprise_id: msg.entreprise_id, canal_id: msg.canal_id, auteur_id: cible.id, user_id: null,
      texte, genre, meta: { par_ia: true, modele: r.modele, reponse_a_id: msg.id },
    }).select().single();
    if (error) { pourquoi = pourquoi || error.message; continue; }
    ecrits.push(ecrit);
    ont_repondu.push(cible.nom);
    lignes.push(`${cible.nom}: ${texte}`);

    const intitule = typeof r.obj.tache === 'string' ? r.obj.tache.trim().slice(0, 200) : '';
    if (intitule) {
      const { data: tache } = await service.from('legion_messages').insert({
        entreprise_id: msg.entreprise_id, canal_id: msg.canal_id, auteur_id: cible.id, user_id: null,
        texte: intitule, genre: 'tache', assigne_a: cible.id,
        meta: { par_ia: true, statut: 'a_faire', priorite: 'moyenne', depuis: msg.id },
      }).select().single();
      if (tache) ecrits.push(tache);
    }
  }

  // On répond TOUJOURS 200 avec la raison: « Edge Function returned a
  // non-2xx status code » ne dit rien à personne.
  return json({ messages: ecrits, ...(ecrits.length === 0 ? { erreur: pourquoi || 'personne n’a pu répondre' } : {}) });
});
