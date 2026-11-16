# Analyse du trafic de la place de marché — 15/11/2026

Source : la table `events`, que NOTRE code remplit (pays, région, ville, provenance, écran). Cloudflare n'est pas nécessaire pour ça. Fenêtre : 30 derniers jours, comptes de test exclus quand c'est précisé. Chiffres mesurés, non arrondis à la hausse.

## Le constat
- **3 603 « visiteurs »** sur 30 jours, mais **≈ 53 humains probables** (ont fait un geste : fermer l'intro, répondre aux cookies, cliquer un article, chercher, WhatsApp, panier… ou connectés). **30 hors États-Unis.**
- **3 489 visiteurs « américains »**, soit 97 %, viennent de villes de centres de données : Ashburn (Virginie) 1 762, Moncks Corner (Caroline du Sud) 618, Boston 489, New York 452, Council Bluffs (Iowa) 144. Sur ces 3 489, seuls 23 ont fait un geste. Ils lisent les fiches articles (2 672 vues de fiches pour 30 jours) sans jamais rien faire : ce sont des robots d'exploration, pas des acheteurs.
- Les pics (31/10 : 360, 03/11 : 533, 07/11 : 285, 12/11 : 454 « visiteurs ») sont des passages de robots, pas un effet de publication.

## Les humains (30 jours)
- Pays : France 25, Allemagne 28 (surtout 1 action), Cameroun 14, Belgique 2, Côte d'Ivoire 1, Finlande 1, Chine 1.
- Comptes connectés actifs : 10 dont 1 compte de test (9 réels).
- Provenances nommées (très peu) : finjaro.net 5, Google 2, Bing 1, Facebook 1, TikTok 1, Gmail 1.
- **Visites étiquetées flyer : 0.**

## L'entonnoir (30 jours, tout compris)
- Fiches vues : 2 679 (dont l'essentiel par les robots) → clics article : 10 (7 personnes) → clics WhatsApp : 3 → panier : 1 → début de paiement : 2 → commande : 1.

## Ce que ça change
1. Ne jamais citer « visiteurs uniques » tels quels : à citer avec « humains probables » (geste ou connecté).
2. Les décisions (flyers, séries, Accounting) se jugent sur ≈ 2 humains par jour, pas sur les centaines affichées.
3. À faire (code, avec accord de Beau) : écarter les robots du comptage (villes de centres de données, absence de geste) pour que les agents et les rapports ne lisent plus de faux chiffres.

## Posts Metricool contre visites réelles (26/10 → 16/11)
Humain probable = a fait un geste sur le site (intro fermée, cookies, clic article, recherche, WhatsApp, panier…) ou est connecté (donc compte Beau et tests inclus). Source des posts : Metricool, marque 7400752.

| Période | Posts | Humains probables par jour (moyenne) |
|---|---|---|
| 26/10 → 03/11 (avant les flyers) | aucun flyer | 2,0 |
| 04/11 → 11/11 (flyers Instagram + Facebook à 17 h chaque jour) | 8 | 3,3 |
| 12/11 → 16/11 (flyers en pause) | 0 | 1,0 |

- **Instagram** (8 images, 04 → 11/11) : portée de 7 à 14 personnes par image (≈ 80 en tout), 11 interactions au total.
- **Facebook** (mêmes jours) : portée de 0 à 2, 0 clic sur lien, 0 réaction.
- **TikTok** (3 vidéos sur la période) : 29/10 = 782 vues ; 11/11 = 1 791 vues ; 13/11 = 719 vues. Le jour des 1 791 vues, le site a eu 4 humains probables ; aucun ne vient d'un lien TikTok identifié (TikTok n'envoie pas toujours sa provenance).
- Visiteurs arrivés d'un réseau social identifié : 2 sur 3 semaines (01/11 et 10/11).
- **Lecture honnête** : l'écart « avec posts / sans posts » est de 1 à 2 personnes par jour, trop petit pour être prouvé. Les flyers n'ont touché que quelques dizaines de personnes. La seule vraie audience mesurée est TikTok (centaines à milliers de vues), mais elle ne se transforme pas en visites mesurables : le lien vers le site n'est pas cliqué ou pas tracé.
- Pic de 9 humains le 09/11 : non expliqué (peut être des essais internes).

## Qui est venu ? (Cloudflare)
- Cloudflare n'est pas connecté à cette session (connecteur à autoriser par Beau). Nos chiffres viennent de notre propre table `events`.
- On connaît pays, ville, provenance, écrans vus. On ne connaît **jamais l'identité** d'un visiteur non connecté ; seul un compte (connexion) donne une identité.
- Cloudflare apporterait un tri robots/humains fait par eux et les pays, pas des noms.

## Robots écartés (16/11, décision de Beau : « oui, écarte les robots du comptage »)
- **À l'arrivée** (`src/worker.js`) : Cloudflare donne le nom de l'organisation du réseau du visiteur ; un hébergeur (Amazon, Google, Microsoft, OVH, Hetzner…) marque la visite `robot: true`, et tout ce que fait ce visiteur dans l'onglet porte la marque (`src/lib/track.js`). Rien n'est jeté, tout est marqué.
- **Dans la base** : vue `public.events_humains` (migration 0248, ajout seul, lecture réservée au serveur). Elle écarte les visiteurs marqués robot ET, pour l'historique d'avant la marque, les visiteurs américains sans aucun geste ni connexion.
- **Résultat sur les 30 derniers jours** : 7 456 lignes d'événements → 603 ; 98 visiteurs avec une visite (au lieu de ≈ 3 560) ; 41 vues de fiches (au lieu de 2 679).
- **Limites** : la règle d'historique sous-compte quelques vrais Américains passifs ; l'Allemagne (28 visiteurs, 10 à une seule action) n'est pas écartée et contient probablement aussi des robots. À revoir dans une semaine avec la marque `robot` posée.
