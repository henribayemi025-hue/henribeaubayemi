// Finou Chou — assistante IA de Finjaro (texte + vision + OUTILS).
//
// v2: Finou ne se contente plus de parler, elle interroge vraiment la base.
// Gemini reçoit une liste d'outils (function calling) et décide lui-même quand
// les appeler: chercher un produit, lire les commandes de l'utilisateur, sortir
// les stats du vendeur, trouver une boutique… La réponse est donc fondée sur de
// VRAIES lignes de la base, plus sur ce que le modèle imagine.
//
// SÉCURITÉ — deux points essentiels:
//   1. Quota anti-abus obligatoire. La fonction restait ouverte à tous sans
//      aucune limite: n'importe qui pouvait la marteler et brûler le budget
//      Gemini de Finjaro. Les visiteurs non connectés gardent l'accès (Finou
//      est un levier de conversion sur la page d'accueil) mais avec un quota
//      par IP nettement plus serré que celui des comptes.
//   2. Tous les outils s'exécutent avec le client porteur du JWT de
//      l'utilisateur, jamais avec la service_role. Les RLS s'appliquent donc
//      telles quelles: même si le modèle demandait les commandes d'un autre
//      compte, Postgres ne les renverrait pas. Finou ne peut pas fuiter ce que
//      l'utilisateur n'a pas le droit de voir. Les outils personnels sont en
//      plus refusés d'emblée aux invités.
//
// Budget safety net: finou-chat et miroir-ia partagent une clé Gemini. Chaque
// appel réussi journalise un coût ESTIMÉ dans public.ai_usage, et la fonction
// refuse d'appeler Gemini une fois BUDGET_EUR atteint sur le mois.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// 2.5-flash en tête: c'est le seul des deux à répondre de façon fiable en ce
// moment (3.5-flash renvoie régulièrement 503 "high demand"), et il gère
// parfaitement l'appel d'outils. 3.5 sert de secours.
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const BUDGET_EUR = 20;
const FINOU_CALL_COST_EUR = 0.0008;
const ADMIN_USER_ID = 'bffb724f-6652-4240-a6f7-6904369a1fd4';
const GEMINI_TIMEOUT_MS = 30_000;
const MAX_TOOL_ROUNDS = 4; // garde-fou: pas de boucle d'outils infinie

const CATEGORIES = [
  'mode', 'chaussures', 'sacs', 'bijoux', 'montres', 'parfums', 'beaute',
  'cheveux', 'deco', 'mariages', 'evenement', 'mannequinerie', 'art', 'accessoires',
];

