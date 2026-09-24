# 02 — Anthropic Skills (le dépôt officiel des compétences de Claude)

- **Source** : https://github.com/anthropics/skills
- **Type** : dépôt GitHub
- **Accès** : ouvert. Cloné le 24/09/2026 (dernier commit du même jour). Lus en entier : README, THIRD_PARTY_NOTICES (en-tête), gabarit, `skill-creator` (SKILL.md + agent `grader.md`), `internal-comms` (SKILL.md + ses 4 exemples), `discernment-nudge`, `doc-coauthoring`, `frontend-design`. Lus en partie : `academy-guide`, `claude-api`, `webapp-testing`, `mcp-builder`, `theme-factory`, `brand-guidelines`. Seulement l'en-tête pour les autres (`algorithmic-art`, `canvas-design`, `slack-gif-creator`, `web-artifacts-builder`). Les 4 compétences sous licence propriétaire (`docx`, `pdf`, `pptx`, `xlsx`) : seulement l'en-tête et la licence, volontairement (voir plus bas). Le fichier `spec/` ne contient qu'un lien vers agentskills.io, que je n'ai pas ouvert.
- **Licence / droits** : licence mixte, compétence par compétence.
  - **Apache-2.0** (réutilisable en citant la source) : 14 compétences, à savoir academy-guide, algorithmic-art, brand-guidelines, canvas-design, claude-api, discernment-nudge, frontend-design, internal-comms, mcp-builder, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder et webapp-testing.
  - **Propriétaire, « tous droits réservés »** : `docx`, `pdf`, `pptx`, `xlsx`. Leur licence interdit expressément de les copier, de les extraire et d'en faire des œuvres dérivées. On n'en tire rien.
  - **Sans fichier de licence** : `doc-coauthoring`. Le README dit seulement que « beaucoup » de compétences sont en Apache-2.0. Dans le doute, on la traite comme tous droits réservés : on reprend l'idée, pas le texte.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
C'est la bibliothèque de référence d'Anthropic pour les « skills » : chaque compétence est un dossier avec un fichier `SKILL.md`. Ce fichier contient un nom, une description qui dit QUAND s'en servir, puis des consignes. Le dépôt compte 19 compétences, un gabarit minimal et, surtout, `skill-creator`, la méthode d'Anthropic pour écrire une compétence, la tester et l'améliorer. C'est exactement le métier de Mentor. Le reste est un catalogue d'exemples : communication interne, rédaction de documents, design, tests d'applications web, création de serveurs MCP, documents Office.

## Ce qui est vraiment utile pour Finjaro et Léo
- **La méthode d'écriture d'une fiche** (`skill-creator`, Apache-2.0) :
  - la description est ce qui fait qu'un agent pense à la fiche : elle doit dire le quoi ET le quand ;
  - expliquer le pourquoi vaut mieux qu'empiler des « TOUJOURS / JAMAIS » en majuscules ;
  - garder la fiche courte et généraliser plutôt que coller aux exemples ;
  - relire le déroulé des essais, pas seulement le résultat final.
- **La boucle de test d'une fiche** : quelques demandes réalistes, chaque demande lancée avec et sans la fiche, des critères vérifiables, un correcteur, puis une réécriture. Le correcteur (`grader.md`) doit aussi dénoncer les critères trop faciles, qui « passent » même quand le travail est mauvais. C'est la meilleure idée du dépôt pour Rigo.
- **Les cas « presque »** : pour tester le déclenchement d'une fiche, les meilleurs contre-exemples sont ceux qui lui ressemblent mais ne doivent pas la déclencher.
- **Le point hebdomadaire « Progrès / Plans / Problèmes »** (`internal-comms`, Apache-2.0) : un format lisible en moins d'une minute, directement utilisable pour les comptes rendus des agents à Beau.
- **Les « questions de recul »** (`discernment-nudge`, Apache-2.0) : après un conseil, une estimation ou un brouillon que Beau va utiliser, 2 ou 3 questions précises qui l'aident à vérifier. Au plus une fois par conversation, et jamais s'il a déjà demandé une vérification.
- **Le test du lecteur neuf** (`doc-coauthoring`, idée seulement) : on donne le document fini à un agent qui n'a AUCUN contexte, avec les questions qu'un lecteur poserait, et on regarde ce qu'il comprend de travers.
- **La partie « écrire dans une interface »** de `frontend-design` (Apache-2.0) :
  - nommer les choses comme l'utilisateur les comprend ;
  - un bouton dit exactement ce qu'il fait ;
  - une action garde le même nom de bout en bout ;
  - un message d'erreur dit ce qui s'est passé et comment réparer.

