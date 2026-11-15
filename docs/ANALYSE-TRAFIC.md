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
