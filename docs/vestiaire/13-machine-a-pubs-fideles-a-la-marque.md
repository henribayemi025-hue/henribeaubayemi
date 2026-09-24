# 13 — « The On-Brand Ad Machine » (Pletor + Jev)

- **Source** : https://pletor-ai.notion.site/the-on-brand-ad-machine-jev
- **Type** : page Notion publique (tutoriel promotionnel de Pletor, un outil de création publicitaire)
- **Accès** : texte lu en entier par l'interface publique de Notion : 113 blocs, dont les deux tableaux et les trois grilles JSON. **Les deux vidéos intégrées n'ont pas été regardées** : un fichier .MOV d'introduction et une capture d'écran de l'étape 6. Les liens externes n'ont pas été suivis : chaîne YouTube, documentation Jev, blog Pletor, lien d'agent Pletor.
- **Licence / droits** : aucune licence (tous droits réservés). On reprend la méthode, pas les textes ni les grilles telles quelles.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un tutoriel décrit une chaîne pour produire des publicités sur les réseaux sans sortir de la marque.
1. On range les règles de marque dans une mémoire (« Brain »).
2. On récupère les publicités actives de 10 marques : 5 concurrentes et 5 marques « voisines ».
3. Un modèle de décision (« Jev », de TypeSafe) note chaque publicité avec des grilles fixes, et on garde les 10 meilleures.
4. On vérifie les consignes de génération AVANT de dépenser des crédits.
5. On génère les visuels puis on les anime.
6. On contrôle chaque résultat contre les règles de marque, avec trois voies : publier, relire à la main, refuser.

Le tout est piloté depuis Claude Code et vend au passage la plateforme Pletor.

## Ce qui est vraiment utile pour Finjaro et Léo
- **La mémoire de marque d'abord.** Sans règles écrites, rien ne peut juger si un contenu est « dans la marque ». Détail très concret : nommer les couleurs par leur nom (terracotta, laiton, crème) et pas par leur code, parce qu'un modèle de texte ne sait pas comparer des codes couleur.
- **Juger avec des grilles fixes plutôt qu'avec un « qu'en penses-tu ? »** :
  - chaque question a ses réponses possibles définies à l'avance (3 niveaux décrits, ou oui/non avec la définition de chaque cas) ;
  - on note chaque élément un par un ;
  - on classe ensuite par un calcul à poids fixes.

  Quand le classement ne plaît pas, on change un poids : on ne réécrit pas le prompt au hasard.
- **Vérifier la consigne avant de générer.** Une consigne est du texte : la contrôler ne coûte presque rien. La génération d'image ou de vidéo coûte cher. On attrape donc les conflits avec les règles AVANT : élément interdit, élément obligatoire absent, promesse risquée.
- **Trois voies au lieu de deux** : sûr → on publie ; incertain → un humain relit ; clairement contraire → on refuse et on réécrit. Le bon indicateur n'est pas « précision » mais **la part du volume qui passe sans relecture**. Si 40 % part en relecture humaine, on a construit une version chère de ce qu'on avait déjà.
- **Les refus nourrissent la mémoire.** Chaque refus, avec sa raison, retourne dans les règles de marque. La prochaine série en produit moins. Ça ne s'améliore que si on écrit ce retour : ce n'est pas automatique.
- **Chercher des angles chez les marques voisines**, pas seulement chez les concurrents. Les concurrents montrent les codes du secteur ; les voisines montrent des idées que le secteur n'a pas encore.
- **Une leçon involontaire.** La page publiée contient, à la fin, une relecture laissée par une IA et jamais retirée (« Before you publish — three things »). Cette relecture dit elle-même que :
  - le chiffre vedette « 40 pubs en 10 minutes » n'a jamais été mesuré ;
  - une affirmation sur l'accès sans liste d'attente était fausse ;
  - l'adresse de l'API citée n'est pas l'officielle.

  C'est exactement le contrôle qu'on veut chez nous (CLAUDE.md §3), et la preuve qu'il faut relire ce qu'on publie jusqu'à la dernière ligne.

