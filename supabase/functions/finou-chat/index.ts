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

// FINOU 2.0 — les catégories viennent de la TABLE `categories` (source de
// vérité du pivot, migrations 0022/0023), rechargées au premier appel de
// chaque instance. Les listes ci-dessous ne sont qu'un repli statique si la
// lecture échoue (miroir de src/lib/categories.js au moment du déploiement).
let PRODUCT_CATEGORIES = [
  'mode_femme', 'mode_homme', 'enfants_bebe', 'hightech', 'beaute_cosmetiques',
  'bijoux_montres', 'maison_deco', 'evenementiel_mariages', 'alimentaire',
  'jus_naturels', 'seconde_main', 'vehicules', 'vehicules_voiture',
  'vehicules_moto', 'vehicules_pieces', 'immobilier_vente',
  // héritées (toujours valides en base):
  'mode', 'chaussures', 'sacs', 'maroquinerie', 'bijoux', 'montres', 'parfums',
  'beaute', 'cheveux', 'deco', 'mariages', 'evenement', 'mannequinerie', 'art', 'accessoires',
];
let SERVICE_CATEGORY_IDS = [
  'beaute_domicile', 'menage', 'btp_bricolage', 'informatique_digital',
  'electricite_plomberie', 'livraison_demenagement', 'traiteur_chef',
  'location_immobiliere', 'location_vehicules',
  'cours', 'evenementiel_service', 'autre_service',
  'reparation', 'jardinage', 'demenagement', 'coursier', 'ongles',
];
let categoriesLoaded = false;
async function ensureCategories(sb: SupabaseClient) {
  if (categoriesLoaded) return;
  try {
    const { data } = await sb.from('categories').select('id,kind');
    if (data && data.length > 0) {
      PRODUCT_CATEGORIES = data.filter((c: { kind: string }) => c.kind === 'PRODUCT').map((c: { id: string }) => c.id);
      SERVICE_CATEGORY_IDS = data.filter((c: { kind: string }) => c.kind === 'SERVICE').map((c: { id: string }) => c.id);
      categoriesLoaded = true;
    }
  } catch {
    /* repli statique */
  }
}

// Voir miroir-ia: on teste le HÔTE, pas une liste figée d'URL. Le domaine de
// production est finjaro.net, pas le sous-domaine Netlify.
const PROD_HOST = 'finjaro.net';

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
  if (host.endsWith('.pages.dev')) return true;
  if (host.endsWith('.workers.dev')) return true;
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

function systemPrompt(): string {
  return `Tu es Finia, l'assistante IA de Finjaro, une marketplace GÉNÉRALISTE
(produits ET services) pour l'Afrique et sa diaspora, ouverte à l'international:
mode, high-tech, alimentaire, véhicules, immobilier, et des prestataires à domicile
(ménage, BTP, coiffure, traiteur…). Slogan: "Au-delà des rêves". Tu es chaleureuse,
concise et utile.

RÈGLE LA PLUS IMPORTANTE: tu es une assistante généraliste, pas un robot limité au
shopping. Réponds VRAIMENT à toute question (calcul, culture générale, conseil,
question personnelle, blague...), même sans rapport avec Finjaro. Ne te contente
JAMAIS de te re-présenter en guise de réponse: tu t'es déjà présentée au début.

LANGUE & REGISTRE (caméléon): réponds dans la langue ET le registre de la personne.
Si elle écrit en anglais, réponds en anglais; en français soutenu, reste soutenue;
si elle utilise le camfranglais, le nouchi ou un ton très familier, adapte-toi
naturellement sans forcer ni caricaturer. Ne corrige jamais sa façon de parler.

PHOTO REÇUE = RECHERCHE VISUELLE: quand l'utilisateur envoie la photo d'un objet
(vêtement, meuble, téléphone…), identifie ce que c'est, déduis des mots-clés et la
catégorie, puis appelle search_products pour retrouver des articles similaires
réellement en vente — c'est le réflexe "Snap & Buy". Si la photo montre plutôt un
problème technique (fuite, panne, mur abîmé), décris le problème et appelle
search_services pour proposer le bon corps de métier. URGENCE: si le message ou la
photo décrit une urgence réelle (fuite d'eau, panne électrique dangereuse...),
saute le bavardage — appelle search_services immédiatement et donne le prestataire
le plus pertinent en premier.

DIAGNOSTIC TRAVAUX/PANNE (photo): si la photo montre un mur abîmé, une fuite, une
installation électrique, un moteur ou un appareil en panne, fais un mini-diagnostic
structuré: (1) le problème probable, (2) les matériaux ou pièces vraisemblablement
nécessaires, (3) une FOURCHETTE de coût en FCFA clairement annoncée comme
approximative ("à confirmer par un professionnel sur place" — tu ne vois qu'une
photo), puis (4) appelle search_services pour proposer le corps de métier adapté.
Jamais de chiffre précis présenté comme un devis ferme.

BESOIN MIXTE (orchestrateur): pour un événement complet ("mariage: robe + traiteur
+ déco"), enchaîne plusieurs outils (search_products puis search_services) et
présente un mini-plan groupé, jamais un seul résultat isolé.`;
}

