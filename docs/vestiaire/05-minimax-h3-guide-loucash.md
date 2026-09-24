# 05 — MiniMax H3, « le modèle vidéo gratuit » (guide Loucash)

- **Source** : https://guides.0xloucash.xyz/Cr%C3%A9ation%20de%20Contenu/Guides%20DM/MiniMax%20H3%20-%20le%20modele%20video%20gratuit
- **Type** : guide (site Obsidian Publish, fiche « guide DM » d'un créateur de contenu)
- **Accès** : ouvert et lu en entier. La page est rendue en JavaScript ; le texte complet (fichier Markdown d'origine, daté du 29/08/2026) a été lu directement depuis le serveur Obsidian Publish. Les quatre images de la page n'ont pas été regardées (captures d'interface, sans texte utile).
- **Licence / droits** : aucune licence indiquée sur le guide (= tous droits réservés). Le modèle dont il parle est sous « MiniMax H3 Community License Agreement » (licence propriétaire à restrictions, lue en entier sur Hugging Face).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)

Un guide grand public qui présente MiniMax H3, un modèle chinois de génération vidéo sorti le 02/08/2026, capable de produire en une passe l'image, une voix, la synchronisation des lèvres et une musique. Il explique la différence entre « poids ouverts » et « open source », donne une fiche technique, trois façons de l'essayer (installation locale, version allégée Wan2GP via Pinokio, espaces Hugging Face en ligne) et met en garde contre les faux installeurs. Il se termine par une FAQ et un mot-clé à envoyer en message privé (c'est un aimant à abonnés).

## Ce qui est vraiment utile pour Finjaro et Léo

Le contenu vidéo lui-même sert peu à Léo aujourd'hui (aucun agent n'a de carte graphique ni de terminal hors Claude et Ada). Ce qui sert, c'est la **démarche de vérification** que le guide montre à moitié, et que j'ai terminée sur les sources officielles :

**Vérifié sur les sources officielles (licence, fiche du modèle, doc MiniMax, 24/09/2026) :**
- Modèle réel, publié par l'organisation officielle `MiniMaxAI` sur Hugging Face ; environ 5 600 « j'aime » et ~3,6 M de téléchargements affichés sur la période récente (le « 5 M+ » du guide n'est pas vérifiable tel quel). Les étoiles GitHub (« 7 900+ ») n'ont pas pu être vérifiées : GitHub est bloqué depuis notre environnement.
- « Open-weight, pas open-source » : **juste**. Le préprocesseur H3-Context-IR et le module 2K (Regenerate-2K) ne sont pas publiés ; ils ne sont disponibles que via l'API payante.
- 768 px sur le petit côté par défaut, durée 4 à 15 s, 11 langues de dialogue stables dont le français et l'anglais : **juste**.
- Poids complets d'environ 108 Go ; MiniMax ne publie **aucun** minimum de mémoire graphique. Les chiffres « 5-6 Go / 8-9 Go de VRAM » viennent de Wan2GP (outil tiers) et n'ont pas pu être vérifiés.
- **L'API officielle est payante** : 0,08 $/s en 768p, 0,13 $/s en 2K (grille « Pay as you go » de MiniMax). Donc « gratuit » n'est vrai que pour les poids, là où la licence les autorise.

**Ce que le guide dit de faux ou d'incomplet :**
- « Solution légale partout : les espaces Hugging Face en ligne » — **faux d'après le texte de la licence**. La licence couvre explicitement l'usage « y compris via des services hébergés » et interdit d'utiliser ou d'**afficher les œuvres ou leurs résultats** hors du territoire autorisé (UE, Royaume-Uni, Corée du Sud et États-Unis exclus). Un espace Hugging Face tenu par un particulier fait tourner les poids ouverts : il relève de cette licence. Seule l'API officielle de MiniMax est présentée par MiniMax comme utilisable partout (sous ses propres conditions, que je n'ai pas lues en détail).
- « Usage commercial autorisé sauf au-delà de 20 M$ » — vrai mais incomplet : un produit commercial doit **afficher « MiniMax H3 » dans son interface**, lier ses utilisateurs à la politique d'usage, et la politique interdit de publier du contenu généré **sans dire clairement qu'il est généré par une machine**, ainsi que les faux avis et le faux engagement.
- Le guide met en garde contre les `.exe` de dépôts inconnus (bon réflexe), mais recommande en même temps Pinokio, un installeur « en un clic » qui télécharge et exécute des scripts tiers : même type de risque, simplement plus connu.

## Pour quels agents de Léo

- **Vigie (veille)** — c'est typiquement le genre d'annonce qu'elle croise ; elle doit savoir séparer promesse et fait, et lire une licence avant de dire « gratuit ».
- **Forge (IA)** — c'est lui qui évaluerait un modèle vidéo pour Finjaro ; la grille de licence lui est indispensable.
- **Alpha (direction technique)** — décide si un outil entre dans la maison ; doit voir le piège territorial (Finjaro vise le monde entier, y compris UE/UK/US).
- **Écho et Plume (marketing, contenu)** — seraient les utilisateurs d'une vidéo générée ; doivent connaître l'obligation de signaler un contenu généré et l'interdiction des faux avis.

## Compétences à tirer (pour Mentor)

**Contrôler un outil IA avant de le recommander** — Vigie, Forge, Alpha
Quand s'en servir : dès qu'une annonce, un tutoriel ou un post vante un outil IA « gratuit », « open source » ou « révolutionnaire ».
Comment faire : 1) remonter à la source officielle (organisation de l'éditeur sur GitHub ou Hugging Face, pas un dépôt récent au nom proche) ; 2) lire la licence elle-même, pas le résumé d'un tiers ; 3) chercher la grille de prix officielle : « gratuit » concerne souvent les poids seulement, l'API est payante ; 4) noter pour chaque chiffre (étoiles, téléchargements, mémoire nécessaire) s'il est vérifié à la source ou seulement annoncé ; 5) rendre un avis en deux colonnes : « vérifié » et « annoncé, non vérifié ».
Pièges : un installeur `.exe`/`.dmg` pour un modèle IA est un signal d'alarme ; un installeur « en un clic » exécute aussi du code de tiers ; un chiffre recopié de blog en blog n'est pas une source. Ne jamais écrire « c'est gratuit » ou « c'est légal » sans avoir lu la licence.

