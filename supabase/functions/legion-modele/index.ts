// LEGION — un modèle d'entreprise pour n'importe quel secteur, à la demande.
//
// Beau, 22/09: « comment c'est juste les 7 ici ? Je t'ai dit qu'il y a des
// milliers de services, plusieurs secteurs… » Sept modèles écrits à la main
// ne feront jamais une place de marché mondiale. Ici, on décrit un secteur
// (« opérateur télécom », « clinique privée », « salon de coiffure ») et
// Gemini Pro écrit l'organigramme complet: les départements, les métiers
// avec leur mandat, qui est directeur, à partir de quelle taille chaque
// poste s'ouvre, et le poids de chacun dans l'effectif. Le modèle entre dans
// le catalogue (studio_modeles + studio_modele_postes) comme les autres, et
// la fondation d'une entreprise (legion_fonder) s'en sert tel quel.
//
// Deux portes: une personne connectée (trois modèles par jour, le coût),
// ou le jeton de la base pour remplir le catalogue en série.
//
// Deuxième service depuis le 25/09 (`mode: 'postes'`) : sur la page Fonder,
// Léo aide à COMPOSER l'équipe — « décris ce qu'il te manque », un fichier
// de postes envoyé, ou « regarde mon projet et dis-moi qui garder » — et
// rend des postes à ajouter, à retirer, des mandats à réécrire. Rien n'est
// écrit en base : la personne coche, puis fonde.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteurs, moteursSimples } from '../_shared/moteur.ts';

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

const TAILLES = ['cocon', 'startup', 'scaleup', 'megacorp'];
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    nom: { type: 'STRING' },
    emoji: { type: 'STRING' },
    promesse: { type: 'STRING' },
    niveau: { type: 'STRING' },
    concept: { type: 'STRING' },
    effectifs: { type: 'STRING' },
    postes: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      departement: { type: 'STRING' }, poste: { type: 'STRING' }, mandat: { type: 'STRING' },
      des_la_taille: { type: 'STRING', enum: TAILLES }, est_directeur: { type: 'BOOLEAN' }, poids: { type: 'INTEGER' },
    }, required: ['departement', 'poste', 'mandat', 'des_la_taille', 'est_directeur', 'poids'] } },
  },
  required: ['nom', 'emoji', 'promesse', 'niveau', 'concept', 'effectifs', 'postes'],
};

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = (s: string) => sansAccent(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function invite(secteur: string) {
  return `Tu écris l'organigramme type d'une entreprise du secteur suivant, pour un logiciel où chaque poste devient un agent avec un mandat: « ${secteur} ».

Écris en français. Sois précis et concret, comme quelqu'un qui a travaillé dans ce secteur: les vrais métiers, les vrais départements, pas des généralités. Aucun nom de marque.

"nom": le nom du modèle, court (« Opérateur télécom », « Clinique privée », « Salon de coiffure »).
"emoji": un seul emoji qui l'évoque.
"promesse": une phrase (≤ 110 signes) qui dit ce que cette entreprise fait, à la manière de « Marketing, contenu, ventes: ce qui fait venir les clients et les garde. »
"niveau": le type d'organisation en deux à quatre mots (« Opérateur télécom national »).
"concept": 500 à 800 signes: ce que vend cette entreprise, comment elle est organisée, qui décide, comment le travail circule entre les départements. À la manière de « Un cabinet vend du jugement. Une question de direction, une équipe de mission… ».
"effectifs": une ligne sur les tailles typiques, avec des ordres de grandeur réalistes (« Boutique: 5 à 30. Régional: 100 à 500. Mondial: plusieurs dizaines de milliers. »).
"postes": 45 à 80 postes, groupés par département (8 à 14 départements, dans l'ordre logique: la direction d'abord, puis le cœur du métier, puis les fonctions support). Pour chaque poste:
  - "departement": le nom du département (le même libellé exact pour tous les postes du département);
  - "poste": l'intitulé (unique dans le modèle);
  - "mandat": une phrase de 60 à 160 signes, à l'impératif ou au présent, qui dit ce dont ce poste répond — concret, mesurable quand c'est possible;
  - "des_la_taille": à partir de quelle taille d'entreprise le poste existe: "cocon" (moins de 10 personnes: seuls les postes indispensables), "startup" (10 à 50), "scaleup" (50 à 500), "megacorp" (plus de 500);
  - "est_directeur": true pour UN seul poste par département, celui qui le dirige;
  - "poids": 1 à 8 — combien de personnes ce poste représente en proportion dans une grande entreprise (8 pour les métiers de masse: vendeurs, agents, opérateurs; 1 pour un poste unique).
Le premier département est « Direction » avec le dirigeant (est_directeur true, des_la_taille "cocon").`;
}

// --- Composer l'équipe avec Léo (page Fonder) --------------------------------

type Existant = { departement?: string; poste?: string };
type CorpsPostes = {
  mode?: string; consigne?: string; texte?: string; langue?: string; modele_nom?: string;
  existants?: Existant[]; secteur?: string;
};
const SCHEMA_POSTES = {
  type: 'OBJECT',
  properties: {
    conseil: { type: 'STRING' },
    ajouter: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      departement: { type: 'STRING' }, poste: { type: 'STRING' }, mandat: { type: 'STRING' },
      est_directeur: { type: 'BOOLEAN' }, poids: { type: 'INTEGER' },
    }, required: ['departement', 'poste', 'mandat', 'est_directeur', 'poids'] } },
    retirer: { type: 'ARRAY', items: { type: 'STRING' } },
    modifier: { type: 'ARRAY', items: { type: 'OBJECT', properties: { poste: { type: 'STRING' }, mandat: { type: 'STRING' } }, required: ['poste', 'mandat'] } },
  },
  required: ['conseil', 'ajouter', 'retirer', 'modifier'],
};
const PAR_JOUR_POSTES = 40;

