// ATELIER-MODELE — le relais des modèles pour l'Atelier de code de Léo (24/09).
//
// Beau, 24/09 au soir : tous les modèles au choix dans l'atelier, sans
// recopier chaque clé dans Cloudflare. Les clés sont DÉJÀ dans les secrets
// de Supabase (DEEPSEEK_API_KEY, KIMI_API_KEY, GEMINI_API_KEY, la clé OpenAI
// rangée sous « Leo », ANTHROPIC_API_KEY si elle existe un jour) : le Worker
// de l'atelier (atelier/src/moteur.js) passe par ici pour tout modèle dont la
// clé n'est pas posée chez lui. Une clé posée dans le Worker reste
// prioritaire : il appelle alors le modèle lui-même, sans ce relais.
//
// Ce que fait ce relais, et rien d'autre :
// - `modeles` : la liste des modèles joignables selon les clés présentes
//   (jamais la valeur d'une clé) ;
// - `appel` : transmet une requête chat/completions (format OpenAI) au bon
//   fournisseur avec la bonne clé, et rend sa réponse TELLE QUELLE, statut
//   compris, pour que le Worker la traite exactement comme un appel direct.
//   Claude seul est traduit (anthropic.ts) : il ne parle pas ce format.
//
// La porte : le jeton Supabase de la personne, et la MÊME règle que le
// Worker (atelier/src/supabase.js) — propriétaire de l'entreprise Finjaro
// dans Léo (legion_membres, rôle « proprietaire »), lu avec SON jeton sous
// les règles d'accès, ou identifiant listé dans ATELIER_UTILISATEURS.
// Aucune clé de service ici : ce relais ne voit que ce que la personne voit.
//
// Pas de CORS : seul le serveur du Worker appelle ce relais, jamais une
// page. Une requête qui arrive avec un en-tête Origin (un navigateur) est
// refusée.
//
// Le coût reste compté par l'atelier lui-même (atelier_couts, écrit par le
// Worker). Ce relais n'écrit donc rien dans ai_usage ; il LIT atelier_couts
// pour un plafond simple par personne et par jour (ATELIER_PLAFOND_JOUR_USD,
// 1 $ par défaut depuis le 24/09 : « 10 $, c'est trop, on fait seulement le test » (Beau)), en plus du plafond dur de chaque session du Worker.
//
// ATTENTION : comme toute fonction edge, elle est COMMUNE à staging et à la
// production (CLAUDE.md §4). Elle n'est appelée que par l'atelier.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cleOpenAI } from '../_shared/cout.ts';
import { depuisAnthropic, versAnthropic } from './anthropic.ts';

const TAILLE_MAX = 2_000_000; // octets : le Worker envoie au plus ~240 000 caractères de conversation, que JSON et UTF-8 peuvent doubler
const DELAI_MS = 120_000;
const SORTIE_MAX = 16_384; // jetons de sortie par appel, au plus (le Worker en demande 8 000)
const ENTREPRISE = Deno.env.get('ATELIER_ENTREPRISE') || '44bb201b-6787-4de0-8f7f-f9145d5c03e7';

const env = (nom: string) => (Deno.env.get(nom) || '').trim() || undefined;

// Les mêmes adresses que atelier/src/moteur.js (Gemini par son point
// d'entrée compatible OpenAI).
const FOURNISSEURS: Record<string, { url: string; cle: () => string | undefined }> = {
  ds: { url: 'https://api.deepseek.com/chat/completions', cle: () => env('DEEPSEEK_API_KEY') },
  km: { url: 'https://api.moonshot.ai/v1/chat/completions', cle: () => env('KIMI_API_KEY') },
  gm: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', cle: () => env('GEMINI_API_KEY') },
  oa: { url: 'https://api.openai.com/v1/chat/completions', cle: () => cleOpenAI() },
  an: { url: 'https://api.anthropic.com/v1/messages', cle: () => env('ANTHROPIC_API_KEY') },
};

// Les identifiants du Worker, à l'identique (atelier/src/moteur.js, MODELES).
const MODELES = ['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'gm:gemini-3.5-flash', 'gm:gemini-2.5-flash', 'gm:gemini-3.1-pro-preview', 'oa:gpt-6-astra', 'oa:gpt-6-sol', 'oa:gpt-5.4-mini', 'an:claude-sonnet-5'];

const disponibles = () => MODELES.filter((m) => !!FOURNISSEURS[m.split(':')[0]]?.cle());

// Seuls ces champs de la requête passent au fournisseur : pas de « n »
// (plusieurs réponses facturées), pas de « stream », pas de « store », pas
// d'outils payants cachés. Le modèle, lui, vient de la liste ci-dessus.
const CHAMPS = ['messages', 'tools', 'tool_choice', 'max_tokens', 'max_completion_tokens', 'temperature', 'top_p', 'thinking', 'reasoning_effort', 'response_format', 'parallel_tool_calls', 'stop', 'seed'];

// Ce que le relais répond LUI-MÊME (refus, erreurs) porte « refus » ; ce que
// le fournisseur a répondu porte « fournisseur ». Le Worker distingue ainsi
// un 401 de la porte (jeton expiré) d'un 401 du fournisseur (clé refusée).
const repondre = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), {
  status: statut,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'x-atelier-relais': 'refus' },
});

