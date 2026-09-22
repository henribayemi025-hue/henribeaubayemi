// LEGION — un agent répond.
//
// Beau a écrit « salut tout le monde » dans Direction, et personne n'a
// répondu. C'est le trou principal, et c'est ici qu'il se bouche.
//
// Ce que fait cette fonction, et rien de plus:
//   1. Elle reçoit l'identifiant d'un message que quelqu'un vient d'écrire.
//   2. Elle décide QUI doit répondre — une seule personne, jamais toute la
//      salle: l'agent en face dans un message privé, l'agent nommé par
//      « @Nom », sinon le directeur du département du salon.
//   3. Si cet agent est éteint, elle ne dépense rien et le dit.
//   4. Sinon elle lui donne son poste, son mandat, sa personnalité et les
//      vingt derniers messages du salon, et lui demande de répondre comme le
//      collègue qu'il est — court, en français, avec son caractère.
//   5. Elle écrit la réponse dans le salon. Le temps réel fait le reste.
//
// Garde-fous: un agent éteint ne tourne pas; un message n'a qu'UNE réponse
// d'agent (rappuyer ne repaie pas); 1 200 caractères au plus.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
const TIMEOUT_MS = 25_000;
const CONTEXTE = 20;

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

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Agent = { id: string; cle: string; nom: string; poste: string; departement: string | null; mandat: string | null;
  personnalite: string | null; actif: boolean; est_directeur: boolean; user_id: string | null; autonomie: string; ordre: number };

function consigne(a: Agent, entreprise: { nom: string; projet: string | null }, salon: string, fil: string, auteur: string): string {
  return `Tu es ${a.nom}, ${a.poste}${a.departement ? ` au département ${a.departement}` : ''} chez « ${entreprise.nom} ».
${entreprise.projet ? `Le projet de l'entreprise: ${entreprise.projet}\n` : ''}Ton mandat: ${a.mandat || 'faire ton métier.'}
Ta personnalité: ${a.personnalite || 'Direct, précis.'}
Niveau d'autonomie: ${a.autonomie === 'autonome' ? 'tu agis et tu préviens' : a.autonomie === 'semi' ? 'tu agis sur ce qui ne coûte rien et tu rends compte' : 'tu proposes, le fondateur valide'}.

Tu es dans le salon « ${salon} ». Voici les derniers messages, du plus ancien au plus récent:
${fil}

Le dernier message est de ${auteur}. Réponds-lui comme un collègue, pas comme un assistant:
- dans la langue de son message (français par défaut), avec TA façon d'écrire (ta personnalité doit s'entendre);
- court: une à cinq phrases, sauf s'il faut vraiment détailler;
- concret: si tu ne sais pas, dis ce que tu vas vérifier et quand;
- jamais de chiffre inventé; si un chiffre manque, dis-le;
- pas de formule creuse (« excellente question », « n'hésitez pas »);
- si une action précise en découle et qu'elle est de ton ressort, propose-la comme tâche.

Réponds UNIQUEMENT par un objet JSON, sans texte autour:
{"texte": "ta réponse", "genre": "info" | "question" | "proposition", "tache": "intitulé court de la tâche que tu prends, ou null"}
"question" seulement si tu as vraiment besoin d'une réponse du fondateur pour avancer — ça fait sonner son téléphone.`;
}

function extraireJson(t: string): Record<string, unknown> | null {
  const d = t.indexOf('{'); const f = t.lastIndexOf('}');
  if (d < 0 || f <= d) return null;
  try { return JSON.parse(t.slice(d, f + 1)); } catch { return null; }
}