function invitePostes(c: { consigne: string; texte: string; anglais: boolean; modele: string; existants: Existant[] }) {
  const liste = c.existants.map((e) => `- ${e.departement} : ${e.poste}`).join('\n') || '(aucun poste pour l’instant)';
  return `Tu aides quelqu'un à composer l'équipe d'une entreprise d'agents, dans un logiciel où chaque poste devient un agent avec un mandat. ${c.anglais ? 'Écris TOUT en anglais (conseil, départements, postes, mandats).' : 'Écris en français.'} Aucun nom de marque, aucun nom de personne.

Le modèle choisi : « ${c.modele || 'sans modèle'} ».
Les postes déjà dans l'équipe (département : poste) :
${liste}

Ce que la personne demande :
« ${c.consigne || 'Regarde le document ci-dessous et propose les postes qu’il décrit.'} »
${c.texte ? `\nDocument fourni (liste de postes, organigramme, fiche de projet…) :\n"""\n${c.texte}\n"""\n` : ''}
Réponds avec :
"conseil" : deux à quatre phrases, concrètes, comme un directeur des ressources humaines qui a lu la demande — ce que tu proposes et pourquoi. Pas de formule creuse.
"ajouter" : les postes à AJOUTER (0 à 40). Pour chacun : "departement" (réutilise un département existant quand il convient, sinon un nom court), "poste" (intitulé unique, absent de la liste ci-dessus), "mandat" (60 à 160 signes, concret : ce dont ce poste répond), "est_directeur" (true seulement si ce poste dirige un département qui n'a pas encore de directeur), "poids" (1 à 8 : combien de personnes ce poste représente en proportion ; 1 pour un poste unique, 8 pour un métier de masse).
"retirer" : les intitulés EXACTS de postes de la liste ci-dessus qui ne servent pas ce projet (vide si tout sert). Ne retire un poste que si la demande le justifie clairement.
"modifier" : des postes existants dont le mandat mérite d'être réécrit pour ce projet — "poste" exact et nouveau "mandat" (vide si rien à changer).
Si la demande décrit un poste précis (« il me faut quelqu'un pour… »), réponds avec ce poste dans "ajouter". Si elle demande d'écrire ou de réécrire le mandat d'un poste existant, réponds dans "modifier".`;
}

