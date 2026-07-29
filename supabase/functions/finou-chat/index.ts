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
  dont tu n'as pas déjà l'id réel (cherche-le d'abord si besoin). NE DIS JAMAIS
  "ajouté"/"c'est fait" sans avoir réellement appelé add_to_cart et reçu
  added:true — si le résultat dit added:false, explique la vraie raison
  (message du résultat) au lieu d'affirmer un succès.
- "Demande-lui si...", "écris à la boutique", "est-ce dispo en taille M ?",
  "demande un devis" -> message_shop. TOUJOURS en deux temps: d'abord tu
  PROPOSES le texte exact ("Je lui écris : « ... » — je l'envoie ?") et tu
  attends le OK; ensuite seulement tu appelles l'outil. Rédige le message à
  la première personne, comme si l'utilisateur l'écrivait lui-même.
- "Abonne-moi à cette boutique", "suis-la pour moi" -> follow_shop.
- Vendeuse qui décrit un article à mettre en vente ("ajoute une robe wax à
  25000, j'en ai 3") -> create_product. Récapitule d'abord nom, prix,
  catégorie et stock, attends le OK, puis appelle l'outil. Précise ensuite
  que l'article est en BROUILLON: il faut y ajouter des photos et le publier
  depuis « Mes articles » pour qu'il apparaisse dans le catalogue.
Ces trois outils écrivent VRAIMENT dans la base pour le compte de
l'utilisateur: jamais sans son accord explicite dans le tour juste avant, et
ne prétends jamais qu'ils ont réussi si le résultat dit sent/followed/created
= false — donne la vraie raison.
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
  {
    name: 'message_shop',
    description:
      "Écrit un message à une boutique de la part de l'utilisateur (disponibilité, taille, prix, devis pour mariage/événement...). N'appelle cet outil qu'après avoir montré à l'utilisateur le texte exact et obtenu son accord.",
    parameters: {
      type: 'OBJECT',
      properties: {
        shop_id: { type: 'STRING', description: "L'id exact de la boutique, renvoyé par find_shops ou search_products" },
        body: { type: 'STRING', description: "Le message, rédigé à la première personne comme si l'utilisateur l'écrivait" },
        product_id: { type: 'STRING', description: "Id de l'article concerné, si la question porte sur un article précis" },
      },
      required: ['shop_id', 'body'],
    },
  },
  {
    name: 'follow_shop',
    description: "Abonne l'utilisateur à une boutique pour suivre ses nouveautés. Uniquement sur demande explicite.",
    parameters: {
      type: 'OBJECT',
      properties: { shop_id: { type: 'STRING', description: "L'id exact de la boutique" } },
      required: ['shop_id'],
    },
  },
  {
    name: 'create_product',
    description:
      "Crée une fiche article dans la boutique de l'utilisateur vendeur. L'article est créé HORS LIGNE (brouillon): la vendeuse doit ensuite y ajouter des photos et le publier. N'appelle cet outil qu'après avoir récapitulé nom, prix, catégorie et stock, et obtenu l'accord explicite.",
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: "Nom de l'article" },
        price_fcfa: { type: 'NUMBER', description: 'Prix en FCFA' },
        category: { type: 'STRING', description: `Une de: ${CATEGORIES.join(', ')}` },
        description: { type: 'STRING' },
        stock: { type: 'NUMBER', description: 'Quantité disponible, 1 par défaut' },
      },
      required: ['name', 'price_fcfa', 'category'],
    },
  },
];

// Catégories vendues sur devis: pas de prix ferme, donc rien à mettre au
// panier — l'acheteur doit contacter la boutique. Doit rester aligné avec
// QUOTE_ONLY_CATEGORIES côté client (src/lib/categories.js).
const QUOTE_ONLY = ['mariages', 'evenement', 'mannequinerie'];

type Json = Record<string, unknown>;

