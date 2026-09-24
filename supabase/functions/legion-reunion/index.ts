// LEGION — les réunions d'agents (23/09).
//
// Beau, 23/09 : « ils vont faire des réunions… on va voir comment ils sont en
// train de le faire », puis, dans ses notes : « faire communiquer et disputer
// les agents ». Jusqu'ici, un « salut à tous » faisait répondre trois agents
// l'un après l'autre, chacun poliment d'accord avec le précédent. Ce n'est
// pas une réunion.
//
// Une réunion, ici :
//   1. Un membre la convoque dans un salon d'équipe, avec un sujet (et, s'il
//      veut, la liste des participants ; sinon l'équipe du salon, cinq au
//      plus). Le responsable du salon préside.
//   2. TOUR 1 — chacun donne sa position, depuis son métier.
//   3. TOUR 2 — le débat : chacun conteste nommément le point le plus faible
//      d'un collègue, avec un argument de son métier, et propose mieux.
//   4. Le président rédige le compte rendu : décidé, écarté et pourquoi,
//      désaccords qui restent, ce que l'humain doit trancher ; les tâches
//      partent au tableau, chacune à un participant.
//
// En direct : chaque prise de parole est un appel séparé de cette fonction,
// qui répond tout de suite, parle en arrière-plan, puis lance la suivante
// (jeton partagé « legion_reunion », 0176). Les messages arrivent un par un
// dans le salon, comme dans une vraie salle. L'humain peut intervenir à tout
// moment (son message est lu par le suivant qui parle), ou demander de
// conclure tout de suite.
//
// Garde-fous : un agent éteint ne parle pas ; le plafond du mois arrête la
// réunion ; aucun message de réunion ne réveille d'autres agents
// (meta.sans_reponse) ; seul le compte rendu fait sonner le téléphone ;
// jamais de chiffre inventé ni de travail prétendu.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { budgetAgentAtteint, compter, coutEnCours, enFond, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { aerer, generer, garder, moteurs, moteursSimples } from '../_shared/moteur.ts';
import { lireFeuille } from '../_shared/feuille.ts';
import { texteAvecPieces } from '../_shared/pieces.ts';
import { aBesoinDuWeb, blocWeb, chercherWeb, type Trouvaille } from '../_shared/web.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const PROD_HOST = 'finjaro.net';
const TOURS = 2;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 5;
// Une réunion qui n'a pas fini au bout de 45 minutes est abandonnée (une
// panne au milieu ne doit pas bloquer le salon pour toujours).
const DUREE_MAX_MS = 45 * 60_000;

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

type Agent = { id: string; cle: string; nom: string; poste: string; departement: string | null; mandat: string | null;
  personnalite: string | null; actif: boolean; est_directeur: boolean; user_id: string | null; ordre: number; moteur: string;
  jamais?: string | null; peut_lire?: string[] | null; mission?: { objectif?: string; prend?: string[]; relais_humain?: string } | null; fin_mission?: string | null; plafond_mois_eur?: number | null };
// Ce qu'un agent a le droit de lire (0177): vide = tout ce qui est branché.
const peut = (a: Agent, source: string) => !Array.isArray(a.peut_lire) || a.peut_lire.includes(source);
// `recherche`: une recherche sur Internet est faite UNE fois, avant la
// première prise de parole, et tous les participants la lisent (Beau, 23/09:
// « qu'on demande à la commission de réfléchir » sur les taux de change — une
// réunion qui raisonne sans faits ne sert à rien sur un tel sujet).
type Reunion = { ouverture: true; sujet: string; participants: string[]; president: string; tours: number; conclure?: boolean; terminee?: boolean;
  recherche?: boolean; web?: Trouvaille | null; format?: string };