function systemPromptTools(): string {
  return `

TES OUTILS — utilise-les, ne devine jamais:
- Question sur des articles, des prix, "trouve-moi…", "combien coûte…", "qu'est-ce
  que vous avez en…" -> appelle search_products. Ne cite JAMAIS un prix ou un stock
  de mémoire: ils viennent de l'outil ou tu n'en parles pas.
- Besoin d'un PRESTATAIRE ou d'un service ("trouve-moi un plombier", "qui fait le
  ménage à Douala", "traiteur pour samedi") -> search_services.
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
- Vendeuse qui veut CHANGER un article ("baisse le prix de la robe wax à 20000",
  "je n'ai plus de stock sur les sandales", "publie mon brouillon") ->
  list_my_products d'ABORD pour retrouver l'id réel, puis update_product. Ne
  devine jamais un id. S'il y a plusieurs articles possibles, montre-les et
  demande lequel. Récapitule le changement, attends le OK, puis appelle.
  Publier exige au moins une photo: si l'outil refuse pour cette raison,
  dis-le simplement et renvoie vers « Mes articles » pour les ajouter.
- Vendeuse qui gère ses COMMANDES REÇUES ("j'ai des commandes ?", "accepte la
  commande 1042", "c'est livré", "je ne peux pas honorer celle-là") ->
  list_shop_orders puis update_order_status. Attention: get_my_orders donne
  ses PROPRES achats, list_shop_orders donne ce que sa boutique a reçu — ce
  ne sont pas les mêmes commandes. L'acheteuse est prévenue automatiquement,
  dis-le. Une commande n'avance que dans l'ordre (nouvelle -> acceptée ->
  envoyée -> livrée); si l'outil refuse, explique l'étape qui manque au lieu
  d'insister. Pour annuler, demande TOUJOURS la raison d'abord: elle est
  envoyée telle quelle à l'acheteuse.
- Vendeuse qui travaille par arrivage ("mes habits changent chaque semaine",
  "je veux que ça s'efface tous les 7 jours et je remets du neuf") ->
  set_rotation. Par DÉFAUT les articles de l'arrivage passé sont SUPPRIMÉS
  définitivement — dis-le clairement avant d'activer, et précise que les
  commandes déjà passées gardent bien leur nom et leur prix. Si elle
  préfère les retrouver, passe delete_items à false: ils repassent alors en
  brouillon. Une case « article permanent » sur chaque fiche exempte les
  pièces toujours disponibles. Appelle set_rotation sans argument pour
  juste lire son réglage actuel.
Ces outils écrivent VRAIMENT dans la base pour le compte de
l'utilisateur: jamais sans son accord explicite dans le tour juste avant, et
ne prétends jamais qu'ils ont réussi si le résultat dit sent/followed/created/ok
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

L'ARGENT — parler la monnaie de la personne.
Le [Contexte écran] contient "buyerCurrency": c'est la monnaie dans laquelle
la personne voit les prix. Donne TOUJOURS les montants dans celle-là. Quelqu'un
qui annonce « j'ai 20 euros » et à qui on répond « 8 500 FCFA » doit faire la
conversion de tête pour savoir si c'est dans ses moyens — c'est notre travail,
pas le sien. Les outils te renvoient \`prix_fcfa\` parce que la base stocke en
FCFA; convertis à l'affichage.

Un budget se transmet TEL QUE DIT: \`max_price\` = 20, \`max_price_currency\` =
EUR. Ne fais jamais la conversion toi-même, le serveur s'en charge. (Le
paramètre \`max_price_fcfa\` a fait proposer des gants de chantier à 0 F à
quelqu'un qui cherchait un cadeau avec 20 €: le modèle y avait mis 20.)

Quand un article revient avec \`prix_sur_demande: true\`, il n'a PAS de prix:
dis « prix sur demande », jamais un montant, et jamais zéro.

AVANT DE PROPOSER — POSER LA QUESTION QUI MANQUE.
Un testeur, capture à l'appui: « il loupe des étapes, il peut poser plus de
questions avant de faire des propositions — comme un cadeau pour un homme ou
une femme ». Il avait raison: sur « idée cadeau », tu partais chercher les
articles populaires du moment. Une liste au hasard n'aide personne, et donne
l'impression que tu n'as pas écouté.

Quand la demande est trop vague pour chercher utilement — « idée cadeau »,
« un truc joli », « une surprise », « quelque chose pour ma sœur » — pose
D'ABORD la question qui change tout, et propose 2 ou 3 réponses toutes faites
pour qu'on réponde d'un mot:
- un cadeau: pour un homme ou une femme ? et à peu près quel budget ?
- un vêtement: pour qui, et quelle taille ?
- une occasion: mariage, anniversaire, naissance ?

Règles pour que ça reste agréable:
- UNE question à la fois, deux au maximum avant de proposer. On n'est pas un
  formulaire: à la troisième question, cherche avec ce que tu as.
- Ne redemande jamais ce qui a déjà été dit, ni ce que le contexte t'apprend.
- Dès que tu as de quoi chercher, cherche — et annonce ce que tu as compris:
  « d'accord, un cadeau pour une femme autour de 20 000 FCFA, je regarde ».
- Si la personne répond « peu importe » ou « propose », arrête de demander et
  propose immédiatement.

QUAND QUELQUE CHOSE NE MARCHE PAS — tu es le service d'aide de Finjaro
Les gens t'écrivent aussi pour se plaindre ou pour signaler que l'application
ne fonctionne pas. C'est normal, et c'est précieux: pour une personne qui
écrit, plusieurs abandonnent en silence.

Ta règle en deux temps:

1. ESSAIE D'ABORD. Si c'est une question à laquelle tu sais répondre — où
   trouver un bouton, comment fixer un prix, comment publier — réponds, tout
   simplement. Ne transmets pas ce que tu sais résoudre.

2. TRANSMETS DÈS QUE ÇA TE DÉPASSE, avec \`contacter_finjaro\`:
   - l'application ne fait pas ce qu'elle devrait (« ça ne s'envoie pas »,
     « le bouton ne fait rien », « j'ai une erreur ») → gravite « bug »;
   - argent, commande bloquée, compte inaccessible, contenu choquant →
     gravite « urgent »;
   - tu n'as sincèrement pas la réponse → gravite « question ».

NE FAIS JAMAIS SEMBLANT. « Videz votre cache », « vérifiez votre connexion »,
« réessayez plus tard » quand tu n'en sais rien: c'est la pire réponse
possible. La personne s'en va en pensant que c'est sa faute, et le
dysfonctionnement reste invisible. Une vendeuse a mis dix-sept jours à
signaler qu'aucune de ses photos ne partait — c'était un vrai bug, dans
l'application. Si tu ne sais pas, dis-le et transmets.

Avant de transmettre, demande UNE seule chose utile si elle manque: à quel
moment exactement ça bloque, ou ce qui s'affiche à l'écran. Pas plus — le
reste, on le sait déjà de notre côté. Puis dis clairement que c'est transmis
et qu'on revient vers elle.

OÙ SE TROUVENT LES CHOSES — pour guider quelqu'un de perdu, ne devine jamais:
Finjaro a deux modes. Le mode ACHETEUR (onglets: Accueil, Fin, Services,
Messages, Profil) sert à acheter. Le mode VENDEUR (onglets: Tableau de bord,
Produits, Commandes, Boutique) sert à gérer sa boutique: ajouter ses articles,
voir ses commandes et ses ventes, répondre à ses clientes vendeuses.
- Passer en mode vendeur: la carte « Vendre sur Finjaro » en haut du Profil
  (ou « Passer en mode vendeur » si la boutique existe déjà).
- Revenir en mode acheteur: le bouton « Mode acheteur » en haut du tableau de
  bord vendeur.
Si le [Contexte écran] contient "vendorStats" ou "shopUrl", l'utilisateur EST
un vendeur avec une boutique active. S'il semble perdu — il cherche sa
boutique, ses articles, ses commandes, comment ajouter, « ça ne marche pas »,
« je ne trouve pas » — explique en une phrase que ça se passe en mode vendeur
et termine par "ACTION: vendor_space". Ne le laisse JAMAIS penser que sa
boutique a disparu: elle est dans l'autre mode, dis-le.

LE GUIDE — quand on te demande comment marche Finjaro (« comment ça marche »,
« je suis nouveau », « guide-moi », « je fais quoi ici »):
- Demande D'ABORD, en une phrase, si la personne veut ACHETER ou VENDRE — sauf
  si le contexte le dit déjà (vendorStats présent = elle vend).
- Puis guide EN TROIS ÉTAPES MAXIMUM à la fois, dans ses mots à elle, en
  t'appuyant sur « où se trouvent les choses » ci-dessus. Jamais la visite
  complète d'un coup: personne ne retient huit étapes.
- Pour ACHETER: chercher (ou me demander, je cherche pour toi) → commander →
  payer à la livraison ou au retrait, rien en ligne. Dis ce dernier point
  clairement, c'est LA question que tout le monde se pose sans oser.
- Pour VENDRE: ouvrir sa boutique (Profil → « Vendre sur Finjaro », gratuit) →
  publier ses articles (une photo suffit, je rédige la fiche) → répondre aux
  commandes dans l'espace vendeur. Termine par "ACTION: sell" si elle n'a pas
  encore de boutique, "ACTION: vendor_space" si elle en a une.
- Ferme chaque réponse en proposant l'étape suivante ou en offrant de la
  faire ensemble — jamais un « voilà » qui laisse la personne seule.

Style: réponds dans la langue de l'utilisateur (français ou anglais), 2-5 phrases,
ton amical, un emoji max.

Balises de fin de réponse (au plus UNE, en dernière ligne, sinon aucune):
- Catégorie Finjaro clairement identifiée parmi: ${PRODUCT_CATEGORIES.join(', ')}
  — termine par "CAT: <id>".
- Intention de se connecter/créer un compte — "ACTION: login".
- Intention de vendre, de devenir vendeur, OU d'ajouter / publier / mettre en
  ligne / déposer un ou plusieurs articles — "ACTION: sell". Ne demande JAMAIS
  toi-même le nom, la catégorie, le prix ou le stock: un assistant guidé s'ouvre
  juste après ta réponse et les collecte avec les photos. Dis simplement que tu
  ouvres l'assistant, en une phrase.
- Demande du lien de sa boutique (shopUrl présent) — "ACTION: share_shop".
- Intention de supprimer un de ses articles — "ACTION: delete_product". Ne demande
  jamais toi-même lequel: le choix se fait ensuite dans une liste réelle.
- Vendeur (vendorStats/shopUrl présent) perdu, qui cherche sa boutique ou
  comment la gérer — "ACTION: vendor_space".
Dans tous les autres cas, n'ajoute aucune de ces lignes.`;
}