## Pour quels agents de Léo
- **Mentor** : c'est son manuel. Écrire une fiche, la tester, la corriger, soigner la description qui la déclenche.
- **Rigo** : la boucle de test avec et sans fiche, et le correcteur qui critique aussi ses propres critères, lui donnent une méthode pour mesurer si une amélioration en est vraiment une.
- **Orchestre** : le format Progrès / Plans / Problèmes peut devenir le compte rendu commun à tous les agents. C'est aussi à lui d'organiser les essais avec et sans fiche (il faut lancer plusieurs agents à part).
- **Lien** : les questions de recul, quand il transmet à Beau un conseil ou une estimation.
- **Claudinette** : même raison. Une estimation comptable est typiquement le cas où deux questions de vérification évitent une erreur coûteuse.
- **Alpha** : les questions de recul sur ses recommandations techniques, et `claude-api` comme référence quand il faut choisir un modèle ou le paramétrer (voir Limites).
- **Plume** : le test du lecteur neuf avant de publier un texte long, et les règles d'écriture d'interface pour les libellés.
- **Miroir et Ada Nkemba** : les règles d'écriture d'interface, pour critiquer ou corriger les libellés des pages.
- **Claude** (développeur de Léo) : `claude-api` et `mcp-builder` s'il faut brancher de nouveaux outils sur les agents (il a accès aux fichiers et au terminal).

## Compétences à tirer (pour Mentor)

**Écrire une fiche de compétence** — Mentor
Commence par la description : elle doit dire ce que fait la fiche ET dans quelles situations l'utiliser, avec les mots que l'agent rencontrera vraiment. Un agent ne lit une fiche que s'il la reconnaît. Dans le corps, donne l'ordre des étapes et, pour chaque règle importante, sa raison en une phrase : un modèle qui comprend le pourquoi se trompe moins qu'un modèle qui obéit. Mets un exemple court de bon résultat. Reste court : nos agents reçoivent la fiche entière dans leur consigne et ne peuvent pas ouvrir de fichier annexe, donc tout doit y tenir. Piège : les majuscules et les « JAMAIS » à répétition. Garde-les pour les vraies lignes rouges de Finjaro (chiffres inventés, devise imposée, Site URL de Supabase).
*Source : inspiré de skill-creator, Apache-2.0, Anthropic.*

**Tester une fiche avant de la distribuer** — Mentor, Rigo, Orchestre
Écris 3 demandes réalistes, comme Beau ou une vendeuse les formuleraient, avec leurs fautes et leur contexte. Fais faire chaque demande deux fois, avec et sans la fiche, puis compare. Pour chaque demande, écris 2 ou 3 critères vérifiables (« le prix est affiché dans la devise de la boutique »), pas des impressions. Le correcteur doit aussi signaler un critère qui passerait même avec une mauvaise réponse. Ajoute des demandes « presque » : elles ressemblent au sujet de la fiche mais ne doivent pas la déclencher. Piège : ne corriger que pour les 3 exemples. La fiche servira des milliers de fois, donc on généralise.
*Transposition : il faut lancer plusieurs agents séparés, ce qu'Orchestre (ou Claude côté code) peut faire, mais pas un agent seul dans sa conversation. Source : inspiré de skill-creator et grader.md, Apache-2.0, Anthropic.*

**Point hebdomadaire Progrès / Plans / Problèmes** — Orchestre, Alpha, et tout agent qui rend compte à Beau
Trois rubriques, rien d'autre :
- Progrès : ce qui est fini et vérifié cette semaine ;
- Plans : les priorités de la semaine suivante ;
- Problèmes : ce qui bloque, et ce dont tu as besoin de Beau.

Chaque ligne est un fait concret (« page vendeur : prix en devise de la boutique, en ligne sur staging »), pas un effort (« travaillé sur les prix »). L'ensemble se lit en moins d'une minute. Piège : annoncer comme fait ce qui est seulement poussé ou « vert en CI ». Sur Finjaro, une CI verte ne prouve pas qu'une version est en ligne. Écris « en ligne » seulement si c'est vérifié à l'adresse réelle.
*Source : inspiré de internal-comms (3P updates), Apache-2.0, Anthropic.*

