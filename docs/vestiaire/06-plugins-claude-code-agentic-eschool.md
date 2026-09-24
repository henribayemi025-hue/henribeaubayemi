# 06 — Les 4 plugins Claude Code à installer avant de coder (Agentic eSchool)

- **Source** : https://www.agentic-eschool.com/guide/plugins-claude-code
- **Type** : guide (site d'une école en ligne sur l'IA)
- **Accès** : ouvert et lu en entier depuis le code de la page. À l'écran, la seconde moitié est floutée derrière un formulaire « Lis la suite gratuitement » qui demande une adresse e-mail ; je ne l'ai pas rempli, le texte complet étant déjà présent dans la page.
- **Licence / droits** : aucune licence sur le guide (= tous droits réservés). Les quatre outils présentés, vérifiés à la source : Ponytail (MIT), Graphify (Apache-2.0, le dépôt annonce aussi MIT), Agent Skills (MIT), OmniRoute (MIT).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)

Un guide qui recommande quatre extensions pour Claude Code, chacune contre un défaut précis : **Graphify** fabrique une carte du code (qui appelle quoi) pour éviter de relire les fichiers un par un ; **Ponytail** oblige l'agent à se demander si du code est vraiment nécessaire avant d'en écrire ; **Agent Skills** (25 fiches) impose une méthode d'ingénieur (spécifier, découper, tester, relire, livrer par étapes) ; **OmniRoute** bascule vers d'autres fournisseurs de modèles quand l'abonnement est épuisé. Il donne les commandes d'installation et un ordre conseillé. Le bas de page vend un « challenge » de 30 jours et un agent payant.

## Ce qui est vraiment utile pour Finjaro et Léo

- **L'échelle de Ponytail** (vérifiée sur le dépôt) : avant d'écrire, descendre une série de questions — faut-il que ça existe ? est-ce déjà dans le projet ? la bibliothèque standard ou le navigateur le fait-il ? une dépendance déjà installée ? une ligne suffit-elle ? — et ne jamais rogner sur la validation, la sécurité ni l'accessibilité. C'est exactement ce qu'il faut à Ada et Claude sur un dépôt Finjaro déjà gros.
  Chiffres : −54 % de code, −22 % de jetons, −20 % de coût, mesurés **par l'auteur** sur 12 tâches (modèle Haiku 4.5, un dépôt FastAPI + React). Le guide les rapporte honnêtement, avec la nuance « presque rien sur du code déjà minimal ». Non reproduits par nous.
- **Le format « excuses → réponses » d'Agent Skills** : chaque fiche liste les prétextes que l'agent se donne pour sauter une étape (« j'ajouterai les tests après ») et la réponse à chacun. C'est un **modèle d'écriture de fiche** directement utile à Mentor, puisque nos compétences sont justement des fiches lues par les agents.
- **La discipline spec → plan → tranches** d'Agent Skills : interroger avant d'écrire, découper en petites tâches, livrer et vérifier une tranche à la fois, s'arrêter au premier échec.
- **Graphify** : utile seulement pour les sessions Claude/Ada sur le gros dépôt (analyse du code en local, sans modèle, sans télémétrie selon le dépôt ; les documents et PDF, eux, passent par un modèle). À garder en réserve.
- **OmniRoute** : voir « Limites ». Ne sert pas Léo.

Vérifications faites le 24/09/2026 : licences lues sur les dépôts, paquets `graphifyy` (PyPI, Apache-2.0) et `omniroute` (npm, MIT) existent bien. Étoiles lues sur GitHub : Graphify ~121 k, Agent Skills ~99 k, OmniRoute ~70 k, Ponytail ~145 k — plus élevées que les chiffres du guide (117 k, 93 k, 65 k), ce qui est normal pour des dépôts en croissance.

## Pour quels agents de Léo

- **Ada Nkemba (développeuse place de marché)** et **Claude (développeur de Léo)** — ce sont les seuls à écrire du code ; l'échelle du moins de code et la livraison par tranches les concernent directement.
- **Rigo (qualité et améliorations continues)** — peut appliquer l'échelle en relecture : « qu'est-ce qui est en trop dans ce changement ? ».
- **Alpha (direction technique)** — arbitre ce qui entre dans le dépôt ; la méthode spec → plan → tranches est sa grille.
- **Mentor (formation des agents)** — reprend le format « excuses → réponses » pour écrire des fiches qui résistent aux raccourcis.
- **Orchestre** — pas de compétence directe, mais l'idée d'OmniRoute (continuer quand un budget tombe) rejoint le budget mensuel par agent déjà présent dans Léo ; on ne la reprend pas (voir limites).

## Compétences à tirer (pour Mentor)

**L'échelle du moins de code** — Ada Nkemba, Claude, Rigo
Quand s'en servir : avant d'écrire la moindre ligne, et en relisant un changement.
Comment faire : descendre les marches dans l'ordre et s'arrêter à la première qui répond. 1) Faut-il vraiment que ça existe ? 2) Le dépôt Finjaro le fait-il déjà quelque part (composant, fonction, colonne) ? 3) Le langage ou le navigateur le fait-il nativement (un champ date HTML plutôt qu'une bibliothèque) ? 4) Une dépendance déjà installée le fait-elle ? 5) Une ligne suffit-elle ? 6) Seulement alors : le minimum qui marche.
Jamais sur la liste des économies : la validation des données qui arrivent, les droits d'accès, la gestion d'une perte de données, l'accessibilité, les règles de la maison (devise de l'acheteur, devise de la boutique côté vendeur, migrations additives).
Piège : « moins de code » ne veut pas dire raboter le style vintage de Finjaro ; le décor n'est pas du code en trop.