// ——— Les formats de réunion (23/09, idées 6, 16, 20, 72, 78, 93, 120, 125,
// 175, 181, 184, 186 et 190 des 200 de Gemini, que Beau a demandé de faire) ———
// Une réunion n'est pas toujours un débat entre collègues : on peut voter,
// faire jouer à un agent l'avocat du diable, simuler une conférence de presse,
// des clients, une négociation, des investisseurs, une crise, un « et si »,
// une rétrospective, un arbitrage de budget ou une étude d'impact. Chaque
// format donne un RÔLE à certains participants, remplace les consignes des
// tours, et titre le compte rendu à sa façon. Toujours les mêmes garde-fous :
// aucun chiffre inventé, l'humain tranche.
type Format = {
  // Le rôle joué par un participant (son rang parmi ceux qui ne président pas, et s'il préside).
  role?: (rang: number, preside: boolean) => string | null;
  tour1?: string; tour2?: string;
  vote?: boolean;
  contexte?: 'taches' | 'plans';
  titres: [string, string, string, string]; titresEn: [string, string, string, string];
  cr: string;
};
const FORMATS: Record<string, Format> = {
  vote: {
    vote: true,
    tour2: `C'EST TON TOUR — TOUR 2, LE DÉBAT PUIS LE VOTE. Conteste nommément le point le plus faible d'un collègue avec un argument de TON métier, dis ce que tu changes si on t'a convaincu, puis VOTE sur la proposition du sujet : "vote" = pour, contre ou abstention, et dis ta raison en une phrase à la fin de ton texte. Entre 60 et 140 mots.
"conteste" : le prénom exact du collègue que tu contestes, ou "".`,
    titres: ['Décidé', 'Écarté, et pourquoi', 'Les désaccords qui restent', 'À toi de trancher'], titresEn: ['Decided', 'Dropped, and why', 'Disagreements that remain', 'For you to decide'],
    cr: `C'était une réunion avec VOTE : le décompte est affiché à part, ne le recopie pas. Dans "a_trancher", rappelle que le vote éclaire la décision mais ne la prend pas : c'est l'humain qui décide.`,
  },
  avocat: {
    role: (rang) => (rang === 0 ? `TU ES L'AVOCAT DU DIABLE de cette réunion : tu contestes la position qui domine, à chaque tour, avec des arguments sérieux de ton métier — même si, en temps normal, tu serais d'accord. Dis-le franchement au début de ta première prise de parole.` : null),
    titres: ['Décidé', 'Écarté, et pourquoi', 'Les objections qui tiennent encore', 'À toi de trancher'], titresEn: ['Decided', 'Dropped, and why', 'Objections still standing', 'For you to decide'],
    cr: `Un participant jouait l'avocat du diable : garde ses objections qui n'ont pas trouvé de réponse dans "desaccords".`,
  },
  presse: {
    role: (rang, preside) => (preside
      ? `TU ES LE PORTE-PAROLE de l'entreprise face à la presse : tu réponds à chaque question posée, franchement, sans langue de bois et sans rien promettre qu'on ne peut pas tenir.`
      : `TU JOUES UN OU UNE JOURNALISTE (un média ${['économique', 'tech', 'grand public', 'spécialisé', 'local'][rang % 5]}) : tu poses des questions difficiles et précises, celles qui mettent l'entreprise en difficulté. Tu ne fais pas de discours.`),
    tour1: `C'EST TON TOUR — TOUR 1. Si tu es journaliste : UNE question dure et précise sur le sujet, avec ce qui la motive (une ligne). Si tu es le porte-parole : réponds à chaque question posée depuis l'ouverture, une à une, en citant qui l'a posée. Entre 40 et 160 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2, LES RELANCES. Si tu es journaliste : relance sur la réponse la plus faible du porte-parole (cite-la), ou pose la question qu'il esquive. Si tu es le porte-parole : réponds aux relances, et reconnais ce que tu ne sais pas. Entre 40 et 160 mots.
"conteste" : le prénom exact de celui ou celle que tu relances, ou "".`,
    titres: ['Réponses solides', 'Phrases à éviter', 'Questions qui ont mis en difficulté', 'À préparer avant une vraie interview'], titresEn: ['Solid answers', 'Phrases to avoid', 'Questions that hurt', 'To prepare before a real interview'],
    cr: `C'était une CONFÉRENCE DE PRESSE SIMULÉE. "decide" = les réponses du porte-parole qui ont tenu ; "ecarte" = les formulations maladroites ou risquées à ne plus dire (et pourquoi) ; "desaccords" = les questions qui ont mis en difficulté, nommément ; "a_trancher" = ce qu'il faut préparer ou décider avant une vraie interview. Les tâches : préparer les réponses manquantes.`,
  },
  clients: {
    role: (rang, preside) => (preside
      ? `TU ANIMES L'ENTRETIEN avec des clients : tu poses les questions, tu relances, tu ne vends rien.`
      : `TU JOUES UN CLIENT OU UNE CLIENTE TYPE de l'entreprise — choisis un profil réaliste et DIFFÉRENT des autres (âge, situation, usage, budget). Tu parles avec tes mots de client, pas ceux d'un expert : ce que tu attends, ce qui te fait hésiter, ce qui te ferait acheter ou revenir. Aucun chiffre de marché inventé.`),
    tour1: `C'EST TON TOUR — TOUR 1. Client ou cliente : présente-toi en une ligne (ton profil), puis ce que tu attends et ce qui te fait hésiter. Animateur : pose la question qui fera parler (ce qui manque, ce qui gêne). Entre 50 et 150 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2. Client ou cliente : réagis à ce qu'a dit un autre client (d'accord ou pas, pourquoi) et dis ce qui te ferait acheter. Animateur : relance sur la contradiction la plus utile. Entre 50 et 150 mots.
"conteste" : le prénom exact d'un participant avec qui tu n'es pas d'accord, ou "".`,
    titres: ['Ce qu’ils attendent', 'Ce qui les fait hésiter', 'Ce qui les divise', 'À vérifier auprès de vrais clients'], titresEn: ['What they expect', 'What makes them hesitate', 'Where they disagree', 'To check with real customers'],
    cr: `C'était un ENTRETIEN AVEC DES CLIENTS SIMULÉS : rappelle en une ligne dans "a_trancher" que ce sont des profils imaginés, à confirmer auprès de vrais clients.`,
  },
  negociation: {
    role: (rang) => (rang === 0 ? `TU JOUES LA PARTIE D'EN FACE (le fournisseur, le partenaire ou le gros client dont parle le sujet) : tu défends SES intérêts, durement mais de bonne foi. Tu ne fais pas de cadeau.` : `Tu négocies POUR l'entreprise, depuis ton métier.`),
    titres: ['Points d’accord possibles', 'Concessions à ne pas faire', 'Ce qui bloque', 'À trancher avant la vraie négociation'], titresEn: ['Possible agreements', 'Concessions not to make', 'What blocks', 'To decide before the real negotiation'],
    cr: `C'était une NÉGOCIATION SIMULÉE (un participant jouait la partie d'en face). Aucun montant qui n'a pas été donné.`,
  },
  investisseurs: {
    role: (rang, preside) => (preside
      ? `TU REPRÉSENTES L'ENTREPRISE devant des investisseurs : tu réponds aux questions, sans enjoliver, et tu dis quand un chiffre manque.`
      : `TU JOUES UN INVESTISSEUR (${['fonds de capital-risque', 'business angel', 'fonds à impact', 'investisseur du secteur'][rang % 4]}) qui étudie le dossier : questions dures sur le marché, l'équipe, les chiffres, le modèle, les risques.`),
    tour2: `C'EST TON TOUR — TOUR 2. Investisseur : ton VERDICT — tu investirais ou pas, et la raison principale ; ce qu'il faudrait pour que tu changes d'avis. Représentant de l'entreprise : réponds aux objections qui restent. Entre 50 et 150 mots.
"conteste" : le prénom exact d'un participant que tu contestes, ou "".`,
    titres: ['Ce qui convainc', 'Ce qui fait fuir', 'Questions sans bonne réponse', 'À préparer avant de lever des fonds'], titresEn: ['What convinces', 'What scares them off', 'Questions without a good answer', 'To prepare before raising'],
    cr: `C'était un COMITÉ D'INVESTISSEMENT SIMULÉ : donne dans "decide" le verdict de chaque investisseur, nommément.`,
  },
  crise: {
    tour1: `C'EST TON TOUR — TOUR 1. LE SUJET EST UN SCÉNARIO DE CRISE. Depuis TON métier : ce que tu fais dans la première heure, puis le premier jour — concret (qui prévient qui, quoi dire, quoi arrêter). Entre 70 et 160 mots.
"conteste" : "".`,
    titres: ['Premières actions (qui, quand)', 'Ce qu’il ne faut surtout pas faire', 'Les désaccords', 'À décider par toi si ça arrive'], titresEn: ['First actions (who, when)', 'What not to do', 'Disagreements', 'For you to decide if it happens'],
    cr: `C'était un EXERCICE DE CRISE : "decide" = le plan d'action, dans l'ordre, avec qui fait quoi.`,
  },
  etsi: {
    contexte: 'plans',
    tour1: `C'EST TON TOUR — TOUR 1. LE SUJET EST UN « ET SI » : compare avec ce qui a été décidé et fait (les plans et décisions plus haut). Depuis TON métier : ce qui aurait changé, en bien ou en mal, et ce qui n'aurait rien changé. Entre 70 et 160 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2. Conteste nommément l'analyse d'un collègue qui te paraît fausse, puis dis LA leçon pour la suite. Entre 60 et 140 mots.
"conteste" : le prénom exact du collègue que tu contestes, ou "".`,
    titres: ['Ce qui aurait changé', 'Ce qui n’aurait rien changé', 'Là où on n’est pas d’accord', 'Leçons à retenir'], titresEn: ['What would have changed', 'What would not have changed', 'Where we disagree', 'Lessons'],
    cr: `C'était une réunion « ET SI ». Les tâches : seulement si une leçon demande d'agir maintenant.`,
  },
  retro: {
    contexte: 'taches',
    tour1: `C'EST TON TOUR — TOUR 1, LA RÉTROSPECTIVE des sept derniers jours (les tâches plus haut). Depuis TON métier : ce qui a marché, ce qui a coincé — avec des faits (les tâches), jamais d'impression vague. Entre 60 et 150 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2. UNE chose à changer, concrète, et conteste la proposition d'un collègue qui ne réglerait rien. Entre 50 et 130 mots.
"conteste" : le prénom exact du collègue que tu contestes, ou "".`,
    titres: ['On garde', 'On arrête', 'Ce qui divise', 'À changer — à toi de valider'], titresEn: ['Keep', 'Stop', 'What divides us', 'To change — for you to approve'],
    cr: `C'était une RÉTROSPECTIVE : "decide" = ce qu'on garde, "ecarte" = ce qu'on arrête (et pourquoi).`,
  },
  budget: {
    tour1: `C'EST TON TOUR — TOUR 1, L'ARBITRAGE DE BUDGET. Défends ce dont TON département a besoin, par ordre de priorité, et ce que tu peux sacrifier. AUCUN montant qui n'a pas été donné : parle en priorités et en parts (« la moitié », « d'abord »). Entre 60 et 150 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2. Conteste nommément la demande qui te semble la moins justifiée, et dis ce que tu céderais pour débloquer. Entre 50 et 130 mots.
"conteste" : le prénom exact du collègue que tu contestes, ou "".`,
    titres: ['Priorités qui font consensus', 'Demandes écartées, et pourquoi', 'Arbitrages disputés', 'À toi de fixer (montants)'], titresEn: ['Agreed priorities', 'Dropped requests, and why', 'Disputed trade-offs', 'For you to set (amounts)'],
    cr: `C'était un ARBITRAGE DE BUDGET : aucun montant qui n'a pas été donné ; les montants sont dans "a_trancher", pour l'humain.`,
  },
  impact: {
    tour1: `C'EST TON TOUR — TOUR 1, L'ÉTUDE D'IMPACT de ce que propose le sujet. Depuis TON métier : les effets sur les clients, les équipes, la société, la loi, l'environnement — bons et mauvais. Entre 60 et 150 mots.
"conteste" : "".`,
    tour2: `C'EST TON TOUR — TOUR 2. Le risque que l'équipe sous-estime, nommément contre l'analyse d'un collègue, et le garde-fou qui le couvrirait. Entre 50 et 130 mots.
"conteste" : le prénom exact du collègue que tu contestes, ou "".`,
    titres: ['Effets positifs', 'Risques à éviter', 'Désaccords', 'Garde-fous à décider'], titresEn: ['Positive effects', 'Risks to avoid', 'Disagreements', 'Safeguards to decide'],
    cr: `C'était une ÉTUDE D'IMPACT : "decide" = les effets positifs retenus, "ecarte" = les risques à éviter et comment.`,
  },
};
const formatDe = (r: Reunion) => (r.format && FORMATS[r.format]) || null;