async function composerPostes(req: Request, corps: CorpsPostes, apiKey: string, json: (b: unknown, s?: number) => Response) {
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await personne.auth.getUser();
  if (!user) return json({ erreur: 'Il faut être connecté.' }, 401);

  const consigne = String(corps.consigne || '').trim().slice(0, 800);
  const texte = String(corps.texte || '').trim().slice(0, 15_000);
  if (consigne.length < 3 && texte.length < 20) return json({ erreur: 'Dis à Léo ce que tu cherches, ou envoie un fichier.' }, 400);
  const anglais = String(corps.langue || '').toLowerCase().startsWith('en');
  const existants = (Array.isArray(corps.existants) ? corps.existants : []).slice(0, 400)
    .map((e) => ({ departement: String(e?.departement || '').slice(0, 60), poste: String(e?.poste || '').slice(0, 80) }))
    .filter((e) => e.poste);

  // Quarante demandes par jour et par personne : de quoi composer une équipe,
  // pas de quoi vider le budget. Compté dans legion_cache (nettoyé la nuit).
  const jour = new Date().toISOString().slice(0, 10);
  const cle = `fonder-postes:${user.id}:${jour}`;
  const { data: compteur } = await service.from('legion_cache').select('valeur').eq('cle', cle).maybeSingle();
  const n = Number((compteur?.valeur as { n?: number } | null)?.n || 0);
  if (n >= PAR_JOUR_POSTES) return json({ erreur: anglais ? 'Forty requests a day: come back tomorrow.' : 'Quarante demandes par jour, pas plus : reviens demain.' }, 429);
  await service.from('legion_cache').upsert({ cle, fonction: 'fonder-postes', valeur: { n: n + 1 }, expire_le: new Date(Date.now() + 2 * 86_400_000).toISOString() });

  const r = await generer(apiKey, invitePostes({ consigne, texte, anglais, modele: String(corps.modele_nom || '').slice(0, 80), existants }), SCHEMA_POSTES,
    { temperature: 0.4, maxSortie: 8192, reflexion: 1024, delaiMs: 90_000, modeles: moteursSimples() });
  if ('erreur' in r) return json({ erreur: r.erreur });
  const obj = r.obj as { conseil?: string; ajouter?: unknown; retirer?: unknown; modifier?: unknown };

  const connus = new Map(existants.map((e) => [sansAccent(e.poste), e.poste]));
  const vus = new Set<string>();
  const ajouter = (Array.isArray(obj.ajouter) ? obj.ajouter : []).slice(0, 40)
    .map((p) => { const x = (p || {}) as Record<string, unknown>; return {
      departement: String(x.departement || '').trim().slice(0, 60), poste: String(x.poste || '').trim().slice(0, 80),
      mandat: String(x.mandat || '').trim().slice(0, 300), est_directeur: !!x.est_directeur,
      poids: Math.min(8, Math.max(1, Number(x.poids) || 1)) }; })
    .filter((p) => { const k = sansAccent(p.poste); if (!p.poste || !p.departement || connus.has(k) || vus.has(k)) return false; vus.add(k); return true; });
  const retirer = (Array.isArray(obj.retirer) ? obj.retirer : []).map((s) => connus.get(sansAccent(String(s || '')))).filter((s): s is string => !!s).slice(0, 100);
  const modifier = (Array.isArray(obj.modifier) ? obj.modifier : [])
    .map((m) => { const x = (m || {}) as Record<string, unknown>; return { poste: connus.get(sansAccent(String(x.poste || ''))) || '', mandat: String(x.mandat || '').trim().slice(0, 300) }; })
    .filter((m) => m.poste && m.mandat.length >= 10).slice(0, 60);
  console.log(`postes pour ${user.id.slice(0, 8)} (${r.modele}) : +${ajouter.length} −${retirer.length} ✎${modifier.length}`);
  return json({ ok: true, conseil: String(obj.conseil || '').slice(0, 1200), ajouter, retirer, modifier, modele: r.modele });
}

