# Finou Chou 2.0 — état réel des « super-pouvoirs » et feuille de route

_Écrit le 31 juillet 2026, pendant le cycle staging du pivot. Ce document dit
ce qui est FAIT, ce qui est faisable ensuite avec l'infrastructure actuelle,
et ce qui demande des briques qui n'existent pas encore — sans enrober._

**Règle d'or respectée partout** : la clé Gemini ne quitte jamais le serveur
(Edge Functions Deno uniquement), toute action transactionnelle est validée
par la base (RLS + revalidation serveur) avant confirmation UI, et les
réponses machine-exploitables passent par les Structured Outputs de Gemini
(responseSchema JSON strict), jamais par du texte libre à parser.

---

## Fait dans ce cycle (staging)

| # | Capacité | Comment |
|---|---|---|
| 1 (partiel) | Polyglotte & Caméléon | Prompt v3 : langue ET registre adaptés (camfranglais/nouchi/français soutenu), sans caricature. C'est du prompt engineering sur Gemini 2.5 Flash — la « détection » est native au modèle. |
| 2 (partiel) | Voix bidirectionnelle | Dictée micro (Web Speech API) existait ; ajout de la LECTURE des réponses (speechSynthesis, bouton haut-parleur dans Finou). 100 % navigateur, zéro clé exposée. |
| 3 (base) | Analyse d'urgence | Le prompt court-circuite le bavardage sur urgence détectée (texte ou photo : « fuite d'eau ! ») → `search_services` immédiat. Détection du stress DANS LA VOIX : non — il faudrait un flux audio vers le serveur (voir « Demande de l'infra »). |
| 6 | Recherche croisée | Nouvel outil `search_services` (annonces « Je propose » + boutiques prestataires, par métier/ville, enfants de catégorie inclus via la table `categories`). Combiné à `search_products`/`find_shops`, une même conversation couvre produits + services + boutiques. Pas de PostGIS : le géo reste lat/lng + tri par distance côté client. |
| 7 | « Shazam » visuel (Snap & Buy) | `finou-vision` réécrite en vraie fonction : photo → Gemini 2.5 Flash avec **responseSchema strict** `{keywords[], category(enum des ids réels), description}` → recherche catalogue côté serveur → produits réels retournés. Dans le chat, une photo d'objet déclenche le même réflexe via le prompt. |
| 8 (base) | Planificateur d'événements | Prompt « besoin mixte » : mariage = enchaînement search_products + search_services et mini-plan groupé. Devis groupés AUTONOMES (écriture) : non — voir plus bas. |
| — | Catégories dynamiques | Finou lit désormais l'arborescence réelle depuis la table `categories` (repli statique embarqué si la lecture échoue). Le pivot est visible par l'IA sans redéploiement. |
| — | Bulle orange | La bulle flottante passe au terracotta de la marque (#C25E38), comme le prototype. |

## Faisable ensuite avec l'infra actuelle (Edge Functions + Gemini + tables)

- **12. Auto-Listing** : photo → titre/SEO/prix suggéré via structured output,
  branché sur le flux `create_product` existant (déjà en brouillon + accord
  explicite). Le détourage/fond studio demande un modèle d'édition d'image
  (même famille que Miroir IA) — coût par appel à cadrer dans le budget.
- **13. KYC OCR** : les pièces arrivent déjà dans le bucket privé `ids`.
  Une fonction OCR (structured output: nom, date de naissance, expiration)
  posant un statut `pending_review` est raisonnable. Décision AUTOMATIQUE
  d'identité : à ne pas faire — assistance à la vérification, pas verdict.
- **14 (SAV)** : analyse photo produit cassé + proposition ENCADRÉE (jamais
  d'exécution de remboursement sans accord des deux parties).
- **10. Évaluateur de troc** : 2 photos → structured output état/valeur
  estimée/soulte. Schéma prêt (ci-dessous). L'estimation « prix du marché »
  n'aura que le catalogue Finjaro comme référence au début — à dire dans l'UI.
- **15 (scripts vidéo)** : génération de scripts Reels pour vendeuses — texte
  pur, trivial. PDF de contrats : possible (lib PDF Deno) mais JURIDIQUE —
  il faut des modèles de contrat validés par un humain avant d'automatiser.
- **19 (recadrage Miroir)** : hint de cadrage par catégorie déjà en place ;
  filtrage morphologique du catalogue = colonne `attributes` + prompt.
- **11. CO2 → points** : calculable en SQL pur (distance vendeur-acheteur,
  seconde main). La partie « Graines/fidélité » est un système de points à
  concevoir (décision produit).

## Demande de l'infra qui n'existe pas encore

- **4-5. Traduction/interprète temps réel (Reels, appels)** : il n'y a PAS
  d'appels audio/vidéo dans Finjaro (pas de WebRTC). À construire d'abord :
  signalisation, TURN, UI d'appel — un chantier en soi, avant toute IA.
- **17-18. Diagnostic vidéo + AR (flèches sur la vidéo)** : demande capture
  vidéo streamée vers Gemini + overlay AR synchronisé. Réaliste en V1
  dégradée : PHOTOS multiples → diagnostic structured output → estimation de
  devis. L'AR temps réel est un projet séparé.
- **20-22. Visite 3D, acousticien, simulateur sensoriel** : projection de
  meubles/aménagement = modèles 3D des produits (aucun n'existe) ; mix audio
  généré = API audio non branchée. V1 honnête : questions vocales sur une
  photo immobilière (photo + question → réponse) est faisable dès maintenant.
- **16. Logistique crowdsourcée** : il n'y a pas de flotte de livreurs dans
  le produit. Le calcul d'itinéraires vient APRÈS l'existence des livreurs.
- **23. Anti-contrefaçon « microscopique »** : une photo smartphone ne permet
  pas une certification sérieuse — le promettre créerait un risque juridique.
  Ce qu'on peut faire : score d'indices visuels avec disclaimer explicite.

## Schémas JSON stricts préparés (responseSchema Gemini)

```jsonc
// finou-vision (DÉPLOYÉ, staging)
{ "type": "OBJECT", "required": ["keywords", "category", "description"],
  "properties": {
    "keywords":    { "type": "ARRAY", "items": { "type": "STRING" } },
    "category":    { "type": "STRING", "enum": ["<ids réels de la table categories>"] },
    "description": { "type": "STRING" } } }

// Évaluateur de troc (prêt à implémenter)
{ "type": "OBJECT", "required": ["item_a", "item_b", "soulte_fcfa", "en_faveur_de"],
  "properties": {
    "item_a": { "type": "OBJECT", "properties": {
      "etat": { "type": "STRING", "enum": ["neuf", "tres_bon", "bon", "use", "abime"] },
      "valeur_estimee_fcfa": { "type": "NUMBER" } } },
    "item_b": { "$ref": "item_a" },
    "soulte_fcfa": { "type": "NUMBER" },
    "en_faveur_de": { "type": "STRING", "enum": ["a", "b", "aucun"] } } }

// KYC OCR (prêt à implémenter — statut TOUJOURS pending_review, jamais auto-approve)
{ "type": "OBJECT", "required": ["type_piece", "lisible"],
  "properties": {
    "type_piece": { "type": "STRING", "enum": ["cni", "passeport", "sejour", "autre"] },
    "lisible": { "type": "BOOLEAN" },
    "nom": { "type": "STRING" }, "prenom": { "type": "STRING" },
    "date_naissance": { "type": "STRING" }, "date_expiration": { "type": "STRING" } } }
```

## Principe de séquencement proposé

1 fonctionnalité IA = 1 fonction edge dédiée + quota `check_rate_limit` +
ligne `ai_usage` (budget global 20 €/mois partagé) + structured output.
Prochain lot recommandé, du plus utile au moins urgent : Auto-Listing (12),
KYC OCR assisté (13), Troc (10), diagnostic photo BTP (17-V1).
