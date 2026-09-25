# Relevé complet depuis lundi 22/09 et plan point par point

Demandé par Beau le 25/09 au soir : « arrête-toi, reprends tout ce que je te dis depuis lundi, fais une liste de tous les points, prompts et messages, fais un plan et pars point par point ; chaque point développé de manière exhaustive, triple vérifié, avec des propositions et des nouvelles fonctionnalités — je suis fatigué du travail bâclé ».

## La cible visuelle, dite par Beau

« Tu vois comment Slam Dunk était, ou Tekken, ou Street Fighter, ou 2K14 : ce n'était pas la 5G, mais c'était propre et tout. » Donc : **pas la photo, mais du fini** — des formes nettes, des couleurs franches, des animations complètes, rien qui clignote, rien qui traverse un mur, rien qui reste à moitié. Chaque chose visible est terminée avant d'être montrée.

## Comment ce document est fait

- **Sources** : le carnet (`docs/A-FAIRE.md`, section 0 : 242 lignes datées du 24 au 25/09), l'historique du dépôt pour le 22 et le 23/09, et les messages du 25/09 au soir.
- **Chaque point** a :
  - un numéro ;
  - ce que Beau a dit, en court ;
  - l'état **vérifié** : fait sur staging, fait sur finjaro.net, à moitié fait, pas fait, ou attend Beau.
- **« Triple vérification »**, pour chaque point livré à partir de maintenant, veut dire trois choses :
  1. **les tests automatiques** passent ;
  2. **deux captures** montrent le résultat : une en 390 px (téléphone), une en 1440 px (grand écran) ;
  3. **un essai en vrai** est fait sur staging avec un compte de test : on clique, on joue, et on regarde le résultat.

  Un point n'est coché ✅ qu'après les trois.
- Rien n'est annoncé fait s'il ne l'est pas. Ce qui est à moitié fait est écrit à moitié fait.

---

## 1. Les règles permanentes (rappel, elles s'appliquent à tout ce qui suit)

1. Finjaro est une place de marché **mondiale**. Aucun texte ne l'enferme dans un pays, aucune devise n'est « par défaut », on ne parle jamais publiquement de « diaspora ».
2. **Aucun chiffre inventé**, aucune photo d'article prise sur le web.
3. Base commune avec Accounting et des applications tierces :
   - migrations **additives** seulement ;
   - fonctions edge communes à staging et à la production ;
   - on ne touche jamais au Site URL ;
   - on prévient Beau avant, en nommant Accounting.
4. **Staging d'abord.** finjaro.net seulement sur « pousse sur finjaro.net ». Pas de pull request sans demande.
5. **Tout noter** dans le carnet le jour même.
6. **Diviser le travail** avec les agents de Léo, dont des tâches difficiles, et relire chaque livrable avant d'en parler.
7. **Tout ce qu'on construit dans Léo est pour toutes les entreprises**, pas seulement Finjaro.
8. Une remarque en cours de route est **notée**, puis on finit ce qu'on faisait.
9. Si Beau ne répond pas à une question, **on continue**.
10. Aucun code, modèle, son ou nom repris de Rockstar : GTA San Andreas est une **inspiration**, pas une source.
11. **Budget** : au plus 20 € par mois pour le monde 3D (outils et modèles gratuits ou libres).
12. On ne dit « c'est en ligne » qu'après l'avoir vu servi par staging.

---

## 2. Ce qui attend Beau (lui seul peut le faire)

