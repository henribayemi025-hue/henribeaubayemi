// JARVIS V0 — la télécommande vocale de Léo (Beau, 24/09 : « on réveille
// Jarvis d'un geste, puis on lui parle comme à un chef de cabinet : ouvre
// les dépôts, je veux parler à Alpha, Alpha mon rapport, Claude continue » ;
// 25/09 : « fais »).
//
// Le navigateur envoie ce qui a été dit (audio, jamais gardé ici) ; on le
// transcrit, on comprend l'ordre, et on rend UNE intention que l'écran
// exécute : ouvrir une vue, ouvrir la conversation avec un agent, lui
// demander son rapport, préparer une tâche (confirmée à l'écran), ou poser
// une question à l'équipe (confirmée). Rien ne part hors de Léo, rien ne se
// paie, rien ne s'efface à la voix : ces demandes-là sont refusées (niveau
// N3 de la doctrine Jarvis, plan du 24/09).
//
// « Jarvis » reste un nom de projet interne : à l'écran, c'est « Léo ».

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteursSimples } from '../_shared/moteur.ts';
import { transcrireVocal } from '../_shared/pieces.ts';
import { intentionPropre, VUES } from '../_shared/jarvis.ts';

const PROD_HOST = 'finjaro.net';
function cors(origin: string | null): Record<string, string> {
  let ok = false;
  try {
    const h = new URL(origin || '').hostname;
    ok = h === 'localhost' || h === '127.0.0.1' || h === PROD_HOST || h.endsWith(`.${PROD_HOST}`) || h.endsWith('.workers.dev') || h.endsWith('.pages.dev');
  } catch { /* refusé */ }
  return {
    'Access-Control-Allow-Origin': ok ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    intention: { type: 'STRING', enum: ['ouvrir_vue', 'parler_a', 'demander_rapport', 'creer_tache', 'question', 'refuse', 'inconnu'] },
    vue: { type: 'STRING', enum: [...VUES, ''] },
    agent: { type: 'STRING' },
    salon: { type: 'STRING' },
    texte: { type: 'STRING' },
    reponse: { type: 'STRING' },
  },
  required: ['intention', 'reponse'],
};

Deno.serve(compter('legion_jarvis', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY') || '';

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: u } = await service.auth.getUser(jwt);
  if (!u?.user) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { entreprise_id?: string; audio?: string; mime?: string; texte?: string; langue?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const entrepriseId = String(corps.entreprise_id || '');
  if (!/^[0-9a-f-]{36}$/.test(entrepriseId)) return json({ erreur: 'Entreprise manquante.' }, 400);
  const { data: membre } = await service.from('legion_membres').select('role').eq('entreprise_id', entrepriseId).eq('user_id', u.user.id).maybeSingle();
  if (!membre) return json({ erreur: 'Pas membre de cette entreprise.' }, 403);
  pourEntreprise(entrepriseId);
  if ((await plafondAtteint(entrepriseId)).atteint) return json({ erreur: 'Le budget du mois est atteint.' });

  // 1. Ce qui a été dit.
  let dit = String(corps.texte || '').trim().slice(0, 600);
  if (!dit && corps.audio) {
    const mime = String(corps.mime || 'audio/wav').split(';')[0];
    if (!/^audio\//.test(mime) || corps.audio.length > 8_000_000) return json({ erreur: 'Audio refusé.' }, 400);
    dit = (await transcrireVocal(apiKey, corps.audio, mime)) || '';
  }
  if (!dit || /^\(?inaudible\)?$/i.test(dit)) return json({ transcription: '', intention: 'inconnu', reponse: corps.langue === 'en' ? "I didn't catch that. Say it again?" : "Je n'ai pas entendu. Tu redis ?" });

  // 2. Ce qu'il faut faire, parmi ce que l'écran sait faire.
  const [{ data: agents }, { data: salons }] = await Promise.all([
    service.from('legion_agents').select('nom, poste, departement, user_id, actif').eq('entreprise_id', entrepriseId),
    service.from('legion_canaux').select('nom, prive_entre').eq('entreprise_id', entrepriseId),
  ]);
  const machines = (agents || []).filter((a: { user_id: string | null }) => !a.user_id);
  const publics = (salons || []).filter((c: { prive_entre: string[] | null }) => !c.prive_entre?.length).map((c: { nom: string }) => c.nom);
  const anglais = corps.langue === 'en';
  const consigne = `Tu es la télécommande vocale de Léo, le logiciel où une entreprise travaille avec ses agents IA. La personne vient de dire (dictée vocale, parfois déformée : noms mal transcrits, mots collés) :
« ${dit} »

Les agents de l'entreprise : ${machines.map((a: { nom: string; poste: string }) => `${a.nom} (${a.poste})`).join(', ') || 'aucun'}.
Les salons : ${publics.join(', ') || 'aucun'}.
Les vues : ${VUES.join(', ')} (ville = les projets en tours ; immeuble = qui travaille où ; reunions = la salle de réunion ; academie = formations ; taches = le tableau des tâches ; atelier = l'atelier de code ; connecteurs = les services branchés ; accueil = l'accueil ; frise = ce qui s'est passé ; idees = le tableau d'idées ; organigramme).

Choisis UNE intention :
- ouvrir_vue (vue) : « ouvre / montre / va sur … »
- parler_a (agent) : « je veux parler à X », « appelle X »
- demander_rapport (agent) : « X, ton rapport », « où en est X »
- creer_tache (agent facultatif, texte = la tâche, courte et claire) : « demande à X de … », « ajoute une tâche … »
- question (texte = la question reformulée) : une question pour l'équipe
- refuse : tout ce qui envoie quelque chose HORS de Léo (message à un client, e-mail, publication), paie, achète, supprime, efface, déconnecte, met en ligne, change un réglage ou un mot de passe. Ces actes ne se font jamais à la voix.
- inconnu : rien de clair.
Pour « agent », écris le nom EXACT de la liste (retrouve-le même mal transcrit) ; pour « salon », un nom de la liste ou rien.
« reponse » : ce que Léo dit à voix haute, une phrase courte, en ${anglais ? 'anglais' : 'français'}, sans remplissage (« J'ouvre la ville. », « Je demande son rapport à Alpha. », « Je prépare la tâche pour Plume : tu confirmes ? », « Ça, je ne le fais pas à la voix : fais-le à l'écran. »).`;
  const r = await generer(apiKey, consigne, SCHEMA, { temperature: 0.1, maxSortie: 400, modeles: moteursSimples() });
  if ('erreur' in r) return json({ transcription: dit, intention: 'inconnu', reponse: anglais ? 'I understood the words, but not the order. Again?' : "J'ai entendu, mais pas compris l'ordre. Tu redis ?", erreur: r.erreur });
  const propre = intentionPropre(r.obj, machines.map((a: { nom: string }) => a.nom), publics);
  return json({ transcription: dit, ...propre });
}));