async function demander(apiKey: string, texte: string): Promise<{ obj: Record<string, unknown>; modele: string } | null> {
  for (const model of MODELS) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: texte }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!resp.ok) continue;
      const body = await resp.json();
      const txt = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      const obj = extraireJson(txt);
      if (obj && typeof obj.texte === 'string') return { obj, modele: model };
    } catch { /* modèle suivant */ }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' }, 503);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { message_id?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if (!corps.message_id) return json({ erreur: 'Message manquant.' }, 400);

  // Avec le jeton de la personne: si elle n'est pas membre, la base ne
  // renvoie pas le message, et on s'arrête là.
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: msg } = await personne.from('legion_messages')
    .select('id, entreprise_id, canal_id, auteur_id, texte, genre, meta').eq('id', corps.message_id).maybeSingle();
  if (!msg) return json({ erreur: 'Message inconnu, ou tu n\'es pas membre.' }, 403);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Une seule réponse d'agent par message.
  const { count: deja } = await service.from('legion_messages').select('id', { count: 'exact', head: true })
    .eq('canal_id', msg.canal_id).contains('meta', { reponse_a_id: msg.id });
  if ((deja ?? 0) > 0) return json({ deja: true });

  const [{ data: entreprise }, { data: salon }, { data: agents }] = await Promise.all([
    service.from('legion_entreprises').select('nom, projet').eq('id', msg.entreprise_id).single(),
    service.from('legion_canaux').select('id, cle, nom, prive_entre').eq('id', msg.canal_id).single(),
    service.from('legion_agents').select('id, cle, nom, poste, departement, mandat, personnalite, actif, est_directeur, user_id, autonomie, ordre')
      .eq('entreprise_id', msg.entreprise_id).order('ordre'),
  ]);
  if (!entreprise || !salon || !agents) return json({ erreur: 'Entreprise introuvable.' }, 404);

  const auteur = agents.find((a) => a.id === msg.auteur_id);
  // Un agent ne répond pas à un agent: sinon deux machines se parlent
  // toute la nuit sur le compte de Beau.
  if (!auteur || !auteur.user_id) return json({ ignore: 'pas un humain' });

  const machines = (agents as Agent[]).filter((a) => !a.user_id);
  let cible: Agent | undefined;

  if (Array.isArray(salon.prive_entre) && salon.prive_entre.length) {
    cible = machines.find((a) => salon.prive_entre.includes(a.cle) && a.cle !== auteur.cle);
  }
  if (!cible) {
    const t = sansAccent(msg.texte);
    cible = machines.find((a) => t.includes('@' + sansAccent(a.nom)));
  }
  if (!cible) {
    const nomSalon = sansAccent(salon.nom);
    const duDept = machines.filter((a) => a.departement && sansAccent(a.departement) === nomSalon);
    cible = duDept.find((a) => a.est_directeur && a.actif) || duDept.find((a) => a.actif) || duDept[0];
  }
  if (!cible) {
    cible = machines.find((a) => a.est_directeur && a.actif) || machines.find((a) => a.est_directeur) || machines.find((a) => a.actif);
  }
  if (!cible) return json({ personne: true });
  if (!cible.actif) return json({ dort: { id: cible.id, nom: cible.nom, poste: cible.poste } });

  const { data: fil } = await service.from('legion_messages')
    .select('auteur_id, texte, created_at').eq('canal_id', msg.canal_id)
    .order('created_at', { ascending: false }).limit(CONTEXTE);
  const nomDe = (id: string) => agents.find((a) => a.id === id)?.nom || 'Quelqu\'un';
  const texteFil = (fil || []).reverse().map((m) => `${nomDe(m.auteur_id)}: ${String(m.texte).slice(0, 600)}`).join('\n');

  const rep = await demander(apiKey, consigne(cible, entreprise, salon.nom, texteFil, auteur.nom));
  if (!rep) return json({ erreur: 'Le modèle n\'a pas répondu.' }, 502);

  const texte = String(rep.obj.texte).trim().slice(0, 1200);
  const genre = ['info', 'question', 'proposition'].includes(String(rep.obj.genre)) ? String(rep.obj.genre) : 'info';
  if (!texte) return json({ erreur: 'Réponse vide.' }, 502);

  const { data: ecrit, error } = await service.from('legion_messages').insert({
    entreprise_id: msg.entreprise_id, canal_id: msg.canal_id, auteur_id: cible.id, user_id: null,
    texte, genre, meta: { par_ia: true, modele: rep.modele, reponse_a_id: msg.id },
  }).select().single();
  if (error) return json({ erreur: error.message }, 500);

  let tache = null;
  const intitule = typeof rep.obj.tache === 'string' ? rep.obj.tache.trim().slice(0, 200) : '';
  if (intitule) {
    const { data: t } = await service.from('legion_messages').insert({
      entreprise_id: msg.entreprise_id, canal_id: msg.canal_id, auteur_id: cible.id, user_id: null,
      texte: intitule, genre: 'tache', assigne_a: cible.id,
      meta: { par_ia: true, statut: 'a_faire', priorite: 'moyenne', depuis: msg.id },
    }).select().single();
    tache = t;
  }

  return json({ agent: { id: cible.id, nom: cible.nom }, message: ecrit, tache });
});