| # | Quoi | Pourquoi | État |
|---|---|---|---|
| B1 | Dire « pousse sur finjaro.net » pour le lot de ce soir | tout ce qui suit est sur staging seulement | attend |
| B2 | Choisir la source des modèles de voitures réalistes (voir E5) | les modèles libres réalistes sont rares ; la plupart des « 5 000 voitures » sont payantes ou à licence à vérifier une par une | attend |
| B3 | Relire la politique de confidentialité, article 4 (Finia commune) — Union européenne / Royaume-Uni en « éteint par défaut » ? | décision juridique | attend |
| B4 | Compte de test « Qualité » (profil `is_test`) pour que Rigo voie les écrans connectés | touche `auth.users`, commun avec Accounting | attend |
| B5 | Cloudflare, Worker `finjaro-atelier` : ne reconstruire que si `atelier/*` change (« Build watch paths ») | chaque poussée sur staging remet l'atelier à zéro et coupe les séances | 2 min, attend |
| B6 | Vérifier la clé Fish Audio (elle a la forme d'une clé OpenAI) | l'essai des voix en dépend | attend |
| B7 | Régénérer le secret client GitHub (apparu sur une capture) | prudence | attend |
| B8 | Application Meta (Facebook / Instagram) | connecteur par utilisateur | attend |
| B9 | Décision « gangs et armes » dans le monde 3D (voir E14) | Léo sert aussi à des entreprises : je propose une version sans violence réaliste | attend |
| B10 | Retours sur la vidéo Accounting v2 | — | attend |

---

## 3. Le relevé, thème par thème

Légende : ✅ fait (sur staging, sauf mention finjaro.net) · 🟡 à moitié · ⬜ pas fait · ⏳ attend Beau.

### A. Léo — l'application (audit du 25/09)

| # | Demande de Beau | État vérifié |
|---|---|---|
| A1 | « Legion » visible partout alors que c'est Léo | ✅ tous les textes visibles |
| A2 | Textes restés en français sur un compte anglais (encadré « Comment Léo… », 61 modèles, formulaires) | ✅ 45 textes + 61 modèles ; 🟡 les **3 535 postes** (noms des rôles) restent en français |
| A3 | L'équipe répond en français sur un compte anglais | ✅ pour une entreprise **fondée en anglais** (langue + mot d'accueil) ; ⬜ une entreprise existante ne change qu'avec le bouton FR/EN |
| A4 | « New company » trois fois sur la page | ✅ une seule fois |
| A5 | Deux micros superposés dans le salon | ✅ Jarvis devient le lion nommé, au centre de l'en-tête |
| A6 | Icônes incomprises ; salons « # » tous pareils ; « pas d'icône, des photos » | ✅ visages des agents (salons, rail, en-tête, accueil, Mes entreprises), libellés à côté des icônes sur grand écran |
| A7 | Emoji Info / Question / Proposition / Décision / Tâche | ✅ vraies icônes |
| A8 | Page de connexion : fond photo ou vidéo de la cité avec des agents qui marchent ; « Continue with Finjaro » à côté de Google et Apple | ⬜ |
| A9 | Mes entreprises : que ça défile comme Finjaro, images des agents au travail | ⬜ |
| A10 | Deux palettes au choix : la sombre actuelle et le blanc de Finjaro | ⬜ |
| A11 | Fonder une entreprise : emoji des cabinets → photos d'agents qui défilent ; 71 rôles cliquables (voir, ajouter, prompt, fichier) ; un agent d'aide pour répartir les rôles ; « What it is » modifiable ; bouton « Found it » vivant | ⬜ |
| A12 | Tour de contrôle : défilement, beau design, « formes qui ne font pas IA, pas une app comme Google » | ⬜ |
| A13 | Le lion et les emoji « building » : de vrais visuels qui bougent au survol | 🟡 lion de Jarvis fait ; ⬜ icône 🏢 de l'immeuble (Beau veut une vraie image, ligne du 25/09 matin) |
| A14 | À la création, les agents ont déjà leur photo réelle et choisissent leur nom | ⬜ (aujourd'hui : bouton « De vraies photos » à cliquer) |
| A15 | Salons « à rendre encore plus beaux » | 🟡 visages faits ; ⬜ le reste |
| A16 | La génération d'images dans un salon ne donne qu'une petite image ; tenir avec 25, 100, 10 000 agents | ⬜ |
| A17 | Livrables trop longs (« qui m'a envoyé un pavé ? ») | ⬜ consigne « court d'abord » |
| A18 | Power BI : un agent peut-il en envoyer ? | ⬜ réponse honnête à donner (voir plan C9) |
| A19 | Version téléphone de l'audit | ⏳ Beau l'enverra |

### B. Les agents et leur travail

| # | Demande | État vérifié |
|---|---|---|
| B-1 | « Les agents fonctionnent bien ? Ont-ils fait toutes tes tâches ? » | Réponse honnête (section 5) : **non, pas toutes** |
| B-2 | Pas d'heures fixes : chaque agent « sent » quand travailler | ⬜ (3 passages fixes + passage des urgences au quart d'heure) |
| B-3 | Une vraie entreprise : managers, subordonnés, stagiaires, alternants, RH, agents qui se parlent | 🟡 grades et chef dans la base (0203), organigramme ✅ ; ⬜ stagiaires, RH, conversations spontanées |
| B-4 | Les agents ne doivent pas attendre qu'on leur demande | 🟡 plan du matin par responsable ; ⬜ vraie initiative |
| B-5 | Ada ne travaille pas seule : Rigo relit, collègues, renfort RH (CDD, CDI, stagiaire, intérim) | 🟡 dans l'atelier : confier à un collègue ✅, recruter sur carte ✅ ; ⬜ plusieurs agents dans la même séance, RH/Mentor qui choisit |
| B-6 | Ce que les agents construisent ne doit jamais être réservé à Beau | ✅ règle appliquée (atelier ouvert à tous les propriétaires, relais compris) |
| B-7 | « J'espère qu'ils entraînent notre modèle open source » | 🟡 échanges gardés (`ia_traces`, avec accord) ; ⬜ aucun modèle entraîné |
| B-8 | Salle d'entraînement (simulations type MiroFish) | ⬜ |
| B-9 | Agents sur Facebook / Instagram (par utilisateur) | ⏳ B8 |
| B-10 | Les agents font eux-mêmes les vidéos | 🟡 étude de Forge rendue ; ⬜ construction |

### C. L'atelier de code

| # | Demande | État vérifié |
|---|---|---|
| C1 | « Aucun modèle disponible » avec un nouveau compte | ✅ relais ouvert (Beau : « ça marche maintenant ») |
| C2 | Voir à qui l'agent confie, avec les visages | ✅ |
| C3 | Changer de mode pendant que l'agent travaille | ✅ |
| C4 | Messages de l'atelier en français sur un compte anglais | ⬜ (textes du Worker) |
| C5 | Ada relit le travail de Julie et en rend compte | ✅ livrable rendu à 16 h 54 (voir section 5) ; ⬜ ses 5 règles à mettre dans la consigne |
| C6 | Séance coupée au plafond sans prévenir | ⬜ alerte à 80 % du plafond |
| C7 | Jupyter / Python comme Colab ; éditeur « mieux que VS Code » (erreurs soulignées, autocomplétion, Composer) | ⬜ |
| C8 | Panneau « Tâches en arrière-plan » | ⬜ |
| C9 | Ctrl+K partout dans l'atelier | ⬜ (la palette d'Ada existe, pas branchée partout) |
| C10 | Les tâches de code données aux agents s'exécutent dans l'atelier, visibles | ⬜ |
| C11 | Connecteurs par utilisateur : son GitHub, son Supabase, son Vercel, sur mesure | 🟡 application GitHub prête (installée sur un dépôt) ; ⬜ branchement par utilisateur |
| C12 | GPT-6 Astra dans l'atelier | ✅ |
| C13 | Reprendre couleurs et interactions des 5 prototypes AI Studio | 🟡 onglets, terminaux, palette ; ⬜ 11 éléments |