// ---------------------------------------------------------------------------
// Outils exposés à Gemini. Déclarations + implémentations.
// Toutes les requêtes passent par le client de l'UTILISATEUR (RLS actives).
// ---------------------------------------------------------------------------
function toolDeclarations() {
  return [
  {
    name: 'search_products',
    description:
      "Cherche des articles réellement en vente sur Finjaro. À utiliser dès qu'on parle d'un article, d'un prix ou d'une disponibilité. " +
      "RENSEIGNE TOUJOURS `category` quand la demande le permet: sans elle, une recherche infructueuse ne peut rien proposer d'approchant. " +
      "Si la réponse contient `resultat_approche: true`, ce ne sont PAS des correspondances exactes: annonce-le (« je n'ai pas trouvé exactement ça, mais voici ce qu'il y a en... ») au lieu de les présenter comme la demande.",
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description:
            "Mots-clés, ex: 'robe rouge', 'parfum homme'. Chaque mot est cherché séparément, dans le nom ET la description — inutile de deviner le titre exact de l'annonce.",
        },
        category: { type: 'STRING', description: `Une de: ${PRODUCT_CATEGORIES.join(', ')}` },
        max_price: {
          type: 'NUMBER',
          description:
            "Budget maximum, DANS LA MONNAIE OÙ LA PERSONNE L'A DIT. Si elle dit « 20 euros », mets 20 et max_price_currency EUR. Ne convertis jamais toi-même: le serveur s'en charge.",
        },
        max_price_currency: {
          type: 'STRING',
          description: "Monnaie du budget: FCFA, EUR, USD ou GBP. À défaut, celle de la personne.",
        },
        max_price_fcfa: { type: 'NUMBER', description: 'Budget maximum déjà exprimé en FCFA (ancien paramètre).' },
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
        category: { type: 'STRING', description: `Une de: ${PRODUCT_CATEGORIES.join(', ')}` },
        description: { type: 'STRING' },
        stock: { type: 'NUMBER', description: 'Quantité disponible, 1 par défaut' },
      },
      required: ['name', 'price_fcfa', 'category'],
    },
  },
  {
    name: 'list_my_products',
    description:
      "Liste les articles de la boutique du vendeur connecté, avec leur id, prix, stock et s'ils sont publiés ou en brouillon. Appelle TOUJOURS cet outil avant update_product: c'est lui qui donne les ids réels, et il ne faut jamais en deviner un.",
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: "Filtre optionnel sur le nom de l'article" },
        only_drafts: { type: 'BOOLEAN', description: 'true pour ne lister que les brouillons non publiés' },
      },
    },
  },
  {
    name: 'update_product',
    description:
      "Modifie UN article de la boutique du vendeur connecté: son prix, son stock, ou sa publication (publié / brouillon). Récapitule d'abord à voix haute ce que tu vas changer et sur quel article, attends le OK, puis appelle l'outil. Ne sert pas à créer un article (create_product) ni à en supprimer un.",
    parameters: {
      type: 'OBJECT',
      properties: {
        product_id: { type: 'STRING', description: "L'id exact renvoyé par list_my_products" },
        price_fcfa: { type: 'NUMBER', description: 'Nouveau prix en FCFA' },
        stock: { type: 'NUMBER', description: 'Nouveau stock disponible' },
        is_active: { type: 'BOOLEAN', description: 'true pour publier au catalogue, false pour repasser en brouillon' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'list_shop_orders',
    description:
      "Les commandes REÇUES par la boutique du vendeur connecté (à ne pas confondre avec get_my_orders, qui donne ses propres achats). Donne l'id, le numéro, le statut, l'acheteuse et les articles. Appelle-le avant update_order_status: c'est lui qui fournit les ids réels.",
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: "Filtre optionnel: 'new', 'confirmed', 'shipped', 'delivered' ou 'cancelled'",
        },
      },
    },
  },
  {
    name: 'update_order_status',
    description:
      "Fait avancer UNE commande de la boutique du vendeur connecté: l'accepter, la marquer envoyée/prête, la marquer livrée, ou l'annuler. L'acheteuse est prévenue automatiquement. Récapitule d'abord le numéro de commande et l'action, attends le OK, puis appelle l'outil. Une annulation demande toujours une raison à dire à l'acheteuse.",
    parameters: {
      type: 'OBJECT',
      properties: {
        order_id: { type: 'STRING', description: "L'id exact de la commande, renvoyé par list_shop_orders" },
        action: {
          type: 'STRING',
          description: "'confirm' (accepter), 'ship' (envoyée ou prête au retrait), 'deliver' (livrée), 'cancel' (refuser/annuler)",
        },
        reason: { type: 'STRING', description: "Obligatoire pour 'cancel': la raison, lisible par l'acheteuse" },
      },
      required: ['order_id', 'action'],
    },
  },
  {
    name: 'set_rotation',
    description:
      "Active, désactive ou règle les arrivages tournants de la boutique de l'utilisateur vendeur: ses articles repassent automatiquement en brouillon après N jours pour laisser place au nouvel arrivage. Appelle aussi cet outil SANS argument pour simplement lire le réglage actuel.",
    parameters: {
      type: 'OBJECT',
      properties: {
        enabled: { type: 'BOOLEAN', description: 'true pour activer, false pour désactiver. Omets pour seulement lire.' },
        days: { type: 'NUMBER', description: "Durée d'un arrivage en jours, entre 1 et 90 (7 par défaut)" },
        delete_items: {
          type: 'BOOLEAN',
          description:
            "true (défaut): les articles de l'arrivage passé sont SUPPRIMÉS définitivement. false: ils sont gardés en brouillon et republiables.",
        },
      },
    },
  },
  {
    name: 'contacter_finjaro',
    description:
      "Transmet une demande à l'équipe Finjaro. N'appelle cet outil QUE si tu ne peux pas résoudre toi-même: un dysfonctionnement de l'application, un problème de compte ou de paiement, une réclamation, ou une question dont tu n'as sincèrement pas la réponse. Une question à laquelle tu sais répondre ne se transmet PAS. Dis toujours à la personne que tu transmets, et ce qui va se passer ensuite.",
    parameters: {
      type: 'OBJECT',
      properties: {
        sujet: { type: 'STRING', description: 'Le problème en une ligne, comme un titre. Ex: « Les photos ne partent pas à la publication »' },
        resume: { type: 'STRING', description: "Ce que la personne a décrit, avec ce qu'elle a déjà essayé et ce que tu as constaté. Écris pour quelqu'un qui n'a pas lu la conversation." },
        gravite: {
          type: 'STRING',
          description: "'bug' = l'application ne fonctionne pas comme prévu; 'urgent' = argent, commande bloquée, compte inaccessible, contenu choquant; 'question' = le reste.",
        },
      },
      required: ['sujet', 'resume', 'gravite'],
    },
  },
  {
    name: 'search_services',
    description:
      "Cherche des PRESTATAIRES de services (ménage, BTP, plomberie, coiffure à domicile, traiteur, location...) : annonces 'Je propose' et boutiques prestataires, par métier et/ou ville.",
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: `Un métier parmi: ${SERVICE_CATEGORY_IDS.join(', ')}` },
        city: { type: 'STRING', description: 'Ville, ex: Douala, Paris' },
        query: { type: 'STRING', description: 'Mots-clés libres' },
      },
    },
  },
  ];
}

