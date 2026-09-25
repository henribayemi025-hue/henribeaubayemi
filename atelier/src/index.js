// finjaro-atelier — le Worker de l'Atelier de code de Léo (V0).
//
// SÉPARÉ du site : son propre nom, son propre wrangler.jsonc, son propre
// dossier. Le déployer ne touche pas finjaro.net.
//
// Trois pièces :
// 1. Ce point d'entrée : origines permises (CORS), vérification de la
//    session Supabase, accès réservé (V0 : Beau), puis passage au Durable
//    Object de la personne.
// 2. `Atelier` (atelier.js) : les projets, la boucle de l'agent, le journal.
// 3. `AtelierSandbox` : le bac à sable Cloudflare (Sandbox SDK
//    @cloudflare/sandbox 0.12.10), un par projet, SANS AUCUNE CLÉ, réseau
//    fermé sauf npm, PyPI et GitHub, en lecture seulement.
//
// Les clés des modèles (DEEPSEEK_API_KEY, KIMI_API_KEY, GEMINI_API_KEY) peuvent
// être des secrets de CE Worker : il appelle alors les modèles lui-même.
// Depuis le 24/09 au soir, il n'en a plus besoin : pour tout modèle dont la
// clé manque ici, il passe par la fonction Supabase `atelier-modele`, qui
// détient déjà les clés de Léo, avec le jeton Supabase de la personne
// (moteur.js). Le bac à sable ne reçoit jamais ni clé ni jeton (le SDK ne
// transmet au conteneur que les variables qu'on lui donne explicitement —
// ici aucune).

import { Sandbox, ContainerProxy } from '@cloudflare/sandbox';
import { identifier } from './supabase.js';
import { disponibles, modelesRelais } from './moteur.js';
import { plafondSession } from './atelier.js';
import { HOTES_PERMIS, sortiePermise } from './politique.js';
import { voirEcran } from './ecran.js';

export { Atelier } from './atelier.js';
// Nécessaire pour que le filtrage du réseau sortant fonctionne (doc
// « Outbound traffic » du Sandbox SDK).
export { ContainerProxy };

export class AtelierSandbox extends Sandbox {
  // Internet fermé par défaut ; seuls les domaines de la liste passent.
  enableInternet = false;
  allowedHosts = HOTES_PERMIS;
}

// Lecture seulement, même vers les domaines permis (politique.js, sortiePermise).
AtelierSandbox.outbound = async (request) => {
  if (!sortiePermise(request.method, request.url)) {
    return new Response('Atelier : seule la lecture est permise (npm, PyPI, GitHub).', { status: 403 });
  }
  return fetch(request);
};

async function jetonTravailValide(env, cle) {
  if (!/^[0-9a-f]{32,128}$/i.test(cle)) return false;
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/legion_jeton_travail_valide`, {
    method: 'POST', headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_jeton: cle }),
  }).catch(() => null);
  return !!r?.ok && (await r.json().catch(() => false)) === true;
}

function origines(env) {
  return String(env.ATELIER_ORIGINES || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function cors(request, env) {
  const origine = request.headers.get('Origin');
  if (!origine || !origines(env).includes(origine)) return {};
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function avec(reponse, entetes) {
  const r = new Response(reponse.body, reponse);
  for (const [k, v] of Object.entries(entetes)) r.headers.set(k, v);
  r.headers.set('X-Content-Type-Options', 'nosniff');
  r.headers.set('Cache-Control', 'no-store');
  return r;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const entetes = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: entetes['Access-Control-Allow-Origin'] ? 204 : 403, headers: entetes });

    if (url.pathname === '/' || url.pathname === '/sante') {
      return avec(new Response('Atelier de Léo : en service.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }), entetes);
    }
    if (!url.pathname.startsWith('/api/')) return avec(new Response('introuvable', { status: 404 }), entetes);

    // Une page d'un autre site ne peut pas piloter l'atelier.
    const origine = request.headers.get('Origin');
    if (origine && !entetes['Access-Control-Allow-Origin']) return avec(Response.json({ erreur: 'origine non permise' }, { status: 403 }), {});

    // « voir_ecran » des agents de Léo (ecran.js) : appelé par les fonctions
    // Supabase avec le jeton du travail des agents, vérifié par la base.
    if (url.pathname === '/api/ecran' && request.method === 'POST') {
      const cle = request.headers.get('x-finjaro-token') || '';
      if (!(await jetonTravailValide(env, cle))) return avec(Response.json({ erreur: 'non autorisé' }, { status: 401 }), entetes);
      const corps = await request.json().catch(() => ({}));
      const r = await voirEcran(env, corps.url, corps.largeur).catch((e) => ({ erreur: `navigateur : ${e.message}` }));
      return avec(Response.json(r, { status: r.erreur ? 422 : 200 }), entetes);
    }

    const jeton = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const qui = await identifier(env, jeton).catch(() => null);
    if (!qui) return avec(Response.json({ erreur: 'Connecte-toi à Léo.' }, { status: 401 }), entetes);
    if (!qui.autorise) return avec(Response.json({ erreur: 'L\'atelier est réservé pour l\'instant.' }, { status: 403 }), entetes);

    if (url.pathname === '/api/moi') {
      // Les modèles du Worker ET ceux du relais Supabase (clés de Léo).
      const relais = await modelesRelais(env, jeton);
      return avec(Response.json({ user: qui.user, modeles: disponibles(env, { relais }), plafond_session_usd: plafondSession(env), taille: env.ATELIER_TAILLE || 'standard-1' }), entetes);
    }

    const stub = env.ATELIER.get(env.ATELIER.idFromName(qui.user.id));
    const transmis = new Request(request.url, {
      method: request.method,
      headers: { 'Content-Type': 'application/json', 'x-atelier-user': qui.user.id, 'x-atelier-jeton': jeton },
      body: ['POST', 'PUT'].includes(request.method) ? await request.text() : undefined,
    });
    return avec(await stub.fetch(transmis), entetes);
  },
};