// Le panier vit côté client (localStorage, voir src/hooks/useCart.jsx) — pas
// de table en base. add_to_cart ne peut donc pas "écrire" côté serveur:
// il VALIDE l'article contre la vraie base (existe, actif, en stock, pas un
// article sur devis) et pousse une ligne prête à l'emploi dans `cartActions`,
// que la réponse finale renvoie au client. FinouChou.jsx applique chaque
// ligne via cart.add(), qui déclenche déjà la mini-fenêtre de confirmation
// globale du panier — aucune UI neuve nécessaire.
async function runTool(
  name: string,
  args: Json,
  db: SupabaseClient,
  userId: string | null,
  cartActions: Json[],
): Promise<Json> {
  // Outils personnels: sans compte, on le dit au modèle au lieu de deviner.
  const NEEDS_AUTH = ['get_my_orders', 'get_my_shop_stats', 'message_shop', 'follow_shop', 'create_product'];
  if (!userId && NEEDS_AUTH.includes(name)) {
    return { signed_in: false, message: "L'utilisateur n'est pas connecté: invite-le à se connecter pour faire ça." };
  }
  switch (name) {
    case 'search_products': {
      let q = db
        .from('products')
        .select('id,name,price_fcfa,category,stock,shop_id,shops(name,slug)')
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
          shop_id: p.shop_id,
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
        .select('id,name,slug,city,country,rating,is_verified')
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
          id: s.id, nom: s.name, ville: s.city, pays: s.country, note: s.rating, verifiee: s.is_verified,
        })),
      };
    }

    case 'add_to_cart': {
      const productId = typeof args.product_id === 'string' ? args.product_id : null;
      if (!productId) return { added: false, message: 'product_id manquant' };
      const qty = typeof args.qty === 'number' && args.qty > 0 ? Math.floor(args.qty) : 1;

      // Revalidé contre la vraie base — jamais confiance dans ce que le
      // modèle affirme sur l'article (nom, prix, disponibilité).
      const { data: p, error } = await db
        .from('products')
        .select('id,name,price_fcfa,images,stock,is_active,category,shop_id,shops(name)')
        .eq('id', productId)
        .maybeSingle();
      if (error) return { added: false, message: error.message };
      if (!p) return { added: false, message: "Cet article n'existe pas (ou plus)." };
      if (!p.is_active) return { added: false, message: "Cet article n'est plus en vente." };
      if (QUOTE_ONLY.includes(p.category as string)) {
        return { added: false, message: "Cet article est sur devis, pas d'ajout direct au panier — invite à contacter la boutique." };
      }
      if (((p.stock as number) ?? 0) < qty) {
        return { added: false, message: `Stock insuffisant (${p.stock} disponible(s)).` };
      }

      cartActions.push({
        id: p.id,
        name: p.name,
        price_fcfa: p.price_fcfa,
        images: p.images ?? [],
        shop_id: p.shop_id,
        shop_name: (p.shops as Json | null)?.name ?? '',
        qty,
      });
      return { added: true, nom: p.name, prix_fcfa: p.price_fcfa, quantite: qty };
    }

    case 'message_shop': {
      const shopId = typeof args.shop_id === 'string' ? args.shop_id : null;
      const body = typeof args.body === 'string' ? args.body.trim() : '';
      if (!shopId) return { sent: false, message: 'shop_id manquant' };
      if (!body) return { sent: false, message: 'message vide' };
      if (body.length > 1000) return { sent: false, message: 'message trop long (1000 caractères max)' };

      const { data: shop } = await db.from('shops').select('id,name,owner_id').eq('id', shopId).maybeSingle();
      if (!shop) return { sent: false, message: "Cette boutique n'existe pas." };
      if (shop.owner_id === userId) {
        return { sent: false, message: "C'est sa propre boutique — on ne s'écrit pas à soi-même." };
      }

      // Réutilise le fil existant s'il y en a un, sinon en ouvre un. Mêmes
      // règles que src/lib/chat.js pour que le fil créé ici soit exactement
      // celui que l'acheteur retrouvera dans sa boîte de réception.
      let conversationId: string;
      const { data: existing } = await db
        .from('conversations')
        .select('id')
        .eq('buyer_id', userId)
        .eq('shop_id', shopId)
        .maybeSingle();
      if (existing) {
        conversationId = existing.id as string;
      } else {
        const productId = typeof args.product_id === 'string' ? args.product_id : null;
        const { data: created, error: convErr } = await db
          .from('conversations')
          .insert({ buyer_id: userId, shop_id: shopId, product_id: productId })
          .select('id')
          .single();
        if (convErr) return { sent: false, message: convErr.message };
        conversationId = created.id as string;
      }

      const { error: msgErr } = await db.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: 'buyer',
        body,
      });
      if (msgErr) return { sent: false, message: msgErr.message };

      await db
        .from('conversations')
        .update({ last_message: body, last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { sent: true, boutique: shop.name, conversation_id: conversationId, message_envoye: body };
    }

    case 'follow_shop': {
      const shopId = typeof args.shop_id === 'string' ? args.shop_id : null;
      if (!shopId) return { followed: false, message: 'shop_id manquant' };
      const { data: shop } = await db.from('shops').select('id,name').eq('id', shopId).maybeSingle();
      if (!shop) return { followed: false, message: "Cette boutique n'existe pas." };

      const { data: already } = await db
        .from('shop_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('shop_id', shopId)
        .maybeSingle();
      if (already) return { followed: true, deja_abonne: true, boutique: shop.name };

      const { error } = await db.from('shop_follows').insert({ follower_id: userId, shop_id: shopId });
      if (error) return { followed: false, message: error.message };
      return { followed: true, boutique: shop.name };
    }

    case 'create_product': {
      const { data: shop } = await db.from('shops').select('id,name').eq('owner_id', userId).maybeSingle();
      if (!shop) {
        return { created: false, message: "Cet utilisateur n'a pas de boutique — invite-le à en ouvrir une." };
      }
      const nom = typeof args.name === 'string' ? args.name.trim() : '';
      const prix = typeof args.price_fcfa === 'number' ? Math.round(args.price_fcfa) : NaN;
      const cat = typeof args.category === 'string' ? args.category : '';
      if (!nom) return { created: false, message: 'nom manquant' };
      if (!Number.isFinite(prix) || prix < 0) return { created: false, message: 'prix invalide' };
      if (!CATEGORIES.includes(cat)) {
        return { created: false, message: `catégorie invalide — une de: ${CATEGORIES.join(', ')}` };
      }
      const stock = typeof args.stock === 'number' && args.stock >= 0 ? Math.floor(args.stock) : 1;

      // Créé en brouillon (is_active false): une fiche sans photo publiée
      // directement donnerait un article fantôme dans le catalogue. La
      // vendeuse ajoute ses photos puis publie depuis "Mes articles".
      const { data: created, error } = await db
        .from('products')
        .insert({
          shop_id: shop.id,
          name: nom,
          description: typeof args.description === 'string' ? args.description.trim() : null,
          price_fcfa: prix,
          category: cat,
          stock,
          is_active: false,
        })
        .select('id,name,price_fcfa,category,stock')
        .single();
      if (error) return { created: false, message: error.message };

      return {
        created: true,
        brouillon: true,
        id: created.id,
        nom: created.name,
        prix_fcfa: created.price_fcfa,
        categorie: created.category,
        stock: created.stock,
        message: "Créé en brouillon — il faut ajouter des photos puis le publier depuis « Mes articles ».",
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
    const cartActions: Json[] = [];

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
        const result = await runTool(fc.name, fc.args ?? {}, userClient, user?.id ?? null, cartActions);
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

    // Fusionne les doublons (même article ajouté deux fois dans le tour) en
    // sommant les quantités, pour un seul appel cart.add() côté client.
    const mergedCart = new Map<string, Json>();
    for (const line of cartActions) {
      const id = line.id as string;
      const existing = mergedCart.get(id);
      if (existing) existing.qty = (existing.qty as number) + (line.qty as number);
      else mergedCart.set(id, { ...line });
    }

    return json({ reply, category, action, cartActions: [...mergedCart.values()] });
  } catch (err) {
    console.error('finou-chat exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