// Catégories vendues sur devis: pas de prix ferme, donc rien à mettre au
// panier — l'acheteur doit contacter la boutique. Doit rester aligné avec
// QUOTE_ONLY_CATEGORIES côté client (src/lib/categories.js). Étendu au pivot:
// immobilier, véhicules et locations ne s'achètent pas via le panier COD.
const QUOTE_ONLY = [
  'mariages', 'evenement', 'mannequinerie',
  'evenementiel_mariages', 'immobilier_vente', 'location_immobiliere',
  'vehicules', 'vehicules_voiture', 'vehicules_moto', 'location_vehicules',
];

type Json = Record<string, unknown>;

// Le panier vit côté client (localStorage, voir src/hooks/useCart.jsx) — pas
// de table en base. add_to_cart ne peut donc pas "écrire" côté serveur:
// il VALIDE l'article contre la vraie base (existe, actif, en stock, pas un
// article sur devis) et pousse une ligne prête à l'emploi dans `cartActions`,
// que la réponse finale renvoie au client. FinouChou.jsx applique chaque
// ligne via cart.add(), qui déclenche déjà la mini-fenêtre de confirmation
// globale du panier — aucune UI neuve nécessaire.
// Taux de conversion, alignés sur src/lib/currency.js côté client.
// Le budget arrive dans la monnaie où la personne l'a formulé; c'est ICI
// qu'on le ramène en FCFA, l'unité de stockage. Laisser le modèle faire ce
// calcul, c'est accepter qu'il se trompe — et il s'est trompé.
const RATES: Record<string, number> = { FCFA: 1, EUR: 0.001524, USD: 0.00165, GBP: 0.0013 };

function budgetEnFcfa(args: Json): number | null {
  if (typeof args.max_price === 'number' && args.max_price > 0) {
    const cur = String(args.max_price_currency ?? 'FCFA').toUpperCase();
    const rate = RATES[cur] ?? 1;
    return Math.round(args.max_price / rate);
  }
  if (typeof args.max_price_fcfa === 'number' && args.max_price_fcfa > 0) {
    return Math.round(args.max_price_fcfa);
  }
  return null;
}