**Lire la licence d'un modèle génératif : sept questions** — Forge, Alpha, Écho, Plume
Quand s'en servir : avant de proposer d'utiliser un modèle d'image, de vidéo, de voix ou de texte pour quoi que ce soit de public chez Finjaro.
Les sept questions : 1) Où a-t-on le droit de s'en servir, et **où a-t-on le droit de montrer ce qu'il produit** ? Finjaro s'adresse au monde entier : une exclusion de territoire sur les résultats bloque presque tout usage public. 2) Les services hébergés (API, espaces en ligne) sont-ils couverts par la même licence ? 3) Y a-t-il un seuil de chiffre d'affaires ou une autorisation écrite à demander ? 4) Faut-il afficher le nom du modèle dans l'interface ou sur le contenu ? 5) La politique d'usage impose-t-elle de signaler un contenu généré ? interdit-elle faux avis, usurpation de voix ou de visage ? 6) Peut-on réutiliser les résultats pour entraîner un autre modèle ? 7) Quel droit s'applique en cas de litige ?
Rendu : un tableau court question → réponse → article de la licence. Si une réponse bloque, le dire en premier.

## Limites, risques, prudence

- **Territoire** : la licence exclut l'UE, le Royaume-Uni, la Corée du Sud et les États-Unis, pour l'usage comme pour l'affichage des résultats. Finjaro étant une place de marché mondiale, publier une vidéo H3 faite avec les poids ouverts poserait problème dès qu'elle est vue dans ces pays. Le guide conseille aussi le VPN « sous ta seule responsabilité » : à ne jamais reprendre.
- **Règles Finjaro** : aucune photo d'article prise sur le web, aucun chiffre inventé. Une vidéo générée ne doit jamais montrer un article comme s'il était réel, ni une fausse cliente.
- **Coût** : la voie légale mondiale (API) coûte environ 0,80 $ pour 10 s en 768p ; ce n'est pas « gratuit ».
- Le guide lui-même est un contenu d'appel (mot-clé à envoyer en message privé) sans licence : on s'inspire de la démarche, on ne reprend pas le texte.
- Non vérifié : étoiles GitHub, chiffres de VRAM de Wan2GP, « installeur Apple Silicon » évoqué dans la FAQ (GitHub inaccessible depuis ici ; la doc MiniMax ne le mentionne pas).

## Verdict

Retenu pour la **méthode de vérification** (provenance, poids ouverts contre open source, lecture de licence), transformée en deux compétences pour Vigie, Forge, Alpha, Écho et Plume. L'outil MiniMax H3 lui-même est **mis de côté** pour Finjaro parce que sa licence interdit l'usage et l'affichage de ses résultats dans l'UE, au Royaume-Uni, en Corée du Sud et aux États-Unis, ce qui est incompatible avec une place de marché mondiale ; à réexaminer seulement via l'API officielle, après lecture de ses conditions et accord de Beau.

## Complément (24/09, question de Beau : « un autre modèle gratuit utilisable partout ? »)
Licences lues sur Hugging Face le 24/09/2026 :
- **Wan 2.2 (Alibaba, organisation Wan-AI)** : Apache-2.0 — usage commercial libre, **aucune exclusion de pays**. Versions texte→vidéo et image→vidéo (14B), une version légère 5B, une version « parole → vidéo » (S2V), et Wan2.2-Animate-2 (août 2026). C'est l'alternative propre à MiniMax H3.
- **LTX-2 (Lightricks)** : licence communautaire — gratuite sous 10 M$ de chiffre d'affaires annuel, pas d'exclusion de l'UE (seulement les pays sous sanctions).
- **Mochi 1 (Genmo)** : Apache-2.0, plus ancien.
- À éviter pour nous : **HunyuanVideo (Tencent)**, licence « tencent-hunyuan-community » à restrictions territoriales, comme MiniMax H3.
« Gratuit » veut dire : les poids sont libres. Il faut une carte graphique pour les faire tourner (la 5B de Wan tourne sur une carte grand public, les 14B demandent une grosse carte ou une machine louée à l'heure), ou passer par un service en ligne payant.