// Voir miroir-ia: on teste le HÔTE, pas une liste figée d'URL. Le domaine de
// production est finjaro.net, pas le sous-domaine Netlify.
const PROD_HOST = 'finjaro.net';
const NETLIFY_HOST = 'finjaro.netlify.app';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host === NETLIFY_HOST || host.endsWith(`--${NETLIFY_HOST}`)) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const SYSTEM_PROMPT = `Tu es Finou Chou, l'assistante IA de Finjaro, une marketplace de
beauté, mode, parfums et décoration d'événement pour l'Afrique et sa diaspora, ouverte
à l'international. Slogan: "Au-delà des rêves". Tu es chaleureuse, concise et utile.

RÈGLE LA PLUS IMPORTANTE: tu es une assistante généraliste, pas un robot limité au
shopping. Réponds VRAIMENT à toute question (calcul, culture générale, conseil,
question personnelle, blague...), même sans rapport avec Finjaro. Ne te contente
JAMAIS de te re-présenter en guise de réponse: tu t'es déjà présentée au début.

TES OUTILS — utilise-les, ne devine jamais:
- Question sur des articles, des prix, "trouve-moi…", "combien coûte…", "qu'est-ce
  que vous avez en…" -> appelle search_products. Ne cite JAMAIS un prix ou un stock
  de mémoire: ils viennent de l'outil ou tu n'en parles pas.
- "Qu'est-ce qui marche en ce moment", "les tendances", "le plus populaire" ->
  get_trending_products.
- "Où en est ma commande", "mes achats", "j'ai commandé quoi" -> get_my_orders.
- "Mes ventes", "mon chiffre d'affaires", "combien j'ai gagné" -> get_my_shop_stats.
- "Quelles boutiques", "y a-t-il des vendeurs à/en…" -> find_shops.
- "Ajoute ça au panier", "je le prends", "mets-en 2" à propos d'un article que
  TOI (Finou) venez de montrer via search_products/get_trending_products dans
  CETTE conversation -> add_to_cart avec son id exact. N'appelle JAMAIS cet
  outil sans confirmation claire de l'utilisateur, et jamais pour un article
  dont tu n'as pas déjà l'id réel (cherche-le d'abord si besoin).
Tu peux enchaîner plusieurs outils avant de répondre. Si un outil ne renvoie rien,
dis-le franchement et propose une alternative — n'invente aucun produit.

Quand tu cites des produits, donne le nom et le prix exactement tels que l'outil les
a renvoyés, au maximum 3 ou 4, en une courte liste.

Tu as une vraie mémoire de cette conversation — utilise-la, ne redemande pas une
info déjà donnée.

Si le [Contexte écran] contient "shopUrl", c'est le VRAI lien de la boutique du
vendeur connecté: donne-le tel quel si on te le demande, et termine par
"ACTION: share_shop".

Style: réponds dans la langue de l'utilisateur (français ou anglais), 2-5 phrases,
ton amical, un emoji max.

Balises de fin de réponse (au plus UNE, en dernière ligne, sinon aucune):
- Catégorie Finjaro clairement identifiée parmi: mode, chaussures, sacs, bijoux,
  montres, parfums, beaute, cheveux, deco, mariages, evenement, mannequinerie, art,
  accessoires — termine par "CAT: <id>".
- Intention de se connecter/créer un compte — "ACTION: login".
- Intention de vendre/devenir vendeur — "ACTION: sell".
- Demande du lien de sa boutique (shopUrl présent) — "ACTION: share_shop".
- Intention de supprimer un de ses articles — "ACTION: delete_product". Ne demande
  jamais toi-même lequel: le choix se fait ensuite dans une liste réelle.
Dans tous les autres cas, n'ajoute aucune de ces lignes.`;

// ---------------------------------------------------------------------------
// Outils exposés à Gemini. Déclarations + implémentations.
// Toutes les requêtes passent par le client de l'UTILISATEUR (RLS actives).
// ---------------------------------------------------------------------------
const TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      "Cherche des articles réellement en vente sur Finjaro. À utiliser dès qu'on parle d'un article, d'un prix ou d'une disponibilité.",
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: "Mots-clés, ex: 'robe rouge', 'parfum homme'" },
        category: { type: 'STRING', description: `Une de: ${CATEGORIES.join(', ')}` },
        max_price_fcfa: { type: 'NUMBER', description: 'Prix maximum en FCFA' },
      },
    },
  },
  {
    name: 'get_trending_products',
    description: 'Les articles les plus populaires du moment (vues et likes).',
    parameters: {
      type: 'OBJECT',
      properties: { category: { type: 'STRING', description: 'Filtre catégorie optionnel' } },
    },
  },
  {
    name: 'get_my_orders',
    description: "Les commandes de l'utilisateur connecté, avec leur statut. Pour 'où en est ma commande'.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_my_shop_stats',
    description:
      "Chiffres de vente réels de la boutique de l'utilisateur s'il est vendeur: commandes et revenu sur 7 et 30 jours.",
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'find_shops',
    description: 'Cherche des boutiques Finjaro par nom, ville ou pays.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Nom ou partie du nom de la boutique' },
        city: { type: 'STRING' },
        country: { type: 'STRING', description: 'Code pays ISO, ex: CM, FR' },
      },
    },
  },
  {
    name: 'add_to_cart',
    description:
      "Ajoute au panier un article que l'utilisateur vient d'accepter explicitement. Ne l'appelle jamais de ta propre initiative ni sans l'id réel d'un article déjà trouvé.",
    parameters: {
      type: 'OBJECT',
      properties: {
        product_id: { type: 'STRING', description: "L'id exact renvoyé par search_products/get_trending_products" },
        qty: { type: 'NUMBER', description: 'Quantité, 1 par défaut' },
      },
      required: ['product_id'],
    },
  },
];

