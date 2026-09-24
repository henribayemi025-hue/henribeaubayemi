# 23 — « Les 7 repos gratuits. Et ce qu'on vend avec. » (guide PDF de bencodezero)

- **Source** : https://bencodezero-dm-engine.bencodezero.workers.dev/guides/machine.pdf
- **Type** : guide (PDF de 12 pages, « MACHINE / V2.0 », compte @bencodezero)
- **Accès** : téléchargé le 24/09/2026 et **lu en entier** (12 pages sur 12). Pour vérifier ses chiffres et ses licences, j'ai ouvert les sept dépôts cités (clonage léger, sans rien installer ni exécuter) et lu leur fichier de licence. J'ai aussi relu dans les README ce que le guide leur attribue : la limite multi-utilisateur d'anything-llm, la licence de firecrawl. Les nombres d'étoiles n'ont pas pu être recomptés : l'API GitHub n'est pas accessible depuis cet environnement.
- **Licence / droits** :
  - **le PDF** : aucune licence indiquée (tous droits réservés par défaut). On s'inspire des méthodes, on ne recopie pas le texte.
  - **les dépôts cités** (licences vérifiées le 24/09/2026) : pipecat en BSD-2-Clause, cline en Apache-2.0, anything-llm, crewAI et browser-use en MIT, postiz et firecrawl en AGPL-3.0. Pour firecrawl, le README précise que les SDK et certains composants sont sous MIT, une nuance que le guide omet.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un guide pour qui veut vendre des services à des entreprises en s'appuyant sur sept outils libres branchés sur Claude :
- un accueil téléphonique vocal (pipecat) ;
- un agent qui code (cline) ;
- un outil de programmation de publications (postiz) ;
- une IA qui connaît les documents d'une entreprise (anything-llm) ;
- une équipe d'agents (crewAI) ;
- un navigateur piloté par un agent (browser-use) ;
- l'extraction de données de sites web (firecrawl).

Chaque page donne : ce que l'outil remplace, la commande d'installation copiée du README, « le piège », et une fiche datée (étoiles, dernier commit, licence). Il est **remarquablement honnête** : aucun tarif ni revenu promis, chiffres datés et sourcés, une page entière sur ce qu'il ne peut pas garantir.

## Ce qui est vraiment utile pour Finjaro et Léo
Les outils eux-mêmes servent peu Finjaro aujourd'hui. **La méthode, elle, est exactement la nôtre**, et elle apporte trois choses que le vestiaire n'avait pas encore :
- **Les quatre contrôles avant de coller une commande** : la licence, le coût réel, la date du dernier commit, **le nom exact**. Ce dernier point est illustré par trois dépôts connus qui ont changé d'adresse (`ryoppippi/ccusage` → `ccusage/ccusage`, `ruvnet/claude-flow` → `ruvnet/ruflo`, `getAsterisk/claudia` → `winfunc/opcode`). La fiche 21 en donne un cas concret le même jour : un guide qui fait lancer `npx -y @21st/mcp`, paquet qui n'existe pas.
- **« Gratuit ne veut pas dire sans coût »** : le code est gratuit, mais pas les minutes de voix, les jetons du modèle, le serveur ni le stockage. Il faut faire tourner l'outil une semaine pour soi et lire la facture avant d'annoncer un prix. Le seul prix défendable repose sur deux chiffres qu'on peut montrer : le temps mesuré chez le client et le prix de revient.
- **L'AGPL-3.0 expliquée simplement** : s'en servir ne pose pas de problème ; en faire un service en ligne modifié oblige à publier ses modifications. C'est important pour Finjaro, qui est justement un service en ligne.
- D'autres pièges recoupent des fiches existantes :
  - « un agent autonome sur une branche à part, avec le but, les interdits et la condition d'arrêt écrits » : fiches 01, 04 et 06 ;
  - « cinq agents coûtent cinq fois plus pour un résultat plus flou » : fiche 14, « un seul agent d'abord » ;
  - « une liste de prospects extraite du web est un risque (conditions des sites, RGPD) » : fiche 11 ;
  - « une automatisation de navigateur casse au premier changement de site, donc on vend l'entretien avec » : fiche 20, « prévoir la panne ».

## Pour quels agents de Léo
- **Vigie** (veille) : c'est lui qui repère des outils et les recommande. Les quatre contrôles et le nom exact sont sa première règle.
- **Claude**, **Ada Nkemba** et **Alpha** : ils sont les seuls à installer quoi que ce soit. Ils doivent vérifier le paquet sur le registre et le dépôt à son adresse actuelle, et lire la licence (AGPL comprise) avant tout usage dans finjaro.net.
- **Forge** (IA) : le prix de revient d'un service IA (voix à la minute, jetons, hébergement) est son sujet.
- **Claudinette** (comptabilité) : le prix de revient et la règle « facture d'une semaine avant d'annoncer un prix ».
- **Écho** (marketing) : ne jamais annoncer un prix de service ou une offre Léo qui ne repose pas sur ces deux chiffres.

