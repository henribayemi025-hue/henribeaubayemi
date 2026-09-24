# 14 — AI Vault (boutique de « systèmes IA prêts à l'emploi »)

- **Source** : https://ai-vault-ochre.vercel.app/
- **Type** : site web (boutique et annuaire d'outils IA, en construction). Signé du compte seb.ai, le même nom que la ressource 17.
- **Accès** : **partiel**.
  - Lus en entier : la page d'accueil, 18 pages intérieures (fonctionnement, catalogue, banc d'essai, cimetière, prix, conditions, deux fiches produit, etc.) et une fiche d'outil (LibreChat).
  - Beaucoup de pages sont des coquilles vides : « SHELL · populates in VAULT-12 », « Terms of service publish before launch ».
  - **Les produits payants (de 1 à 199 USD) n'ont pas été achetés** : leur contenu n'est connu que par la table des matières affichée sur leur page.
- **Licence / droits** : aucune licence affichée, conditions d'utilisation pas encore publiées. Contenu commercial : on ne reprend ni texte ni produit, seulement des idées de fonctionnement décrites publiquement.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Une vitrine qui vend des « systèmes IA » à télécharger : packs de prompts, kits Claude Code, automatisations, modèles pour agences, créateurs, commerces locaux. Les prix vont d'un produit d'appel à 1 USD à un pack complet à 199 USD. Elle comprend aussi un annuaire de 20 outils open source (n8n, Ollama, CrewAI, Claude Code…) avec leurs étoiles GitHub. Elle annonce aussi un banc d'essai public, un « cimetière » public des outils retirés, une lettre hebdomadaire et des parcours d'apprentissage. Presque tout, hors boutique, est encore vide.

## Ce qui est vraiment utile pour Finjaro et Léo
La valeur n'est pas dans les produits. Elle est dans **la charte « How the Vault works »**, qui décrit des règles de confiance très proches des nôtres (CLAUDE.md §3) :
- **Chaque chiffre est relevé, jamais tapé à la main**, avec la date du relevé visible. Si on ne peut pas le vérifier, on ne l'affiche pas.
- **Aucun faux témoignage, aucun faux nombre de membres**, pas de rubrique « avis » tant qu'il n'y a pas de vrais avis.
- **Pas de faux prix barré** (« habituellement 99 $ »), pas de compte à rebours, pas de précommande.
- **Tout lien rémunéré est signalé juste à côté du lien.**
- **Un banc d'essai public** : rien n'entre sans avoir été testé. Trois issues : promu, refusé avec une raison datée, ou expiré.
- **Un cimetière public** : un outil retiré garde sa page, avec la date et la raison du retrait. « Un annuaire qui ne fait qu'ajouter pourrit lentement. » C'est mot pour mot l'esprit de la consigne de Beau pour ce vestiaire : rien n'est jeté sans raison écrite.

**Contre-exemple tout aussi instructif** : le site ne tient pas encore ses propres promesses.
- Il se décrit comme « chaque système personnellement construit ou testé », alors que les fiches d'outils disent « verdict en attente, pas encore testé ».
- Il promet une mise à jour des étoiles « chaque nuit », mais la date affichée est le 4 août, sept semaines plus tôt.
- Il vend avec bouton d'achat alors que ses conditions générales « seront publiées avant le lancement ».

C'est exactement le genre d'écart que Miroir et Vigie doivent savoir repérer, chez les autres comme chez nous.

## Pour quels agents de Léo
- **Vigie (veille)** : le banc d'essai et le cimetière sont la bonne forme pour notre propre veille d'outils. Le repérage des écarts entre promesse et réalité l'aide à trier des ressources comme celle-ci.
- **Mentor** : même logique pour le catalogue de compétences des agents. Une compétence entre après essai, sort avec une raison datée, et sa fiche reste lisible.
- **Rigo (qualité)** : vérifier que chaque chiffre affiché sur finjaro.net ou dans Léo a une source et une date.
- **Miroir (critique des pages)** : chercher les coquilles vides, les dates figées, les promesses que la page ne tient pas.
- **Écho et Plume** : les règles « pas de faux prix barré, pas de compte à rebours, lien rémunéré signalé » pour toute campagne.
- **Lien (relation)** : conseiller les vendeuses sur des prix honnêtes, sans faux « avant / après ».
- **Ada Nkemba** : afficher la date de relevé à côté de tout compteur public, et masquer un compteur plutôt que d'afficher un chiffre non mesuré.
- **Orchestre et Alpha** : l'idée, visible seulement dans le titre d'un produit payant, qu'il faut d'abord savoir quand NE PAS lancer plusieurs agents.

## Compétences à tirer (pour Mentor)

**N'afficher qu'un chiffre mesuré, avec sa date** — Ada Nkemba, Écho, Plume, Rigo
Tout chiffre montré au public (vendeuses, commandes, visites, téléchargements) doit venir d'une requête ou d'un relevé, jamais d'une saisie à la main. Il doit exclure les comptes de test (`profiles.is_test`, `compte_reel()`). À côté, indique la date du relevé (« au 24/09 »). Si le relevé est trop ancien ou impossible, n'affiche rien plutôt qu'un chiffre approximatif. Un compteur vide vaut mieux qu'un compteur faux. Piège : une date « mise à jour chaque nuit » qui ne bouge plus. Vérifie que la date change vraiment, sinon le chiffre ment en silence.
*Source : idée tirée de la charte publique d'AI Vault, réécrite ; rejoint CLAUDE.md §3 et §8.*