**Deux ou trois questions de recul** — Lien, Claudinette, Alpha, Écho
Quand tu donnes à Beau quelque chose sur quoi il va agir (une estimation de coût, un conseil, un plan, un brouillon d'e-mail), termine par 2 ou 3 questions qu'il pourrait te renvoyer telles quelles. Chacune vise un point précis de ta réponse :
- un chiffre à vérifier ;
- une hypothèse de raisonnement ;
- une information que tu as dû deviner (le pays de la vendeuse, par exemple).

Pas de question générique du type « veux-tu que je vérifie ? ». Une seule fois par conversation. Ne le fais pas s'il t'a déjà demandé de vérifier ou d'aller vite, ni pour un simple renseignement, ni quand tu ne fais que mettre en forme ses propres notes.
*Source : inspiré de discernment-nudge, Apache-2.0, Anthropic.*

**Relecture par un lecteur neuf** — Plume, Mentor, Lien
Avant qu'un texte long parte (guide pour les vendeuses, fiche de compétence, annonce), fais-le lire par un agent qui ne connaît RIEN de la conversation. Donne-lui le texte seul et 5 questions qu'un vrai lecteur se poserait. Regarde où il répond faux et ce qu'il suppose connu, puis corrige ces passages. Recommence jusqu'à ce qu'il n'apparaisse plus d'incompréhension nouvelle. Piège : faire relire par l'agent qui a écrit. Il comble lui-même les trous et ne les voit donc pas.
*Transposition : il faut deux appels distincts, que seul Orchestre peut organiser. Source : idée tirée de doc-coauthoring, qui n'a pas de licence, donc texte entièrement réécrit.*

**Écrire les libellés d'une interface** — Ada Nkemba, Miroir, Plume
Nomme les choses comme l'acheteur ou la vendeuse les comprennent, pas comme la base de données les appelle (« Mes commandes », pas « orders »). Un bouton dit ce qui va se passer (« Publier l'article », pas « Valider »), et la confirmation reprend le même mot (« Article publié »). Un message d'erreur dit ce qui s'est passé et quoi faire. Il ne s'excuse pas et ne reste jamais vague. Un écran vide invite à agir (« Ajoute ton premier article »). Piège propre à Finjaro : aucun libellé ne doit enfermer Finjaro dans un pays ni supposer une devise.
*Source : inspiré de frontend-design (partie écriture), Apache-2.0, Anthropic.*

## Limites, risques, prudence
- **Contradiction directe avec le style de Beau.** `frontend-design` cite « fond crème, titres en sérif contrastés, accent terracotta » comme un tic des pages générées par IA, à éviter. C'est précisément le style vintage choisi par Beau (CLAUDE.md §6). La fiche dit elle-même que la consigne du client l'emporte toujours. Miroir ne doit JAMAIS s'appuyer sur cette liste pour critiquer le style de Finjaro. On ne garde que la partie « écriture ».
- **`docx`, `pdf`, `pptx`, `xlsx`** : licence propriétaire qui interdit copie et œuvres dérivées. Ni recopie ni adaptation.
- **`doc-coauthoring`** n'a pas de licence : idée reprise, texte réécrit.
- **Beaucoup de choses supposent des fichiers, un terminal ou des sous-agents** : scripts Python, visionneuse HTML, `claude -p`, Playwright. Nos agents de Léo n'ont ni fichiers ni terminal (sauf Claude et Ada). Il faut une organisation par Orchestre pour lancer plusieurs agents, et les fiches ci-dessus sont écrites pour tenir entièrement dans la consigne.
- **`brand-guidelines` et `theme-factory`** appliquent la charte d'Anthropic ou des thèmes génériques. Hors sujet pour Finjaro, qui a son propre style.
- **`claude-api`** donne des noms de modèles et des tarifs qui changent vite. Le dépôt prévient lui-même que les habitudes apprises peuvent être périmées. À relire au moment de s'en servir, sans figer de chiffres.
- **`academy-guide`** renvoie vers la formation d'Anthropic. Utile à Beau éventuellement, pas aux agents.
- Aucune instruction piégée trouvée dans le dépôt. Le manifeste du plugin contient l'adresse e-mail d'un employé d'Anthropic : elle n'est pas reprise ici.

## Verdict
**Retenu** comme source principale de Mentor, pour la méthode d'écriture et de test des fiches, et de Rigo, pour la boucle d'évaluation. Également retenu pour trois formats directement utilisables : le point Progrès / Plans / Problèmes, les questions de recul et le test du lecteur neuf. Deux parties sont **mises de côté** avec leur raison : les compétences documentaires propriétaires (licence qui interdit la reprise), et les passages de `frontend-design` sur la palette (contraires au style voulu par Beau).