// Ce qu'un format demande de relire : les tâches des sept derniers jours
// (rétrospective), ou les plans et décisions passés (« et si »).
async function contexteDuFormat(service: Service, o: Message, f: Format | null, agents: Agent[]): Promise<string> {
  if (!f?.contexte) return '';
  const nomDe = (id: string | null) => agents.find((a) => a.id === id)?.nom || '?';
  if (f.contexte === 'taches') {
    const depuis = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data } = await service.from('legion_messages').select('texte, assigne_a, meta, created_at, termine_le')
      .eq('entreprise_id', o.entreprise_id).eq('genre', 'tache').or(`created_at.gte.${depuis},termine_le.gte.${depuis}`).order('created_at').limit(80);
    const lignes = (data || []).map((x: { texte: string; assigne_a: string | null; meta: { statut?: string; echeance?: string } | null; termine_le: string | null }) =>
      `- ${String(x.texte).slice(0, 160)} — ${nomDe(x.assigne_a)} — ${x.termine_le ? 'fait' : (x.meta?.statut || 'a_faire')}`);
    return lignes.length ? `
LES TÂCHES DES SEPT DERNIERS JOURS :
${lignes.join('\n')}
` : "\n(Aucune tâche ces sept derniers jours.)\n";
  }
  const { data: plans } = await service.from('legion_plans').select('departement, horizon, contenu, created_at')
    .eq('entreprise_id', o.entreprise_id).order('created_at', { ascending: false }).limit(6);
  const { data: decisions } = await service.from('legion_messages').select('texte, created_at')
    .eq('entreprise_id', o.entreprise_id).eq('genre', 'decision').order('created_at', { ascending: false }).limit(6);
  const p = (plans || []).map((x: { departement: string; horizon: string; contenu: string; created_at: string }) => `(${x.created_at.slice(0, 10)}, ${x.departement}, ${x.horizon}) ${String(x.contenu).slice(0, 700)}`);
  const d = (decisions || []).map((x: { texte: string; created_at: string }) => `(${x.created_at.slice(0, 10)}) ${String(x.texte).slice(0, 700)}`);
  return `\nCE QUI A ÉTÉ PLANIFIÉ ET DÉCIDÉ (les plus récents d'abord) :\n${[...p, ...d].join('\n\n') || '(rien encore)'}\n`;
}
type Message = { id: string; entreprise_id: string; canal_id: string; auteur_id: string; user_id: string | null; texte: string; genre: string; created_at: string;
  meta: Record<string, unknown> | null };
// deno-lint-ignore no-explicit-any
type Service = any;

const COLS_AGENT = 'id, cle, nom, poste, departement, mandat, personnalite, actif, est_directeur, user_id, ordre, moteur, jamais, peut_lire, mission, fin_mission, plafond_mois_eur';
const COLS_MSG = 'id, entreprise_id, canal_id, auteur_id, user_id, texte, genre, created_at, meta';

const reunionDe = (m: Message | null) => (m?.meta as { reunion?: Record<string, unknown> } | null)?.reunion ?? null;

// Un agent désigné par le modèle: son nom complet OU son seul prénom (« Nadia »
// pour « Nadia Benali »). Vu au premier essai (23/09): les agents se citent
// par le prénom, et la comparaison au nom complet perdait qui contestait qui,
// et toutes les tâches du compte rendu.
function designe(nom: string, parmi: Agent[]): Agent | null {
  const n = sansAccent(nom).trim();
  if (!n) return null;
  return parmi.find((a) => sansAccent(a.nom) === n)
    || parmi.find((a) => sansAccent(a.nom).split(/\s+/)[0] === n.split(/\s+/)[0])
    || null;
}

// ——— Qui vient à la réunion ———
// La même équipe que celle qui répond dans le salon (legion-repondre) :
// le département du même nom et les agents ajoutés à la main ; en Direction,
// les responsables de chaque département. Allumés seulement, responsables
// d'abord ; complété par les autres responsables s'il manque du monde.
function choisirParticipants(salon: { nom: string; membres: string[] | null }, agents: Agent[], demandes?: string[]): Agent[] {
  const machines = agents.filter((a) => !a.user_id && a.moteur !== 'claude-code' && a.actif);
  if (Array.isArray(demandes) && demandes.length) {
    return demandes.map((id) => machines.find((a) => a.id === id)).filter((a): a is Agent => !!a).slice(0, MAX_PARTICIPANTS);
  }
  const nomSalon = sansAccent(salon.nom);
  const ajoutes = Array.isArray(salon.membres) ? salon.membres : [];
  const duSalon = machines.filter((a) => sansAccent(a.departement || '') === nomSalon || ajoutes.includes(a.cle));
  const vivier = nomSalon === 'direction'
    ? [...duSalon.filter((a) => a.est_directeur), ...machines.filter((a) => a.est_directeur && !duSalon.includes(a)), ...duSalon.filter((a) => !a.est_directeur)]
    : [...duSalon.filter((a) => a.est_directeur), ...duSalon.filter((a) => !a.est_directeur)];
  const choisis = vivier.slice(0, MAX_PARTICIPANTS);
  if (choisis.length < MIN_PARTICIPANTS) {
    for (const a of machines.filter((x) => x.est_directeur)) if (choisis.length < MIN_PARTICIPANTS + 1 && !choisis.includes(a)) choisis.push(a);
  }
  return choisis;
}

// Le président : le responsable du salon s'il est là, sinon le premier
// responsable présent, sinon le premier participant.
function choisirPresident(salon: { nom: string }, participants: Agent[]): Agent {
  const nomSalon = sansAccent(salon.nom);
  return participants.find((a) => a.est_directeur && sansAccent(a.departement || '') === nomSalon)
    || participants.find((a) => a.est_directeur) || participants[0];
}