// Un message d'erreur de fournisseur peut citer la clé (OpenAI en montre le
// début et la fin quand elle est refusée) : on masque tout ce qui y ressemble.
function masquer(texte: string, cle: string): string {
  let t = cle ? texte.split(cle).join('[clé masquée]') : texte;
  t = t.replace(/sk-[A-Za-z0-9_\-*.]{4,}/g, '[clé masquée]').replace(/AIza[0-9A-Za-z_\-]{10,}/g, '[clé masquée]');
  return t;
}

// ——— La porte ———
type Personne = { id: string; client: ReturnType<typeof createClient> };
const cacheAcces = new Map<string, { id: string; autorise: boolean; expire: number }>();

// L'échéance du jeton (champ « exp », en secondes), lue sans le vérifier :
// la vérification, c'est getUser() plus bas. Elle sert à ne pas garder en
// cache une autorisation au-delà de la vie du jeton (une heure).
function echeance(jeton: string): number | null {
  try {
    const partie = jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = Number(JSON.parse(atob(partie + '='.repeat((4 - (partie.length % 4)) % 4))).exp);
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

async function verifier(auth: string): Promise<{ personne?: Personne; statut?: number; erreur?: string }> {
  const jeton = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jeton) return { statut: 401, erreur: 'Connecte-toi à Léo.' };
  const fin = echeance(jeton);
  if (fin != null && fin <= Date.now()) return { statut: 401, erreur: 'Ta connexion à Léo a expiré : reconnecte-toi.' };
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: `Bearer ${jeton}` } }, auth: { persistSession: false } });
  const deja = cacheAcces.get(jeton);
  if (deja && deja.expire > Date.now()) {
    return deja.autorise ? { personne: { id: deja.id, client } } : { statut: 403, erreur: 'L\'atelier est réservé pour l\'instant.' };
  }
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { statut: 401, erreur: 'Ta connexion à Léo a expiré : reconnecte-toi.' };
  const liste = String(Deno.env.get('ATELIER_UTILISATEURS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  let autorise = liste.includes(user.id);
  if (!autorise) {
    const { data } = await client.from('legion_membres').select('role').eq('entreprise_id', ENTREPRISE).eq('user_id', user.id);
    autorise = Array.isArray(data) && data.some((l: { role: string }) => l.role === 'proprietaire');
  }
  cacheAcces.set(jeton, { id: user.id, autorise, expire: Math.min(Date.now() + 5 * 60_000, fin ?? Infinity) });
  if (cacheAcces.size > 200) cacheAcces.delete(cacheAcces.keys().next().value!);
  return autorise ? { personne: { id: user.id, client } } : { statut: 403, erreur: 'L\'atelier est réservé pour l\'instant.' };
}

// ——— Le plafond du jour ———
// La dépense de l'atelier depuis minuit (UTC) pour CETTE personne : les
// règles d'accès de atelier_couts ne lui montrent que ses projets. Si la
// table n'existe pas encore (migration 0200 pas appliquée), il n'y a rien
// à compter : le plafond dur de chaque session reste la protection.
const plafondJour = () => {
  const n = Number(Deno.env.get('ATELIER_PLAFOND_JOUR_USD'));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

async function depenseDuJour(p: Personne): Promise<number | null> {
  const debut = new Date();
  debut.setUTCHours(0, 0, 0, 0);
  // Par pages de 1 000 lignes (le plafond de lignes de l'API Supabase) :
  // une seule requête sous-compterait une grosse journée.
  let total = 0;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await p.client.from('atelier_couts').select('cout_usd').gte('quand', debut.toISOString()).order('id').range(page * 1000, page * 1000 + 999);
    if (error) {
      console.warn(`atelier-modele : dépense du jour illisible (${error.message}) — seul le plafond de session protège.`);
      return null;
    }
    total += (data || []).reduce((t: number, l: { cout_usd: number | string }) => t + Number(l.cout_usd || 0), 0);
    if ((data || []).length < 1000) break;
  }
  return total;
}

// ——— L'appel ———
async function appeler(p: Personne, modele: string, corps: Record<string, unknown>): Promise<Response> {
  if (!MODELES.includes(modele)) return repondre({ erreur: `modèle inconnu : ${modele}`, code: 'modele' }, 400);
  const [prefixe, nom] = modele.split(/:(.+)/);
  const f = FOURNISSEURS[prefixe];
  const cle = f?.cle();
  if (!cle) return repondre({ erreur: `${modele} : pas de clé dans Supabase`, code: 'cle' }, 400);
  if (!corps || typeof corps !== 'object' || !Array.isArray(corps.messages)) return repondre({ erreur: 'corps invalide (messages manquants)', code: 'corps' }, 400);

  const depense = await depenseDuJour(p);
  const plafond = plafondJour();
  if (depense != null && depense >= plafond) {
    return repondre({ erreur: `Plafond du jour de l'atelier atteint (${depense.toFixed(2)} $ sur ${plafond} $) : reprends demain.`, code: 'plafond_jour' }, 429);
  }

  const envoi: Record<string, unknown> = { model: nom };
  for (const c of CHAMPS) if (corps[c] !== undefined) envoi[c] = corps[c];
  for (const c of ['max_tokens', 'max_completion_tokens']) {
    if (envoi[c] !== undefined) envoi[c] = Math.min(SORTIE_MAX, Math.max(1, Number(envoi[c]) || SORTIE_MAX));
  }

  const debut = Date.now();
  const anthropic = prefixe === 'an';
  let r: Response;
  try {
    r = await fetch(f.url, {
      method: 'POST',
      headers: anthropic
        ? { 'Content-Type': 'application/json', 'x-api-key': cle, 'anthropic-version': '2023-06-01' }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
      body: JSON.stringify(anthropic ? versAnthropic(envoi, nom) : envoi),
      signal: AbortSignal.timeout(DELAI_MS),
    });
  } catch (e) {
    const delai = (e as Error)?.name === 'TimeoutError';
    console.warn(`atelier-modele : ${p.id.slice(0, 8)} ${modele} → ${delai ? 'délai dépassé' : 'réseau'} (${Date.now() - debut} ms)`);
    return repondre({ erreur: delai ? `${modele} : pas de réponse en ${DELAI_MS / 1000} s` : `${modele} : fournisseur injoignable`, code: 'reseau' }, delai ? 504 : 502);
  }
  console.log(`atelier-modele : ${p.id.slice(0, 8)} ${modele} → ${r.status} (${Date.now() - debut} ms)`);

  const entetes = { 'Content-Type': r.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store', 'x-atelier-relais': 'fournisseur' };
  if (!r.ok) {
    // Le statut et le texte du fournisseur, tels quels — clé masquée.
    return new Response(masquer(await r.text().catch(() => ''), cle), { status: r.status, headers: entetes });
  }
  if (anthropic) {
    const donnees = await r.json().catch(() => null);
    if (!donnees) return new Response(JSON.stringify({ error: { message: 'réponse illisible' } }), { status: 502, headers: entetes });
    return new Response(JSON.stringify(depuisAnthropic(donnees)), { status: 200, headers: { ...entetes, 'Content-Type': 'application/json' } });
  }
  // Une réponse réussie passe sans être relue : rien à y masquer, et aucune
  // copie en mémoire (le délai de 120 s vaut aussi pour sa lecture).
  return new Response(r.body, { status: r.status, headers: entetes });
}

Deno.serve(async (req: Request) => {
  // Pas de CORS : jamais appelé depuis une page.
  if (req.headers.get('Origin')) return repondre({ erreur: 'réservé au serveur de l\'atelier' }, 403);
  if (req.method !== 'GET' && req.method !== 'POST') return repondre({ erreur: 'méthode non permise' }, 405);

  const annoncee = Number(req.headers.get('Content-Length') || 0);
  if (annoncee > TAILLE_MAX) return repondre({ erreur: 'requête trop grande', code: 'taille' }, 413);

  const acces = await verifier(req.headers.get('Authorization') || '').catch((e) => {
    console.error(`atelier-modele : porte (${(e as Error).message})`);
    return { statut: 500, erreur: 'vérification impossible' } as { personne?: Personne; statut?: number; erreur?: string };
  });
  if (!acces.personne) return repondre({ erreur: acces.erreur, code: acces.statut === 401 ? 'jeton' : 'acces' }, acces.statut || 401);

  if (req.method === 'GET') return repondre({ modeles: disponibles() });

  const texte = await req.text();
  if (new TextEncoder().encode(texte).length > TAILLE_MAX) return repondre({ erreur: 'requête trop grande', code: 'taille' }, 413);
  let demande: { action?: string; modele?: string; corps?: Record<string, unknown> } = {};
  try { demande = JSON.parse(texte || '{}'); } catch { return repondre({ erreur: 'JSON invalide' }, 400); }

  if (!demande.action || demande.action === 'modeles') return repondre({ modeles: disponibles() });
  if (demande.action === 'appel') return appeler(acces.personne, String(demande.modele || ''), demande.corps || {});
  return repondre({ erreur: 'action inconnue' }, 400);
});