**Écrire une fiche qui résiste aux excuses** — Mentor
Quand s'en servir : chaque fois que Mentor rédige ou révise une compétence pour un agent.
Comment faire : sous la méthode, ajouter un court bloc « Les excuses que tu vas te donner » avec 3 à 5 prétextes réalistes pour ce métier, chacun suivi de sa réponse en une phrase. Exemples : « le chiffre a l'air plausible » → « s'il n'est pas mesuré, il ne s'écrit pas » ; « je vérifierai après publication » → « Finjaro est en ligne pour tout le monde dès la poussée ».
Pièges : garder la fiche sous 2 500 caractères (Léo tronque au-delà et n'en charge que quatre par agent) ; écrire avec ses mots, pas copier la fiche d'un tiers ; une excuse vague (« par paresse ») n'aide pas, il faut la phrase exacte que l'agent se dirait.

**Spécifier, découper, livrer par tranches** — Alpha, Ada Nkemba, Claude
Quand s'en servir : dès qu'une demande dépasse une petite correction.
Comment faire : 1) écrire en quelques lignes ce qui doit être vrai à la fin, pour qui, et ce qui est hors sujet ; 2) poser les questions qui manquent avant de coder ; 3) découper en tranches qui chacune laissent le site fonctionnel ; 4) livrer une tranche, la vérifier réellement (pas seulement « la compilation passe »), puis passer à la suivante ; 5) s'arrêter et le dire au premier échec au lieu d'empiler.
Pièges : chez Finjaro, une poussée sur la branche de production part en ligne tout de suite, y compris dans les applications mobiles ; une CI verte ne prouve pas qu'une version est en ligne ; ne jamais annoncer « c'est fait » sans l'avoir constaté.

## Limites, risques, prudence

- **OmniRoute** est écarté pour Finjaro : il ferait passer notre code et nos conversations par des fournisseurs gratuits variables (le dépôt lui-même en classe 13 « à éviter » pour leurs conditions d'utilisation), sans contrôle sur ce qu'ils gardent. Le code de Finjaro et les échanges de travail n'ont pas à partir chez des inconnus ; c'est un risque de fuite, pour une économie qui ne nous concerne pas (nos agents ont un budget, pas une limite d'abonnement à contourner).
- Les chiffres de Ponytail sont mesurés par son auteur, sur un seul dépôt et un seul modèle : indicatifs, pas garantis.
- Installer des extensions ajoute du code tiers qui s'exécute à chaque session (Ponytail et Agent Skills se déclenchent automatiquement) : à relire avant installation par Claude/Ada, pas par les autres agents (pas de terminal).
- Le guide sert aussi d'aimant commercial (formulaire e-mail, challenge, agent payant « de 0 à 70 000 abonnés » non vérifiable) : on garde la méthode, pas les promesses.

## Verdict

Retenu pour trois compétences (échelle du moins de code, fiche qui résiste aux excuses, livraison par tranches) destinées à Ada, Claude, Rigo, Alpha et Mentor. **Graphify** est gardé en réserve pour les sessions de code sur le gros dépôt, si la relecture de fichiers devient un vrai coût. **OmniRoute** est mis de côté parce qu'il enverrait code et données vers des fournisseurs non maîtrisés, sans bénéfice pour Léo.