## Compétences à tirer (pour Mentor)

**Recommander un dépôt ou un paquet : le nom exact, l'adresse actuelle, la date** — Vigie, Claude, Ada Nkemba, Alpha, Forge
Quand s'en servir : avant de recommander, citer ou installer un dépôt, un paquet npm ou pip, ou une commande vue dans un guide ou une vidéo.
Comment faire :
1. Ouvre le dépôt lui-même et copie la commande de son README, jamais celle d'une vidéo ou d'un guide.
2. Vérifie que le paquet existe sous ce nom exact dans le registre officiel, et qu'il appartient bien à l'éditeur.
3. Si le dépôt redirige vers une autre adresse, cite la nouvelle et signale le déménagement.
4. Note la date du dernier commit : un outil abandonné n'est pas recommandé.
5. Lis le fichier de licence. Une licence AGPL oblige à publier ses modifications si on en fait un service en ligne, ce qui est le cas de Finjaro.
6. Écris le jour du relevé à côté de chaque chiffre (étoiles, version).
Piège : une commande qui s'exécute sans confirmation (`npx -y`, `curl | sh`) avec un nom mal orthographié ou inexistant. N'importe qui peut publier sous ce nom. Rien ne s'installe sans l'accord de Beau.
*Source : inspiré des « quatre contrôles » du guide de bencodezero (texte non repris) ; exemple réel relevé dans la fiche 21.*

**Calculer le prix de revient d'un service IA avant d'annoncer un prix** — Claudinette, Forge, Écho
Quand s'en servir : avant de proposer, publier ou comparer le prix d'un service qui repose sur l'IA (une offre Léo, une option Finjaro, un outil pour les vendeuses).
Comment faire :
1. Liste tout ce qui se paie à l'usage : jetons du modèle, minutes de voix, serveur, stockage, abonnements d'outils.
2. Fais tourner le service une semaine en conditions réelles, pour nous, et relève la facture réelle.
3. Ramène-la à l'unité vendue (par conversation, par minute, par boutique et par mois).
4. Côté client, mesure le temps que le service lui fait gagner. Un prix se défend avec ces deux chiffres mesurés, jamais avec le tarif vu chez un inconnu.
5. Exprime les montants dans la monnaie de la boutique ou du client, jamais dans une monnaie supposée, avec la date du relevé.
Piège : annoncer « gratuit » parce que le code l'est. Le coût à l'usage arrive plus tard, et il grandit avec le succès.
*Source : inspiré des pages 2 et 11 du guide de bencodezero (texte non repris).*

## Limites, risques, prudence
- **Un guide pour vendre des services.** Son public est le freelance qui veut « un client ». Finjaro n'est pas une agence : la plupart des sept outils ne servent pas la place de marché aujourd'hui. On prend la méthode de contrôle, pas le modèle d'affaires.
- **Chiffres d'étoiles non revérifiés** (API GitHub inaccessible d'ici). Les licences et les dates de dernier commit, elles, ont été contrôlées : tous les dépôts ont été modifiés entre le 15 et le 24/09/2026. De toute façon, le guide le dit lui-même : les étoiles ne mesurent pas la qualité.
- **Nuance omise sur firecrawl** : le guide le présente en AGPL-3.0 sans préciser que ses SDK sont sous MIT.
- **Outils sensibles** :
  - pipecat (appels vocaux) : tout appel à un tiers relève de la fiche 07 (se présenter comme assistant automatisé, accord de Beau) ;
  - firecrawl et browser-use (extraction, navigation automatique) : fiche 11 et RGPD, aucune liste de personnes constituée sans nécessité ;
  - postiz (publication programmée) : publier reste une action qui demande l'accord de Beau à chaque fois.
- **L'adresse du PDF** est un « moteur de messages privés » (`dm-engine`). Le guide est probablement distribué en réponse à un mot-clé envoyé en message. Je n'ai rien envoyé ni rien rempli pour l'obtenir : le lien était direct.
- Le fichier PDF déclare 8 pages dans ses métadonnées, mais en affiche 12, numérotées de 1 à 12. Rien ne manque.

## Verdict
**Retenu pour deux compétences** :
- recommander un dépôt ou un paquet avec son nom exact, son adresse actuelle et sa date (Vigie, Claude, Ada Nkemba, Alpha, Forge) ;
- calculer le prix de revient d'un service IA avant d'annoncer un prix (Claudinette, Forge, Écho).

Le guide est aussi un **bon modèle de ton pour Mentor** : il date ses chiffres, cite ses sources, dit ce qu'il ne garantit pas. Les sept outils sont **gardés en réserve**. anything-llm (MIT) pourrait un jour servir une IA interne qui connaît les procédures de Finjaro, et crewAI (MIT) comme lecture pour Orchestre. **Mis de côté pour l'instant** : postiz et firecrawl (AGPL, et publication ou extraction à encadrer), pipecat (appels vocaux, hors besoin actuel), cline (Claude couvre déjà ce rôle).