// ——— La suite de la réunion : un nouvel appel, qui répond tout de suite ———
async function lancer(service: Service, reunionId: string, etape: number) {
  const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_reunion').maybeSingle();
  if (!sec?.value) { console.error('réunion: jeton legion_reunion absent'); return; }
  const suite = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-reunion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`, 'x-finjaro-token': sec.value },
    body: JSON.stringify({ reunion_id: reunionId, etape }),
    signal: AbortSignal.timeout(30_000),
  }).then((r) => r.text()).catch((e) => console.error('réunion, étape suivante:', (e as Error).message));
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(suite);
  else await suite;
}

// ——— Ce que chacun sait avant de parler ———
async function contexte(service: Service, o: Message) {
  const [{ data: entreprise }, { data: salon }, { data: agents }, { data: regles }] = await Promise.all([
    service.from('legion_entreprises').select('nom, projet, formule, langue').eq('id', o.entreprise_id).single(),
    service.from('legion_canaux').select('id, nom, membres, resume').eq('id', o.canal_id).single(),
    service.from('legion_agents').select(COLS_AGENT).eq('entreprise_id', o.entreprise_id).order('ordre'),
    service.from('legion_memoire').select('regle').eq('entreprise_id', o.entreprise_id).eq('actif', true).order('created_at', { ascending: false }).limit(40),
  ]);
  const memoire = (regles || []).map((x: { regle: string }) => x.regle).reverse();
  // Le connecteur « Mesures Finjaro », s'il est branché : les seuls chiffres
  // que les participants ont le droit de citer, avec ceux dits en réunion.
  let mesures: string | null = null;
  const { data: branche } = await service.from('legion_connecteurs').select('id')
    .eq('entreprise_id', o.entreprise_id).eq('type', 'finjaro-mesures').eq('actif', true).maybeSingle();
  if (branche) {
    const { data: m, error } = await service.rpc('legion_mesures_finjaro');
    if (error) console.error('mesures:', error.message); else if (m) mesures = JSON.stringify(m).slice(0, 4000);
  }
  const feuille = await lireFeuille(service, o.entreprise_id, Object.fromEntries(((agents || []) as Agent[]).map((a) => [a.id, a.nom])));
  // Les messages du salon depuis l'ouverture : les prises de parole ET les
  // interventions des humains pendant la réunion.
  const { data: fil } = await service.from('legion_messages').select(COLS_MSG)
    .eq('canal_id', o.canal_id).gte('created_at', o.created_at).neq('genre', 'tache')
    .order('created_at').limit(120);
  return { entreprise, salon, agents: (agents || []) as Agent[], memoire, mesures, feuille, fil: (fil || []) as Message[] };
}

function transcription(fil: Message[], o: Message, agents: Agent[]): string[] {
  const nomDe = (id: string) => agents.find((a) => a.id === id)?.nom || '?';
  return fil.map((m) => {
    if (m.id === o.id) return `${nomDe(o.auteur_id)} (humain, a convoqué la réunion) ouvre : ${String(m.texte).slice(0, 1500)}`;
    const r = reunionDe(m);
    const tour = typeof r?.tour === 'number' ? `[tour ${r.tour}] ` : '';
    const qui = `${nomDe(m.auteur_id)}${m.user_id ? ' (humain, intervient)' : ''}`;
    return `${tour}${qui} : ${texteAvecPieces(String(m.texte), m.meta, 1500)}`;
  });
}

const SCHEMA_PAROLE = {
  type: 'OBJECT',
  properties: { texte: { type: 'STRING' }, conteste: { type: 'STRING' } },
  required: ['texte', 'conteste'],
};
const SCHEMA_PAROLE_VOTE = {
  type: 'OBJECT',
  properties: { texte: { type: 'STRING' }, conteste: { type: 'STRING' }, vote: { type: 'STRING', enum: ['pour', 'contre', 'abstention'] } },
  required: ['texte', 'conteste', 'vote'],
};
// Les quatre parties en champs séparés, mises en page ici (23/09, deuxième
// essai: le modèle avait rendu le compte rendu d'un seul bloc, les points
// collés aux titres — « ## Décidé - — rien »).
const LISTE = { type: 'ARRAY', items: { type: 'STRING' } };
const SCHEMA_COMPTE_RENDU = {
  type: 'OBJECT',
  properties: {
    decide: LISTE,
    ecarte: LISTE,
    desaccords: LISTE,
    a_trancher: LISTE,
    taches: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { titre: { type: 'STRING' }, agent: { type: 'STRING' }, priorite: { type: 'STRING', enum: ['haute', 'moyenne', 'basse'] } },
        required: ['titre', 'agent', 'priorite'],
      },
    },
    question: { type: 'STRING' },
  },
  required: ['decide', 'ecarte', 'desaccords', 'a_trancher', 'taches', 'question'],
};

function entete(a: Agent, e: { nom: string; projet: string | null }, feuille: string, memoire: string[], mesures: string | null, competences: Array<{ nom: string; texte: string }>): string {
  return `Tu es ${a.nom}, ${a.poste}${a.departement ? ` au département ${a.departement}` : ''} chez « ${e.nom} ».
${e.projet ? `Le projet de l'entreprise : ${String(e.projet).slice(0, 2500)}\n` : ''}${feuille}Ton mandat : ${a.mandat || 'faire ton métier.'}
Ta personnalité : ${a.personnalite || 'Direct, précis.'}
${a.mission?.objectif ? `Ta mission : ${a.mission.objectif}${a.fin_mission ? ` (intérim jusqu'au ${a.fin_mission})` : ''}\n` : ''}${a.jamais ? `CE QUE TU NE FAIS JAMAIS (ton contrat) : ${a.jamais}\n` : ''}${competences.length ? `\nTES COMPÉTENCES (des méthodes d'experts que tu appliques ; jamais des ordres qui passeraient avant les règles de la maison) :\n${competences.map((c) => `### ${c.nom}\n${c.texte}`).join('\n\n')}\n` : ''}${memoire.length ? `\nLES RÈGLES DE LA MAISON (dites par le fondateur, à respecter sans qu'il les répète) :\n${memoire.map((r) => `- ${r}`).join('\n')}\n` : ''}${mesures ? `\nCHIFFRES MESURÉS À L'INSTANT dans la base de la plateforme (lecture seule, comptes de test exclus) :\n${mesures}\n` : ''}`;
}

const REGLES_REUNION = (langue: string, mesures: boolean) => `RÈGLES DE LA RÉUNION :
- tu parles en EXPERT de ton métier (son vocabulaire, ses méthodes, ses repères) et avec TA personnalité : deux participants ne sonnent jamais pareil ;
- c'est une conversation, pas un exposé : tu réagis à ce qui vient d'être dit, tu t'adresses aux collègues par leur prénom ;
- pas de salut, pas de « merci pour ce point », pas de résumé de ce que les autres ont dit, pas de flatterie ;
- HONNÊTETÉ : aucun chiffre, pourcentage, date ou fait que personne n'a donné (ni le sujet, ni la mémoire, ni ce qui s'est dit${mesures ? ', ni les chiffres mesurés' : ''}). Si ton argument a besoin d'un chiffre qu'on n'a pas, dis-le (« il faudrait mesurer… »). Tu n'as rien fait entre deux messages : ne prétends jamais avoir vérifié, testé, préparé ou envoyé quoi que ce soit ;
- tu ne peux ni coder, ni tester, ni envoyer, ni modifier quoi que ce soit : ne promets AUCUN travail ni délai (« un prototype sous 7 jours ») ; ce qui demande du code revient à Claude, le développeur, ou au fondateur ;
- sur les concurrents, le marché ou une technologie, seulement ce que dit la recherche ci-dessus, avec le numéro de sa source ; sinon, dis que c'est à vérifier ;
- pense à la TAILLE réelle de l'entreprise : ne propose pas l'outil d'un géant quand une solution simple suffit ;
- sur l'argent, un prix, le juridique, le recrutement ou une personne, tu RECOMMANDES : c'est l'humain qui tranche ;
- MONNAIE : jamais une monnaie que personne n'a dite ; un montant garde la monnaie de sa source, sinon le nombre reste sans monnaie ou tu demandes laquelle. Aucune monnaie « par défaut » (ni FCFA, ni euro, ni dollar) ;
- INTELLIGENCE ÉMOTIONNELLE (Beau, 24/09) : lis l'état des autres dans leurs mots — un collègue découragé, agacé, pressé, enthousiaste — et réponds en conséquence : un désaccord se dit avec respect et un argument, jamais une pique ; un collègue découragé reçoit d'abord ce qui tient, puis une piste faisable ; un enthousiasme se partage avant d'être nuancé. Si le fondateur intervient et semble fatigué ou tendu, va à l'essentiel, sans fausse empathie ni flatterie ;
- écris en ${langue}.`;

// ——— Une prise de parole ———
async function prendreLaParole(service: Service, apiKey: string, o: Message, r: Reunion, a: Agent, tour: number, ordre: number,
  ctx: Awaited<ReturnType<typeof contexte>>, participants: Agent[], president: Agent) {
  const avant = coutEnCours();
  const { data: comp } = await service.from('legion_competences').select('nom, description, contenu')
    .eq('agent_id', a.id).eq('actif', true).order('created_at').limit(3);
  const competences = (comp || []).map((c: { nom: string; description: string | null; contenu: string | null }) =>
    ({ nom: c.nom, texte: String(c.contenu || c.description || '').slice(0, 1500) }));
  const lignes = transcription(ctx.fil, o, ctx.agents);
  const convocant = ctx.agents.find((x) => x.id === o.auteur_id)?.nom || 'le fondateur';
  // L'humain est intervenu depuis la dernière prise de parole de cet agent :
  // il lui répond d'abord.
  const miens = ctx.fil.filter((m) => m.auteur_id === a.id && typeof reunionDe(m)?.tour === 'number');
  const depuis = miens.length ? miens[miens.length - 1].created_at : o.created_at;
  const interventions = ctx.fil.filter((m) => m.user_id && m.id !== o.id && m.created_at > depuis);
  const langue = ctx.entreprise?.langue === 'en' ? 'anglais' : 'français';

  const f = formatDe(r);
  const rangs = participants.filter((p) => p.id !== president.id);
  const role = f?.role ? f.role(rangs.findIndex((p) => p.id === a.id), a.id === president.id) : null;
  const extra = await contexteDuFormat(service, o, f, ctx.agents);
  const voteIci = !!f?.vote && tour === (r.tours || TOURS);
  const consigneFormat = tour === 1 ? f?.tour1 : f?.tour2;
  const consigneTour = consigneFormat || (tour === 1
    ? `C'EST TON TOUR — TOUR 1, TA POSITION. Depuis TON métier : ce que tu recommandes (concret : quoi, qui, quand), pourquoi (l'argument de ton métier), le risque principal que tu vois, et ce qu'il te faudrait pour avancer. Si des collègues ont déjà parlé, ne commence PAS par dire que tu es d'accord : apporte d'abord ce que TON métier voit et qu'ils n'ont pas dit, puis situe-toi — d'accord sur quoi, pas d'accord sur quoi, nommément. Entre 70 et 160 mots.
"conteste" : le prénom exact d'un collègue avec qui tu n'es pas d'accord, ou "".`
    : `C'EST TON TOUR — TOUR 2, LE DÉBAT. On ne se félicite pas : on se dispute sur le fond, comme une vraie équipe qui veut la meilleure décision.
1. Choisis LE point le plus faible, le plus risqué ou le plus coûteux avancé par UN collègue nommé (ou une critique qu'on t'a faite).
2. Reprends-le en une ligne (« Plume, tu proposes… »), puis conteste-le avec un argument de TON métier : un risque, un coût, une contrainte, un exemple, un chiffre DÉJÀ DONNÉ.
3. Propose mieux : une alternative, ou une idée neuve que personne n'a encore mise sur la table.
Si on t'a contesté et que l'autre a raison, dis-le franchement et dis ce que tu changes. Interdit : « je suis d'accord avec tout le monde », les compliments, la langue de bois. Ferme sur le fond, courtois dans la forme. Entre 60 et 140 mots.
"conteste" : le prénom exact du collègue que tu contestes (obligatoire à ce tour, sauf si tu reconnais qu'on avait raison contre toi : alors "").`);

  const texte = `${entete(a, ctx.entreprise, ctx.feuille, ctx.memoire, peut(a, 'mesures') ? ctx.mesures : null, competences)}
TU ES EN RÉUNION, dans le salon « ${ctx.salon?.nom} », convoquée par ${convocant}. Le sujet :
« ${r.sujet} »
Autour de la table : ${participants.map((p) => `${p.nom} (${p.poste})`).join(', ')}. Préside : ${president.nom}.
${role ? `\n${role}\n` : ''}${extra}${ctx.salon?.resume ? `\nLA MÉMOIRE DE CE SALON (ce qui s'est dit avant) :\n${String(ctx.salon.resume).slice(0, 2000)}\n` : ''}
${r.web && peut(a, 'web') ? `${blocWeb(r.web)}\n` : ''}CE QUI S'EST DIT DEPUIS L'OUVERTURE, dans l'ordre :
${lignes.join('\n')}

${consigneTour}
${interventions.length ? `\n${interventions.map((m) => ctx.agents.find((x) => x.id === m.auteur_id)?.nom || 'Un humain').join(', ')} vient d'intervenir (plus haut, « humain, intervient ») : réponds-lui D'ABORD, en une ou deux phrases, puis fais ton tour.\n` : ''}
${REGLES_REUNION(langue, !!ctx.mesures)}`;

  const rendu = await generer(apiKey, texte + (voteIci && !consigneFormat?.includes('"vote"') ? `\n"vote" : pour, contre ou abstention sur la proposition du sujet.` : ''), voteIci ? SCHEMA_PAROLE_VOTE : SCHEMA_PAROLE, { temperature: 0.85, reflexion: 1024, maxSortie: 2048, delaiMs: 45_000, modeles: moteursSimples() });
  if ('erreur' in rendu || typeof rendu.obj.texte !== 'string' || !rendu.obj.texte.trim()) {
    console.error('réunion, parole:', 'erreur' in rendu ? rendu.erreur : 'texte vide');
    return false;
  }
  const conteste = typeof rendu.obj.conteste === 'string' ? rendu.obj.conteste.trim() : '';
  const vote = voteIci && ['pour', 'contre', 'abstention'].includes(String(rendu.obj.vote)) ? String(rendu.obj.vote) : null;
  const vise = conteste ? designe(conteste, participants.filter((p) => p.id !== a.id)) : null;
  const { data: ecrit, error } = await service.from('legion_messages').insert({
    entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: a.id, user_id: null,
    texte: aerer(rendu.obj.texte.trim()).slice(0, 3000), genre: 'info',
    meta: { par_ia: true, modele: rendu.modele, cout_eur: Number((coutEnCours() - avant).toFixed(6)), sans_reponse: true, reunion: { id: o.id, tour, ordre, ...(vise ? { conteste: vise.nom } : {}), ...(vote ? { vote } : {}), ...(role ? { role: true } : {}) } },
  }).select('id').single();
  if (error) { console.error('réunion, écrire:', error.message); return false; }
  await garder(service, { entreprise_id: o.entreprise_id, message_id: ecrit.id, fonction: 'legion_reunion', modele: rendu.modele, consigne: texte, sortie: JSON.stringify(rendu.obj) });
  return true;
}

// ——— Le compte rendu, par le président ———
async function conclure(service: Service, apiKey: string, o: Message, r: Reunion, ctx: Awaited<ReturnType<typeof contexte>>,
  participants: Agent[], president: Agent, nbParoles: number) {
  const avant = coutEnCours();
  const fin = async (texte: string, extra: Record<string, unknown> = {}) => {
    await service.from('legion_messages').insert({
      entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: president.id, user_id: null, texte, genre: 'info',
      meta: { par_ia: true, sans_reponse: true, reunion: { id: o.id, fin: true, ...extra } },
    });
    await service.from('legion_messages').update({ meta: { ...(o.meta || {}), reunion: { ...r, terminee: true } } }).eq('id', o.id);
  };
  const anglais = ctx.entreprise?.langue === 'en';
  if (nbParoles === 0) {
    await fin(anglais ? 'Meeting closed before anyone spoke.' : 'Réunion close avant la première prise de parole.', { annulee: true });
    return;
  }
  const convocant = ctx.agents.find((x) => x.id === o.auteur_id)?.nom || 'le fondateur';
  const lignes = transcription(ctx.fil, o, ctx.agents);
  const langue = anglais ? 'anglais' : 'français';
  const f = formatDe(r);
  const extra = await contexteDuFormat(service, o, f, ctx.agents);
  // Le décompte du vote : compté ici, jamais par le modèle.
  const votes = f?.vote ? ctx.fil.filter((m) => reunionDe(m)?.id === o.id && typeof reunionDe(m)?.vote === 'string').map((m) => String(reunionDe(m)!.vote)) : [];
  const decompte = votes.length ? { pour: votes.filter((v) => v === 'pour').length, contre: votes.filter((v) => v === 'contre').length, abstention: votes.filter((v) => v === 'abstention').length } : null;
  const texte = `${entete(president, ctx.entreprise, ctx.feuille, ctx.memoire, ctx.mesures, [])}
Tu PRÉSIDES la réunion, dans le salon « ${ctx.salon?.nom} », convoquée par ${convocant}. Le sujet :
« ${r.sujet} »
Participants : ${participants.map((p) => `${p.nom} (${p.poste})`).join(', ')}.

${extra}${r.web ? `${blocWeb(r.web)}\n` : ''}TOUT CE QUI S'EST DIT, dans l'ordre :
${lignes.join('\n')}
${r.conclure ? `\n${convocant} a demandé de conclure maintenant : conclus avec ce qui a été dit.\n` : ''}
Rédige le COMPTE RENDU que ${convocant} lira sur son téléphone : quatre listes, un point par élément, une phrase courte chacun, sans puce ni titre (la mise en page est faite ailleurs).
"decide" : ce sur quoi l'équipe converge — qui fait quoi (prénom), et quand si ça a été dit. [] si rien n'a été décidé.
"ecarte" : chaque idée écartée — la raison donnée en réunion, et par qui.
"desaccords" : ce qui divise encore — qui pense quoi, nommément ; ne les efface pas pour faire propre.
"a_trancher" : une à trois questions précises pour ${convocant}, chacune avec les options qui ont été défendues (et par qui).
Tu ne tranches pas à la place de ${convocant} quand un désaccord porte sur l'argent, un prix, le juridique, le recrutement ou une personne : tu poses la question avec les options. Aucun chiffre ni fait qui n'a pas été dit en réunion. Pas d'introduction, pas de formule de fin. Écris en ${langue}.
Un agent ne code pas, ne teste pas, n'envoie rien : une décision qui demande ce travail va dans "a_trancher" (qui le fait : Claude le développeur, ou le fondateur), jamais dans les tâches d'un agent. Aucun délai que personne n'a fixé.
"taches" : une à cinq tâches concrètes DÉCIDÉES en réunion (celles de la partie « Décidé »), que l'agent peut faire lui-même (analyser, écrire, comparer, préparer), chacune confiée à UN participant ("agent" = son nom tel qu'écrit dans la liste des participants), avec la priorité. Rien qui n'ait pas été décidé ; [] s'il n'y en a pas.
"question" : la question la plus importante pour ${convocant}, en une phrase, ou "".${f ? `\n\nFORMAT DE CETTE RÉUNION : ${f.cr}${decompte ? ` Décompte : ${decompte.pour} pour, ${decompte.contre} contre, ${decompte.abstention} abstention(s).` : ''}` : ''}`;

  const gratuite = ctx.entreprise?.formule === 'gratuite';
  const rendu = await generer(apiKey, texte, SCHEMA_COMPTE_RENDU, {
    temperature: 0.4, reflexion: 2048, maxSortie: 6144, delaiMs: 60_000,
    // Pro d'abord (le compte rendu est ce que l'humain lit), Flash en dernier
    // recours: la liste de moteurs() se termine déjà par Flash.
    modeles: gratuite ? moteursSimples() : moteurs(),
  });
  const listes = 'erreur' in rendu ? null : (['decide', 'ecarte', 'desaccords', 'a_trancher'] as const).map((k) =>
    (Array.isArray(rendu.obj[k]) ? (rendu.obj[k] as unknown[]) : []).map((x) => String(x).replace(/^[\s\-–•*]+/, '').trim()).filter(Boolean).slice(0, 8));
  if ('erreur' in rendu || !listes || listes.every((l) => !l.length)) {
    console.error('réunion, compte rendu:', 'erreur' in rendu ? rendu.erreur : 'listes vides');
    await fin(anglais
      ? 'I could not write the minutes (the model did not answer). Everything said is above.'
      : "Je n'ai pas pu rédiger le compte rendu (le modèle n'a pas répondu). Tout ce qui s'est dit est au-dessus.", { echec: true });
    return;
  }
  const question = typeof rendu.obj.question === 'string' ? rendu.obj.question.trim().slice(0, 400) : '';
  // Le sujet en tête (c'est aussi le texte de la notification), coupé sur un
  // mot et pas au milieu.
  const sujetCourt = (() => {
    const x = r.sujet.replace(/\s+/g, ' ').trim();
    if (x.length <= 90) return x;
    return `${x.slice(0, 90).replace(/\s+\S*$/, '')}…`;
  })();
  const titre = `${anglais ? 'Minutes' : 'Compte rendu'} — ${sujetCourt}`;
  const titres = f
    ? (anglais ? f.titresEn : f.titres).map((t, i) => (i === 3 ? `${t}, ${convocant}` : t))
    : anglais
      ? ['Decided', 'Dropped, and why', 'Disagreements that remain', `For you to decide, ${convocant}`]
      : ['Décidé', 'Écarté, et pourquoi', 'Les désaccords qui restent', `À toi de trancher, ${convocant}`];
  const vide = anglais ? '- nothing' : '- rien';
  const ligneVote = decompte ? (anglais
    ? `## Vote\n- ${decompte.pour} for · ${decompte.contre} against · ${decompte.abstention} abstention(s) — the vote informs, you decide.\n\n`
    : `## Vote\n- ${decompte.pour} pour · ${decompte.contre} contre · ${decompte.abstention} abstention(s) — le vote éclaire, c'est toi qui décides.\n\n`) : '';
  const corpsCR = ligneVote + titres.map((t, i) => `## ${t}\n${listes[i].length ? listes[i].map((x) => `- ${x}`).join('\n') : vide}`).join('\n\n');
  const { data: cr, error } = await service.from('legion_messages').insert({
    entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: president.id, user_id: null,
    texte: `${titre}\n\n${corpsCR}`.slice(0, 5000), genre: 'decision',
    meta: { par_ia: true, modele: rendu.modele, cout_eur: Number((coutEnCours() - avant).toFixed(6)), sans_reponse: true, reunion: { id: o.id, fin: true, participants: participants.map((p) => p.id), ...(r.format ? { format: r.format } : {}), ...(decompte ? { votes: decompte } : {}) }, ...(question ? { question } : {}), ...(r.web?.sources.length ? { sources: r.web.sources } : {}) },
  }).select('id').single();
  if (error) { console.error('réunion, compte rendu:', error.message); return; }
  await garder(service, { entreprise_id: o.entreprise_id, message_id: cr.id, fonction: 'legion_reunion', modele: rendu.modele, consigne: texte, sortie: JSON.stringify(rendu.obj) });

  // Les tâches décidées, au tableau — sauf celles que l'agent a déjà.
  const { data: ouvertes } = await service.from('legion_messages').select('texte, assigne_a')
    .eq('entreprise_id', o.entreprise_id).eq('genre', 'tache').is('termine_le', null).limit(300);
  const mots = (x: string) => new Set(sansAccent(x).split(/[^a-z0-9]+/).filter((m) => m.length > 3));
  const semblable = (x: string, y: string) => {
    const A = mots(x), B = mots(y);
    if (!A.size || !B.size) return sansAccent(x) === sansAccent(y);
    return [...A].filter((m) => B.has(m)).length / Math.min(A.size, B.size) >= 0.6;
  };
  const taches = Array.isArray(rendu.obj.taches) ? (rendu.obj.taches as Array<{ titre?: string; agent?: string; priorite?: string }>) : [];
  let creees = 0;
  for (const t of taches.slice(0, 5)) {
    const titreT = String(t.titre || '').trim().slice(0, 200);
    const qui = designe(String(t.agent || ''), participants);
    if (!titreT || !qui) continue;
    if ((ouvertes || []).some((x: { texte: string; assigne_a: string | null }) => x.assigne_a === qui.id && semblable(x.texte, titreT))) continue;
    const { error: e } = await service.from('legion_messages').insert({
      entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: president.id, user_id: null,
      texte: titreT, genre: 'tache', assigne_a: qui.id,
      meta: { par_ia: true, statut: 'a_faire', priorite: ['haute', 'moyenne', 'basse'].includes(String(t.priorite)) ? t.priorite : 'moyenne', depuis: cr.id, reunion: { id: o.id } },
    });
    if (!e) creees += 1;
  }
  await service.from('legion_messages').update({ meta: { ...(o.meta || {}), reunion: { ...r, terminee: true, compte_rendu: cr.id, taches: creees } } }).eq('id', o.id);
}

// ——— Une étape : qui parle maintenant, ou le compte rendu ———
async function avancer(service: Service, apiKey: string, reunionId: string, etape: number) {
  const { data: o } = await service.from('legion_messages').select(COLS_MSG).eq('id', reunionId).maybeSingle();
  const r = reunionDe(o) as Reunion | null;
  if (!o || !r?.ouverture || r.terminee) return;
  pourEntreprise(o.entreprise_id);
  const ctx = await contexte(service, o);
  if (!ctx.entreprise || !ctx.salon) return;
  const paroles = ctx.fil.filter((m) => reunionDe(m)?.id === o.id);
  if (paroles.some((m) => reunionDe(m)?.fin)) return;
  const ordres = paroles.map((m) => reunionDe(m)?.ordre).filter((x): x is number => typeof x === 'number');
  const prochain = ordres.length ? Math.max(...ordres) + 1 : 0;
  if (etape !== prochain) { console.log(`réunion ${o.id}: étape ${etape} déjà passée (prochaine: ${prochain})`); return; }

  const participants = r.participants.map((id) => ctx.agents.find((a) => a.id === id)).filter((a): a is Agent => !!a);
  const president = ctx.agents.find((a) => a.id === r.president) || participants[0];
  if (!participants.length || !president) return;

  const trop = Date.now() - Date.parse(o.created_at) > DUREE_MAX_MS;
  const p = await plafondAtteint(o.entreprise_id);
  if (p.atteint || trop) {
    const anglais = ctx.entreprise.langue === 'en';
    const raison = p.atteint
      ? (anglais ? `Meeting stopped: this month's cap is reached (${p.depense.toFixed(2)} € of ${p.plafond} €).` : `Réunion arrêtée : le plafond du mois est atteint (${p.depense.toFixed(2)} € sur ${p.plafond} €).`)
      : (anglais ? 'Meeting stopped: it ran past 45 minutes.' : 'Réunion arrêtée : elle dépassait 45 minutes.');
    await service.from('legion_messages').insert({
      entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: president.id, user_id: null, texte: raison, genre: 'info',
      meta: { sans_reponse: true, reunion: { id: o.id, fin: true, interrompue: p.atteint ? 'plafond' : 'duree' } },
    });
    await service.from('legion_messages').update({ meta: { ...(o.meta || {}), reunion: { ...r, terminee: true } } }).eq('id', o.id);
    return;
  }

  // La recherche sur Internet, une seule fois, avant la première parole.
  if (etape === 0 && r.recherche && r.web === undefined) {
    const t = await chercherWeb(apiKey, `Sujet d'une réunion de l'entreprise « ${ctx.entreprise.nom} »${ctx.entreprise.projet ? ` (${String(ctx.entreprise.projet).slice(0, 300)})` : ''} :\n${r.sujet}\nTrouve les faits, les pratiques, les prix et les règles publiques qui permettent de trancher.`);
    r.web = t;
    await service.from('legion_messages').update({ meta: { ...(o.meta || {}), reunion: { ...r } } }).eq('id', o.id);
    o.meta = { ...(o.meta || {}), reunion: { ...r } };
  }

  const n = participants.length;
  const total = (r.tours || TOURS) * n;
  let place = etape;
  // Un agent éteint entre-temps ne parle pas : on passe au suivant.
  while (!r.conclure && place < total && !participants[place % n].actif) place += 1;
  if (r.conclure || place >= total) {
    await conclure(service, apiKey, o, r, ctx, participants, president, paroles.filter((m) => typeof reunionDe(m)?.tour === 'number').length);
    return;
  }
  // Budget du mois atteint (0184): il ne parle pas, et on le dit.
  const budget = await budgetAgentAtteint(participants[place % n]);
  const ok = !budget && await prendreLaParole(service, apiKey, o, r, participants[place % n], Math.floor(place / n) + 1, place, ctx, participants, president);
  // Un raté (modèle saturé) : on ne bloque pas la réunion, le suivant parle.
  if (!ok) {
    await service.from('legion_messages').insert({
      entreprise_id: o.entreprise_id, canal_id: o.canal_id, auteur_id: participants[place % n].id, user_id: null,
      texte: budget
        ? (ctx.entreprise.langue === 'en' ? '(monthly budget reached — does not speak)' : '(budget du mois atteint — ne prend pas la parole)')
        : (ctx.entreprise.langue === 'en' ? '(could not speak — the model did not answer)' : "(n'a pas pu prendre la parole — le modèle n'a pas répondu)"), genre: 'info',
      meta: { sans_reponse: true, reunion: { id: o.id, tour: Math.floor(place / n) + 1, ordre: place, rate: true } },
    });
  }
  await lancer(service, o.id, place + 1);
}

async function ouvrirParLegion(service: Service, corps: { canal_id: string; sujet: string; participants?: string[]; format?: string }) {
  const sujet = String(corps.sujet).trim().slice(0, 800);
  const { data: salon } = await service.from('legion_canaux').select('id, entreprise_id, nom, membres, prive_entre').eq('id', corps.canal_id).maybeSingle();
  if (!salon || (Array.isArray(salon.prive_entre) && salon.prive_entre.length)) return { erreur: 'Salon inconnu ou privé.' };
  const { data: recentes } = await service.from('legion_messages').select(COLS_MSG).eq('canal_id', salon.id).eq('genre', 'reunion')
    .gte('created_at', new Date(Date.now() - DUREE_MAX_MS).toISOString()).order('created_at', { ascending: false }).limit(5);
  if (((recentes || []) as Message[]).some((m) => { const r = reunionDe(m); return r?.ouverture && !r.terminee; })) return { erreur: 'Une réunion est déjà en cours dans ce salon.' };
  pourEntreprise(salon.entreprise_id);
  const p = await plafondAtteint(salon.entreprise_id);
  if (p.atteint) return { erreur: 'Plafond du mois atteint.' };
  const { data: agents } = await service.from('legion_agents').select(COLS_AGENT).eq('entreprise_id', salon.entreprise_id).order('ordre');
  const participants = choisirParticipants(salon, (agents || []) as Agent[], corps.participants);
  if (participants.length < MIN_PARTICIPANTS) return { erreur: 'Il faut au moins deux agents allumés.' };
  const president = choisirPresident(salon, participants);
  const ordre = [...participants.filter((a) => a.id !== president.id), president];
  const format = corps.format && FORMATS[corps.format] ? corps.format : undefined;
  const reunion: Reunion = { ouverture: true, sujet, participants: ordre.map((a) => a.id), president: president.id, tours: TOURS, ...(format ? { format } : {}) };
  const { data: ouverture, error } = await service.from('legion_messages').insert({
    entreprise_id: salon.entreprise_id, canal_id: salon.id, auteur_id: president.id, user_id: null,
    texte: sujet, genre: 'reunion', meta: { sans_reponse: true, reunion, par_legion: true },
  }).select().single();
  if (error || !ouverture) return { erreur: error?.message || 'Impossible d\'ouvrir la réunion.' };
  await lancer(service, ouverture.id, 0);
  return { ok: true, message_id: ouverture.id };
}

Deno.serve(compter('legion_reunion', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  let corps: { canal_id?: string; sujet?: string; participants?: string[]; reunion_id?: string; etape?: number; conclure?: boolean; recherche?: boolean; format?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }

  // Porte 1 : la réunion elle-même, d'une prise de parole à la suivante.
  const jeton = req.headers.get('x-finjaro-token');
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_reunion').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
    // Porte 1 bis (24/09) : Legion ouvre une réunion d'elle-même — un nouveau
    // ticket sur le dépôt branché (legion-flux). Elle est ouverte au nom du
    // président de séance, jamais au nom du fondateur.
    if (!corps.reunion_id && corps.canal_id && String(corps.sujet || '').trim().length >= 3) {
      return json(await ouvrirParLegion(service, corps as { canal_id: string; sujet: string; participants?: string[]; format?: string }));
    }
    if (!corps.reunion_id || typeof corps.etape !== 'number') return json({ erreur: 'étape manquante' }, 400);
    const { data: o } = await service.from('legion_messages').select('entreprise_id').eq('id', corps.reunion_id).maybeSingle();
    const travail = enFond('legion_reunion', o?.entreprise_id ?? null, () => avancer(service, apiKey, corps.reunion_id!, corps.etape!));
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(travail);
    else await travail;
    return json({ ok: true });
  }

  // Porte 2 : un membre de l'entreprise (son jeton : il ne voit que ce qui est à lui).
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await personne.auth.getUser();
  if (!user) return json({ erreur: 'Il faut être connecté.' }, 401);

  // « Conclure maintenant » : le président rédige avec ce qui a été dit.
  if (corps.reunion_id && corps.conclure) {
    const { data: o } = await personne.from('legion_messages').select(COLS_MSG).eq('id', corps.reunion_id).maybeSingle();
    const r = reunionDe(o as Message | null) as Reunion | null;
    if (!o || !r?.ouverture) return json({ erreur: 'Réunion inconnue, ou tu n\'es pas membre.' }, 403);
    if (r.terminee) return json({ ok: true, deja: true });
    await service.from('legion_messages').update({ meta: { ...(o.meta || {}), reunion: { ...r, conclure: true } } }).eq('id', o.id);
    // Si la réunion ne bouge plus depuis deux minutes (une étape tombée en
    // panne), on la relance nous-mêmes : sinon elle attend la suivante.
    const { data: paroles } = await service.from('legion_messages').select('created_at, meta').eq('canal_id', o.canal_id)
      .contains('meta', { reunion: { id: o.id } }).order('created_at', { ascending: false }).limit(60);
    const derniere = paroles?.[0]?.created_at || o.created_at;
    if (Date.now() - Date.parse(derniere) > 120_000) {
      const ordres = (paroles || []).map((m: { meta: { reunion?: { ordre?: number } } | null }) => m.meta?.reunion?.ordre).filter((x: unknown): x is number => typeof x === 'number');
      await lancer(service, o.id, ordres.length ? Math.max(...ordres) + 1 : 0);
    }
    return json({ ok: true });
  }

  // Convoquer une réunion.
  const sujet = String(corps.sujet || '').trim().slice(0, 800);
  if (!corps.canal_id || sujet.length < 3) return json({ erreur: 'Il faut un salon et un sujet.' }, 400);
  const { data: salon } = await personne.from('legion_canaux').select('id, entreprise_id, nom, membres, prive_entre').eq('id', corps.canal_id).maybeSingle();
  if (!salon) return json({ erreur: 'Salon inconnu, ou tu n\'es pas membre.' }, 403);
  if (Array.isArray(salon.prive_entre) && salon.prive_entre.length) return json({ erreur: 'Une réunion se tient dans un salon d\'équipe, pas dans une conversation privée.' }, 400);

  const { data: agents } = await service.from('legion_agents').select(COLS_AGENT).eq('entreprise_id', salon.entreprise_id).order('ordre');
  const moi = ((agents || []) as Agent[]).find((a) => a.user_id === user.id);
  if (!moi) return json({ erreur: 'Tu n\'as pas de place dans cette entreprise.' }, 403);

  // Une seule réunion à la fois dans un salon.
  const { data: recentes } = await service.from('legion_messages').select(COLS_MSG).eq('canal_id', salon.id).eq('genre', 'reunion')
    .gte('created_at', new Date(Date.now() - DUREE_MAX_MS).toISOString()).order('created_at', { ascending: false }).limit(5);
  if (((recentes || []) as Message[]).some((m) => { const r = reunionDe(m); return r?.ouverture && !r.terminee; })) {
    return json({ erreur: 'Une réunion est déjà en cours dans ce salon.' }, 409);
  }

  pourEntreprise(salon.entreprise_id);
  const p = await plafondAtteint(salon.entreprise_id);
  if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € dépensés sur ${p.plafond} €. Tu peux le monter sur l'accueil de Léo.` });

  const participants = choisirParticipants(salon, (agents || []) as Agent[], corps.participants);
  if (participants.length < MIN_PARTICIPANTS) return json({ erreur: 'Il faut au moins deux agents allumés pour tenir une réunion.' }, 400);
  const president = choisirPresident(salon, participants);
  // Le président parle en dernier à chaque tour : il écoute avant de conclure.
  const ordre = [...participants.filter((a) => a.id !== president.id), president];

  const { data: ent } = await service.from('legion_entreprises').select('formule').eq('id', salon.entreprise_id).maybeSingle();
  const recherche = ent?.formule !== 'gratuite' && (corps.recherche === true || aBesoinDuWeb(sujet));
  const format = corps.format && FORMATS[corps.format] ? corps.format : undefined;
  const reunion: Reunion = { ouverture: true, sujet, participants: ordre.map((a) => a.id), president: president.id, tours: TOURS, ...(recherche ? { recherche: true } : {}), ...(format ? { format } : {}) };
  const { data: ouverture, error } = await personne.from('legion_messages').insert({
    entreprise_id: salon.entreprise_id, canal_id: salon.id, auteur_id: moi.id, user_id: user.id,
    texte: sujet, genre: 'reunion', meta: { sans_reponse: true, reunion },
  }).select().single();
  if (error || !ouverture) return json({ erreur: error?.message || 'Impossible d\'ouvrir la réunion.' }, 500);

  await lancer(service, ouverture.id, 0);
  return json({ ok: true, message: ouverture, participants: ordre.map((a) => ({ id: a.id, nom: a.nom })), president: { id: president.id, nom: president.nom } });
}));