**Banc d'essai et cimetière pour nos outils et nos compétences** — Vigie, Mentor, Rigo
Quand un nouvel outil ou une nouvelle compétence est proposé, inscris-le au « banc » avec la date et ce qu'on va tester. Il n'en sort que de trois façons :
- **retenu**, avec le résultat de l'essai ;
- **refusé**, avec la raison et la date ;
- **expiré**, si personne ne l'a testé dans le délai prévu.

Quand on retire un outil qu'on utilisait (abandonné par ses auteurs, remplacé, devenu payant ou dangereux), on ne l'efface pas : on garde sa fiche, avec la date et la raison du retrait. Piège : laisser des outils « en essai » pendant des mois. Ce n'est plus un banc, c'est un grenier.
*Source : idée tirée de « The Bench » et « The Graveyard » d'AI Vault, réécrite.*

**Repérer l'écart entre ce qu'un site promet et ce qu'il montre** — Vigie, Miroir
Pour juger une ressource ou une page, y compris les nôtres :
1. Relève ses promesses : « tout est testé », « mis à jour chaque jour », « gratuit », « des milliers d'utilisateurs ».
2. Ouvre trois ou quatre pages intérieures et vérifie chaque promesse : pages vides ou « bientôt », dates figées, verdicts « en attente », conditions générales absentes alors qu'on vend.
3. Résume en une ligne par promesse : tenue / non tenue / invérifiable.

Piège : juger sur la page d'accueil seule. C'est la plus soignée, et l'écart se voit toujours à l'intérieur.
*Source : méthode tirée de la lecture de ce site ; pas de reprise de texte.*

**Des prix et des promotions honnêtes** — Lien, Écho, Miroir, Ada Nkemba
Sur Finjaro, un prix barré n'est acceptable que si l'article a vraiment été vendu à ce prix. Un compte à rebours n'est acceptable que si l'offre s'arrête vraiment à cette heure-là. Quand tu aides une vendeuse à rédiger une fiche ou une promotion, propose un vrai argument (qualité, délai, fabrication) plutôt qu'un faux « -50 % ». Dans nos campagnes, tout lien qui nous rapporte une commission est signalé juste à côté. Piège : l'ancrage « habituellement X » paraît anodin, mais c'est ce qui fait perdre la confiance d'un acheteur au premier doute.
*Source : idée tirée de la charte publique d'AI Vault, réécrite, appliquée à la place de marché.*

**Un seul agent d'abord** — Orchestre, Alpha
Avant de découper une tâche entre plusieurs agents, demande-toi si un seul agent bien briefé ne suffit pas. Il en faut plusieurs seulement quand les parties sont vraiment indépendantes, ou quand un regard séparé est utile (une relecture, par exemple). Plusieurs agents, c'est plus de coordination, plus de coût et plus d'endroits où l'information se perd. Piège : multiplier les agents parce que « ça fait équipe ». Mesure si c'est plus rapide ou plus juste, sinon reviens à un seul.
*Source : idée générale suggérée par le titre d'un produit payant d'AI Vault (« quand ne pas utiliser plusieurs agents »). Son contenu n'a pas été lu, le texte est entièrement le nôtre.*

## Limites, risques, prudence
- **Site en construction** : la plupart des rubriques sont vides. Le « Drop #001 » sortira « au lancement ». Les prix des abonnements ne sont pas encore fixés.
- **Il vend déjà sans conditions générales publiées.** Aucun achat à faire pour Finjaro.
- **Promesses non tenues à ce jour** : « chaque système testé » contre « verdict en attente » ; « synchronisation chaque nuit » contre des données datées du 4 août ; quelques erreurs d'étiquetage (Claude Code présenté comme projet Python). Les chiffres d'étoiles ne sont pas à reprendre.
- **Produits payants non lus** : ne rien affirmer sur leur qualité. Ceux qui touchent aux commerces locaux ou aux agences seraient à évaluer seulement si Beau le décide, et l'achat reviendrait à Beau.
- **Ciblage** : le site vise créateurs, agences, commerces locaux, sans rapport direct avec une place de marché mondiale. Seules les règles de confiance nous servent.
- Pas de donnée personnelle reprise. Le nom du compte créateur n'est cité que pour faire le lien avec la ressource 17.

## Verdict
**Retenu pour sa charte de confiance**, pas pour ses produits :
- chiffres relevés et datés ;
- banc d'essai et cimetière publics, avec des raisons écrites ;
- pas de faux prix barré ni de faux témoignage ;
- liens rémunérés signalés.

Ces règles se traduisent directement pour Vigie, Mentor, Rigo, Miroir, Écho, Lien et Ada. Le site lui-même et sa boutique sont **mis de côté** : encore en construction, produits payants non vérifiables, conditions générales absentes. On peut y revenir dans quelques mois pour voir si le banc d'essai s'est rempli.
