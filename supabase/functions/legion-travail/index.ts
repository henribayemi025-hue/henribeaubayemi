// LEGION — la journée de travail des agents, sans qu'on leur parle.
//
// Beau, 22/09: « le directeur ne sait pas ce qu'on va faire aujourd'hui,
// demain. Quel est le plan de la semaine ? Du mois ? La stratégie ? Rien…
// Tout le monde me dit "on est en train de travailler". Donne-moi le
// résultat. Je veux des gens autonomes, une entreprise qui fonctionne. »
//
// Jusqu'ici, un agent n'existait que quand on lui écrivait. Chaque matin
// (cron « legion-travail », 0154) — ou quand le fondateur touche « Au
// travail » sur l'accueil —, cette fonction fait deux choses:
//
//   1. LES PLANS. Chaque responsable de département allumé écrit, une fois
//      par semaine, le plan de la semaine (et une fois par mois, celui du
//      mois): d'où on part (chiffres mesurés), un objectif chiffré, trois à
//      cinq actions avec un responsable. Le plan est posté dans le salon du
//      département et rangé dans legion_plans; ses actions deviennent des
//      tâches sur le tableau.
//
//   2. LES LIVRABLES. Chaque agent allumé prend sa tâche ouverte la plus
//      ancienne, vérifie dans la base (outils de lecture), et rend un
//      LIVRABLE: une analyse, une proposition, un brouillon — un document,
//      pas une action. Il le poste dans son salon; la tâche passe « à
//      revoir ». S'il est bloqué, il dit pourquoi et ce qu'il lui faut.
//
// Honnêteté: un agent n'a que des outils de lecture. Le livrable est écrit
// tel quel, mais il ne prétend jamais avoir changé quoi que ce soit.
// Coût: Pro pour écrire, Flash pour l'enquête; le plafond du mois arrête
// tout. Claude (moteur « claude-code ») ne travaille pas ici: il travaille
// dans sa propre session.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { aerer, generer, garder, type Rendu } from '../_shared/moteur.ts';
import { aBesoinDuWeb, blocWeb, chercherWeb } from '../_shared/web.ts';
import { lireFeuille } from '../_shared/feuille.ts';
import { lireGithub } from '../_shared/github.ts';
import { enqueter, type Boutique } from '../_shared/enquete.ts';

const PROD_HOST = 'finjaro.net';
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

type Agent = { id: string; cle: string; nom: string; poste: string; departement: string | null; mandat: string | null;
  personnalite: string | null; actif: boolean; est_directeur: boolean; user_id: string | null; moteur: string };
type Tache = { id: string; texte: string; assigne_a: string | null; canal_id: string; meta: { statut?: string; priorite?: string; suite_de?: { tache_id: string; tache: string; par: string } } | null; created_at: string };
type Canal = { id: string; cle: string; nom: string; prive_entre: string[] | null; resume: string | null; resume_jusqua: string | null };
type Service = ReturnType<typeof createClient>;

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const semblable = (a: string, b: string) => {
  const mots = (x: string) => new Set(sansAccent(x).split(/[^a-z0-9]+/).filter((m) => m.length > 3));
  const A = mots(a), B = mots(b);
  if (!A.size || !B.size) return sansAccent(a) === sansAccent(b);
  const communs = [...A].filter((m) => B.has(m)).length;
  return communs / Math.min(A.size, B.size) >= 0.6;
};

// Le moteur (_shared/moteur.ts): Gemini aujourd'hui, un autre demain, par
// le réglage LEGION_MOTEURS — sans toucher à ce fichier.
async function ecrire(apiKey: string, texte: string, schema: unknown): Promise<Rendu> {
  return await generer(apiKey, texte, schema, { temperature: 0.6, reflexion: 4096, delaiMs: 90_000 });
}

// La mémoire d'un salon (0161): ce qui précède les 20 derniers messages,
// résumé par Flash — décisions, chiffres, qui fait quoi, questions
// ouvertes. Beau, 22/09: « compacter les messages quand c'est trop long ».
const SCHEMA_RESUME = { type: 'OBJECT', properties: { resume: { type: 'STRING' } }, required: ['resume'] };
async function resumer(apiKey: string, salon: string, ancien: string | null, messages: string): Promise<string | null> {
  const texte = `Tu tiens la mémoire du salon « ${salon} » d'une entreprise (des humains et des agents y parlent). Écris un résumé, en français, de 600 à 1500 signes, en Markdown léger (## titres courts, - points): les décisions prises, les chiffres cités (avec leur date), qui fait quoi, les questions restées ouvertes, les consignes du fondateur. Rien d'autre: pas de salutations, pas de commentaires. Jamais de numéro de téléphone, d'e-mail ni d'adresse.
${ancien ? `\nLE RÉSUMÉ PRÉCÉDENT (à fusionner, en gardant ce qui compte encore):\n${ancien}\n` : ''}
LES NOUVEAUX MESSAGES À RÉSUMER, du plus ancien au plus récent:
${messages}`;
  try {
    const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: texte }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: SCHEMA_RESUME } }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!resp.ok) { console.error('résumé:', resp.status); return null; }
    const body = await resp.json();
    const txt = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    const r = String(JSON.parse(txt).resume || '').replace(/\\r\\n|\\n/g, '\n').trim();
    return r.length >= 80 ? r.slice(0, 2500) : null;
  } catch (e) { console.error('résumé:', (e as Error).message); return null; }
}

