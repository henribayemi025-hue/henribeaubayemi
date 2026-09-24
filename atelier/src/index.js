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
// Les clés des modèles (DEEPSEEK_API_KEY, KIMI_API_KEY, GEMINI_API_KEY) sont
// des secrets de CE Worker : il appelle les modèles lui-même. Le bac à sable
// ne les reçoit jamais (le SDK ne transmet au conteneur que les variables
// qu'on lui donne explicitement — ici aucune).

import { Sandbox, ContainerProxy } from '@cloudflare/sandbox';
import { identifier } from './supabase.js';
import { disponibles } from './moteur.js';
import { plafondSession } from './atelier.js';
import { HOTES_PERMIS, sortiePermise } from './politique.js';

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

    const jeton = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const qui = await identifier(env, jeton).catch(() => null);
    if (!qui) return avec(Response.json({ erreur: 'Connecte-toi à Léo.' }, { status: 401 }), entetes);
    if (!qui.autorise) return avec(Response.json({ erreur: 'L\'atelier est réservé pour l\'instant.' }, { status: 403 }), entetes);

    if (url.pathname === '/api/moi') {
      return avec(Response.json({ user: qui.user, modeles: disponibles(env), plafond_session_usd: plafondSession(env), taille: env.ATELIER_TAILLE || 'standard-1' }), entetes);
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