## Pour quels agents de Léo
- **Écho (marketing) et Plume (contenu et réseaux)** : toute la chaîne, en version Finjaro. Mémoire de marque, vérification des consignes avant de générer un visuel, contrôle du résultat.
- **Miroir (critique des pages)** : le contrôle final en trois voies et la règle « nommer les couleurs », appliqués aux pages et aux visuels.
- **Forge (IA)** : la technique des grilles à réponses fixes et du classement par calcul. Elle s'applique à tout tri automatique : fiches produit, messages, publicités.
- **Vigie (veille)** : relever chaque mois les publicités des concurrents et des marques voisines, par exemple dans la bibliothèque publicitaire publique de Meta.
- **Rigo (qualité)** : régler les seuils sur 30 exemples déjà jugés par un humain, mesurer la part qui passe sans relecture.
- **Orchestre** : la chaîne est un bon « modèle d'entreprise » pour Léo (une étape = un agent, un humain à la fin).
- **Mentor** : transformer le « Brain » en fiche de marque Finjaro que tous les agents de contenu reçoivent.

## Compétences à tirer (pour Mentor)

**Tenir à jour la fiche de marque Finjaro** — Écho, Plume, Miroir (Mentor la distribue)
Avant de produire un contenu, relis la fiche de marque et vérifie qu'elle contient :
- les couleurs nommées en mots (crème, terracotta, laiton) ;
- le ton ;
- la phrase de positionnement qu'on défend ;
- ce qu'on ne dit jamais : pas de pays qui enferme Finjaro, pas de « diaspora », pas de chiffre non mesuré, pas de photo prise sur le web ;
- les éléments obligatoires (logo, devise de l'acheteur) ;
- quelques contenus qui ont bien marché.

Si une règle manque, propose-la à Beau au lieu de l'inventer. Chaque fois qu'un contenu est refusé, ajoute la raison du refus à la fiche, sinon la même erreur reviendra. Piège : décrire les couleurs par leur code (#C25E38 pour la terracotta) : un agent qui lit du texte ne peut pas comparer des codes.
*Source : idée tirée de l'étape « Build the Brain », réécrite.*

**Vérifier une consigne de visuel avant de la lancer** — Plume, Écho, Forge
Avant de demander une image ou une vidéo à un outil de génération, relis ta consigne et réponds à quatre questions :
1. Demande-t-elle quelque chose que la fiche de marque interdit ?
2. Contient-elle tous les éléments obligatoires ?
3. Fait-elle affirmer au visuel une promesse chiffrée, de santé ou de performance qu'on ne peut pas prouver ?
4. Est-elle assez précise (sujet, décor, cadrage, place du produit) pour ne pas laisser l'outil deviner ?

Si une réponse est mauvaise, corrige la consigne avant de générer : c'est gratuit maintenant, cher après. Piège : générer d'abord, puis trier. On paie alors pour des visuels qui étaient condamnés d'avance.
*Source : idée tirée de l'étape 5, réécrite.*

**Noter avec une grille fixe, classer par calcul** — Forge, Vigie, Écho
Quand tu dois trier beaucoup d'éléments (publicités vues en veille, idées, fiches produit), ne demande pas « quels sont les meilleurs ? ». Écris 2 à 4 questions. Chacune a ses réponses possibles décrites à l'avance, par exemple 3 niveaux : « banal, on l'a vu partout / bien fait mais connu / idée jamais vue dans le secteur ». Note chaque élément séparément sur toutes les questions, puis calcule un score à poids fixes, par exemple 45 % originalité, 40 % accord avec Finjaro, 15 % faisable avec nos moyens. Élimine d'office ce qui repose sur une célébrité ou une marque tierce. Si le classement ne convient pas à Beau, change un poids et recommence. Piège : ne réécris pas les questions à chaque essai, sinon tu ne peux plus comparer les résultats.
*Source : idée tirée de l'étape 4, réécrite.*

**Trois voies : publier, faire relire, refuser** — Miroir, Rigo, Orchestre
Pour chaque contenu contrôlé :
- publie seul uniquement quand toutes les vérifications sont nettement bonnes ;
- envoie en relecture humaine dès qu'une vérification est incertaine ;
- refuse et fais réécrire quand une règle est clairement violée.

Au début, pars de seuils prudents. Fais passer 30 contenus déjà jugés par Beau et compare : là où tu te trompes, déplace le seuil. Suis chaque semaine la part de contenus qui passent sans relecture : si elle est faible, la chaîne coûte plus qu'elle ne rapporte, et il faut le dire. Piège : croire qu'une réponse « valide » est une réponse juste. Un contrôle peut répondre proprement « conforme » et se tromper.
*Source : idée tirée des étapes 5 et 7 et de la section « before you trust it », réécrite.*

**Relire jusqu'à la dernière ligne avant de publier** — Plume, Écho, Miroir
Avant toute publication (page, post, guide), relis le texte final en entier, dans sa version publiée si possible. Cherche trois choses :
- des restes de travail : notes internes, questions d'une IA (« veux-tu une version LinkedIn ? »), mentions « à vérifier » ;
- chaque chiffre : est-il mesuré, avec sa source ? Sinon, retire-le ou écris ce qu'on sait vraiment ;
- chaque adresse et chaque nom d'outil : est-ce l'officiel ?

Piège : relire seulement le début. Les restes se cachent en bas de page, comme dans cette ressource, qui a publié la relecture de son IA avec la liste de ses propres erreurs.
*Source : leçon tirée de la page elle-même.*

## Limites, risques, prudence
- **Page promotionnelle** : elle vend Pletor (crédits de génération payants) et contient un lien d'affiliation. Les performances ne sont pas démontrées. Le chiffre vedette n'est pas mesuré, et la page le reconnaît elle-même dans la relecture laissée en bas.
- **Jev / TypeSafe** : outil récent, accès direct sur liste d'attente, sinon via des passerelles tierces (Vercel, OpenRouter, Cloudflare). Tarif annoncé : 0,042 USD par million de jetons en entrée, non vérifié. L'idée de « probabilité calibrée » n'est pas prouvée sur nos données. On garde la méthode (grilles fixes et seuils), pas l'outil. Un modèle ordinaire, avec une réponse imposée, peut faire la même chose.
- **Ne rien installer** : la page demande d'installer une extension Claude Code (`claude plugin install …`). Pas sans l'accord de Beau, et seulement côté Claude.
- **Copier des publicités concurrentes** : on s'inspire d'un angle, on ne reprend jamais les images ni les textes. Rappel CLAUDE.md §3 : aucune photo prise sur le web, les visuels viennent des vendeuses ou de Beau.
- **Contrôle d'image** : un modèle de texte ne voit pas les images. Il faut d'abord un modèle de vision qui décrit l'image, et c'est la partie lente et chère.
- **Pas de ciblage par pays dans les messages** : si Vigie relève des publicités locales, les contenus produits restent conformes à l'identité mondiale de Finjaro (CLAUDE.md §1).

## Verdict
**Retenu pour la méthode**, qui manque aujourd'hui à Écho, Plume et Miroir :
- une fiche de marque écrite et enrichie par les refus ;
- la vérification de la consigne avant de générer ;
- des grilles fixes et un classement par calcul ;
- trois voies (publier / relire / refuser), mesurées par la part qui passe sans relecture ;
- relire jusqu'à la dernière ligne.

Les outils (Pletor, Jev) sont **mis de côté** : payants, promotionnels, pas nécessaires pour appliquer la méthode.