// --- Le premier jour : chaque agent choisit son nom et se présente ----------
//
// Beau, 25/09 : « les agents doivent déjà automatiquement prendre leurs
// photos réelles et choisir leur nom » à la création. La base leur donne un
// nom tiré d'une liste ; ici, le premier jour, chacun choisit le sien
// (prénom et nom, à l'image de l'entreprise et de son pays) et se présente
// en trois traits. Une seule demande au moteur pour toute l'équipe (60 au
// plus par appel). Les photos, c'est legion-portrait (directeurs d'abord).

const SCHEMA_NOMS = {
  type: 'OBJECT',
  properties: {
    agents: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      i: { type: 'INTEGER' }, prenom: { type: 'STRING' }, nom: { type: 'STRING' }, personnalite: { type: 'STRING' },
    }, required: ['i', 'prenom', 'nom', 'personnalite'] } },
  },
  required: ['agents'],
};
type AgentNom = { id: string; nom: string; poste: string; departement: string | null; est_directeur: boolean; personnalite: string | null };

function inviteNoms(e: { nom: string; projet: string; langue: string; marche: string; modele: string }, agents: AgentNom[]) {
  const anglais = e.langue === 'en';
  const liste = agents.map((a, i) => `#${i + 1} ${a.poste}${a.departement ? ` — ${a.departement}` : ''}${a.est_directeur ? ' (dirige le département)' : ''}`).join('\n');
  return `C'est le premier jour de « ${e.nom} », une entreprise d'agents (modèle : ${e.modele || 'libre'}).${e.marche ? ` Marché : ${e.marche}.` : ''}
Projet : ${e.projet || '(pas encore écrit)'}

Chaque agent ci-dessous choisit LUI-MÊME son prénom et son nom, puis se présente en trois traits.
${liste}

Règles :
- Des noms plausibles et variés : origines, genres et âges mêlés — l'équipe est mondiale. Si le projet ou le marché nomme un pays ou une région, une bonne part des noms en viennent, sans que ce soit tous.
- Jamais deux fois le même nom dans l'équipe ; jamais le nom d'une personne connue, d'une marque ou d'un personnage de fiction.
- "personnalite" : le caractère, la façon d'écrire, la manie de l'agent — trois phrases courtes, à la troisième personne, ${anglais ? 'en anglais' : 'en français'}, 200 caractères au plus. Précis et un peu gênant, comme on décrirait un vrai collègue ; pas de mots creux (« rigoureux », « passionné »). Elle doit s'entendre quand il écrira.
Réponds pour chaque numéro, dans l'ordre, avec "i" = le numéro.`;
}

