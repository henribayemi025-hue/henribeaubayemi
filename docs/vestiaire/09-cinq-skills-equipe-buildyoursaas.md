# 09 — « 5 nouveaux skills Claude Code pour remplacer ton équipe » (BuildYourSaaS)

- **Source** : https://buildyoursaas.tech/guide-5skills-team.html
- **Type** : guide (page de vente d'un consultant en IA)
- **Accès** : ouvert et lu en entier. La page contient un formulaire (téléphone, profil) pour « débloquer une bibliothèque » : je ne l'ai pas rempli, la liste des cinq outils est lisible sans. J'ai ensuite lu, sur les dépôts, les fichiers qui fondent mes compétences : la fiche « grilling » de mattpocock/skills, le README de last30days-skill et celui d'Impeccable.
- **Licence / droits** : aucune licence sur le guide (= tous droits réservés). Outils cités, vérifiés à la source : mattpocock/skills (MIT), last30days-skill (MIT), **Impeccable (Apache-2.0, et non MIT comme l'affirme le guide)**, wshobson/agents (MIT), ai-berkshire (MIT).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)

Une page qui présente cinq ensembles de compétences pour Claude Code, chacun censé « remplacer » un poste : **grill-me** (un interrogatoire serré sur un projet avant d'écrire du code), **Last 30 Days** (un rapport de veille sourcé sur les 30 derniers jours, tiré de Reddit, X, YouTube, TikTok, Hacker News…), **Impeccable** (des règles et commandes de design contre le « look généré par IA »), le **catalogue de Seth Hobson** (des dizaines d'agents et d'extensions de développement) et **AI Berkshire** (des agents qui débattent d'une action en bourse). Le reste de la page vend des séances individuelles, avec des témoignages nominatifs de clients.

## Ce qui est vraiment utile pour Finjaro et Léo

- **L'interrogatoire par vagues (grill-me / grilling)**, lu sur le dépôt : on représente le projet comme un arbre de décisions ; à chaque tour on pose **toutes les questions qu'on peut déjà trancher**, numérotées, chacune avec **la réponse qu'on recommande** ; on cherche soi-même les faits au lieu de les demander ; on ne passe à l'action que quand plus rien n'est supposé. C'est très adapté à Beau : il dicte à la voix, a peu de temps, et peut répondre « d'accord sur 1, 2, 4 ; pour 3, non ».
- **La veille sur 30 jours pondérée par l'engagement (Last 30 Days)** : fenêtre de temps fixe, plusieurs sources, classement par ce que les gens ont réellement voté ou regardé, chaque point cité. L'idée est reprenable par Vigie et Radar avec notre simple recherche web ; l'outil lui-même, non (voir limites).
- **Les tics du « design généré par IA » (Impeccable)** : police par défaut partout, dégradés violet-bleu, cartes dans des cartes, texte gris sur fond coloré, noir pur, animations qui rebondissent ; et sa commande « harden » qui cherche les textes qui débordent, les langues, les cas limites. Utile à Miroir, **à condition de ne pas raboter le style vintage de Finjaro**.
- **Catalogue wshobson/agents** : vaste réservoir de fiches de développement ; nombre d'agents annoncé (199 / 161 / 90) non recompté.
- **AI Berkshire** : sans rapport avec Finjaro.

Écarts relevés entre le guide et les dépôts (24/09/2026) : Impeccable n'est pas sous MIT ; il annonce aujourd'hui 24 commandes et 61 règles automatiques (le guide dit 23 et 45) ; la commande d'installation de grill-me donnée par le guide correspond à celle du dépôt (non testée ici), qui propose aussi une extension dans la place de marché officielle de Claude Code ; les « 440 K étoiles cumulées » n'ont pas été vérifiées (GitHub bloqué depuis notre environnement pour ce comptage).

## Pour quels agents de Léo

- **Alpha (direction technique)** et **Orchestre** — l'interrogatoire par vagues est la bonne façon de cadrer une demande de Beau avant de la répartir.
- **Lien (relation)** — même méthode pour clarifier la demande d'une vendeuse ou d'un acheteur sans l'épuiser de questions.
- **Vigie (veille)** et **Radar (événements)** — la veille sur 30 jours pondérée par l'engagement.
- **Plume (contenu)** — la veille sert à trouver des sujets qui intéressent réellement les gens.
- **Miroir (critique des pages)** — la liste des tics de design et les contrôles de robustesse (débordement de texte, langues, écrans larges).
- **Claude et Ada** — le catalogue wshobson en réserve.

## Compétences à tirer (pour Mentor)

**Cadrer une demande par vagues de questions** — Alpha, Orchestre, Lien
Quand s'en servir : quand une demande est floue, large ou dictée à la voix, avant de lancer le travail.
Comment faire : 1) lister les décisions à prendre et ce dont chacune dépend ; 2) poser en un seul message **uniquement** les questions dont on peut déjà parler (pas celles qui dépendent d'une réponse attendue) ; 3) numéroter, 5 au plus, et donner pour chacune **ta réponse recommandée** pour qu'on puisse répondre « d'accord » ; 4) chercher toi-même les faits (chiffres, état de la boutique, ce qui existe déjà dans Léo) au lieu de les demander ; 5) recommencer avec les nouvelles questions débloquées ; 6) résumer ce qui est décidé et attendre un « oui » avant d'agir.
Pièges : un interrogatoire de 20 questions d'un coup décourage ; lire l'intention d'un message dicté plutôt que la lettre ; les décisions restent au fondateur, les faits sont ton travail.

**Veille des 30 derniers jours, classée par ce que les gens font vraiment** — Vigie, Radar, Plume
Quand s'en servir : pour savoir ce qui bouge sur un sujet (commerce en ligne, mode, paiement mobile, un concurrent, un événement).
Comment faire : 1) fixer la fenêtre (30 jours) et la dire ; 2) chercher sur plusieurs types de sources (forums, vidéos, presse, sites officiels), dans plusieurs pays : Finjaro est mondiale ; 3) classer par signal réel (votes, vues, commentaires, argent engagé) plutôt que par le ton de l'article ; 4) citer chaque point avec son lien et sa date ; 5) séparer « fait vérifié » et « opinion populaire ».
Pièges : un sujet très commenté n'est pas forcément vrai ; ne jamais recopier des données personnelles d'inconnus ; un chiffre sans source ne va pas dans le rapport ; ne pas se limiter à un seul pays ni à une seule langue.