const SCHEMA_PLAN = {
  type: 'OBJECT',
  properties: {
    plan_semaine: { type: 'STRING' },
    plan_mois: { type: 'STRING' },
    taches: { type: 'ARRAY', items: { type: 'OBJECT', properties: { titre: { type: 'STRING' }, agent: { type: 'STRING' } }, required: ['titre', 'agent'] } },
  },
  required: ['plan_semaine', 'plan_mois', 'taches'],
};
const SCHEMA_LIVRABLE = {
  type: 'OBJECT',
  properties: {
    livrable: { type: 'STRING' },
    statut: { type: 'STRING', enum: ['termine', 'bloque'] },
    besoin: { type: 'STRING' },
    suite_titre: { type: 'STRING' },
    suite_agent: { type: 'STRING' },
  },
  required: ['livrable', 'statut', 'besoin', 'suite_titre', 'suite_agent'],
};

const REGLES_COMMUNES = `RÈGLES ABSOLUES:
- Tu n'as que des outils de LECTURE: la base de la place de marché (les vérifications ci-dessous) et, s'il y en a une plus bas, UNE recherche sur Internet faite pour ta tâche (sans elle, tu n'as pas navigué). Tu n'as accès ni au code ni aux e-mails, et tu ne peux rien modifier ni envoyer. Tu ne prétends donc JAMAIS avoir fait, changé, envoyé ou publié quoi que ce soit.
- Jamais de chiffre, de pourcentage ou de date qui ne figure pas dans les chiffres mesurés ou les vérifications. Un chiffre que tu n'as pas, tu dis que tu ne l'as pas.
- Aucune phrase qui enferme la place de marché dans un pays; jamais de « diaspora ».
- Pas de formule creuse, pas de « on travaille dessus »: du concret — qui, quoi, pour quand, et ce que ça demande au fondateur.
- Ton: chaleureux et direct, en EXPERT de ton métier, avec TA personnalité (ta façon d'écrire se reconnaît); une phrase humaine d'ouverture est bienvenue, puis le fond. Pas d'excuses, pas de « haha », pas de « désolé pour la tension », pas de digressions (« mais je me disperse »). Jamais sec ni télégraphique.
- Écris en français, en Markdown léger (titres courts avec ##, listes avec -), sans tableau. Un retour à la ligne AVANT chaque titre et chaque point de liste (le texte est affiché tel quel: un bloc compact est illisible).
- Legion, l'application où tu travailles, existe déjà: le fondateur y allume et éteint les agents, y lit les salons, le tableau des tâches, les plans, la mémoire des règles, les compétences et la dépense. Ne propose jamais de construire un outil qui fait déjà ça; propose ce qui manque, précisément.
- Les faits sur l'offre: la place de marché est gratuite pour les boutiques inscrites avant fin octobre 2026 (gratuit à vie pour elles), payante ensuite pour les nouvelles. Ne dis rien d'autre sur les prix.`;