// Catégories vendues sur devis: pas de prix ferme, donc rien à mettre au
// panier — l'acheteur doit contacter la boutique. Doit rester aligné avec
// QUOTE_ONLY_CATEGORIES côté client (src/lib/categories.js).
const QUOTE_ONLY = ['mariages', 'evenement', 'mannequinerie'];

type Json = Record<string, unknown>;

async function runTool(name: string, args: Json, db: SupabaseClient, userId: string | null): Promise<Json> {
  // Outils personnels: sans compte, on le dit au modèle au lieu de deviner.
  if (!userId && (name === 'get_my_orders' || name === 'get_my_shop_stats')) {
    return { signed_in: false, message: "L'utilisateur n'est pas connecté: invite-le à se connecter pour voir ces informations." };
  }
  switch (name) {
    case 'search_products': {
      let q = db
        .from('products')
        .select('id,name,price_fcfa,category,stock,shops(name,slug)')
        .eq('is_active', true)
        .limit(6);
      if (typeof args.query === 'string' && args.query.trim()) {
        q = q.ilike('name', `%${args.query.trim()}%`);
      }
      if (typeof args.category === 'string' && CATEGORIES.includes(args.category)) {
        q = q.eq('category', args.category);
      }
      if (typeof args.max_price_fcfa === 'number') {
        q = q.lte('price_fcfa', args.max_price_fcfa);
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return {
        count: data?.length ?? 0,
        products: (data ?? []).map((p: Json) => ({
          id: p.id,
          nom: p.name,
          prix_fcfa: p.price_fcfa,
          categorie: p.category,
          en_stock: (p.stock as number) > 0,
          boutique: (p.shops as Json | null)?.name ?? null,
        })),
      };
    }

    case 'get_trending_products': {
      let q = db
        .from('products')
        .select('id,name,price_fcfa,category,views,shops(name)')
        .eq('is_active', true)
        .order('views', { ascending: false })
        .limit(5);
      if (typeof args.category === 'string' && CATEGORIES.includes(args.category)) {
        q = q.eq('category', args.category);
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return {
        count: data?.length ?? 0,
        products: (data ?? []).map((p: Json) => ({
          nom: p.name, prix_fcfa: p.price_fcfa, categorie: p.category, boutique: (p.shops as Json | null)?.name ?? null,
        })),
      };
    }

    case 'get_my_orders': {
      // RLS: ne renvoie que les commandes dont l'utilisateur est l'acheteur.
      const { data, error } = await db
        .from('orders')
        .select('order_no,status,total_fcfa,created_at,delivery_method,shops(name)')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) return { error: error.message };
      return {
        count: data?.length ?? 0,
        commandes: (data ?? []).map((o: Json) => ({
          numero: o.order_no,
          statut: o.status,
          total_fcfa: o.total_fcfa,
          mode: o.delivery_method,
          boutique: (o.shops as Json | null)?.name ?? null,
          date: o.created_at,
        })),
      };
    }

    case 'get_my_shop_stats': {
      const { data: shop } = await db
        .from('shops')
        .select('id,name')
        .eq('owner_id', userId)
        .maybeSingle();
      if (!shop) return { is_vendor: false, message: "Cet utilisateur n'a pas de boutique." };

      const now = Date.now();
      const d7 = new Date(now - 7 * 864e5).toISOString();
      const d30 = new Date(now - 30 * 864e5).toISOString();
      const { data: orders, error } = await db
        .from('orders')
        .select('total_fcfa,created_at,status')
        .eq('shop_id', shop.id)
        .gte('created_at', d30);
      if (error) return { error: error.message };

      const sum = (rows: Array<{ total_fcfa: number }>) =>
        rows.reduce((s, r) => s + Number(r.total_fcfa || 0), 0);
      const last7 = (orders ?? []).filter((o: Json) => (o.created_at as string) >= d7);
      return {
        is_vendor: true,
        boutique: shop.name,
        commandes_7j: last7.length,
        revenu_7j_fcfa: sum(last7 as Array<{ total_fcfa: number }>),
        commandes_30j: orders?.length ?? 0,
        revenu_30j_fcfa: sum((orders ?? []) as Array<{ total_fcfa: number }>),
      };
    }

    case 'find_shops': {
      let q = db
        .from('shops')
        .select('name,slug,city,country,rating,is_verified')
        .eq('status', 'active')
        .limit(6);
      if (typeof args.query === 'string' && args.query.trim()) q = q.ilike('name', `%${args.query.trim()}%`);
      if (typeof args.city === 'string' && args.city.trim()) q = q.ilike('city', `%${args.city.trim()}%`);
      if (typeof args.country === 'string' && args.country.trim()) q = q.eq('country', args.country.trim().toUpperCase());
      const { data, error } = await q;
      if (error) return { error: error.message };
      return {
        count: data?.length ?? 0,
        boutiques: (data ?? []).map((s: Json) => ({
          nom: s.name, ville: s.city, pays: s.country, note: s.rating, verifiee: s.is_verified,
        })),
      };
    }

    default:
      return { error: `outil inconnu: ${name}` };
  }
}

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

function monthStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function isOverBudget(sb: SupabaseClient): Promise<boolean> {
  const { data } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
  const total = (data ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
  if (total < BUDGET_EUR) return false;

  const monthKey = monthStartIso().slice(0, 7);
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'ai_budget_alert_sent').maybeSingle();
  if (cfg?.value !== monthKey) {
    sb.from('app_config').upsert({ key: 'ai_budget_alert_sent', value: monthKey, updated_at: new Date().toISOString() }).then(() => {}, () => {});
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        user_id: ADMIN_USER_ID,
        title: 'Finjaro — budget IA atteint',
        body: `Finou Chou et Miroir AI sont en pause ce mois-ci (limite ${BUDGET_EUR}€ atteinte).`,
      }),
    }).catch(() => {});
  }
  return true;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

    // Les invités gardent l'accès à Finou (conversion), avec un quota serré.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();

    const { message, image, context, history } = await req.json();
    if ((!message || typeof message !== 'string') && !image) {
      return json({ error: 'invalid_message' }, 400);
    }

    const sb = admin();

    // Anti-abus: 20 messages / 5 min par compte, 6 / 5 min par IP anonyme.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: user ? `finou:u:${user.id}` : `finou:ip:${ip}`,
      p_limit: user ? 20 : 6,
      p_window_seconds: 300,
    });
    if (allowed === false) {
      return json({ reply: "Tu vas un peu vite pour moi 😅 Laisse-moi souffler une minute et reviens !", category: null, action: null });
    }

    if (await isOverBudget(sb)) {
      return json({
        reply: "Je fais une petite pause ce mois-ci pour rester dans le budget de Finjaro 🙏 Reviens un peu plus tard, ou parcours les boutiques en attendant !",
        category: null,
        action: null,
      });
    }

    const ctxLine = context && typeof context === 'object'
      ? `\n[Contexte écran: ${JSON.stringify(context).slice(0, 800)}]`
      : '';

    const userParts: Array<Json> = [{ text: (message || 'Aide-moi avec cette image.') + ctxLine }];
    if (typeof image === 'string' && image.startsWith('data:')) {
      const match = image.match(/^data:(.+?);base64,(.*)$/);
      if (match) userParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
    }

    const contents: Array<Json> = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        if (!turn?.text || typeof turn.text !== 'string') continue;
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text.slice(0, 1000) }],
        });
      }
    }
    contents.push({ role: 'user', parts: userParts });

    async function callGemini(model: string) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          }),
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        }
      );
      return { ok: resp.ok, status: resp.status, body: await resp.json() };
    }

    // Boucle d'outils: Gemini peut demander des données, on les lui renvoie,
    // il reformule. MAX_TOOL_ROUNDS empêche toute boucle sans fin.
    //
    // Le modèle est COLLANT sur toute la conversation. Changer de modèle entre
    // deux tours faisait échouer le second: les `thoughtSignature` attachées
    // aux parts d'un modèle sont rejetées par un autre, et la boucle rendait
    // alors le texte du premier tour ("je regarde ça pour vous") sans jamais
    // exploiter le résultat de l'outil.
    let data: Json | null = null;
    let calls = 0;
    let pinnedModel: string | null = null;

    outer:
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let res: Awaited<ReturnType<typeof callGemini>> | null = null;
      const candidates = pinnedModel ? [pinnedModel] : MODELS;

      for (const model of candidates) {
        calls++;
        try {
          const r = await callGemini(model);
          if (r.ok) { res = r; pinnedModel = model; break; }
          console.error('finou-chat: gemini error', model, r.status, JSON.stringify(r.body).slice(0, 300));
          if (r.status < 500 && r.status !== 429) break; // erreur définitive
        } catch (e) {
          console.error('finou-chat: gemini call failed', model, e);
        }
      }
      if (!res?.ok) break;

      data = res.body as Json;
      const parts = (data?.candidates as Array<Json> | undefined)?.[0]?.content?.parts as Array<Json> | undefined;
      const fnCalls = (parts ?? []).filter((p) => p.functionCall || p.function_call);
      if (fnCalls.length === 0) break outer; // réponse finale en texte

      // Rejouer le tour du modèle puis lui renvoyer les résultats d'outils.
      contents.push({ role: 'model', parts });
      const responseParts: Array<Json> = [];
      for (const p of fnCalls) {
        const fc = (p.functionCall ?? p.function_call) as { name: string; args?: Json };
        const result = await runTool(fc.name, fc.args ?? {}, userClient, user?.id ?? null);
        responseParts.push({ functionResponse: { name: fc.name, response: result } });
      }
      contents.push({ role: 'user', parts: responseParts });
    }

    sb.from('ai_usage').insert({ fn: 'finou_chat', cost_eur: FINOU_CALL_COST_EUR * Math.max(calls, 1) }).then(() => {}, () => {});

    let reply =
      ((data?.candidates as Array<Json> | undefined)?.[0]?.content?.parts as Array<Json> | undefined)
        ?.map((p) => (p.text as string) ?? '')
        .join('')
        .trim() || "Je n'ai pas bien compris, peux-tu reformuler ? 💫";

    let category: string | null = null;
    let action: 'login' | 'sell' | 'share_shop' | 'delete_product' | null = null;
    const catMatch = reply.match(/CAT:\s*([a-z]+)\s*$/i);
    if (catMatch && CATEGORIES.includes(catMatch[1].toLowerCase())) {
      category = catMatch[1].toLowerCase();
      reply = reply.replace(/\n?CAT:\s*[a-z]+\s*$/i, '').trim();
    }
    const actionMatch = reply.match(/ACTION:\s*(login|sell|share_shop|delete_product)\s*$/i);
    if (actionMatch) {
      action = actionMatch[1].toLowerCase() as typeof action;
      reply = reply.replace(/\n?ACTION:\s*(login|sell|share_shop|delete_product)\s*$/i, '').trim();
    }

    return json({ reply, category, action });
  } catch (err) {
    console.error('finou-chat exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