**Critique de page : repérer les tics de l'IA sans toucher au style maison** — Miroir
Quand s'en servir : en relisant une page, un écran ou un visuel de Finjaro ou de Léo.
Chercher : texte gris ou pâle sur fond coloré (lisibilité), cartes empilées dans des cartes, textes qui débordent ou se coupent dans une autre langue (les libellés anglais ou allemands sont plus longs), un prix ou une devise qui ne suit pas le pays du visiteur, un recadrage d'image qui coupe un visage sur écran large (une capture de 390 px ne suffit pas), des animations gadgets.
Ne pas proposer : de remplacer la crème, la terracotta, le laiton ou les grands titres par un look « sobre » ; c'est le style voulu par Beau.
Rendu : une liste courte, chaque point avec l'endroit exact et une correction de détail (couleur, libellé, icône), pas une refonte.

## Limites, risques, prudence

- **Last 30 Days** n'est pas utilisable par nos agents : il demande un terminal, Python, et pour plusieurs sources des clés payantes ou les **cookies du navigateur connecté** de l'utilisateur (X, Xiaohongshu), ce qui revient à aspirer des plateformes avec son compte personnel. On garde la méthode, pas l'outil.
- **AI Berkshire** : conseil en investissement boursier, gros consommateur de jetons, hors du métier de Finjaro ; Claudinette fait de la comptabilité, pas du conseil en placement.
- **Impeccable** installe des automatismes (« hooks ») dans l'outil de code ; à relire par Claude/Ada avant tout usage. Ses règles vont vers un design « moderne » qui peut contredire le style vintage : filtre obligatoire.
- La page est une page de vente : témoignages nominatifs non vérifiables, « remplacer ton équipe », « plusieurs milliers d'euros de valeur ». Aucune donnée de ces personnes n'est reprise ici. Le formulaire recueille des numéros de téléphone : ne pas le remplir.

## Verdict

Retenu pour trois compétences : le cadrage par vagues de questions (Alpha, Orchestre, Lien), la veille des 30 derniers jours (Vigie, Radar, Plume) et la critique des tics de l'IA filtrée par le style maison (Miroir). **wshobson/agents** est gardé en réserve comme réservoir de fiches de développement pour Claude et Ada. **Last 30 Days** (l'outil) est mis de côté parce qu'il repose sur des clés payantes et les cookies de comptes personnels ; **AI Berkshire** est mis de côté parce que le conseil en bourse n'est pas le métier de Finjaro.