### D. Jarvis, voix, ordinateur

| # | Demande | État vérifié |
|---|---|---|
| D1 | Jarvis : réveil d'un geste, puis voix, comme un chef de cabinet | 🟡 V0 (bouton + voix) ; ⬜ geste |
| D2 | Prendre la main sur l'ordinateur / Chrome ; « avec les mains » | 🟡 Claude dans Chrome ↔ Léo (MCP) ; ⬜ gestes de la main |
| D3 | Appeler un agent : ça sonne, il décroche, « allô », mains libres, vraie voix d'homme ou de femme | 🟡 appel plus rapide ; ⬜ sonnerie, mains libres, voix par agent |
| D4 | Voix de la réceptionniste robotique → Fish | ⬜ (attend B6) |
| D5 | Essais à l'aveugle Fish / ElevenLabs, Wan / LTX / Kling | ⬜ |

### E. Le monde 3D façon San Andreas

| # | Demande | État vérifié |
|---|---|---|
| E1 | Vraie 3D (« 4D ») : bâtiments, voitures, gens en volume | ✅ relief des immeubles, voitures réelles, bus, moto, hélicoptère |
| E2 | Conduire, hélicoptère, courses, tableau de bord de jeu de course | ✅ |
| E3 | La ville de chacun : bâtiments = projets, boutiques, clients ; maison ou cité | ✅ |
| E4 | Mer, bateau, nage | ✅ |
| E5 | « Les voitures sont du même modèle » ; « 5 000 types de voitures » | 🟡 berline, SUV, coupé, luxe, taxi, police sur **un** modèle ; ⏳ B2 pour de vrais modèles différents |
| E6 | Police | 🟡 voitures de police qui circulent ; ⬜ poursuite, étoiles de recherche |
| E7 | Moto, avion, char, tous les véhicules | 🟡 moto (circulation) ; ⬜ moto conduite, avion, char, voiture volante |
| E8 | Voir le conducteur dans la voiture ; monter sur le trottoir ; une passagère qui se fâche si on la cogne | ⬜ |
| E9 | La vie des agents : se lever, aller au marché, au travail, rentrer, dormir, boire, courir, basket, foot, stade | ⬜ (aujourd'hui : présent / pause / réunion / veille) |
| E10 | Une grande carte, sans planter ni bugs | 🟡 plus fluide ; ⬜ grande carte |
| E11 | Terrain de basket, stade de foot, jeux (courses, arcade façon Neo Geo), et l'agent peut jouer pendant qu'il code | ⬜ |
| E12 | Monde de rêve : voitures volantes, dauphins volants, « ne reste pas cloîtré » | ⬜ |
| E13 | Agents variés : assis, debout, au téléphone, qui font les cent pas, avec un casque | ✅ |
| E14 | Gangs, fusil | ⏳ B9 |
| E15 | Réception affichée devant chez soi ; bureaux de chaque entreprise | ✅ étiquette « La ville », « Chez toi » ; 🟡 rendre l'immeuble de l'entreprise évident depuis chez soi |
| E16 | Le plafond qui vibre | ✅ |
| E17 | S'approcher d'un agent : sa fiche et ce qu'il fait | ✅ |
| E18 | Pays commun + planète (toutes les entreprises dans un même pays) | ⬜ |
| E19 | Ville selon le pays de la personne (Yaoundé : rond-point, marché, taxis jaunes) | ✅ par région |
| E20 | « Ça bug beaucoup » | ⬜ relevé des bugs à faire (Beau n'a pas précisé lesquels) |

### F. Place de marché Finjaro et écosystème

| # | Demande | État vérifié |
|---|---|---|
| F1 | Outils vendeuse de Finia (créer un article, mes articles) parlent encore en FCFA | ⬜ |
| F2 | Essayer « Retirer le fond » sur téléphone et le classeur du kit dans Excel | ⏳ Beau |
| F3 | L'outil `qui_a_fait` donne le nom d'acheteurs réels à un agent | ⬜ à restreindre avant d'autres clients |
| F4 | Paiements instantanés PI-SPI (veille de Claudinette) | idée, rien d'engagé |
| F5 | Bouton du kit → Accounting déjà connecté | ⏳ accord (touche l'authentification commune) |
| F6 | Studio de contenu : l'import d'un agent perd ses compétences ; noter les idées ; tirer la leçon | ⬜ |

---

## 4. Le plan, lot par lot

**Ordre choisi.**
- Ce qui se voit et casse l'impression d'abord : les écrans de Léo.
- Puis le fonctionnement des agents, parce que c'est le cœur du produit.
- Puis le monde 3D, construit en profondeur et non en surface.

**Pour chaque lot :**
- la triple vérification ;
- un commit ;
- staging vérifié en ligne ;
- le carnet mis à jour.

### Lot 1 — Les écrans de Léo (A8 à A16)

**1.1 Page de connexion (A8).**
- *Fond :*
  - une vidéo courte de la ville de Léo, filmée depuis notre propre monde 3D : une caméra qui survole la ville, des agents qui marchent ;
  - enregistrée en boucle de 10 à 15 s, et en image fixe pour les téléphones lents ou le mode « économie de données ».
- *Boutons :*
  - « Continuer avec Finjaro » (connexion unique déjà construite, relais `sso-relais`), au-dessus de Google et Apple ;
  - e-mail ou téléphone en dessous.
- ⚠ Toucher la page de connexion touche l'authentification commune : on le dit à Beau avant, en nommant Accounting. Le code n'ajoute qu'un bouton qui mène au relais existant, sans changer le Site URL.
- *Vérification :*
  - 390 et 1440 px ;
  - un vrai clic « Continuer avec Finjaro » depuis un compte connecté à finjaro.net ;
  - un compte neuf.
- *Nouveauté proposée :* sous le formulaire, une ligne vivante, par exemple « En ce moment : 3 équipes au travail ». Elle vient de vrais chiffres comptés, avec les comptes de test exclus, ou n'apparaît pas.

**1.2 Mes entreprises (A9, A12).**
- Chaque entreprise devient une grande carte avec une bande qui défile : les portraits de l'équipe avec ce que chacun fait maintenant (tâche en cours, réunion, pause, veille), les mêmes données que dans le monde 3D.
- La carte s'ouvre sur la tour de contrôle.
- Formes : on garde le style de Beau (crème, terracotta, laiton, grands titres) et on retire l'aspect « tableau de bord générique » :
  - pas de dégradé violet ;
  - pas de cartes toutes identiques ;
  - de vraies photos, une typographie de titre forte, des bandes qui glissent.
- *Vérification :* 1 entreprise, 4 entreprises, entreprise sans agent, téléphone.

**1.3 Deux palettes (A10).**
- Un interrupteur « Sombre / Clair » dans l'en-tête de Léo.
- Le clair reprend les couleurs de Finjaro (crème, terracotta, laiton).
- Toutes les couleurs de Léo passent par des variables : aujourd'hui les classes `legion-*` sont des couleurs fixes, elles deviennent des variables CSS.
- Choix retenu par appareil ; au premier passage, on suit le réglage du téléphone.
- *Vérification :* chaque écran de Léo dans les deux palettes, contraste des textes.

**1.4 Fonder une entreprise (A11).**
- À gauche, un bandeau de portraits qui défilent : les agents du modèle choisi, avec leur vraie photo quand elle existe.
- Les **rôles deviennent cliquables** : une fiche avec le mandat et ce que l'agent fera. Depuis la fiche, on peut :
  - retirer un rôle ;
  - ajouter un rôle depuis le catalogue ;
  - **décrire un rôle par une phrase** (l'IA écrit le poste et le mandat) ;
  - **déposer un fichier** (organigramme, fiche de poste) pour que l'IA en tire les rôles.
- **Un agent d'aide** est présent dès cette page. Il pose deux ou trois questions, propose la répartition, et répond « pourquoi ce rôle ? ».
- « What it is » est modifiable : le changement vaut pour cette entreprise seulement.
- Le bouton « Found it » devient animé : il montre l'équipe qui arrive, les portraits qui se rangent dans l'organigramme.
- *Vérification :* fonder en français et en anglais, avec un rôle ajouté par phrase et un rôle retiré ; l'équipe créée correspond exactement à l'écran.

**1.5 Photos et noms à la création (A14).**
- À la fondation, chaque agent reçoit tout de suite un portrait tiré de notre banque de visages.
- Il choisit ensuite son nom, dans la langue de l'entreprise, avant le mot d'accueil.
- Le bouton « De vraies photos » reste là pour régénérer un portrait.

**1.6 Images dans les salons (A16).**
- L'image générée s'affiche en grand (visionneuse plein écran, téléchargement).
- Les listes de 100 à 10 000 agents se dessinent au fil du défilement.
- Un essai de charge est fait sur une entreprise de test à 10 000 agents, avant de promettre quoi que ce soit.

**1.7 Postes en anglais (A2).**
- Les 3 535 postes sont traduits par lots de 200 :
  - traduction par le moteur ;
  - relecture d'un échantillon par Plume (tâche donnée) ;
  - stockage **dans un fichier de l'application**, sans migration.

### Lot 2 — Les agents qui travaillent vraiment (B-1 à B-5, A17, C5, C6)

**2.1 Réparer ce qui bloque le travail.**
- Passage des agents de l'entreprise Finjaro : il est tombé en « WORKER_RESOURCE_LIMIT » ce soir (trop gros : 41 agents et plus de 300 tâches ouvertes).
- Il sera découpé en tranches de quelques agents.
- *Vérification :* trois passages de suite sans erreur.

**2.2 Plus d'une tâche par jour.**
- Aujourd'hui, un agent qui a déjà rendu un livrable dans la journée ne prend plus rien. C'est pourquoi les 8 tâches du monde 3D confiées cet après-midi n'ont pas été faites.
- Nouvelle règle : un agent enchaîne tant que sa journée et son budget le permettent. Le plafond de dépense reste la barrière.

**2.3 Chaque agent choisit quand travailler (B-2).**
- Un réveil toutes les 15 min remplace les 3 passages fixes.
- À chaque réveil, un calcul simple décide : urgence, âge des tâches, rythme propre de l'agent (matinal ou tardif, tiré de sa fiche), réunions à venir.
- Le monde 3D montre le résultat : il arrive, il part, il fait une pause.

**2.4 Court d'abord (A17).**
- Chaque livrable commence par 3 lignes : ce que j'ai fait, ce que je propose, ce que j'attends de toi.
- Le détail est replié en dessous.

**2.5 L'agent de code apprend de la relecture d'Ada (C5, C6).** Les 5 règles d'Ada entrent dans la consigne de l'atelier :
1. attendre les collègues ou confirmer le sujet ;
2. un projet par application ;
3. tester l'interface ou dire clairement qu'on n'a pas pu ;
4. prévenir à 80 % du plafond ;
5. bilan des fichiers en fin de séance.

Le Worker affiche aussi lui-même l'alerte à 80 %.

**2.6 Une vraie entreprise (B-3, B-5).**
- Grades visibles (déjà dans la base) ; stagiaires et alternants encadrés par un chef ; RH et Mentor qui proposent un renfort sur carte.
- Des conversations spontanées entre agents d'un même salon, seulement sur une vraie tâche en cours, jamais pour faire du bruit.

**2.7 Délégation de ce lot.** Des tâches pour les agents, relues par moi :
- Plume : les textes « court d'abord » ;
- Rigo : le plan de test des passages découpés ;
- Orchestre (difficile) : les règles du réveil libre ;
- Ada (difficile) : le code de la décision de réveil, en fonction pure testée.

### Lot 3 — Le monde 3D façon San Andreas, en profondeur (E5 à E20)

Principe : une chose à la fois, jouée et vérifiée, pas dix choses en surface.

**3.1 Stabilité d'abord (E10, E20).**
- Relevé systématique des bugs : un parcours complet rejoué automatiquement (marcher, entrer, ascenseur, étages, sortir, conduire, hélicoptère, bateau, nage, maisons), avec captures.
- Mesure des images par seconde à chaque étape, au téléphone et à l'ordinateur.
- On corrige avant d'ajouter.

**3.2 La vie des agents (E9).**
- Chaque agent a une journée, calculée à partir de son heure, de sa région et de ses vraies tâches :
  - le matin : il sort de chez lui (sa maison au bord de la mer), marche ou prend un taxi vers l'immeuble ;
  - la journée : au travail s'il a une tâche, en réunion s'il y en a une ;
  - la pause : café, marché, terrasse ;
  - le soir : sport (course au bord de la mer, basket, foot) ou un verre ;
  - la nuit : il dort chez lui.
- **Règle de vérité** : ce qui est un vrai travail vient des données, jamais inventé. Le reste de la journée est une vie décorative, clairement du décor.
- On peut suivre un agent toute sa journée.

**3.3 La grande carte (E10).**
- La ville s'étend en quartiers chargés seulement quand on s'en approche :
  - le centre (immeubles des entreprises) ;
  - le quartier des boutiques ;
  - la plage et les villas ;
  - le stade et les terrains de sport ;
  - la campagne ;
  - l'aéroport.
- Chaque quartier a une version légère vue de loin.

**3.4 Les véhicules (E5, E7, E8).**
- **Conducteur visible** : un personnage assis au volant de chaque voiture qui circule, et notre avatar quand on conduit.
- **Passager** : on peut prendre un agent avec soi. Si on heurte quelque chose, il réagit par une animation et une bulle (« Doucement ! »), puis descend si ça recommence.
- **Trottoir** : la voiture peut y monter. Les passants s'écartent en courant, sans violence, jamais écrasés.
- **Moto conduite** : la moto existante devient jouable.
- **Avion** : sur l'aéroport de la grande carte.
- **Char** : dans une zone de jeu à part.
- **Voiture volante** (E12).
- De vrais modèles différents après la décision de Beau (B2). En attendant, les silhouettes et habillages existants (police, taxi, luxe…).

**3.5 La police (E6).**
- Rouler trop vite ou percuter des voitures fait monter les « étoiles », qu'on voit en haut de l'écran.
- Une voiture de police prend la poursuite, gyrophares et sirène.
- On la sème en s'éloignant ou en se cachant ; si elle nous rattrape à l'arrêt, amende simulée et retour à l'immeuble.

**3.6 Sports et jeux (E11).**
- **Terrain de basket** jouable : tirer, le score s'affiche.
- **Stade de foot** : tirs au but contre un gardien.
- **Salle d'arcade** avec des jeux écrits pour Léo. Aucune ROM ni jeu Neo Geo copié : ce serait illégal. Des jeux originaux dans cet esprit : course vue de dessus, casse-briques, combat de robots.
- **L'agent joue pendant que son code tourne** : quand une séance de l'atelier attend (tests, construction), l'agent va à la salle d'arcade, et on le voit jouer. C'est vrai : il attend vraiment.

**3.7 Le monde de rêve (E12).**
- Voitures volantes sur des couloirs aériens lumineux au-dessus du centre.
- Dauphins qui sautent et volent au-dessus de la mer.
- Un parc suspendu entre deux tours.
- La nuit, des aurores sur la mer.

**3.8 Le pays commun (E18).**
- Toutes les entreprises de Léo dans un même pays, chacune avec son immeuble.
- On visite celles qui l'acceptent : réglage « visible dans le pays commun », éteint par défaut, avec les données visibles clairement listées.

**3.9 Gangs et armes (E14), après la décision de Beau.** Ma proposition : une arène de paintball / laser game (équipes aux couleurs vives, marquage de peinture), pas de fusils réalistes ni de gangs. Léo est aussi une vitrine pour des entreprises.

**Délégation du lot 3.**
- Forge (difficile) : le calcul de la journée d'un agent, en fonction pure testée.
- Plume : les bulles des passagers et des passants.
- Vigie : les modèles libres de droits réalistes (voitures, avion, dauphin), avec licence vérifiée.
- Rigo : le parcours automatique de non-régression.

### Lot 4 — Atelier, Jarvis et voix (C4, C7 à C11, D1 à D5)

**Atelier :**
- messages dans la langue du compte ;
- panneau des tâches en arrière-plan ;
- Ctrl+K partout ;
- tâches de code des agents exécutées dans l'atelier ;
- GitHub par utilisateur, puis Supabase et Vercel ;
- carnets Python ;
- erreurs soulignées dans l'éditeur.

**Jarvis :**
- réveil par le mot « Jarvis » ;
- réveil par un geste de la main devant la caméra, après accord et sans image envoyée.

**Appel :** sonnerie, « allô », mains libres, une voix par agent (Fish après B6).

---

## 5. Réponse honnête : « les agents fonctionnent bien ? ils ont fait toutes tes tâches ? »

**Non, pas toutes.** Voici ce que dit la base à 17 h (25/09).

**Ce qui a bien marché :**
- La plupart des tâches du 23 au 25/09 ont un livrable, relu en partie.
- **Ada a rendu ce soir la relecture de Julie** en 13 min, et elle est juste. Une nuance à lui dire : elle reproche à Julie de ne pas avoir contesté le fait inventé de Nora. Mais Julie ne s'en est pas servie, elle a pris un autre sujet.

**Les 8 tâches du monde 3D données cet après-midi n'ont pas été faites.**
- Il s'agit de :
  - pour Plume : la radio de la voiture, les conseils de chargement, les phrases du hall ;
  - pour Forge : les feux tricolores et les trajets de marche ;
  - pour Mentor : deux leçons ;
  - pour Orchestre : le Conseil de lancement.
- Cause : la règle « une tâche par agent et par jour ». Ces agents avaient déjà rendu un livrable ce jour-là. Corrigé au lot 2.2.

**Ada a échoué trois fois** sur l'exercice « hauteurTour », sans livrable ; la cause est à chercher.

**Vigie est bloquée**, et c'est une bonne raison : elle refuse d'inventer 40 liens de photos sans outil pour les vérifier.

**Le passage de l'entreprise Finjaro est tombé** ce soir, faute de ressources (voir 2.1). Le passage des urgences, lui, marche : c'est lui qui a fait travailler Ada.

**Dans l'entreprise de test « test 2 », deux choses :**
- l'équipe a répondu en français sur un compte anglais, corrigé pour les nouvelles entreprises ;
- **Nora a inventé un fait** (« place de marché gratuite jusqu'à fin octobre 2026 »), repris par Karim. La relecture automatique n'a pas bloqué ce message avant publication : c'est à renforcer au lot 2.

---

## 6. Mes propositions en plus (« think, dream »)

1. **La journée filmée** : chaque soir, un court film de 30 s monté automatiquement dans le monde 3D, où l'on voit ce que l'équipe a vraiment fait (qui a travaillé, les livrables, la réunion). À partager.
2. **La visite guidée** : un nouveau venu suit la réceptionniste qui lui présente l'entreprise en 60 s, étage par étage, avec les vraies personnes.
3. **Le tableau des records** : records de course, de basket, de tirs au but, par entreprise. Le seul endroit où l'on peut « gagner » sans chiffre inventé.
4. **Le taxi de Léo** : on appelle un taxi qui nous conduit, le temps de voir la ville.
5. **La météo qui change la vie** : quand il pleut vraiment dans la ville de la personne, parapluies, flaques, terrasses fermées.
6. **Les boutiques Finjaro visitables** : entrer dans la boutique d'une vendeuse (ses vrais articles sur les présentoirs, ses photos), avec un bouton « voir sur Finjaro ».
7. **L'agent en direct à son poste** : s'asseoir à côté d'un agent qui code, et son écran montre le vrai code de l'atelier qui s'écrit.

---

## 7. Ordre d'exécution à partir de maintenant

1. Lot 2.1 et 2.2 (les agents bloqués), parce que tout le reste en dépend.
2. Lot 1 (écrans de Léo), dans l'ordre 1.1 → 1.7.
3. Lot 2.3 à 2.7.
4. Lot 3, dans l'ordre 3.1 → 3.9.
5. Lot 4.

Chaque point est coché dans ce fichier et dans le carnet, avec sa date, ses captures et le commit.