function invitePlan(a: Agent, projet: string, dept: string, equipe: string[], taches: string[], memoire: string[], fil: string[], mesures: string | null, verifie: string[], plansPrecedents: string[], besoinMois: boolean, plansDepartements: string[] = []) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const direction = plansDepartements.length > 0;
  return `Tu es ${a.nom}, ${a.poste}, responsable du département « ${dept} ». ${a.personnalite ? `Ta manière: ${a.personnalite}.` : ''}
Ton mandat: ${a.mandat || '(non précisé)'}.
L'entreprise: ${projet}
Nous sommes le ${aujourdhui}. C'est le matin: tu écris le PLAN de ${direction ? "L'ENTREPRISE — le seul que le fondateur lira: il reprend les plans des départements ci-dessous, tranche entre eux, et fixe l'objectif commun" : 'ton département, comme un vrai responsable qui sait ce que son équipe fait aujourd\'hui, demain et cette semaine'}.
${direction ? `\nLES PLANS DES DÉPARTEMENTS, écrits ce matin par leurs responsables (à reprendre, pas à répéter: un objectif commun, les 5 à 7 actions qui comptent le plus toutes équipes confondues, chacune avec son responsable):\n${plansDepartements.join('\n\n')}\n` : ''}

TON ÉQUIPE (seuls les agents allumés peuvent recevoir une tâche):
${equipe.join('\n')}

LES TÂCHES DÉJÀ OUVERTES dans ton département (ne les recrée pas):
${taches.length ? taches.join('\n') : '(aucune)'}

${memoire.length ? `LES RÈGLES DE LA MAISON (fixées par le fondateur):\n${memoire.map((r) => `- ${r}`).join('\n')}\n` : ''}
${plansPrecedents.length ? `TES PLANS PRÉCÉDENTS (pour la continuité: dis ce qui a avancé, ce qui n'a pas bougé):\n${plansPrecedents.join('\n\n')}\n` : ''}
CE QUI S'EST DIT RÉCEMMENT (ton salon et la Direction, du plus ancien au plus récent):
${fil.length ? fil.join('\n') : '(rien)'}

${mesures ? `CHIFFRES MESURÉS À L'INSTANT (connecteur « Mesures Finjaro », lecture seule, comptes de test exclus):\n${mesures}\n` : ''}
${verifie.length ? `VÉRIFICATIONS FAITES À L'INSTANT dans la base (outil → résultat):\n${verifie.join('\n')}\n` : ''}
${REGLES_COMMUNES}

ÉCRIS:
"plan_semaine": le plan de la semaine, 900 à 1800 signes: ## D'où on part (les chiffres qui comptent pour ton département), ## Objectif de la semaine (UN objectif chiffré), ## Actions (3 à 5, chacune « - [Nom de l'agent] action précise — pour quand »), ## Ce qu'il faut au fondateur (décisions, accès, ou « rien »).
"plan_mois": ${besoinMois ? 'le plan du mois, 600 à 1200 signes, même structure, avec l\'objectif du mois et les 3 à 5 chantiers.' : '"" (le plan du mois est déjà écrit ce mois-ci).'}
"taches": les actions de la semaine qui ne sont pas déjà dans les tâches ouvertes, 5 au plus: {"titre": intitulé court et précis, "agent": le nom exact d'un agent ALLUMÉ de ton équipe (toi compris)}.`;
}

function inviteLivrable(a: Agent, projet: string, tache: Tache, equipe: string[], memoire: string[], competences: { nom: string; texte: string }[], fil: string[], mesures: string | null, verifie: string[], plans: string[]) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return `Tu es ${a.nom}, ${a.poste}${a.departement ? `, département « ${a.departement} »` : ''}. ${a.personnalite ? `Ta manière: ${a.personnalite}.` : ''}
Ton mandat: ${a.mandat || '(non précisé)'}.
L'entreprise: ${projet}
Nous sommes le ${aujourdhui}. Tu prends ta tâche du jour et tu la LIVRES maintenant, par écrit. Le fondateur veut un résultat, pas « on y travaille ».

TA TÂCHE: « ${tache.texte} » (ouverte depuis le ${tache.created_at.slice(0, 10)}${tache.meta?.priorite ? `, priorité ${tache.meta.priorite}` : ''}).

L'ÉQUIPE:
${equipe.join('\n')}

${competences.length ? `TES COMPÉTENCES (fiches de savoir-faire, applique-les):\n${competences.map((c) => `### ${c.nom}\n${c.texte}`).join('\n\n')}\n` : ''}
${memoire.length ? `LES RÈGLES DE LA MAISON:\n${memoire.map((r) => `- ${r}`).join('\n')}\n` : ''}
${plans.length ? `LE PLAN EN COURS de ton département:\n${plans.join('\n\n')}\n` : ''}
CE QUI S'EST DIT RÉCEMMENT (ton salon et la Direction):
${fil.length ? fil.join('\n') : '(rien)'}

${mesures ? `CHIFFRES MESURÉS À L'INSTANT (lecture seule, comptes de test exclus):\n${mesures}\n` : ''}
${verifie.length ? `VÉRIFICATIONS FAITES À L'INSTANT dans la base (outil → résultat):\n${verifie.join('\n')}\n` : ''}
${REGLES_COMMUNES}

ÉCRIS:
"livrable": le résultat de la tâche, complet et utilisable tel quel, 800 à 2500 signes. Selon la tâche: une analyse (les chiffres, ce qu'ils disent, ce qu'on fait), une proposition (le quoi, le pourquoi, les étapes, ce que ça coûte en effort), un brouillon (texte prêt à l'emploi), une liste précise. Commence par « ## » et le titre de la tâche. Termine par « ## Et maintenant »: la prochaine étape concrète et qui la fait.
"statut": "termine" si tu as pu livrer; "bloque" si la tâche demande quelque chose que tu n'as pas (un accès, une décision, un outil d'écriture) — dans ce cas "livrable" contient ce que tu as quand même pu faire.
"besoin": si bloqué, en une phrase, ce qu'il te faut et de qui; sinon "".
"suite_titre" et "suite_agent": LE RELAIS. Si ta tâche est terminée et que ton livrable appelle une étape suivante qu'un AUTRE agent ALLUMÉ de l'équipe doit faire (le texte est écrit → la relecture; l'analyse est faite → la maquette), l'intitulé court et précis de cette tâche, et le nom exact de cet agent. Sinon "" et "". Une seule suite, et seulement si elle est vraiment nécessaire.`;
}

// Supabase coupe une fonction qui n'a rien envoyé pendant 150 s (vu le
// 22/09 au premier essai: 4 plans et 3 livrables, puis « IDLE_TIMEOUT »).
// Une journée se fait donc en TRANCHES d'environ 100 s: chaque tranche fait
// ce qu'elle peut, puis se rappelle elle-même pour la suite (avec le jeton
// de la base), jusqu'à ce qu'il ne reste rien. Un plan déjà écrit cette
// semaine et un livrable déjà rendu aujourd'hui ne se refont pas: la
// chaîne s'arrête d'elle-même.
const BUDGET_MS = 100_000;
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

// Le plan et les livrables d'UNE entreprise. Rend true s'il reste du travail.
async function travailler(service: Service, apiKey: string, entrepriseId: string, journal: string[], debut: number): Promise<boolean> {
  const tempsEcoule = () => Date.now() - debut > BUDGET_MS;
  pourEntreprise(entrepriseId);
  const p = await plafondAtteint(entrepriseId);
  if (p.atteint) { journal.push(`${entrepriseId}: plafond du mois atteint (${p.depense.toFixed(2)} €)`); return false; }

  const [{ data: entreprise }, { data: agents }, { data: canaux }, { data: regles }, { data: branche }] = await Promise.all([
    service.from('legion_entreprises').select('id, nom, projet, langue').eq('id', entrepriseId).single(),
    service.from('legion_agents').select('id, cle, nom, poste, departement, mandat, personnalite, actif, est_directeur, user_id, moteur').eq('entreprise_id', entrepriseId).order('ordre'),
    service.from('legion_canaux').select('id, cle, nom, prive_entre, resume, resume_jusqua').eq('entreprise_id', entrepriseId),
    service.from('legion_memoire').select('regle').eq('entreprise_id', entrepriseId).eq('actif', true).order('created_at', { ascending: false }).limit(30),
    service.from('legion_connecteurs').select('id').eq('entreprise_id', entrepriseId).eq('type', 'finjaro-mesures').eq('actif', true).maybeSingle(),
  ]);
  if (!entreprise || !agents || !canaux) { journal.push(`${entrepriseId}: introuvable`); return false; }
  const machines = (agents as Agent[]).filter((a) => !a.user_id && a.moteur !== 'claude-code' && a.actif);
  if (!machines.length) { journal.push(`${entreprise.nom}: personne d'allumé`); return false; }
  const memoire = (regles || []).map((x: { regle: string }) => x.regle).reverse();
  let projet = String(entreprise.projet || entreprise.nom);
  // La langue de l'entreprise (0166, bouton FR / EN de Legion): les plans et
  // les livrables s'écrivent dans celle-là. Vide = français. Pas la langue du
  // profil: celui de Beau est en anglais, il lit ses agents en français.
  const anglais = entreprise.langue === 'en';
  const enLangue = anglais ? '\n\nLANGUE: le fondateur lit en anglais. Écris TOUT ce que tu rends en anglais (English), titres compris — même si les consignes et le fil sont en français.' : '';

  let mesures: string | null = null;
  if (branche) {
    const { data: m, error } = await service.rpc('legion_mesures_finjaro');
    if (error) console.error('mesures:', error.message); else if (m) mesures = JSON.stringify(m);
  }
  // « Se connecter avec Finjaro » (0160): la boutique branchée, s'il y en a une.
  const { data: brancheBoutique } = await service.from('legion_connecteurs').select('config')
    .eq('entreprise_id', entrepriseId).eq('type', 'finjaro-boutique').eq('actif', true).maybeSingle();
  const boutique: Boutique | null = brancheBoutique?.config?.shop_id ? { shop_id: String(brancheBoutique.config.shop_id), nom: String(brancheBoutique.config.nom || 'ma boutique') } : null;
  if (boutique) projet += `\nL'entreprise a branché SA boutique sur la place de marché Finjaro: « ${boutique.nom} » — ses ventes, son stock, ses avis, ses messages en attente sont lisibles par les outils ma_boutique_* (vérifications ci-dessous); on dit « notre boutique ».`;
  const peutEnqueter = !!(mesures || boutique);
  // La feuille de route du fondateur (0168): chacun travaille pour elle.
  projet += await lireFeuille(service, entrepriseId, Object.fromEntries((agents as Agent[]).map((a) => [a.id, a.nom])));
  // Son dépôt GitHub, s'il est branché (0169): une lecture par journée.
  projet += await lireGithub(service, entrepriseId);

  const publics = (canaux as Canal[]).filter((c) => !(Array.isArray(c.prive_entre) && c.prive_entre.length));
  const canalDe = (dept: string | null) => publics.find((c) => sansAccent(c.cle) === sansAccent(dept || '') || sansAccent(c.nom) === sansAccent(dept || ''))
    || publics.find((c) => sansAccent(c.cle) === 'direction') || publics[0];
  const direction = publics.find((c) => sansAccent(c.cle) === 'direction');
  const nomDe = (id: string | null) => (agents as Agent[]).find((a) => a.id === id)?.nom || 'Quelqu\'un';

  // 0. LA MÉMOIRE DES SALONS — un long fil se compacte (0161). Ce qui
  // précède les 20 derniers messages, quand il y en a au moins 30 de
  // nouveaux depuis le dernier résumé.
  for (const c of canaux as Canal[]) {
    if (tempsEcoule()) break;
    const { count } = await service.from('legion_messages').select('id', { count: 'exact', head: true }).eq('canal_id', c.id).neq('genre', 'tache');
    if ((count ?? 0) <= 40) continue;
    const { data: anciens } = await service.from('legion_messages').select('auteur_id, texte, created_at')
      .eq('canal_id', c.id).neq('genre', 'tache').gt('created_at', c.resume_jusqua || '1970-01-01').order('created_at', { ascending: true }).limit(400);
    const aResumer = (anciens || []).slice(0, Math.max(0, (anciens || []).length - 20));
    if (aResumer.length < 30) continue;
    const texte = aResumer.map((m: { auteur_id: string; texte: string; created_at: string }) => `[${m.created_at.slice(0, 16).replace('T', ' ')}] ${nomDe(m.auteur_id)}: ${String(m.texte).slice(0, 400)}`).join('\n');
    const resume = await resumer(apiKey, c.nom, c.resume, texte);
    if (!resume) continue;
    await service.from('legion_canaux').update({ resume, resume_jusqua: aResumer[aResumer.length - 1].created_at, resume_le: new Date().toISOString() }).eq('id', c.id);
    journal.push(`${entreprise.nom}/${c.nom}: mémoire du salon mise à jour (${aResumer.length} messages résumés)`);
  }
  const equipe = (agents as Agent[]).filter((a) => !a.user_id).map((a) => `- ${a.nom} (${a.poste}${a.departement ? `, ${a.departement}` : ''}) — ${a.actif ? 'allumé' : 'éteint'}`);

  const { data: tachesOuvertes } = await service.from('legion_messages').select('id, texte, assigne_a, canal_id, meta, created_at')
    .eq('entreprise_id', entrepriseId).eq('genre', 'tache').is('termine_le', null).order('created_at').limit(300);
  const ouvertes = ((tachesOuvertes || []) as Tache[]).filter((t) => !['fait', 'revue'].includes(t.meta?.statut || ''));

  // Les 30 derniers messages de chaque salon public, pour le contexte.
  const { data: recents } = await service.from('legion_messages').select('auteur_id, texte, canal_id, created_at')
    .eq('entreprise_id', entrepriseId).neq('genre', 'tache').order('created_at', { ascending: false }).limit(200);
  const filDe = (canalIds: string[]) => (recents || []).filter((m: { canal_id: string }) => canalIds.includes(m.canal_id)).slice(0, 30).reverse()
    .map((m: { auteur_id: string; texte: string; created_at: string }) => `[${m.created_at.slice(5, 16).replace('T', ' ')}] ${nomDe(m.auteur_id)}: ${String(m.texte).slice(0, 400)}`);

  const { data: plansRecents } = await service.from('legion_plans').select('departement, horizon, contenu, created_at')
    .eq('entreprise_id', entrepriseId).gte('created_at', new Date(Date.now() - 40 * 86_400_000).toISOString()).order('created_at', { ascending: false });
  const plansDe = (dept: string, horizon?: string) => (plansRecents || [])
    .filter((x: { departement: string; horizon: string }) => sansAccent(x.departement) === sansAccent(dept) && (!horizon || x.horizon === horizon));

  // Qui a déjà rendu son livrable aujourd'hui (une tranche précédente).
  const { data: livresAujourdhui } = await service.from('legion_messages').select('auteur_id')
    .eq('entreprise_id', entrepriseId).gte('created_at', new Date().toISOString().slice(0, 10)).not('meta->livrable', 'is', null);
  const dejaLivre = new Set((livresAujourdhui || []).map((x: { auteur_id: string }) => x.auteur_id));

  // 1. LES PLANS — un par département dont le responsable est allumé; la
  // Direction en dernier: son plan est LE plan de l'entreprise, il reprend
  // ceux des départements écrits juste avant (Beau, 22/09 au soir: « tu ne
  // m'envoies pas quatre plans différents »).
  const estDirection = (a: Agent) => sansAccent(a.departement || '') === 'direction';
  const directeurs = machines.filter((a) => a.est_directeur && a.departement).sort((a, b) => Number(estDirection(a)) - Number(estDirection(b)));
  const plansDuJour: string[] = [];
  for (const d of directeurs) {
    const dept = d.departement!;
    const jours = (x: { created_at: string }) => (Date.now() - new Date(x.created_at).getTime()) / 86_400_000;
    const dernierSemaine = plansDe(dept, 'semaine')[0];
    const dernierMois = plansDe(dept, 'mois')[0];
    if (dernierSemaine && jours(dernierSemaine) < 6) continue;
    if (tempsEcoule()) return true;
    const besoinMois = !dernierMois || jours(dernierMois) >= 25;
    const canal = canalDe(dept);
    const equipeDept = (agents as Agent[]).filter((a) => !a.user_id && sansAccent(a.departement || '') === sansAccent(dept))
      .map((a) => `- ${a.nom} (${a.poste}) — ${a.actif ? 'allumé' : 'éteint'}${a.mandat ? ` — ${a.mandat.slice(0, 160)}` : ''}`);
    const idsDept = (agents as Agent[]).filter((a) => sansAccent(a.departement || '') === sansAccent(dept)).map((a) => a.id);
    const tachesDept = ouvertes.filter((t) => t.assigne_a && idsDept.includes(t.assigne_a)).map((t) => `- ${t.texte} (${nomDe(t.assigne_a)}, ${t.meta?.statut || 'a_faire'})`);
    const fil = filDe([canal.id, ...(direction && direction.id !== canal.id ? [direction.id] : [])]);
    const precedents = [dernierSemaine, dernierMois].filter(Boolean).map((x) => `(${x!.horizon}, ${x!.created_at.slice(0, 10)})\n${String(x!.contenu).slice(0, 1500)}`);
    // La Direction reçoit les plans des départements écrits ce matin (ou
    // cette semaine) pour en faire un seul plan d'entreprise.
    const autresPlans = estDirection(d)
      ? [...plansDuJour, ...(plansRecents || []).filter((x: { departement: string; horizon: string; created_at: string }) => x.horizon === 'semaine' && sansAccent(x.departement) !== 'direction' && (Date.now() - new Date(x.created_at).getTime()) / 86_400_000 < 6 && !plansDuJour.some((p) => p.startsWith(`[${x.departement}]`))).map((x: { departement: string; contenu: string }) => `[${x.departement}]\n${String(x.contenu).slice(0, 1500)}`)]
      : [];
    const verifie = peutEnqueter ? await enqueter(apiKey, service, fil.slice(-10).join('\n'), `Écrire le plan de la semaine du département ${dept} (${d.mandat || d.poste}): quels chiffres vérifier ?`, sansAccent(dept) === 'direction', boutique, !!mesures) : [];
    const consignePlan = invitePlan(d, projet, dept, equipeDept, tachesDept, memoire, fil, mesures, verifie, precedents, besoinMois, autresPlans) + enLangue;
    const r = await ecrire(apiKey, consignePlan, SCHEMA_PLAN);
    if ('erreur' in r) { journal.push(`${entreprise.nom}/${dept}: plan impossible — ${r.erreur}`); continue; }
    const semaine = aerer(String(r.obj.plan_semaine || '').trim()).slice(0, 4000);
    const mois = aerer(String(r.obj.plan_mois || '').trim()).slice(0, 4000);
    if (semaine.length < 100) { journal.push(`${entreprise.nom}/${dept}: plan vide`); continue; }
    await service.from('legion_plans').insert({ entreprise_id: entrepriseId, departement: dept, agent_id: d.id, horizon: 'semaine', contenu: semaine });
    plansDuJour.push(`[${dept}]\n${semaine.slice(0, 1500)}`);
    if (besoinMois && mois.length >= 100) await service.from('legion_plans').insert({ entreprise_id: entrepriseId, departement: dept, agent_id: d.id, horizon: 'mois', contenu: mois });
    const sansTitre = (x: string) => x.replace(/^##\s*(plan|weekly|monthly)[^\n]*\n/i, '');
    const texte = `## ${anglais ? 'Weekly plan' : 'Plan de la semaine'} — ${dept}\n${sansTitre(semaine)}${besoinMois && mois.length >= 100 ? `\n\n## ${anglais ? 'Monthly plan' : 'Plan du mois'} — ${dept}\n${sansTitre(mois)}` : ''}`;
    const { data: planPublie } = await service.from('legion_messages').insert({
      entreprise_id: entrepriseId, canal_id: canal.id, auteur_id: d.id, user_id: null, texte, genre: 'info',
      meta: { par_ia: true, modele: r.modele, plan: { horizon: besoinMois ? 'semaine+mois' : 'semaine', departement: dept }, sans_reponse: true, ...(verifie.length ? { verifie: verifie.map((v) => v.split(' → ')[0]) } : {}) },
    }).select('id').single();
    await garder(service, { entreprise_id: entrepriseId, message_id: planPublie?.id, fonction: 'legion_travail:plan', modele: r.modele, consigne: consignePlan, sortie: JSON.stringify(r.obj) });
    let creees = 0;
    for (const t of (Array.isArray(r.obj.taches) ? r.obj.taches : []).slice(0, 5) as { titre: string; agent: string }[]) {
      const titre = String(t.titre || '').trim().slice(0, 200);
      const qui = machines.find((a) => sansAccent(a.nom) === sansAccent(String(t.agent || '')) && sansAccent(a.departement || '') === sansAccent(dept)) || d;
      if (titre.length < 6 || ouvertes.some((x) => semblable(x.texte, titre))) continue;
      const { data: tache } = await service.from('legion_messages').insert({
        entreprise_id: entrepriseId, canal_id: canal.id, auteur_id: d.id, user_id: null, texte: titre, genre: 'tache', assigne_a: qui.id,
        meta: { par_ia: true, statut: 'a_faire', priorite: 'moyenne', plan: dept },
      }).select('id, texte, assigne_a, canal_id, meta, created_at').single();
      if (tache) { ouvertes.push(tache as Tache); creees += 1; }
    }
    journal.push(`${entreprise.nom}/${dept}: plan écrit par ${d.nom} (${r.modele}), ${creees} tâche(s) ajoutée(s)`);
  }

  // 2. LES LIVRABLES — chaque agent allumé prend sa tâche la plus ancienne.
  const lot = 3;
  const restants = machines.filter((a) => !dejaLivre.has(a.id));
  for (let i = 0; i < restants.length; i += lot) {
    if (tempsEcoule()) return true;
    await Promise.all(restants.slice(i, i + lot).map(async (a) => {
      const tache = ouvertes.find((t) => t.assigne_a === a.id);
      if (!tache) { journal.push(`${entreprise.nom}: ${a.nom} n'a pas de tâche ouverte`); dejaLivre.add(a.id); return; }
      const canal = canalDe(a.departement);
      const { data: comp } = await service.from('legion_competences').select('nom, description, contenu').eq('agent_id', a.id).eq('actif', true).order('created_at').limit(4);
      const competences = (comp || []).map((c: { nom: string; description: string | null; contenu: string | null }) => ({ nom: c.nom, texte: String(c.contenu || c.description || '').slice(0, 2500) }));
      const fil = filDe([canal.id, ...(direction && direction.id !== canal.id ? [direction.id] : [])]);
      const plans = plansDe(a.departement || '').slice(0, 2).map((x: { horizon: string; contenu: string }) => `(${x.horizon})\n${String(x.contenu).slice(0, 1500)}`);
      const enDirection = sansAccent(a.departement || '') === 'direction';
      const verifie = peutEnqueter ? await enqueter(apiKey, service, fil.slice(-10).join('\n'), `Livrer la tâche « ${tache.texte} » (${a.poste}): quels chiffres vérifier ?`, enDirection, boutique, !!mesures) : [];
      // Une tâche reçue en relais: l'agent lit le livrable de celui qui la lui passe.
      let recu = '';
      if (tache.meta?.suite_de?.tache_id) {
        const { data: avant } = await service.from('legion_messages').select('texte').eq('entreprise_id', entrepriseId)
          .eq('meta->livrable->>tache_id', tache.meta.suite_de.tache_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (avant?.texte) recu = `\n\nCETTE TÂCHE T'EST PASSÉE EN RELAIS par ${tache.meta.suite_de.par}, qui vient de livrer « ${tache.meta.suite_de.tache} ». SON LIVRABLE (pars de là, ne le refais pas):\n${String(avant.texte).slice(0, 3000)}`;
      }
      // Une tâche qui regarde dehors (veille, événements, prospects,
      // concurrents): une recherche sur Internet, sources comprises.
      const web = aBesoinDuWeb(tache.texte, a.poste, a.mandat) ? await chercherWeb(apiKey, `Tâche de ${a.nom} (${a.poste}) pour l'entreprise « ${entreprise.nom} » — ${String(entreprise.projet || '').slice(0, 300)}:\n${tache.texte}`) : null;
      const consigneLivrable = inviteLivrable(a, projet, tache, equipe, memoire, competences, fil, mesures, verifie, plans) + recu + (web ? blocWeb(web) : '') + enLangue;
      const r = await ecrire(apiKey, consigneLivrable, SCHEMA_LIVRABLE);
      if ('erreur' in r) { journal.push(`${entreprise.nom}: ${a.nom} — ${r.erreur}`); return; }
      const livrable = aerer(String(r.obj.livrable || '').trim()).slice(0, 4000);
      if (livrable.length < 80) { journal.push(`${entreprise.nom}: ${a.nom} — livrable vide`); return; }
      const bloque = r.obj.statut === 'bloque';
      const besoin = String(r.obj.besoin || '').trim().slice(0, 400);
      const texte = bloque && besoin ? `${livrable}\n\n**Bloqué :** ${besoin}` : livrable;
      const { data: livrablePublie } = await service.from('legion_messages').insert({
        entreprise_id: entrepriseId, canal_id: canal.id, auteur_id: a.id, user_id: null, texte, genre: bloque ? 'question' : 'info',
        meta: { par_ia: true, modele: r.modele, livrable: { tache_id: tache.id, tache: tache.texte, statut: bloque ? 'bloque' : 'termine' }, sans_reponse: true, ...(web?.sources.length ? { sources: web.sources } : {}), ...(verifie.length ? { verifie: verifie.map((v) => v.split(' → ')[0]) } : {}) },
      }).select('id').single();
      await garder(service, { entreprise_id: entrepriseId, message_id: livrablePublie?.id, fonction: 'legion_travail:livrable', modele: r.modele, consigne: consigneLivrable, sortie: JSON.stringify(r.obj) });
      // La tâche passe « à revoir » (le fondateur la ferme, ou la renvoie).
      await service.from('legion_messages').update({ meta: { ...(tache.meta || {}), statut: bloque ? 'en_cours' : 'revue', livre_le: new Date().toISOString(), ...(bloque ? { bloque: besoin } : {}) } }).eq('id', tache.id);
      // LE RELAIS (plan complet, B6-5): un livrable fini passe la suite au bon
      // agent — une tâche nouvelle, dans le salon de son département, qui
      // dit d'où elle vient. Il la prendra à sa prochaine journée.
      let relais = '';
      const suiteTitre = String(r.obj.suite_titre || '').trim().slice(0, 200);
      const suivant = !bloque && suiteTitre.length >= 6
        ? machines.find((x) => x.id !== a.id && sansAccent(x.nom) === sansAccent(String(r.obj.suite_agent || ''))) : null;
      if (suivant && !ouvertes.some((x) => semblable(x.texte, suiteTitre))) {
        const { data: suite } = await service.from('legion_messages').insert({
          entreprise_id: entrepriseId, canal_id: canalDe(suivant.departement).id, auteur_id: a.id, user_id: null, texte: suiteTitre, genre: 'tache', assigne_a: suivant.id,
          meta: { par_ia: true, statut: 'a_faire', priorite: tache.meta?.priorite || 'moyenne', suite_de: { tache_id: tache.id, tache: tache.texte, par: a.nom } },
        }).select('id, texte, assigne_a, canal_id, meta, created_at').single();
        if (suite) { ouvertes.push(suite as Tache); relais = `, relais à ${suivant.nom}`; }
      }
      journal.push(`${entreprise.nom}: ${a.nom} a livré « ${tache.texte.slice(0, 60)} » (${bloque ? 'bloqué' : 'terminé'}, ${r.modele}${relais})`);
      dejaLivre.add(a.id);
    }));
  }
  return false;
}

Deno.serve(compter('legion_travail', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  let corps: { entreprise_id?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }

  // Deux portes: le cron du matin (jeton partagé, toutes les entreprises),
  // ou un membre qui touche « Au travail » (son jeton, son entreprise).
  const jeton = req.headers.get('x-finjaro-token');
  let entreprises: string[] = [];
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_travail').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
    if (corps.entreprise_id) entreprises = [corps.entreprise_id]; // une tranche suivante
    else {
      const { data } = await service.from('legion_agents').select('entreprise_id').eq('actif', true).is('user_id', null).neq('moteur', 'claude-code');
      entreprises = [...new Set((data || []).map((x: { entreprise_id: string }) => x.entreprise_id))];
    }
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth || !corps.entreprise_id) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: e } = await personne.from('legion_entreprises').select('id').eq('id', corps.entreprise_id).maybeSingle();
    if (!e) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);
    entreprises = [e.id];
  }

  const journal: string[] = [];
  const debut = Date.now();
  const aSuivre: string[] = [];
  for (const id of entreprises) {
    try { if (await travailler(service, apiKey, id, journal, debut)) aSuivre.push(id); } catch (e) { journal.push(`${id}: ${(e as Error).message}`); console.error(e); }
  }
  // La tranche suivante, pour ce qui reste: la fonction se rappelle avec le
  // jeton de la base, sans attendre la réponse.
  if (aSuivre.length) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_travail').maybeSingle();
    if (sec?.value) {
      for (const id of aSuivre) {
        const suite = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-travail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`, 'x-finjaro-token': sec.value },
          body: JSON.stringify({ entreprise_id: id }),
        }).catch((e) => console.error('tranche suivante:', (e as Error).message));
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(suite);
      }
      journal.push(`tranche suivante lancée pour ${aSuivre.length} entreprise(s)`);
    }
  }
  console.log(journal.join('\n'));
  return json({ ok: true, journal, suite: aSuivre.length > 0 });
}));