async function runTool(
  name: string,
  args: Json,
  db: SupabaseClient,
  userId: string | null,
  cartActions: Json[],
  contexte: Json | null,
): Promise<Json> {
  // Outils personnels: sans compte, on le dit au modèle au lieu de deviner.
  const NEEDS_AUTH = [
    'get_my_orders', 'get_my_shop_stats', 'message_shop', 'follow_shop', 'create_product', 'set_rotation',
    'list_my_products', 'update_product', 'list_shop_orders', 'update_order_status',
  ];
  if (!userId && NEEDS_AUTH.includes(name)) {
    return { signed_in: false, message: "L'utilisateur n'est pas connecté: invite-le à se connecter pour faire ça." };
  }
  switch (name) {
    case 'search_products': {
      // La recherche ne cherchait la phrase ENTIÈRE que dans le NOM de
      // l'article: « habit pour femme » exigeait un article nommé exactement
      // ainsi, donc zéro résultat, et Finia annonçait un catalogue vide alors
      // que la boutique est pleine de robes et d'ensembles. Constaté par un
      // utilisateur de Beau, sur « habit pour femme », « produit pour femme »
      // et « jus » — tandis que « boisson » marchait, parce qu'un article
      // portait ce mot-là.
      //
      // Une cliente ne connaît pas le nom que la vendeuse a choisi. On
      // cherche donc CHAQUE MOT utile, dans le nom ET dans la description.
      const CATALOG_FIELDS = 'id,name,price_fcfa,price_on_request,category,stock,shop_id,shops(name,slug)';
      // Mots vides du français: sans ce tri, « pour » et « femme » pèsent
      // pareil et « pour » ramène la moitié du catalogue.
      const STOP = new Set([
        'pour', 'avec', 'sans', 'dans', 'des', 'les', 'une', 'un', 'le', 'la', 'de', 'du',
        'et', 'ou', 'mon', 'ma', 'mes', 'ce', 'cette', 'que', 'qui', 'chez', 'sur',
        'produit', 'produits', 'article', 'articles', 'cherche', 'voudrais', 'veux',
      ]);
      const rawQuery = typeof args.query === 'string' ? args.query.trim() : '';
      // Les virgules et parenthèses servent de séparateurs à PostgREST dans un
      // `or(...)`: les laisser passer casserait la requête entière.
      const words = rawQuery
        .toLowerCase()
        .split(/[\s,()%]+/)
        .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
        .filter((w) => w.length >= 3 && !STOP.has(w))
        .slice(0, 4);

      const category =
        typeof args.category === 'string' && PRODUCT_CATEGORIES.includes(args.category)
          ? args.category
          : null;

      // Une catégorie PARENTE ne porte aucun article: tout est rangé dans ses
      // enfants. « mode_femme » compte 0 article en direct mais 16 dans
      // femme_robes, femme_pantalons et femme_vestes_manteaux; « alimentaire »
      // 0 en direct et 3 dans alimentaire_boissons. Filtrer sur la seule
      // catégorie demandée renvoyait donc un catalogue vide — c'est
      // précisément pourquoi « Jus » ne trouvait rien là où « Boisson »
      // marchait, ce dernier tombant par chance sur le NOM d'un article.
      // On élargit à la catégorie ET à ses enfants, comme le fait déjà la
      // recherche de services.
      let categoryIds: string[] = [];
      if (category) {
        const { data: kids } = await db.from('categories').select('id').eq('parent_id', category);
        categoryIds = [category, ...((kids ?? []) as Array<{ id: string }>).map((k) => k.id)];
      }

      async function run(useWords: boolean) {
        let q = db.from('products').select(CATALOG_FIELDS).eq('is_active', true).limit(6);
        if (useWords && words.length) {
          q = q.or(words.flatMap((w) => [`name.ilike.%${w}%`, `description.ilike.%${w}%`]).join(','));
        }
        if (categoryIds.length) q = q.in('category', categoryIds);
        // Budget: converti ICI, jamais par le modèle.
        //
        // Beau, capture à l'appui: quelqu'un dit « j'ai 20 euros » et Finia
        // propose des gants de chantier et des bouchons d'oreille. Deux
        // fautes enchaînées, toutes les deux de notre côté:
        //
        // 1. Le seul paramètre existant s'appelait `max_price_fcfa`. Le modèle
        //    y a mis 20 — vingt FRANCS, pas vingt euros (20 € ≈ 13 100 FCFA).
        // 2. Un article « prix sur demande » est stocké à 0 FCFA. Il passait
        //    donc sous N'IMPORTE quel plafond: 127 articles du catalogue sont
        //    dans ce cas. Avec un plafond de 20, il ne restait qu'eux.
        //
        // Un article sans prix ne peut PAS être déclaré dans un budget: on
        // l'écarte dès qu'un budget est demandé.
        const maxFcfa = budgetEnFcfa(args);
        if (maxFcfa !== null) {
          q = q.lte('price_fcfa', maxFcfa).gt('price_fcfa', 0).eq('price_on_request', false);
        }
        return await q;
      }

      let { data, error } = await run(true);
      if (error) return { error: error.message };

      // Rien trouvé mais une catégorie était visée: on montre ce que cette
      // catégorie contient plutôt que de répondre « je n'ai rien ». Beau:
      // « avant, même quand il n'avait pas une chose, ça proposait autre
      // chose ». `resultat_approche` prévient le modèle que ce ne sont pas
      // des correspondances exactes, pour qu'il l'annonce honnêtement au lieu
      // de faire passer une robe pour le jus qu'on lui demandait.
      let approximate = false;
      if ((data?.length ?? 0) === 0 && categoryIds.length) {
        const retry = await run(false);
        if (!retry.error && (retry.data?.length ?? 0) > 0) {
          data = retry.data;
          approximate = true;
        }
      }

      // Une recherche de Finia qui ne trouve RIEN est le signal le plus net
      // qu'on ait sur la demande non servie: quelqu'un a formulé un besoin,
      // en toutes lettres, et le catalogue n'avait rien. On l'enregistre pour
      // le rapport hebdomadaire — sans jamais bloquer la réponse.
      if ((data?.length ?? 0) === 0) {
        db.from('events')
          .insert({ type: 'search', user_id: userId, meta: { q: String(args.query ?? ''), n: 0, via: 'finia' } })
          .then(() => {}, () => {});
      }

      return {
        count: data?.length ?? 0,
        resultat_approche: approximate,
        mots_cherches: words,
        products: (data ?? []).map((p: Json) => ({
          id: p.id,
          nom: p.name,
          prix_fcfa: p.price_fcfa,
          prix_sur_demande: !!p.price_on_request,
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
      if (typeof args.category === 'string' && PRODUCT_CATEGORIES.includes(args.category)) {
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

    case 'search_services': {
      // Recherche croisée côté services (pivot): annonces "Je propose" ET
      // boutiques prestataires, en un seul outil. Une tête de métier couvre
      // aussi ses enfants hérités (ex: btp_bricolage inclut reparation) —
      // résolus depuis la table categories, la même source que le client.
      const cat = typeof args.category === 'string' && SERVICE_CATEGORY_IDS.includes(args.category) ? args.category : null;
      let catIds: string[] = [];
      if (cat) {
        const { data: kids } = await db.from('categories').select('id').or(`id.eq.${cat},parent_id.eq.${cat}`);
        catIds = (kids ?? []).map((k: { id: string }) => k.id);
        if (catIds.length === 0) catIds = [cat];
      }

      let lq = db
        .from('near_you_listings')
        .select('id,category,description,city,country,user_id')
        .eq('type', 'propose')
        .order('created_at', { ascending: false })
        .limit(6);
      if (catIds.length > 0) lq = lq.in('category', catIds);
      else lq = lq.in('category', SERVICE_CATEGORY_IDS);
      if (typeof args.city === 'string' && args.city.trim()) lq = lq.ilike('city', `%${args.city.trim()}%`);
      if (typeof args.query === 'string' && args.query.trim()) lq = lq.ilike('description', `%${args.query.trim()}%`);

      let sq = db
        .from('shops')
        .select('id,name,slug,city,country,rating,is_verified,categories')
        .eq('status', 'active')
        .limit(6);
      if (catIds.length > 0) sq = sq.overlaps('categories', catIds);
      else sq = sq.overlaps('categories', SERVICE_CATEGORY_IDS);
      if (typeof args.city === 'string' && args.city.trim()) sq = sq.ilike('city', `%${args.city.trim()}%`);

      const [listingsRes, shopsRes] = await Promise.all([lq, sq]);
      if (listingsRes.error && shopsRes.error) return { error: listingsRes.error.message };
      return {
        annonces: (listingsRes.data ?? []).map((l: Json) => ({
          id: l.id, metier: l.category, description: l.description, ville: l.city, pays: l.country,
        })),
        prestataires: (shopsRes.data ?? []).map((s: Json) => ({
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
      if (!PRODUCT_CATEGORIES.includes(cat)) {
        return { created: false, message: `catégorie invalide — une de: ${PRODUCT_CATEGORIES.join(', ')}` };
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

    // ATTENTION — `db` est le client SERVICE_ROLE: la sécurité au niveau des
    // lignes ne s'applique PAS ici. Chaque outil vendeur doit donc vérifier
    // lui-même que l'objet touché appartient bien à la boutique de
    // l'utilisateur. Un `.eq('id', …)` sans `.eq('shop_id', …)` laisserait
    // n'importe quel vendeur modifier l'article ou la commande d'une autre
    // boutique en devinant un identifiant.
    case 'list_my_products': {
      const { data: shop } = await db.from('shops').select('id').eq('owner_id', userId).maybeSingle();
      if (!shop) return { ok: false, message: "Cet utilisateur n'a pas de boutique." };
      let q = db
        .from('products')
        .select('id,name,price_fcfa,stock,is_active,category')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (typeof args.query === 'string' && args.query.trim()) q = q.ilike('name', `%${args.query.trim()}%`);
      if (args.only_drafts === true) q = q.eq('is_active', false);
      const { data: rows, error } = await q;
      if (error) return { ok: false, message: error.message };
      return {
        ok: true,
        nombre: rows?.length ?? 0,
        articles: (rows ?? []).map((r) => ({
          id: r.id, nom: r.name, prix_fcfa: r.price_fcfa, stock: r.stock,
          publie: r.is_active, categorie: r.category,
        })),
      };
    }

    case 'update_product': {
      const { data: shop } = await db.from('shops').select('id').eq('owner_id', userId).maybeSingle();
      if (!shop) return { ok: false, message: "Cet utilisateur n'a pas de boutique." };
      const id = typeof args.product_id === 'string' ? args.product_id : '';
      if (!id) return { ok: false, message: 'product_id manquant' };

      const patch: Json = {};
      if (typeof args.price_fcfa === 'number') {
        const prix = Math.round(args.price_fcfa);
        if (prix < 0) return { ok: false, message: 'prix invalide' };
        patch.price_fcfa = prix;
      }
      if (typeof args.stock === 'number') {
        const s = Math.floor(args.stock);
        if (s < 0) return { ok: false, message: 'stock invalide' };
        patch.stock = s;
      }
      if (typeof args.is_active === 'boolean') patch.is_active = args.is_active;
      if (Object.keys(patch).length === 0) {
        return { ok: false, message: 'Rien à modifier: précise un prix, un stock ou la publication.' };
      }

      // Publier une fiche SANS photo créerait un article fantôme dans le
      // catalogue — c'est déjà la règle de create_product, elle vaut aussi ici.
      if (patch.is_active === true) {
        const { data: cur } = await db
          .from('products').select('images').eq('id', id).eq('shop_id', shop.id).maybeSingle();
        if (!cur) return { ok: false, message: "Cet article n'existe pas dans cette boutique." };
        if (!Array.isArray(cur.images) || cur.images.length === 0) {
          return {
            ok: false,
            message: "Impossible de publier: cet article n'a aucune photo. Elles s'ajoutent depuis « Mes articles ».",
          };
        }
      }

      const { data: updated, error } = await db
        .from('products')
        .update(patch)
        .eq('id', id)
        .eq('shop_id', shop.id)
        .select('id,name,price_fcfa,stock,is_active')
        .maybeSingle();
      if (error) return { ok: false, message: error.message };
      if (!updated) return { ok: false, message: "Cet article n'existe pas dans cette boutique." };
      return {
        ok: true,
        id: updated.id, nom: updated.name, prix_fcfa: updated.price_fcfa,
        stock: updated.stock, publie: updated.is_active,
      };
    }

    case 'list_shop_orders': {
      const { data: shop } = await db.from('shops').select('id').eq('owner_id', userId).maybeSingle();
      if (!shop) return { ok: false, message: "Cet utilisateur n'a pas de boutique." };
      let q = db
        .from('orders')
        .select('id,order_no,status,total_fcfa,created_at,delivery_method,buyer_name,order_items(name,qty)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (typeof args.status === 'string' && args.status.trim()) q = q.eq('status', args.status.trim());
      const { data: rows, error } = await q;
      if (error) return { ok: false, message: error.message };
      return {
        ok: true,
        nombre: rows?.length ?? 0,
        commandes: (rows ?? []).map((o: Json) => ({
          id: o.id,
          numero: o.order_no,
          statut: o.status,
          total_fcfa: o.total_fcfa,
          mode: o.delivery_method,
          acheteuse: o.buyer_name,
          date: o.created_at,
          articles: ((o.order_items as Json[] | null) ?? []).map((it: Json) => `${it.qty}× ${it.name}`),
        })),
      };
    }

    case 'update_order_status': {
      const { data: shop } = await db.from('shops').select('id').eq('owner_id', userId).maybeSingle();
      if (!shop) return { ok: false, message: "Cet utilisateur n'a pas de boutique." };
      const id = typeof args.order_id === 'string' ? args.order_id : '';
      const action = typeof args.action === 'string' ? args.action.toLowerCase() : '';
      if (!id) return { ok: false, message: 'order_id manquant' };

      const { data: order } = await db
        .from('orders')
        .select('id,order_no,status,buyer_id,delivery_method')
        .eq('id', id)
        .eq('shop_id', shop.id)
        .maybeSingle();
      if (!order) return { ok: false, message: "Cette commande n'appartient pas à cette boutique." };

      // Le MÊME enchaînement que l'écran Commandes: une commande n'avance que
      // dans l'ordre. Sans ça, Finia pourrait déclarer « livrée » une commande
      // jamais acceptée, et la boutique perdrait la trace de ce qui s'est
      // réellement passé.
      const now = new Date().toISOString();
      let patch: Json;
      let notif: string;
      if (action === 'confirm') {
        if (order.status !== 'new') return { ok: false, message: `Déjà au statut « ${order.status} »: on n'accepte qu'une commande nouvelle.` };
        patch = { status: 'confirmed', confirmed_at: now };
        notif = 'Commande validée';
      } else if (action === 'ship') {
        if (order.status !== 'confirmed') return { ok: false, message: `Il faut d'abord accepter la commande (statut actuel: ${order.status}).` };
        patch = { status: 'shipped', shipped_at: now };
        notif = order.delivery_method === 'pickup' ? 'Commande prête au retrait' : 'Commande expédiée';
      } else if (action === 'deliver') {
        if (order.status !== 'shipped') return { ok: false, message: `Il faut d'abord la marquer envoyée (statut actuel: ${order.status}).` };
        patch = { status: 'delivered', delivered_at: now };
        notif = 'Commande livrée';
      } else if (action === 'cancel') {
        if (order.status === 'delivered' || order.status === 'cancelled') {
          return { ok: false, message: `Une commande « ${order.status} » ne s'annule plus.` };
        }
        const reason = typeof args.reason === 'string' ? args.reason.trim() : '';
        if (!reason) return { ok: false, message: "Il faut une raison à donner à l'acheteuse avant d'annuler." };
        patch = { status: 'cancelled', cancelled_at: now, cancel_reason: reason };
        notif = order.status === 'new' ? 'Commande refusée' : 'Commande annulée';
      } else {
        return { ok: false, message: "action doit valoir 'confirm', 'ship', 'deliver' ou 'cancel'." };
      }

      const { error } = await db.from('orders').update(patch).eq('id', order.id).eq('shop_id', shop.id);
      if (error) return { ok: false, message: error.message };

      // L'acheteuse est prévenue, exactement comme depuis l'écran Commandes:
      // une commande qui change d'état sans que personne ne le sache est pire
      // qu'une commande qui n'avance pas.
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({
          user_id: order.buyer_id,
          title: notif,
          body: `#${order.order_no}${patch.cancel_reason ? ` — ${patch.cancel_reason}` : ''}`,
          url: '/profile/orders',
        }),
      }).catch(() => {});

      return { ok: true, commande: order.order_no, nouveau_statut: patch.status, acheteuse_prevenue: true };
    }

    case 'set_rotation': {
      const { data: shop } = await db
        .from('shops')
        .select('id,name,rotation_enabled,rotation_days,rotation_delete,rotation_last_at')
        .eq('owner_id', userId)
        .maybeSingle();
      if (!shop) return { ok: false, message: "Cet utilisateur n'a pas de boutique." };

      // Sans argument: simple lecture, aucune écriture.
      const wantsWrite =
        typeof args.enabled === 'boolean' ||
        typeof args.days === 'number' ||
        typeof args.delete_items === 'boolean';
      if (!wantsWrite) {
        return {
          ok: true,
          lecture_seule: true,
          rotation_active: shop.rotation_enabled,
          duree_jours: shop.rotation_days,
          supprime_les_articles: shop.rotation_delete,
          dernier_passage: shop.rotation_last_at,
        };
      }

      const patch: Json = {};
      if (typeof args.enabled === 'boolean') patch.rotation_enabled = args.enabled;
      if (typeof args.delete_items === 'boolean') patch.rotation_delete = args.delete_items;
      if (typeof args.days === 'number') {
        const d = Math.round(args.days);
        if (d < 1 || d > 90) return { ok: false, message: 'La durée doit être entre 1 et 90 jours.' };
        patch.rotation_days = d;
      }

      const { data: updated, error } = await db
        .from('shops')
        .update(patch)
        .eq('id', shop.id)
        .select('rotation_enabled,rotation_days,rotation_delete')
        .single();
      if (error) return { ok: false, message: error.message };

      const fin = updated.rotation_delete
        ? `les articles de l'arrivage passé sont SUPPRIMÉS définitivement (les commandes déjà passées gardent leur nom et leur prix)`
        : `les articles de l'arrivage passé repassent en brouillon et restent republiables depuis « Mes articles »`;

      return {
        ok: true,
        rotation_active: updated.rotation_enabled,
        duree_jours: updated.rotation_days,
        supprime_les_articles: updated.rotation_delete,
        message: updated.rotation_enabled
          ? `Tous les ${updated.rotation_days} jours, ${fin}. Une case « article permanent » existe sur chaque fiche pour en exempter les pièces toujours dispo.`
          : 'Rotation désactivée: plus aucun article ne sera retiré automatiquement.',
      };
    }

    case 'contacter_finjaro': {
      const sujet = String(args.sujet ?? '').trim().slice(0, 200);
      const resume = String(args.resume ?? '').trim().slice(0, 2000);
      const brut = String(args.gravite ?? 'question');
      const gravite = ['question', 'bug', 'urgent'].includes(brut) ? brut : 'question';
      if (!sujet || !resume) return { envoye: false, message: 'sujet et resume sont obligatoires' };

      // Le CONTEXTE est ce qui fait la valeur du ticket. Une vendeuse a écrit
      // « les photos ne partent pas »: il a fallu fouiller la base pendant
      // longtemps pour comprendre, faute de savoir sur quel téléphone et
      // depuis quel écran. On enregistre donc ce qu'on sait, sans le lui
      // demander — elle ne saurait de toute façon pas répondre.
      const ctx = (contexte && typeof contexte === 'object' ? contexte : {}) as Json;
      const sb = admin();

      // Écrit avec la clé de service: la table n'accepte aucune insertion
      // depuis le navigateur, sinon la file se remplirait toute seule.
      const { data: ticket, error: errTicket } = await sb
        .from('support_tickets')
        .insert({ user_id: userId, sujet, resume, gravite, contexte: ctx })
        .select('id')
        .single();
      if (errTicket) return { envoye: false, message: errTicket.message };

      // Beau est prévenu tout de suite. Un ticket que personne ne voit ne vaut
      // pas mieux que l'e-mail qu'il remplace.
      const { data: admins } = await sb.from('profiles').select('id').eq('is_admin', true);
      const titre = gravite === 'urgent'
        ? `Urgent — ${sujet}`
        : gravite === 'bug'
          ? `Bug signalé — ${sujet}`
          : `Demande d'aide — ${sujet}`;
      for (const a of admins ?? []) {
        await sb.from('notifications').insert({
          user_id: (a as Json).id,
          type: 'support',
          title: titre,
          body: resume.slice(0, 300),
          data: { ticket_id: ticket?.id, gravite },
        });
      }
      return {
        envoye: true,
        gravite,
        message: "C'est transmis à l'équipe Finjaro. Dis-le à la personne, et préviens-la qu'on lui revient dessus.",
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
        body: `Finia et Miroir AI sont en pause ce mois-ci (limite ${BUDGET_EUR}€ atteinte).`,
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
    await ensureCategories(sb);

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

    // `noThinking` n'est vrai qu'en REPLI: si un modèle refusait le champ
    // thinkingConfig, on rejouerait l'appel sans lui plutôt que de laisser
    // un 400 se transformer en « je n'ai pas bien compris ».
    async function callGemini(model: string, noThinking = false) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt() + systemPromptTools() }] },
            contents,
            tools: [{ functionDeclarations: toolDeclarations() }],
            generationConfig: {
              temperature: 0.7,
              // 800 était trop court, et d'une façon sournoise: sur les
              // modèles « qui réfléchissent » (2.5 et au-delà), les jetons de
              // réflexion se prennent sur CE budget. Une question claire tenait
              // dans les 800; un message court et dépendant du contexte
              // (« Femme », « Tendances du moment ») demande plus
              // d'interprétation, la réflexion consommait tout, et la réponse
              // revenait SANS AUCUN TEXTE. L'appel réussissait — 200 en deux
              // secondes dans les journaux — et Finia répondait « Je n'ai pas
              // bien compris, peux-tu reformuler ? » à des phrases parfaitement
              // claires. Signalé par un utilisateur de Beau.
              maxOutputTokens: 3072,
              // Réflexion BORNÉE, pas coupée. Le bug des réponses vides venait
              // d'une réflexion ILLIMITÉE qui consommait tout maxOutputTokens
              // avant d'écrire le moindre mot. La couper à zéro a réparé ça —
              // mais un modèle qui ne réfléchit plus choisit mal ses outils,
              // et Beau l'a vu: « il ne parvient même plus à faire les basic
              // trucs ». 512 tokens de réflexion suffisent à choisir le bon
              // outil, et il reste toujours ~2500 tokens garantis pour le
              // texte: le bug ne peut pas revenir.
              ...(noThinking ? {} : { thinkingConfig: { thinkingBudget: 512 } }),
            },
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
          // Un modèle qui ne connaît pas thinkingConfig répond 400: on rejoue
          // sans le champ au lieu d'abandonner sur ce seul motif.
          if (r.status === 400 && JSON.stringify(r.body).includes('thinking')) {
            calls++;
            const retry = await callGemini(model, true);
            if (retry.ok) { res = retry; pinnedModel = model; break; }
          }
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
        const result = await runTool(fc.name, fc.args ?? {}, userClient, user?.id ?? null, cartActions, context ?? null);
        responseParts.push({ functionResponse: { name: fc.name, response: result } });
      }
      contents.push({ role: 'user', parts: responseParts });
    }

    sb.from('ai_usage').insert({ fn: 'finou_chat', cost_eur: FINOU_CALL_COST_EUR * Math.max(calls, 1) }).then(() => {}, () => {});

    let reply =
      ((data?.candidates as Array<Json> | undefined)?.[0]?.content?.parts as Array<Json> | undefined)
        ?.map((p) => (p.text as string) ?? '')
        .join('')
        .trim() || '';

    // Une réponse VIDE n'est pas une incompréhension: c'est un appel qui a
    // réussi sans produire un mot. On trace la vraie raison (MAX_TOKENS,
    // blocage de sécurité...) au lieu de la maquiller en « reformule ta
    // question » — c'est ce silence dans les journaux qui a fait passer ce
    // défaut inaperçu, alors qu'il répondait ça à des phrases très claires.
    if (!reply) {
      const cand = (data?.candidates as Array<Json> | undefined)?.[0];
      console.error(
        'finou-chat: reponse sans texte',
        JSON.stringify({
          finishReason: cand?.finishReason ?? null,
          blockReason: (data?.promptFeedback as Json | undefined)?.blockReason ?? null,
          usage: data?.usageMetadata ?? null,
        })
      );
      reply = "Je n'ai pas bien compris, peux-tu reformuler ? 💫";
    }

    let category: string | null = null;
    let action: 'login' | 'sell' | 'share_shop' | 'delete_product' | 'vendor_space' | null = null;
    // [a-z_]: les ids du pivot contiennent des underscores (mode_femme…).
    const catMatch = reply.match(/CAT:\s*([a-z_]+)\s*$/i);
    if (catMatch && PRODUCT_CATEGORIES.includes(catMatch[1].toLowerCase())) {
      category = catMatch[1].toLowerCase();
      reply = reply.replace(/\n?CAT:\s*[a-z_]+\s*$/i, '').trim();
    }
    const actionMatch = reply.match(/ACTION:\s*(login|sell|share_shop|delete_product|vendor_space)\s*$/i);
    if (actionMatch) {
      action = actionMatch[1].toLowerCase() as typeof action;
      reply = reply.replace(/\n?ACTION:\s*(login|sell|share_shop|delete_product|vendor_space)\s*$/i, '').trim();
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