async function choisirNoms(req: Request, corps: { entreprise_id?: string }, apiKey: string, json: (b: unknown, s?: number) => Response) {
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
  if (!corps.entreprise_id) return json({ erreur: 'Entreprise manquante.' }, 400);
  // La personne doit être de l'entreprise : la lecture passe par ses droits.
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: e } = await personne.from('legion_entreprises').select('id, nom, projet, langue, modele, marche').eq('id', corps.entreprise_id).maybeSingle();
  if (!e) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Trois fois par jour et par entreprise, pas plus.
  const jour = new Date().toISOString().slice(0, 10);
  const cle = `noms:${e.id}:${jour}`;
  const { data: compteur } = await service.from('legion_cache').select('valeur').eq('cle', cle).maybeSingle();
  const n = Number((compteur?.valeur as { n?: number } | null)?.n || 0);
  if (n >= 3) return json({ ok: true, faits: 0, pourquoi: 'déjà fait aujourd’hui' });
  await service.from('legion_cache').upsert({ cle, fonction: 'noms', valeur: { n: n + 1 }, expire_le: new Date(Date.now() + 2 * 86_400_000).toISOString() });

  // Ceux qui n'ont pas encore de caractère : les nouveaux venus. Un agent qui
  // s'est déjà présenté garde son nom. Directeurs d'abord.
  const { data: agents } = await service.from('legion_agents')
    .select('id, nom, poste, departement, est_directeur, personnalite')
    .eq('entreprise_id', e.id).is('user_id', null).neq('moteur', 'claude-code').is('personnalite', null)
    .order('est_directeur', { ascending: false }).order('ordre').limit(60);
  const liste = (agents || []) as AgentNom[];
  if (!liste.length) return json({ ok: true, faits: 0, restants: 0 });

  pourEntreprise(e.id);
  const r = await generer(apiKey, inviteNoms({ nom: e.nom, projet: String(e.projet || '').slice(0, 600), langue: e.langue || 'fr', marche: String(e.marche || ''), modele: e.modele || '' }, liste),
    SCHEMA_NOMS, { temperature: 0.9, maxSortie: 8192, reflexion: 0, delaiMs: 90_000, modeles: moteursSimples() });
  if ('erreur' in r) return json({ erreur: r.erreur });
  const rendus = (Array.isArray((r.obj as { agents?: unknown }).agents) ? (r.obj as { agents: unknown[] }).agents : []) as Array<Record<string, unknown>>;

  const pris = new Set<string>();
  let faits = 0;
  for (const x of rendus) {
    const i = Number(x.i) - 1;
    const a = liste[i];
    if (!a) continue;
    const prenom = String(x.prenom || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const nom = String(x.nom || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const complet = `${prenom} ${nom}`.trim();
    const k = sansAccent(complet);
    if (prenom.length < 2 || nom.length < 2 || pris.has(k)) continue;
    pris.add(k);
    const personnalite = String(x.personnalite || '').trim().slice(0, 240);
    const { error } = await service.from('legion_agents').update({ nom: complet, ...(personnalite ? { personnalite } : {}) }).eq('id', a.id).is('personnalite', null);
    if (error) continue;
    faits += 1;
    // Le mot d'accueil du directeur, écrit par la base avec son ancien nom.
    if (a.nom && a.nom !== complet) {
      const { data: mots } = await service.from('legion_messages').select('id, texte').eq('entreprise_id', e.id).eq('auteur_id', a.id)
        .gte('created_at', new Date(Date.now() - 3_600_000).toISOString()).limit(3);
      for (const m of mots || []) {
        if (typeof m.texte === 'string' && m.texte.includes(a.nom)) await service.from('legion_messages').update({ texte: m.texte.split(a.nom).join(complet) }).eq('id', m.id);
      }
    }
  }
  console.log(`noms pour ${e.id.slice(0, 8)} (${r.modele}) : ${faits}/${liste.length}`);
  return json({ ok: true, faits, restants: Math.max(0, liste.length - faits), modele: r.modele });
}

Deno.serve(compter('legion_modele', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  let corps: CorpsPostes & { entreprise_id?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  if (corps.mode === 'postes') return composerPostes(req, corps, apiKey, json);
  if (corps.mode === 'noms') return choisirNoms(req, corps, apiKey, json);
  const secteur = String(corps.secteur || '').trim().slice(0, 160);
  if (secteur.length < 3) return json({ erreur: 'Décris le secteur en quelques mots.' }, 400);

  // Qui demande: la base (jeton), ou une personne connectée (limitée).
  const jeton = req.headers.get('x-finjaro-token');
  let par: string | null = null;
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_travail').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user } } = await personne.auth.getUser();
    if (!user) return json({ erreur: 'Il faut être connecté.' }, 401);
    par = user.id;
    const { count } = await service.from('studio_modeles').select('cle', { count: 'exact', head: true })
      .eq('cree_par', user.id).gte('created_at', new Date(Date.now() - 86_400_000).toISOString());
    if ((count ?? 0) >= 3) return json({ erreur: 'Trois nouveaux modèles par jour, pas plus: reviens demain.' }, 429);
  }

  // Déjà au catalogue ? On le rend tel quel plutôt que d'en écrire un second.
  const cle0 = slug(secteur);
  const { data: existant } = await service.from('studio_modeles').select('cle, nom').or(`cle.eq.${cle0},nom.ilike.${secteur.replace(/[%,]/g, ' ')}`).maybeSingle();
  if (existant) return json({ ok: true, deja: true, cle: existant.cle, nom: existant.nom });

  // Par le moteur commun (24/09) : DeepSeek d'abord quand sa clé existe,
  // Google ensuite — c'était l'appel le plus cher de Legion (Pro, le 22/09).
  let obj: Record<string, unknown> | null = null; let modele = '';
  let derniere = 'aucun modèle joignable';
  const r = await generer(apiKey, invite(secteur), SCHEMA, { temperature: 0.5, maxSortie: 16384, reflexion: 2048, delaiMs: 120_000, modeles: moteurs() });
  if ('erreur' in r) derniere = r.erreur; else { obj = r.obj; modele = r.modele; }
  if (!obj) return json({ erreur: derniere });

  const postes = (Array.isArray(obj.postes) ? obj.postes : []) as Array<{ departement: string; poste: string; mandat: string; des_la_taille: string; est_directeur: boolean; poids: number }>;
  if (postes.length < 20) return json({ erreur: `Modèle trop maigre (${postes.length} postes): réessaie en précisant le secteur.` });

  // Un seul directeur par département; une clé unique; un ordre stable.
  const vus = new Set<string>(); const dirigeants = new Set<string>();
  const propres = postes.filter((p) => p.poste && p.departement && p.mandat).map((p) => {
    const dept = String(p.departement).trim().slice(0, 60);
    let dir = !!p.est_directeur && !dirigeants.has(sansAccent(dept));
    if (dir) dirigeants.add(sansAccent(dept));
    return { dept, poste: String(p.poste).trim().slice(0, 80), mandat: String(p.mandat).trim().slice(0, 300),
      taille: TAILLES.includes(p.des_la_taille) ? p.des_la_taille : 'scaleup', dir, poids: Math.min(8, Math.max(1, Number(p.poids) || 1)) };
  }).filter((p) => { const k = sansAccent(p.poste); if (vus.has(k)) return false; vus.add(k); return true; });

  // La clé vient du NOM du modèle (« operateur-telecom »), pas de la phrase
  // tapée (« operateur-telecom-mobile-internet-mobile »).
  let cle = slug(String(obj.nom)) || cle0; if (!cle) cle = `modele-${Date.now().toString(36)}`;
  const { data: doublon } = await service.from('studio_modeles').select('cle').eq('cle', cle).maybeSingle();
  if (doublon) cle = `${cle}-${Date.now().toString(36).slice(-4)}`;
  const { data: dernier } = await service.from('studio_modeles').select('ordre').order('ordre', { ascending: false }).limit(1).maybeSingle();

  const { error: e1 } = await service.from('studio_modeles').insert({
    cle, nom: String(obj.nom).slice(0, 80), emoji: String(obj.emoji || '🏢').slice(0, 8), promesse: String(obj.promesse).slice(0, 200),
    niveau: String(obj.niveau).slice(0, 80), taille_defaut: 'startup', ordre: (dernier?.ordre ?? 100) + 10, actif: true,
    concept: String(obj.concept).slice(0, 1500), effectifs: String(obj.effectifs).slice(0, 400), cree_par: par, secteur_demande: secteur,
  });
  if (e1) return json({ erreur: e1.message });
  const { error: e2 } = await service.from('studio_modele_postes').insert(propres.map((p, i) => ({
    modele: cle, departement: p.dept, poste: p.poste, mandat: p.mandat, des_la_taille: p.taille, est_directeur: p.dir, poids: p.poids, ordre: i + 1, a_ecrire: false, agent_cle: null,
  })));
  if (e2) return json({ erreur: e2.message });
  console.log(`modèle ${cle}: ${propres.length} postes, ${dirigeants.size} départements (${modele})`);
  return json({ ok: true, cle, nom: obj.nom, postes: propres.length, departements: dirigeants.size, modele });
}));
