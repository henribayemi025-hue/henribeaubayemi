# Finjaro — LA liste de tout ce qui reste à faire

## 0. CARNET DE BEAU — tout ce qui attend (tenu à jour depuis le 24/09)

_Règle de Beau (24/09, soir) : « Tout ce que je t'envoie, note ça. Note, note,
note. » Chaque demande, chaque lien, chaque idée de Beau arrive ici **le jour
même**, avec sa date, même quand on est occupé ailleurs. On coche ✅ avec la
date quand c'est fait, on ne supprime jamais. Les ressources reçues sont en plus
rangées dans `docs/vestiaire/` (une fiche chacune)._

### 0.1 En attente d'une réponse de Beau

| Date | Quoi | Ce qu'il faut de Beau |
|---|---|---|
| 25/09 | **Idée de Beau (1 h 16, d'après la vidéo « Autopolis », une ville de 50 agents)** : « construire les gars dans un site comme ça… un peu comme les Sims ». Mon avis : oui, mais comme **l'immeuble de TON entreprise dans Léo**, branché sur l'activité RÉELLE (un étage par département, les agents à leur bureau avec leur photo, en réunion, à l'Institut = formation et compétences, la recrue qui arrive) ; jamais d'activité simulée. En 2D isométrique, léger sur téléphone, sans aucun appel d'IA en plus. Il existe déjà un « Bureau » (Vues.jsx) à faire évoluer | ✅ 25/09 « oui lance l'immeuble, étages et Institut » → V0 en cours (Claude code ; Plume les phrases ; Orchestre relit les règles « qui est où ») |
| 25/09 | **Réunion de lancement des agents (Direction, 23 h 07)** : Ada, Rigo, Alpha, Mentor, Orchestre disent « l'atelier ne doit pas passer devant le produit ». Vérifié dans la base (7 jours, sans comptes de test ni pics de robots des 18 et 20/09) : 176 vues de fiches, 6 ajouts au panier, 1 commande réelle (22/09). **47 % des articles en ligne (223 sur 472) sont en « prix sur demande »**, dont 8 des 10 fiches les plus vues. | ✅ 25/09, Beau : « On avance à tout en même temps… il faut diviser pour que ça avance vite » et « je ne veux pas une notification en plus » → les deux chantiers en parallèle ; le prix manquant se demande DANS l'application (carte « Articles sans prix » dans l'espace vendeuse), jamais par une notification. Réparti dans Léo (Direction, 23 h 30) : Claude la carte + l'outil « voir une fiche », Plume les textes, Lien le « pourquoi un prix », Rigo la mesure avant/après, Ada la palette, Alpha le suivi. Départ : 223/472 sans prix, 23 boutiques, 12 sans aucun prix |
| 24/09 | ✅ 24/09 soir, « oui » de Beau : **Mettre en ligne sur finjaro.net** le lot de staging (tout ce qui suit 6bacb72 : choix du modèle d'IA, alertes, relais de recherche, examen de Rigo, Déposer une ressource, modèle Studio de contenu, Retirer le fond, kit /kit, vestiaire 20–26). La mise en ligne a été **bloquée par le contrôle de sécurité** : il faut un « oui, pousse ce lot sur finjaro.net » explicite. | « oui, pousse » — ou d'abord l'essai sur son téléphone (Retirer le fond, /kit) |
| 24/09 | ✅ 24/09 soir, « oui atelier » de Beau → V0 lancée (voir 0.3). **Atelier de code** V0 (plan `docs/plans/2026-09-24-atelier-de-code-et-jarvis.md`) : OpenHands (MIT), modes Demander / Accepter les modifications / Auto, Confirmer obligatoire | « oui atelier » |
| 24/09 | **Jarvis** V0 (réveil par bouton ou geste, puis voix) ; espace « Moi » de l'assistant personnel ; proposition 10 « Hé Léo » | son accord sur le plan |
| 24/09 | **Réceptionniste vocale** pour les clients de Léo (fiche 24) : prototype sans téléphone, puis numéro Twilio (payant) | décision + budget |
| 24/09 | ✅ « oui essai » de Beau (24/09 soir) — il faut d'abord sa clé Fish Audio (voir 0.2). **Essai à l'aveugle Fish Audio contre ElevenLabs** pour les voix de Léo (Fish : environ 11 $/mois avec les droits commerciaux, API gratuite jusqu'au 30/11/2026 sans garantie) | « oui essai » |
| 24/09 | **Essai à l'aveugle Wan 2.6 / LTX 2 contre Kling** pour la vidéo (environ 1 $) | « oui » |
| 24/09 | **Bouton du kit → Accounting déjà connecté** (relais SSO) : touche l'authentification commune, donc Accounting aussi | accord |
| 24/09 | **Vidéo Accounting v2** : retours attendus (prononciation « Accounting », raccord de la voix vers 16 s, longueur de la fin). La version HQ (35 Mo) dépasse la limite d'envoi : proposer une version compressée | ses retours |
| 24/09 | **Agents qui codent** : le correctif est gardé de côté (`scratchpad/leo-agents-codent-complet.patch`), repris dans le plan de l'atelier en version sûre (Confirmer). Ne pas contourner le blocage de sécurité | décision avec l'atelier |
| 24/09 | ✅ **« oui Finia commune »** (Beau, 22 h), « oui Accounting », apprendre des conversations des gens **oui**, **les utilisateurs choisissent s'ils veulent** (consentement), et « tout ça sera dans la politique de confidentialité ». → chantier lancé (voir 0.3). Rappel de la proposition : : une seule Finia dans toutes les apps (place de marché, Accounting, Léo, projets futurs), reliée à nos agents, qui **apprend de l'usage réel**. Proposition faite : un savoir commun, une seule personnalité, un carnet d'apprentissage anonyme validé par Beau (même boucle que « Léo apprend tout seul »), les agents qui lisent les questions fréquentes. Touche **Accounting** (sa Finia est aujourd'hui locale, sans IA) et la **vie privée** (consentement, anonymisation) | son « oui » + accord sur la vie privée ; prévenir Claudinette avant |
| 24/09 | Beau (22 h) : « oui, les conversations peuvent aussi passer par toutes les IA » → relais activé pour la réponse automatique et la modération des chats privés ; modération des articles en relais : « block » devient « à revoir » | ✅ 24/09 22 h |
| 24/09 | Beau (22 h) : les **messages vocaux** en relais : « Kimi/DeepSeek ne peuvent pas ? Qwen peut ? OpenAI ? on a l'API OpenAI, entraînons aussi ça » → OpenAI (transcription) et Qwen (Omni) savent écouter ; à brancher dès que la clé `OPENAI_API_KEY` est dans Supabase | 🟡 24/09 soir : écrit pour Finia (`finou-chat`) et les vocaux des agents (`_shared/pieces.ts`) — OpenAI transcrit (gpt-4o-mini-transcribe, repli whisper-1) quand Google échoue, puis la conversation continue sur le texte. OpenAI (GPT-5.4 mini) ajouté aussi au relais après Kimi. Essayé en local (faux serveur), **pas déployé** |
| 24/09 | Beau (22 h) : les **utilisateurs choisissent** (leur IA ? leur accord pour l'apprentissage ?) — à préciser avec lui | à préciser |
| 24/09 | Beau (22 h) : les **messages vocaux** en relais : « Kimi/DeepSeek ne peuvent pas ? Qwen peut ? OpenAI ? on a l'API OpenAI, entraînons aussi ça » → OpenAI (transcription) et Qwen (Omni) savent écouter ; à brancher dès que la clé `OPENAI_API_KEY` est dans Supabase | clé OpenAI de Beau |
| 24/09 | Beau (22 h) : les **utilisateurs choisissent** (leur IA ? leur accord pour l'apprentissage ?) — à préciser avec lui | ✅ 22 h 15 pour l'apprentissage : **allumé par défaut** (on peut refuser), dit clairement la 1re fois, réglable d'un geste, écrit dans la politique. Reste « leur IA » |
| 24/09 | **Finia commune V0** : relire le **texte ajouté à la politique de confidentialité** (article 4, fr et en, version 1.1 — `src/legal/privacy.js`) avant toute mise en ligne. Et décider : Union européenne / Royaume-Uni en « éteint par défaut » (accord explicite) ? Prévu, pas activé : une ligne par pays dans `ia_pays_accord_explicite` | sa relecture + sa décision |
| 24/09 | Beau (22 h) sur l'atelier : « un développeur doit se sentir super à l'aise ; ce qu'il fait en 5 jours avec VS Code et Claude, avec nous il doit le faire en une heure avec les agents. Toi seul sais ce que les devs aiment : c'est à toi de gérer. » → V1 de l'atelier pensée pour les développeurs | à faire après le premier vrai essai |
| 24/09 | Beau (22 h) : « pourquoi tu veux que je passe Cloudflare payante ? » → expliqué (les bacs à sable n'existent que dans l'offre à 5 $/mois ; alternatives données) | sa décision |
| 24/09 | Beau (22 h) sur Fish Audio : « tu dis que je pars où pour faire ça ? » → marche à suivre simple donnée | sa clé |
| 24/09 | Beau (22 h 15) : « j'ai déjà posé l'API OpenAI dans Supabase sous le nom Leo, ça fait mille fois que je te le dis » → le code reconnaît maintenant une clé à sa forme (« sk- » = OpenAI, « tvly- » = Tavily) sous `OPENAI_API_KEY`/`TAVILY_API_KEY` **ou** « Leo ». Pas besoin de renommer | ✅ 24/09 |
| 24/09 | Beau (22 h 15) : « si je veux faire par exemple Finjaro Learn, je vais sur mes agents, ils me le font en 5 minutes, avec tout » → objectif de l'atelier | V1 atelier |
| 24/09 | Beau (22 h 15) : l'apprentissage de Finia **allumé par défaut** (pas éteint) → transmis au chantier Finia commune, avec message clair et refus d'un toucher | en cours |
| 24/09 | Clé OpenAI de Beau (« Leo ») **vérifiée** : /v1/models répond ; GPT-5.4 mini et GPT-6 Astra ont répondu au banc d'essai. OpenAI rejoint les secours du moteur et le choix du modèle dans Léo. Vocaux en relais par la transcription OpenAI : chantier en cours. À noter : `FISH_AUDIO_API_KEY` est posée mais a la forme d'une clé OpenAI (« sk- ») : à vérifier avec Beau | ✅ 24/09 22 h 40 |
| 24/09 | Beau (22 h 45) : sur Fish Audio, il a demandé à l'agent du site « je veux une clé API » et l'agent a cliqué et ouvert les écrans à sa place jusqu'à la clé : « on doit faire aussi Finia faire ça, dans Finjaro Accounting comme dans la place de marché » → **Finia qui guide en agissant** (ouvre le bon écran, remplit, montre où cliquer) | à concevoir (Finia commune V1) |
| 24/09 | Beau (22 h 45) : Fish Audio « c'est bon » | ✅ (clé posée ; à tester à l'essai des voix) |
| 24/09 | Beau (22 h 45) : quelqu'un qui aime ChatGPT doit pouvoir choisir le type (GPT-5, Astra…) ; **Astra doit être présent quand il veut coder** → GPT-6 Astra dans le choix de Léo (fait) et dans l'atelier de code (à faire) | atelier : à faire |
| 24/09 | Beau (22 h 45) : « guide-moi pour Cloudflare » → guide pas à pas donné | en cours avec Beau |
| 24/09 | **Atelier en ligne** : Beau a fait le réglage Cloudflare (Worker renommé `finjaro-atelier`, dossier `atelier`, branche `staging`) ; https://finjaro-atelier.finjaro.workers.dev répond « Atelier de Léo : en service. » GPT-6 Astra, GPT-6 Sol et GPT-5.4 mini ajoutés au choix de l'atelier | ✅ 24/09 23 h |
| 24/09 | Clés de l'atelier dans Cloudflare (finjaro-atelier → Settings → Variables and Secrets, type Secret) : `DEEPSEEK_API_KEY` (nouvelle clé, la même à remettre dans Supabase), et la clé OpenAI (nom libre, par ex. « Leo ») pour Astra | à faire par Beau |
| 24/09 | Premier vrai essai de l'atelier (bac à sable, modèle, carte d'autorisation, export) | après les clés |
| 24/09 | Beau (23 h) : **tous les modèles au choix dans l'atelier sans recopier chaque clé dans Cloudflare** → fonction Supabase `atelier-modele` écrite (relais : le Worker l'appelle avec le jeton de la personne pour tout modèle dont la clé n'est pas chez lui ; Claude Sonnet 5 aussi, si `ANTHROPIC_API_KEY` existe ; plafond de 10 $ par jour, réglable par `ATELIER_PLAFOND_JOUR_USD`). Testée en local (faux serveurs), **pas déployée**. Une fois déployée, les clés dans Cloudflare (ligne plus haut) deviennent facultatives | son « oui » pour déployer `atelier-modele` (fonction commune staging/production) |
| 24/09 | Finia : le prix donné par ses outils est déjà dans la monnaie de la personne (vu : « 7 000 FCFA (environ 10,67 €) » à quelqu'un en euros) | ✅ 24/09 ; reste : les outils vendeuse (create_product, mes articles) parlent encore en FCFA |
| 24/09 | Beau (23 h) : « dans l'atelier, tous les modèles ; ils vont choisir. J'ai ajouté DeepSeek » → l'atelier ne voyait aucune clé (clé sans doute posée dans les variables de **construction**) ; décision : l'atelier passera par les clés déjà dans Supabase (fonction `atelier-modele`), plus rien à recopier dans Cloudflare | en cours |
| 24/09 | **Vérifié en vrai (23 h)** : l'écoute des vocaux par OpenAI marche avec la clé « Leo » (phrase dite puis transcrite mot pour mot par gpt-4o-mini-transcribe) ; Finia donne « 10,67 € » sans FCFA à une personne en euros | ✅ |
| 24/09 | Beau (23 h 15) : « c'est ok la politique, pousse sur finjaro.net » → mis en ligne (62942b4 : Finia commune + politique 1.1, relais Kimi/DeepSeek/OpenAI, vocaux OpenAI, prix de Finia dans la monnaie de la personne, Excel modifiés par les agents, atelier (entrée visible seulement pour Beau), GPT dans Léo) ; vérifié : le site sert le nouveau code (« Aider Finia à s'améliorer ») | ✅ 24/09 23 h 20 |
| 24/09 | **ORDRE de Beau (23 h 30)** sur l'atelier : « tu sais comment les développeurs fonctionnent, ce qu'ils veulent, comment ils travaillent avec Claude. Moi je ne connais pas. Recherche sur Internet, sur GitHub… Fais un truc que les développeurs vont vraiment aimer, où ils seront franchement à l'aise, avec des propositions, même des trucs qui n'existent pas encore ailleurs. » Y compris : **comment le connecter au bureau (desktop) du développeur** | recherche lancée le 24/09 23 h 30, puis construction |
| 24/09 | Beau (23 h 30) : il va envoyer **un dépôt « du top » qui montre comment faire des trucs à la Salesforce** → à étudier (vestiaire), puis ajouter des choses à **Accounting** et aux **modèles d'entreprise de Léo** | attend le lien de Beau |
| 24/09 | Beau (23 h 30) : Fish Audio **pas encore testé** (clé posée) | essai des voix à faire |
| 24/09 | **Premier vrai essai de l'atelier** (projet « Essai Finjaro Learn », DeepSeek) : l'agent a lu les 4 fichiers, proposé 3 modifications (index.html, script.js, README), chacune avec sa carte d'autorisation, approuvées « une fois » ; page rendue : titre « Finjaro Learn », phrase, bouton « Commencer ». Coût réel **0,0019 $** | ✅ 24/09 23 h 10 |
| 24/09 | Beau (23 h 10) : « tu ne m'as pas dit l'état des avis et des autres choses » → point fait dans la conversation. « Avis » : à préciser (avis des magasins d'applications ? avis des clientes ?) | sa précision |
| 24/09 | **RÈGLE PERMANENTE de Beau (23 h 15)** : toujours diviser le travail entre moi et les agents de Léo (et Claudinette), leur donner parfois les tâches dures pour qu'ils s'entraînent, puis vérifier et corriger → écrite dans CLAUDE.md §10. Premier lot le 24/09 : Rigo (critique du plan de l'atelier V1, difficile), Plume (script de la vidéo Accounting parlée par des commerçants), Forge (chaîne « script → voix → images → montage » pour que les agents fassent les vidéos eux-mêmes, difficile), plus les tâches déjà prévues des autres agents | lancé ; relecture à faire |
| 24/09 | Beau (23 h 15) : **voir les agents coder en direct** dans Léo, comme dans Claude Code (« je lis… », « je lance les tests… », le code qui s'écrit, les agents qui discutent entre eux) | à ajouter à la V1 de l'atelier (étape « vue en direct ») |
| 24/09 | Beau (23 h 20) : **les agents font eux-mêmes les vidéos** (ex. la vidéo Accounting où des vendeuses parlent), branchés à Canva / CapCut / autres, voix Fish Audio ou ElevenLabs ; je corrige derrière ; ça les entraîne. Et **pas seulement pour Beau** : tout utilisateur de Léo doit avoir des agents aussi puissants que les nôtres | étude confiée à Forge (24/09), puis plan |
| 24/09 | **Recherche « ce que les développeurs aiment » terminée** : `docs/plans/2026-09-25-atelier-ce-que-les-devs-aiment.md` (37 propositions, 10 jamais vues ailleurs, sources datées). À retenir : le bac à sable remplace les clics (seul ce qui sort passe par Confirmer) ; « c'est fini » exige une preuve (tests lancés par l'atelier) ; 2 à 5 agents en parallèle ; branchement au poste par GitHub + MCP avec le jeton `lg_…` existant ; « 5 jours en 1 heure » crédible seulement pour un projet neuf et bien délimité (à chronométrer avant de l'annoncer). Décisions pour Beau (section 8) : la preuve avant le parallélisme ? adresse des aperçus (domaine à lui ou tunnels Cloudflare) ? outils MCP dans `legion-mcp` (fonction commune staging/production) ou dans le Worker ? quelles idées ⭐ d'abord ? | ses 4 réponses |
| 24/09 | Beau (23 h 15) sur **Jarvis** : ce n'est PAS la réceptionniste vocale. Son idée (vue dans le dépôt Jarvis, fiche 07 : « le gars fait tap tap ») : on réveille Jarvis d'un geste, puis on lui parle comme à un chef de cabinet : « Jarvis, ouvre les dépôts », « je veux parler à Alpha », « Alpha, mon rapport », « Claude, continue, j'arrive ». Jarvis = la **télécommande vocale de toute l'entreprise** (écrans, agents, atelier). La réceptionniste vocale reste une idée à part, peut-être plus tard | ✅ vision comprise ; construction à planifier (plan Jarvis partie 2, recadré sur ce parcours) |
| 24/09 | Beau (23 h 15) : plafond de l'atelier « 10 $ par jour, c'est trop, on fait seulement le test ; pour les autres on n'a pas encore réfléchi » → **1 $ par jour et par personne** (code `atelier-modele`, réglable par `ATELIER_PLAFOND_JOUR_USD`). Le prix pour les futurs utilisateurs reste à réfléchir | ✅ 24/09 23 h 30 |
| 24/09 | Beau (23 h 15) : « Retirer le fond », on verra après | plus tard |
| 24/09 | Beau (23 h 15) : **application GitHub pour l'atelier : « ok, on fait ça »** → clics donnés dans la conversation | à faire par Beau, puis je branche |
| 24/09 | Beau (23 h 15), reproche : « plusieurs dépôts que tu as notés… finalement tu ne les as pas faits » → vrai en partie : les 29 fiches ont donné des compétences aux agents (dans `legion_competences`), et 4 choses construites (Léo apprend tout seul, Retirer le fond, Studio de contenu, kit) ; mais **pas encore construits** : Jarvis (07), les niveaux de risque N1/N2/N3 et l'alerte de budget à 80 % (07), le mode silencieux et le chaînage (26), noter les idées avant de produire (24), la preuve avant « c'est fini » pour les agents (01) | à faire, dans le plan « entreprise vivante » |
| 24/09 | Beau (23 h 20) : **« je suis allé dans Léo, je n'ai pas vu l'espace code »** → vérifié sur finjaro.net avec son compte : l'entrée existe, mais trop discrète (petite pastille « Atelier » sur téléphone, petite icône `</>` sur ordinateur) et un **agent** s'appelle aussi « Atelier », ce qui brouille. Et surtout : on n'y voit **pas les agents travailler**, seulement ses propres projets | à corriger : grande entrée « Espace code » + agents qui y codent, visibles en direct |
| 24/09 | **VISION de Beau (23 h 20), à ne plus oublier** : « je veux une VRAIE entreprise ». Des **managers, des subordonnés, des stagiaires, des alternants** ; les agents **se parlent entre eux** dans les salons (Direction et les autres) et on les voit échanger ; une **boîte d'intérim** qui part **auditer d'autres entreprises** ; des **freelances**. « Ne limite pas ton imagination, Claude. Moi, je ne limite pas. » Constat : aujourd'hui chaque agent rend son livrable seul ; on ne voit presque aucun échange entre eux | plan « Léo, une entreprise vivante » à écrire et lancer |
| 24/09 | **RÈGLE de Beau (23 h 55)** : « quand je fais une remarque pendant que tu travailles, tu la NOTES et tu continues ce que tu faisais ; sinon tu embrouilles tout » → écrite dans CLAUDE.md §10 | ✅ règle |
| 24/09 | Beau (23 h 30) dans l'atelier : « je pensais que les agents écriraient AU MILIEU : ouvrir les fichiers, taper le code, créer des fichiers, importer des bibliothèques » ; « la photo de profil des agents dans le chat » | ✅ 24/09 minuit sur staging (vérifié en vrai) : le Codeur prend le visage et le nom d'Ada (développeuse de Léo) ; l'éditeur **suit Ada** (il ouvre le fichier qu'elle lit) et elle **tape** sa proposition sous nos yeux, curseur « Ada », ajouts surlignés, pendant que la carte attend l'accord. Reste : bibliothèques (npm/pip) visibles dans un vrai terminal |
| 24/09 | Beau (23 h 45) : « pourquoi il ne peut pas afficher ? il doit pouvoir afficher (artefacts, plugins…) » | ✅ 24/09 minuit sur staging (vérifié en vrai) : bouton **Aperçu** — la page du projet s'affiche en direct dans l'atelier, **avec la proposition d'Ada avant de l'accepter**, en grand ou en taille téléphone ; l'agent sait qu'il y a un aperçu. Reste : aperçu des applications qui ont besoin d'un serveur (React, API) |
| 24/09 | Beau (23 h 30) : **Jupyter et Python « comme Google Colab »** ; un vrai éditeur « comme VS Code mais encore mieux, comme Claude Code » (couleurs, erreurs soulignées) | à faire (V1 atelier) : carnets .ipynb exécutés dans le bac à sable Python, erreurs soulignées dans l'éditeur, terminal |
| 24/09 | Beau (23 h 30) : **« 300 exemples sur Internet, YouTube, 300 propositions »** pour l'atelier et les agents visibles | ✅ 25/09 00 h 10 : `docs/plans/2026-09-25-atelier-300-propositions.md` (300 idées, 42 ⭐ jamais vues ailleurs, 20 à construire d'abord, licences, sources datées). Découverte : notre bac à sable Cloudflare sait DÉJÀ faire un vrai terminal (xterm) et exécuter du Python avec images et tableaux (façon Jupyter) — pas de mise à jour à acheter. Déjà faits ce soir : visage de l'agent, suivre l'agent, écriture animée, proposition dans l'éditeur. Prochains : erreurs soulignées (+ Corriger / Expliquer), carnet .ipynb, terminal, bureau des agents. Honnêteté : l'écriture animée REJOUE la vraie proposition (le vrai direct demande de diffuser la réponse du modèle en continu) — à signaler à l'écran. Pour Beau : choisir le style du bureau des agents sur 2 maquettes |
| 24/09 | Beau (23 h 30) : « si je t'envoie une compétence ou un dépôt (ex. les niveaux d'action), c'est pour la donner aux agents concernés et les en IMPRÉGNER » → vérifié : « Classer ses actions en trois niveaux de risque » est active sur 23 agents, « Séparer celui qui pense de celui qui agit » sur Alpha, Forge, Orchestre, etc. Ce qui manque : que le CODE des outils applique ces niveaux (pas seulement la consigne) | à faire : niveaux N1/N2/N3 dans les outils de Léo |
| 24/09 | **Application GitHub créée par Beau** : « Finjaro Atelier », **App ID 5066102** (pas secret), clé privée posée dans Supabase (« j'espère ») | vérification par le banc (`diagnostic: github`) en cours ; puis brancher l'atelier (branche `leo/…` après Confirmer) |
| 24/09 | Beau (23 h 50) a **appelé Alpha** : 1) il faut toucher le micro → il veut un vrai appel : **ça sonne, l'agent décroche, dit « allô »**, puis on parle sans toucher ; 2) réponse après **près d'une minute** ; 3) **voix de femme robotique** pour un homme → vraie voix (Fish Audio ou OpenAI), une voix par agent qui correspond à son portrait | 🟡 1er pas le 24/09 minuit : appel plus rapide (OpenAI transcrit d'abord, réponse courte, pas d'enquête). À faire : sonnerie + « allô » + mains libres ; vraie voix par agent (fonction `legion-voix`, OpenAI TTS tout de suite, Fish Audio après essai) |
| 25/09 | Beau (00 h 20) : la clé GitHub collée dans Supabase « n'est pas la bonne » → vérifié par l'empreinte : c'EST la bonne clé, collée sans ses lignes BEGIN/END ; le code la lit maintenant telle quelle (le fichier envoyé dans la conversation n'est recopié nulle part) | ✅ 25/09 00 h 30, **vérifié en vrai** : GitHub reconnaît « Finjaro Atelier » (droits : contenu et demandes de fusion en écriture), installée sur le seul dépôt `henribayemi025-hue/Finjaro-learn`. Prochain : brancher l'atelier (importer ce dépôt, branche `leo/…`, demande de fusion après Confirmer) |
| 25/09 | Beau (00 h 20) : **les agents sur Facebook** (et les réseaux) : publier les vidéos, regarder ce qui se passe, repérer les tendances, lui envoyer les liens intéressants. « Les modèles ouverts comme DeepSeek peuvent le faire, d'autres ont des restrictions » → réponse : ce n'est pas le modèle qui bloque, c'est Meta. Voie officielle : l'API de Meta (application Meta + page Finjaro) permet de publier sur la PAGE, lire commentaires et statistiques, répondre ; les tendances viennent de sources ouvertes (Google Trends, TikTok Creative Center, bibliothèque publicitaire de Meta, YouTube). Pas de connexion avec son mot de passe ni de robot qui clique : interdit par Meta, compte bloqué, quel que soit le modèle. Publication = niveau N3 (Confirmer à chaque fois) | à décider par Beau : créer l'application Meta (je donnerai les clics) |
| 25/09 | Beau (00 h 40) précise pour Facebook : « ce n'était pas pour moi : si un UTILISATEUR veut connecter son Facebook ou son Instagram, il doit pouvoir le faire » → **connecteur Meta par utilisateur** dans Léo (chacun se connecte à SA page Facebook ou SON compte Instagram professionnel par la connexion officielle de Meta ; ses agents publient après Confirmer, lisent commentaires et statistiques). Demande : une application Meta Finjaro + la **vérification de l'application par Meta** (obligatoire pour les autres utilisateurs, plusieurs semaines). Les comptes personnels ne se publient pas par l'API | à planifier (connecteurs par utilisateur, plan du 22/09 #24/#45) |
| 25/09 | Beau (00 h 40) : **« oui pour les colonnes »** → migration **0203** appliquée (chef_id + grade sur legion_agents, additive, vérifiée) ; Claudinette prévenue | ✅ 25/09 00 h 45 |
| 25/09 | Beau (00 h 40) : **« pousse sur finjaro.net »** → poussé (c517853 : atelier où Ada écrit sous nos yeux, aperçu, appel plus rapide, recherche Internet réparée, livrables non coupés, plafond atelier 1 $/jour, diagnostic GitHub) | ✅ vérifié : finjaro.net sert la nouvelle version (25/09 00 h 50) |
| 25/09 | Beau (01 h) : « mes agents : vous ne devez pas attendre que je vous demande… une journée ne peut pas passer sans rien… une vraie entreprise autonome » + « dis-moi comment faire, 100 points » (avec la réponse de Gemini, pensée pour des stagiaires humains) → diagnostic : les agents ne travaillaient qu'UNE fois par jour, UNE tâche, et rien sans tâche (tâches créées une fois par semaine). Fait cette nuit : raison d'être dans chaque consigne, initiative du jour quand un agent n'a pas de tâche, 3 passages par jour, un livrable par passage. 100 points : `docs/plans/2026-09-25-agents-autonomes-100.md` | 🟢 en service dès le prochain passage (06 h 30 UTC) ; à relire demain matin |
| 25/09 | Beau (01 h 05) : 100 propositions de Gemini pour « une plateforme incontournable » (IA, plugins, super-app…) → rangées dans `docs/plans/2026-09-25-gemini-plateforme-100.md`, données à **Alpha** à trier (existe / à faire / contraire à nos règles / à vérifier), tâche difficile | Alpha, puis ma relecture |
| 25/09 | Beau (01 h 05) : « tout ce qu'on fait, c'est pour TOUS les utilisateurs, aussi puissant que ce qu'on a » | ✅ règle (CLAUDE.md §10) |
| 25/09 | Beau (01 h 10) : « il y a d'autres listes, je vais continuer à envoyer » | à recevoir |
| 25/09 | Beau (01 h 10) : quand un agent de Léo reçoit du travail de code, Beau veut ENTRER dans Léo et le VOIR travailler dans l'atelier (ouvrir le dossier, le code qui s'affiche au milieu). « Jusqu'à maintenant je ne vois pas encore ça » → les agents de la journée de travail (legion-travail) ne passent pas encore par l'atelier : seuls les projets lancés à la main y sont | à faire : les tâches de code des agents s'exécutent dans l'atelier, visibles |
| 25/09 | Beau (01 h 10) : **pas d'heures fixes** : chaque agent « sent » quand travailler, a son agenda, décide lui-même, parfois soudainement — « humanisé » → remplacer les 3 passages fixes par un réveil fréquent où chaque agent décide (son rythme, son agenda, l'urgence) | à faire |
| 25/09 | Beau (01 h 15) : dans l'atelier, Ada répond « je ne peux pas te l'afficher, touche Aperçu » → « il doit tout faire lui-même ». Sa capture montrait l'ANCIENNE page (navigateur pas rechargé) ; et il a raison : l'agent doit ouvrir l'aperçu lui-même | ✅ 25/09 01 h 30 : outil « montrer » (l'agent ouvre lui-même l'aperçu ou un fichier), en ligne |
| 25/09 | Beau (01 h 30), après rechargement : « c'est propre », le code s'affiche au milieu. Défauts vus : page blanche au clic sur un fichier (ancienne version en mémoire après la mise en ligne), étoiles `**` dans les réponses d'Ada (« pas beau, pas pro ») | ✅ 25/09 01 h 40 : rechargement automatique une fois si l'ancienne version manque ; réponses mises en forme (titres, listes, gras, code encadré) — en ligne |
| 25/09 | Beau (01 h 30) : **les connecteurs de l'atelier** : chaque utilisateur connecte SON GitHub (ses dépôts), SON Supabase, son Vercel (« VSL », à confirmer), et les agents travaillent directement dedans, « comme Claude le fait » ; plus des **connecteurs sur mesure** et des **compétences** qu'on ajoute soi-même | à faire (atelier V1 étape 7 + connecteurs par utilisateur) : 1) GitHub par utilisateur (l'application Finjaro Atelier est prête), 2) Supabase (connexion officielle OAuth de Supabase), 3) Vercel / Cloudflare, 4) connecteurs MCP sur mesure, 5) compétences ajoutées par l'utilisateur |
| 25/09 | Beau (01 h 30) : « donne-moi un prompt difficile, une conception difficile, que je colle à Ada pour voir comment elle travaille » | ✅ donné dans la conversation |
| 25/09 | Beau (01 h 45) a donné le défi à Ada : elle crée lecons.js, logique.js, index.html, style.css, script.js, tests.html un par un. Mais l'éditeur restait sur carburant.py : le bouton « Suivre Ada » était éteint, et l'écran ne suivait plus au-delà de 200 lignes de fil | ✅ 25/09 02 h : corrigé, bouton plus clair (« ● Je suis Ada »), rallumé pour tout le monde — en ligne |
| 25/09 | Beau (01 h 45) : « est-ce possible de voir les LOGS, comment ça défile ? » | ✅ 25/09 02 h : console en direct sous l'éditeur (chaque geste à la seconde) — en ligne |
| 25/09 | Beau (01 h 45) : « oui Vercel ; continue avec les connecteurs » | en cours : GitHub par utilisateur d'abord |
| 25/09 | Beau (01 h 45) : « est-ce possible que les agents prennent possession de ton ordinateur ? ou de ton Chrome ? » → possible techniquement (agents « computer use » d'Anthropic et d'OpenAI, extension de navigateur), mais seulement par une petite application ou extension que la personne installe elle-même, écran visible, bouton Stop, et Confirmer pour tout ce qui sort ; jamais en cachette | à étudier (V2) ; d'abord le branchement à l'éditeur du développeur (MCP) |
| 25/09 | **Défi d'Ada (Finjaro Learn) relu** : 11 fichiers, contenu séparé (lecons.js), logique testable (logique.js), 19 tests ; vérifié par moi hors atelier : **19/19 OK**, application sans erreur, style crème-terracotta-laiton respecté. Ada a été HONNÊTE (« je n'ai pas pu prouver que les tests passent »). Deux pannes de notre côté l'en empêchaient : les commandes échouaient toutes dans le bac à sable (« AbortSignal serialization »), et l'aperçu restait vide (stockage du navigateur interdit dans le cadre isolé) ; il ne montrait que index.html | ✅ 25/09 02 h 20 : les trois corrigés et en ligne ; l'aperçu montre « 19 / 19 tests OK » dans l'atelier |
| 25/09 | Beau (02 h 10) : « j'ai cliqué sur Aperçu, rien » | ✅ corrigé (même cause : stockage) |
| 25/09 | Beau (02 h 10) : un 2e exercice où **Ada fait appel à d'autres agents** : elle passe par les **RH**, **Mentor** qui forme les agents, et elle peut obtenir un **CDD, un CDI, un stagiaire, un alternant ou un intérimaire** pour l'aider ; on voit **les locaux**, **son parcours**, ce qu'elle a fait, **si elle a triché ou tenté de sortir de son bac à sable**, **comment elle a réfléchi** (« les réseaux de neurones ») | à construire : outil « demander du renfort » dans l'atelier (RH/Mentor choisit un agent ou un intérimaire, qui travaille dans le même projet avec son visage) ; le parcours et la réflexion de l'agent visibles ; un contrôle « triche » (tests affaiblis, sorties refusées) |
| 25/09 | Beau (02 h 30) : « un test aussi dur que ceux avec lesquels Anthropic entraîne Fable 5 » → donné : le moteur de tableur (formules, dépendances, cycles, erreurs, annuler/refaire, CSV, performance mesurée), dans le style des bancs d'essai publics difficiles (je ne connais pas les tests internes d'Anthropic) ; **avec des tests cachés** que je lance après elle, comme un vrai banc d'essai | à noter après l'essai |
| 25/09 | Vérifié en vrai 02 h 30 : les commandes remarchent dans le bac à sable (Ada : Node v22.23.2, Python 3.11.14) | ✅ |
| 25/09 | **Résultat de l'exercice difficile (moteur de tableur) d'Ada** : mes 44 tests CACHÉS : **44/44** ; ses propres tests : 90/90 ; recalcul de 10 000 cellules en 17 ms (mesuré par moi), construction 73 ms. Méthode exemplaire : elle a vu seule que sa version récursive cassait à 10 000 cellules et l'a rendue itérative ; ses tests ont trouvé 6 vrais bugs et elle a corrigé LE CODE, pas les tests ; quand un fichier était trop long à écrire d'un coup, elle est passée par un petit script de corrections. Défaut : elle a travaillé dans le projet Finjaro Learn et a **écrasé tests.js** (les 19 tests de Learn perdus, tests.html cassé dans le navigateur) | à lui faire corriger ; l'écran de la grille reste à finir |
| 25/09 | Ada arrêtée par « 30 étapes » et par la longueur d'écriture (8 000 jetons) | ✅ 25/09 : 80 étapes, 16 000 jetons (le plafond de dépense reste la barrière) |
| 25/09 | Beau (03 h 30) : « quel modèle a-t-elle utilisé ? » → **DeepSeek rapide** (deepseek-flash) pour ses 17 réponses : le 44/44 a été fait par le modèle le moins cher. « Si je choisis DeepSeek, elle travaille SEULEMENT avec DeepSeek » | ✅ un modèle choisi travaille seul ; le modèle s'affiche à côté d'Ada |
| 25/09 | Beau (03 h 30) : « 50 propositions que les développeurs vont aimer, et tu les ajoutes » | ✅ `docs/plans/2026-09-25-atelier-50-pour-les-devs.md` (14 déjà faites cette nuit, le reste à faire) |
| 25/09 | Beau (03 h 30) : après la mise en ligne, « un VRAI test, comme ceux (publics) qui servent à entraîner et mesurer les modèles » → exercice « Forth » (tiré des exercices publics d'Exercism, utilisés par le banc d'essai Aider Polyglot) avec 45 tests cachés tirés des cas publics | ✅ 25/09 04 h : Ada (DeepSeek rapide SEUL) : **45/45 aux tests cachés Forth**, 70/70 à ses propres tests |
| 24/09 | Beau dans Léo, salon Direction (21 h 35 UTC) : « qui m'a envoyé un PAVÉ comme ça ? soyez précis, directs » → les livrables et plans des agents sont trop longs pour lui | à faire : consigne « court d'abord » (3 lignes en tête, le détail replié) dans les livrables et les plans |
| 25/09 | Beau (04 h) : 5 prototypes faits avec Google AI Studio (Finjaro Visual Studio Code, Léo refactoring pour VS Code, CodeWhatsApp Studio, DevHive Enterprise Studio, DevEcosystem) à regarder « même dans l'aspect visuel » | étude confiée à un agent de recherche (captures + comparaison) → `docs/plans/2026-09-25-atelier-5-prototypes-de-beau.md` |
| 25/09 | Beau (04 h 30), capture de Claude Code : un panneau **« Tâches en arrière-plan »** dans l'atelier (ce qui tourne : agents, commandes, depuis combien de temps, jetons/coût, lien vers le détail ; les terminées). Il enverra d'autres idées, fichiers et dépôts | à faire (après la vérification des terminaux) |
| 25/09 | Beau (04 h), remarques pas encore faites : **terminal qu'on ferme et qu'on ajoute** (plusieurs terminaux) ; **« Autoriser, autoriser… ça me fatigue »** → mode sans clics ; **Ada travaille seule** : ni équipe, ni tâches partagées, ni recrutement (stagiaires, RH) ; un **test avec TOUS les modèles** dans un bac qui essaie de sortir d'Internet ou d'atteindre son ordinateur (test de sécurité) ; des agents qui, avec permission, **agissent sur l'ordinateur** | 🟢 25/09 04 h 30 : 1) modes « Accepter les modifs » et « Tout autoriser » (+ bouton sur la carte) ✅, 2) panneau du bas : agent en direct + terminaux qu'on ajoute/ferme/agrandit + terminal où l'humain tape ✅ (vérification en cours) ; restent 3) renfort / équipe, 4) test de sécurité tous modèles |
| 25/09 | Beau (02 h 50) : réglages GitHub faits (URL de retour, OAuth, secret client). ⚠️ Le secret client est apparu en clair sur sa capture d'écran dans la conversation : à régénérer plus tard par prudence | ✅ vérifié 03 h : secret client présent ; conseil de régénérer donné |
| 25/09 | Beau (03 h) sur l'atelier, remarques : 1) un **vrai terminal** en bas qui montre EXACTEMENT ce qu'elle a fait (les commandes ET ce qu'elles répondent) ; 2) il n'a pas vu les demandes de permission (règles « Toujours ») ; 3) **pas de bouton pour joindre un fichier** au message ; 4) il n'a pas vu **Ada recruter** un stagiaire / alternant / intérimaire — la recrue doit apparaître avec sa photo, parler dans sa petite bulle (« je fais ceci, je lance ça ») ; 5) « la barre reste à 1 alors qu'elle écrit à la ligne 100 » (l'éditeur ne descend pas là où elle écrit) ; 6) l'aperçu « s'est arrêté » au bout de quelques secondes ; 7) elle n'a **rendu aucun fichier** (PDF, Excel) et on ne peut pas lui en joindre ; 8) des **artefacts** : « génère-moi ceci » → une page HTML cliquable, comme Claude ; 9) il veut un vrai éditeur **comme VS Code** (description de Gemini reçue : Monaco, IntelliSense, multi-curseurs, repli, minimap, recherche globale, onglets, espaces de travail, extensions, terminal xterm multiple, Git intégré avec marge et diff, débogueur pas à pas, barre d'activité, barre d'état, raccourcis, thèmes) ; il enverra des captures d'un autre outil ; 10) « je ne vais pas dormir, on travaille » | ✅ 25/09 03 h 45 en ligne (vérifié) : terminal réel (commande, réponse, code de sortie), joindre un fichier texte, télécharger, éditeur qui descend là où l'agent écrit, page ouverte à part, modèle affiché, tableaux. Reste : fichiers Excel/PDF (binaires), renfort RH, éditeur façon VS Code |

### 0.2 À faire du côté de Beau (réglages que lui seul peut faire)

| Date | Quoi | Pourquoi |
|---|---|---|
| 24/09 | ✅ 24/09, 22 h : Beau a relevé le plafond Google (vérifié : plus aucune erreur 429 depuis 19 h 55 UTC). Ancien point : Relever le **plafond de dépense Google** (ai.studio/spend) | bloqués depuis le 24/09 à 01 h 18 UTC : photos des agents, lecture des documents par le sens, recherche Gemini. **Et côté finjaro.net** (vu le 24/09 au soir) : Finia (le chat), la lecture des photos d'articles (Finia qui propose titre et rayon, y compris dans l'import en masse), la modération, la vérification d'identité, le copilote vendeuse appellent Google en dur. Personne ne s'en est encore servi depuis (aucun échec dans les journaux), mais ils échoueraient. La traduction des fiches et l'enquête de Léo ont maintenant un relais (DeepSeek) |
| 24/09 | ~~Recréer la clé Tavily~~ — ✅ 24/09 : Beau garde la clé actuelle (nommée « Leo » chez Tavily), c'est sa décision. Elle est posée dans Supabase et marche (journaux : Google refuse, Tavily répond) | — |
| 24/09 | Clé **OpenAI** (facultative) dans les secrets Supabase (`OPENAI_API_KEY`) | relais pour les photos des agents tant que Google est bloqué |
| 24/09 | Faire tourner la **clé DeepSeek** | hygiène |
| 24/09 | **GitHub App ou jeton** pour l'atelier et les agents | atelier de code |
| 24/09 | **Clé Fish Audio** : créer un compte gratuit sur fish.audio, puis une clé API, et la poser dans les secrets Supabase sous le nom `FISH_AUDIO_API_KEY` | pour l'essai à l'aveugle Fish Audio contre ElevenLabs |
| 24/09 | **Cloudflare pour l'atelier** : activer l'offre payante Workers (environ 5 $ par mois) si elle ne l'est pas, et brancher le nouveau Worker `finjaro-atelier` (étapes exactes données quand le code sera prêt) | sans ça, l'atelier ne peut pas lancer de bac à sable |
| 24/09 | → le code V0 est sur staging (24/09 soir, testé en local : 133 tests) : **les étapes exactes sont dans `docs/ATELIER-V0.md`** (offre payante, Worker `finjaro-atelier` branché sur le dossier `atelier` et la branche `staging`, secrets `DEEPSEEK_API_KEY` et facultatifs `KIMI_API_KEY`, `GEMINI_API_KEY`) | l'atelier reste « pas encore en ligne » tant que ce n'est pas fait |
| 24/09 | ✅ 24/09 soir : migration 0200 (tables `atelier_*`) appliquée, avec « oui atelier » de Beau ; 0201 fixe un réglage de sécurité | — |
| 24/09 | Un vrai clic **Accounting → finjaro.net** avec un vrai compte | vérifier la connexion unique en conditions réelles |
| 24/09 | Essayer sur téléphone **« Retirer le fond »** (staging, fiche article) et ouvrir le **classeur du kit** dans Excel ou Google Sheets | pas encore testé sur un vrai téléphone ni dans Excel |
| 25/09 | **Décider : un compte de test « Qualité »** (profil `is_test`) pour que Rigo et voir_ecran puissent voir les écrans CONNECTÉS (espace vendeuse, Léo). Touche `auth.users`, commun avec Accounting → ta décision | à décider |
| 25/09 | **Cloudflare, Worker finjaro-atelier** : ne reconstruire que si le dossier `atelier/` change (« Build watch paths » : `atelier/*`). Aujourd'hui chaque poussée sur staging remet l'atelier à zéro et coupe les séances en cours | à régler (2 min) |
| 25/09 | **Vérifier la clé Fish Audio** : celle rangée sous `FISH_AUDIO_API_KEY` a la forme d'une clé OpenAI (`sk-…`), relevé par le diagnostic des clés (noms seulement). OpenAI (sous « Leo ») et Tavily sont bien posées | à vérifier |

### 0.3 À faire de mon côté (pas encore fait)

| Date | Quoi | État |
|---|---|---|
| 25/09 | Beau : « l'atelier de code de l'immeuble dit personne, pourtant il y a du code » → la pièce ne montrait qu'une séance EN COURS ; afficher aussi la dernière séance réelle (qui, quel projet, il y a combien de temps) ; et expliquer : le code écrit par Claude se fait hors de Léo (dans le dépôt) → à terme, montrer les derniers changements du dépôt branché (connecteur GitHub de l'entreprise) | en cours |
| 25/09 | Beau : « des icônes vraiment magnifiques, avec le titre, le connecteur (Notion…) » → vrais logos des services (Notion, GitHub, Canva, Google…) dans les connecteurs et l'atelier, au lieu d'émojis ; soigner les titres | à faire |
| 25/09 | Beau : « fais le prompt de cette partie pour Google AI Studio, qu'il me génère comment ça se présente (l'immeuble et le reste) ; je te l'envoie et tu copies » → prompt AI Studio | en cours |
| 25/09 | Beau (immeuble) : « quand un agent est au travail et que je clique, ça doit ouvrir OÙ il travaille : ce qu'il fait, comment il fait, les chiffres » → panneau « Voir comment il travaille » : sa tâche en cours (depuis quand), ce qu'il a vérifié et cherché, ses derniers messages et livrables, son coût du jour, et l'atelier s'il code | ✅ 25/09 staging (panneau au clic sur un agent : tâche en cours et depuis quand, modèle, ce qu'il a vérifié, ses sources, chiffres du jour, derniers messages) |
| 25/09 | Beau (guide Cursor / Copilot / Claude Code / Aider) : « je veux qu'on fasse aussi ça, qu'on ajoute des trucs » → pour l'atelier : (1) l'autocomplétion en ligne (texte grisé pendant qu'on tape, Tab pour accepter) ; (2) « Composer » : une consigne → plusieurs fichiers modifiés, avec la liste des fichiers touchés avant/après ; (3) l'index du projet (l'agent comprend toute l'architecture : carte des fichiers et des fonctions) ; (4) le chat de débogage à côté du code (sélection → « pourquoi ça casse ? ») ; (5) l'agent qui lance les tests tout seul et prépare le « commit » (envoi GitHub après Confirmer) | noté, à faire après les onglets |
| 25/09 | Beau a collé le prompt « 300 propositions pour l'immeuble » dans cette conversation : il veut aussi MES propositions (« que toi aussi vous réfléchissez ») | ✅ 25/09 : docs/plans/2026-09-25-immeuble-300-claude.md (300 + mes 20 préférées + 5 à ne pas faire) |
| 25/09 | Onglets de fichiers (repris de son prototype VS Code : étiquettes JS/<>/#, trait doré, point « modifié », visage de l'agent sur l'onglet où il écrit, 12 au plus) + barre d'état d'Ada (corrigée : couleurs, erreurs cachées tant qu'elles ne sont pas soulignées) : position, langage, modèle, mode (clic → palette), coût | ✅ 25/09 vérifiés en vrai (3 onglets, brouillon marqué) |
| 25/09 | Beau : « n'hésite pas à prendre les couleurs, les templates, les interactions des prototypes Gemini (Google AI Studio) pour la partie développeur… copie les choses de là-bas » → autorisation de reprendre le code et le style de ses 5 prototypes (scratchpad/ides) dans l'atelier (sauf les photos Unsplash de DevEcosystem) | à faire avec les 11 éléments restants |
| 25/09 | Beau : « je ne vois pas où je vois comment ils travaillent » → grand bouton « 🏢 L'immeuble en direct » en haut de l'accueil de chaque entreprise + icône 🏢 dans la barre de gauche (et pastille au téléphone) | ✅ 25/09 staging |
| 25/09 | Beau (entreprise « test », marketplace de voitures) : « pas d'éditeur de code, pas d'agents développeurs… tout ce qu'on développe, c'est pour tout le monde » → (1) l'atelier est ouvert au propriétaire de TOUTE entreprise de Léo (Worker + écran), chaque projet rattaché à son entreprise, plafond 1 $/jour/personne gardé ; (2) à la fondation, un projet de site/app/logiciel/marketplace reçoit son équipe de code (droit de coder aux postes de développement du modèle, ou une développeuse full-stack + un testeur s'il n'y en a pas) ; son entreprise « test » réparée (Awa Mensah, Idris Kamga, salon Développement) ; (3) règle écrite dans CLAUDE.md §10 | ✅ 25/09 staging · coût à surveiller : chaque propriétaire peut dépenser jusqu'à 1 $/jour dans l'atelier |
| 25/09 | Beau : « immeuble plus vivant, plus humanisé » : un personnage qu'on dirige à la souris, l'accueil qui présente l'entreprise au clic, l'organigramme (chef puis équipe), stagiaires, nouvelles recrues du mois, RH ; + « fais un prompt pour Gemini, 300 propositions, quelque chose qui n'a jamais existé » → prompt écrit (docs/plans/2026-09-25-prompt-gemini-immeuble.md) | prompt ✅ · immeuble V2 à faire (après les 300 de Gemini) |
| 25/09 | Beau : « près de 300 choses dans le plan, 25 agents : que chacun fasse une tâche, divise le travail » → 17 tâches urgentes tirées du plan (une par agent), 8 agents réveillés (Boussole, Caisse, Tirelire, Cap, Maître, Atelier, Socle, Balance ; Foulée/Athlo laissé en veille), annonce dans Direction, passage lancé | ✅ lancé 25/09 ~0 h 15 · relire chaque livrable |
| 25/09 | Beau : « j'espère qu'en travaillant, ils entraînent notre modèle open source » → vrai en partie : chaque échange est gardé (ia_traces, consentement « entraînement » activé pour Finjaro : 100 traces, dont 87 en 24 h). Aucun modèle n'est encore entraîné avec : il faudra choisir un modèle ouvert, trier les meilleurs échanges (livrables relus « repris ») et payer un entraînement (GPU). À proposer à Beau avec un coût | à chiffrer |
| 25/09 | Beau : « les trucs qui font vivre des centaines d'agents (MiroFish), s'il y a déjà le code, entraîne nos agents pour qu'ils deviennent plus forts » → **salle d'entraînement de l'Institut** : nos agents s'exercent contre des clients, vendeuses ou concurrents SIMULÉS (ex. Lien relance 20 vendeuses imaginaires, Rigo cherche la faille dans 20 fiches piégées), notés, les échecs deviennent des leçons (Mentor). MiroFish est en AGPL : on reprend l'idée, on écrit notre code. Toujours marqué « entraînement / simulé », jamais mélangé aux vrais chiffres | à faire (après l'immeuble V0) |
| 25/09 | Beau : « et les fichiers Google AI Studio (5 prototypes) pour le design, ça en est où ? » → point fait à Beau : étudiés (docs/plans/2026-09-25-atelier-5-prototypes-de-beau.md), 15 éléments ; faits : terminaux multiples, palette Ctrl+K (Ada), revoir la séance, droits ; reste 11 | en cours |
| 25/09 | Beau : « pourquoi Rigo n'a pas pu trouver les liens lui-même ? Il doit pouvoir chercher » → outils de lecture pour les agents : classer les fiches (vues hors robots, ajouts au panier, prix manquant, photos, description) et voir une fiche | à faire (suite immédiate) |
| 25/09 | Beau : « le user doit pouvoir donner à ses agents soit la lecture seule, soit la modification » → réglage « Ses droits : Lecture seule / Peut modifier » dans la fiche de chaque agent (peut_coder) | ✅ 25/09 sur staging (8324641) |
| 25/09 | Beau : « je ne vois pas comment Ada code… je ne vois pas comment ça se fait » (arrivé après la fin, 50 s de travail) → « ▶ Revoir la séance » : le dernier travail rejoué pas à pas (messages, fichier qui se tape avec le curseur d'Ada, commandes) ; les tâches de code des agents se font DANS l'atelier (Ada : palette Ctrl+K, 18/18 tests, projet « Chantier — Palette Ctrl+K (Ada) ») | ✅ rejeu sur staging (8324641, vérifié en local) · à faire : que legion-travail envoie d'office une tâche de code à l'atelier |
| 25/09 | Beau : « Ada ne travaille pas seule ? Rigo, un stagiaire, un collègue… plus rapide » → dans l'atelier, plusieurs agents dans la même conversation (Rigo relit, Ada appelle un collègue, visages) | à faire |
| 25/09 | Beau : « Présente-moi comment ça marche : rien » → vérifié : marche chez moi (réponse en 30 à 45 s, sur son projet et sur la Palette). Probablement tombé pendant mon test sur son compte : ne plus tester sur son compte pendant qu'il y est | à revérifier avec lui |
| 25/09 | Beau : « Ctrl+K, rien ne se passe » → dans l'aperçu, il faut cliquer dans la page d'abord (sinon Chrome prend Ctrl+K pour sa barre de recherche) ; la palette d'Ada doit entrer DANS l'atelier (Ctrl+K partout) | à faire (intégration) |
| 25/09 | Les agents n'ont **aucun outil pour ouvrir une page** de finjaro.net (Rigo bloqué deux fois sur « fiche vue → panier ») → outil « voir la fiche » en lecture : prix, photos, description, livraison, et une capture téléphone. Pour tous les utilisateurs de Léo : « voir une page de MON site ». Ada : « livrable vide » quand on lui demande du code → le code reprend maintenant tout texte long rendu, et note les champs reçus au journal | à faire (outil) · ✅ 25/09 (livrable vide, à vérifier au prochain passage) |
| 25/09 | Beau (nuit) : « quand tu as un gros plan, tu ne dois pas le garder : tu en prends une bonne partie, tu divises et tu envoies aux agents dans Léo, dans Finjaro ; quand j'entre, je dois voir comment ils sentent le travail, les crises… Je te l'ai dit 20 fois. » → chantier « Atelier façon VS Code » (15 éléments des 5 prototypes, test de sécurité, entretien d'embauche, Meta) découpé entre Ada, Rigo, Mentor, Orchestre, Plume, Forge, Alpha : tâches **haute priorité** au tableau, message de lancement et réunion de lancement en direct dans Direction. `legion-travail` : une tâche haute ou urgente passe avant les plus anciennes (point 7 des agents autonomes) | ✅ 25/09 23 h 07 : 8 tâches urgentes, message de lancement, réunion en direct (vrai désaccord : produit d'abord). `legion-travail` : urgente > haute > ancienne, et une urgente pas livrée n'attend pas le passage suivant. 7 livrables en 6 min, relus un par un dans les salons (corrections dites à Alpha, Rigo, Mentor, Forge, Plume). Défaut trouvé et corrigé : les livrables étaient coupés à 4 000 caractères (16 000 maintenant). Rigo débloqué avec le classement par fiche. Ada n'a pas encore rendu la palette |
| 25/09 | ✅ 25/09 : finjaro.net sert la version avec le terminal (texte trouvé dans le code servi). Vérifié en vrai puis mis en ligne (d011b90) : terminal où l'humain tape (sortie, code 0), bouton « Tout autoriser » sur la carte → la commande suivante passe sans carte. Défaut vu : Ada ne sait pas dans quel mode elle est (« je continue à demander ») → ✅ 25/09, le mode est dans sa consigne (d2e685e, staging). La liste des terminaux se perd au rechargement ; `cd` ne tient pas ; pas de flèche haut ni d'arrêt (rapport des 5 prototypes) | à faire |
| 25/09 | Beau (captures) : dans l'atelier, Awa Mensah dit « je ne peux pas voir, parler ou coordonner d'autres agents, ni recruter » et ne sait pas ce qu'est « la marketplace » : « c'est un gros problème… elle devait le faire » | ✅ 25/09, 00 h 36 (6cb03ae, staging) : pour TOUTES les entreprises, l'agent de l'atelier reçoit le projet de l'entreprise et son équipe, et a 4 outils : voir l'équipe, confier une tâche (urgente, au tableau de Léo, l'équipe est réveillée aussitôt), lire le travail rendu, proposer une recrue (toujours une carte, même en « Tout autoriser »). Essai réel dans « test » : Awa a présenté les 5 membres et le projet (voitures), a lu les fichiers, puis a confié à Idris un plan de 10 cas de test avec les champs du formulaire. L'équipe s'est réveillée (plans de la semaine écrits). Livrable d'Idris : à vérifier |
| 25/09 | Beau (~00 h 45) : « ce que tu fais n'est pas seulement pour Awa ni pour cette session : c'est pour tous les agents, tous les utilisateurs, et pour chaque nouvel agent créé » | ✅ vérifié 25/09 : l'équipe est relue dans la base à chaque séance de l'atelier (rafraîchie toutes les 5 min) pour n'importe quelle entreprise ; une recrue ou un agent créé ensuite apparaît sans rien faire. Dans les salons, les agents savaient déjà proposer une recrue (« engager_agent », Confirmer) et créer des tâches ; au travail du jour, ils se passent déjà le relais. Reste : dans l'atelier, c'est toujours le PREMIER agent « peut coder » qui tient le clavier → laisser choisir qui code quand il y en a plusieurs |
| 25/09 | Beau (~00 h 50) : « tu peux pousser sur finjaro.net… mais les agents n'ont pas encore rendu le travail que tu leur as donné (les 100 points d'Alpha, les autres) » → pointage : 41 tâches données depuis le 23/09, ~20 rendues, 21 en attente parce que personne n'avait relancé le travail depuis 23 h 57 → relancé à 00 h 44 (5 rendus en 2 min). Défaut trouvé CHEZ MOI grâce à Rigo, Semeur et Atelier : un événement de test « PLACEHOLDER » cassait l'outil « fiches » → corrigé (61b116c, déployé 00 h 45). 7 relectures envoyées (Rigo, Semeur, Vigie, Alpha, Écho, Lien, Plume). Mise en ligne finjaro.net : refusée deux fois par le garde-fou des permissions, puis Beau a écrit la phrase exacte → ✅ 25/09 ~01 h 15, finjaro.net sert 5ab7799 (vérifié dans le code servi) : atelier ↔ équipe, carte Recruter, projets séparés par entreprise, immeuble « Voir comment il travaille », 300 propositions. Côté serveur (commun) : passage des urgences toutes les 15 min, outils code et paiements | en cours (relire les rendus) |
| 25/09 | Beau (~01 h, 5 captures + 3 prototypes Google AI Studio en .zip : « Léo – Entreprise d'agents IA » ×2, « Nexus Corp – L'immeuble des agents IA ») : aime la **salle de réunion** (séance en direct, table des participants, compte rendu + actions assignées, convoquer une réunion), l'**Académie** (fiche de l'apprenant, compétences par rang, modules « Envoyer en formation »), les **connecteurs** (tiroir, état branché, débrancher), et surtout la 5e : **la Tour avec zoom** (1 Mégalopole → 2 Quartier d'affaires → 3 Immeuble → 4 Secteur/étage → 5 Focus agent), filtres contrat (directeur, CDD, alternant, stagiaire) et statut. Idée : **plusieurs tours, une tour = un projet** (un à deux mois), une ville comme les Sims. « Le design était pitoyable, tu peux faire beaucoup mieux. » Et : « c'est toi qui relances : ils ne doivent PAS être bloqués, ils doivent être surpuissants » | à faire : (1) le travail repart tout seul ; (2) lire les 3 prototypes en entier ; (3) reprendre salle de réunion, Académie, connecteurs, la ville et ses tours, avec les VRAIES données (leurs chiffres d'exemple — 96 % réputation, 1420 requêtes/j, XP — ne sont jamais repris) |
| 25/09 | Beau (~01 h 30), avant de dormir : « une proposition pour les prototypes Google AI Studio, même si je ne suis pas d'accord ; puis tout ce que je t'ai demandé depuis ce matin, point par point, divisé avec les agents ; prends tes décisions ; staging seulement, PAS finjaro.net ; demain je vois ce qui dépend de moi » | ✅ proposition : https://claude.ai/artifact/ErZVX16MUtJcXNq97KaDis · plan : `docs/plans/2026-09-25-nuit.md` · 8 tâches aux agents (5 difficiles) · en cours toute la nuit |
| 25/09 | Nuit — **La Ville de Léo** dans l'application (staging) : table `legion_projets` (0205, additive), vue « La ville » par défaut dans le Bureau (une tour par projet daté, hauteur = tâches rendues, échafaudage = restantes, grue = en cours, fenêtres = agents qui ont pris une tâche il y a moins de 10 min), créer un projet, ranger des tâches, entrer dans une tour = l'immeuble du projet. 4 vrais projets créés pour Finjaro (Atelier de code V1, Carte « Articles sans prix », La Ville de Léo, Paiements et comptabilité), 37 tâches rangées | ✅ 25/09 nuit (e3fbc61, bd3c4ad), vu à l'écran avec les vraies données |
| 25/09 | Nuit — **Salle de réunion** (vraies réunions autour d'une table, celui qui parle, compte rendu, actions) et **Académie** (compétences, examens, livrables contestés, « Envoyer en formation » crée une vraie tâche) ; **« l'Académie » partout** (plus d'« Institut » en double, relevé par Plume) ; **vrais logos** des connecteurs (Simple Icons, CC0) + ligne « bientôt » | ✅ 25/09 nuit (d580d55, d2caab1), vu à l'écran |
| 25/09 | Nuit — **carte « Articles sans prix »** dans l'espace vendeuse : prix dans la devise de SA boutique, « Garder sur demande » retenu (0206, additive), pas de devise sans pays, jamais de notification. Textes Plume/Lien, cas de Rigo | ✅ 25/09 nuit (cd0b024), vu en 390 et 1440 px sur la boutique de Beau (rien enregistré) |
| 25/09 | Nuit — **agents débloqués** : outil « lire_page » (ouvrir une page web publique, pour tous), code lu par 20 000 caractères, « fiches » donne le total du catalogue hors boutiques de test (écart 472/407 de Boussole), événement « PLACEHOLDER » ; 6 tâches relancées avec une note à chaque agent ; 12 relectures envoyées | ✅ 25/09 nuit (7612f0e, 4cc6173). Forge a déjà ouvert 3 pages officielles avec |
| 25/09 | Nuit — **atelier : du beau par défaut** : GPT-6 Sol d'abord (il répondait HTTP 400 à chaque appel à cause d'un réglage manquant : corrigé), règles de design de studio, vraie base de site au départ, interdiction des statistiques/avis/badges inventés. Essai réel (Awa, société « test ») : page d'accueil de marketplace de voitures nettement plus belle, mais chiffres inventés (12 400 annonces, 98 %) → règle durcie | ✅ 25/09 nuit (52d6511, 850b9c5) · 2e essai avec GPT-6 Sol à faire |
| 25/09 | Nuit — **les livrables de l'équipe Finjaro sortaient en anglais** depuis 00 h 55 : l'entreprise était passée en « EN » (le petit bouton FR/EN du téléphone, collé à « Se déconnecter », change aussi la langue d'écriture des agents). Remise en français ; le bouton demande maintenant confirmation avant de changer la langue des agents (l'écran, lui, change tout de suite) | ✅ 25/09 02 h 10 (dfc0624) · les livrables suivants sont revenus en français · **Beau : si ton téléphone affiche Léo en anglais, appuie sur FR** |
| 25/09 | Nuit — Orchestre : « 15 endroits où la Ville pourrait mentir » → règle 0 codée (un agent éteint n'allume jamais de fenêtre, testée) ; les règles 1-2, 5, 8, 10, 13, 14 étaient déjà vraies | ✅ 25/09 (dfc0624) |
| 25/09 | Nuit — Traque ne ramenait que 2 boutiques : la recherche web passait APRÈS l'enquête (lire_page n'avait aucune adresse) et partait du texte brut de la tâche (résultats : trading, emplois). → les pages trouvées sont données à ouvrir, et **chercher_web** : l'agent fait ses propres recherches ciblées (métier + lieu + canal), plusieurs fois ; la consigne d'enquête dit de vérifier plutôt que de se dire bloqué | ✅ 25/09 (dfc0624, ee22992) · à relire au passage de 02 h 45 |
| 25/09 | Nuit — Rigo (Qualité) : « 0 porte vue, je n'ai pas de navigateur » → **voir_ecran** : le Worker de l'atelier ouvre une page publique dans un vrai navigateur Cloudflare (texte affiché + capture décrite par Gemini), téléphone ou ordinateur, pour tous les agents. 0207 (additive) : le Worker demande à la base si le jeton du travail est le bon, rien d'autre. Essai réel : l'accueil de finjaro.net rendu fidèlement | ✅ 25/09 02 h 22 (84ef15b) · **limite** : pages publiques seulement — l'écran vendeuse et Léo demandent une connexion (voir 0.2 : compte de test pour la Qualité) |
| 25/09 | Nuit — séance atelier « Essai GPT-6 Sol » figée par le redéploiement (Durable Object remis à zéro) : arrêtée proprement avec Stop | ✅ 25/09 02 h 05 |
| 25/09 | Nuit — **terminal de l'atelier** (suite des remarques de 04 h) : un `cd` tient d'une commande à l'autre (le dossier est relu à la fin, gardé seulement s'il reste dans le projet), historique des 50 dernières commandes (flèches haut/bas), dossier affiché devant l'invite. Premier essai : un `exit` tuait la session du bac à sable → la commande tourne dans un sous-shell | ✅ 25/09 02 h 40 (7ed70bc, 7fe2402), essayé en vrai : `cd essai`, `cd sous`, `cd /etc` ramène au projet, code 1 rendu. Le bac du projet « Essai GPT-6 Sol » est resté coincé par le premier essai : il se remet à zéro après 10 min de veille |
| 25/09 | Nuit — Traque, suite : trois passages sans une page ouverte (l'enquête décidait « rien à vérifier »). → **recherche guidée** pour toute tâche qui cherche dehors : 3 requêtes ciblées écrites pour la tâche, puis les 3 meilleures pages ouvertes (annuaires en dernier). Et les vérifications tiennent dans 30 000 caractères (six pages lues faisaient échouer le livrable) | ✅ 25/09 03 h 10 (07ffa1c, f1a00da, 2a1d077 : recherches en parallèle, Google surchargé faisait dépasser le temps du passage) · **03 h 32 : Traque rend 10 boutiques (Maroc, Côte d'Ivoire, Ghana, Sénégal, France), 4 recherches, 3 pages ouvertes, deux étages « vue / à vérifier »** ; correction dite (une boutique classée « vue » sans l'être). Rien envoyé : attend le Confirmer de Beau |
| 25/09 | Nuit — relectures dites aux agents : Traque, Orchestre, Lien (brouillon « prix » contraire à la règle « aucune notification » : ne part pas), Claudinette (le taux FCFA→EUR est la parité fixe officielle, pas une erreur ; utiliser « paiements »), Rigo (les $US viennent du navigateur situé aux États-Unis : comportement voulu), Ada (carte « Bon retour » : tables inexistantes, import faux, textes en dur, colonne à proposer en migration) | ✅ 25/09 nuit |
| 25/09 | **Rapport du matin** pour Beau : https://claude.ai/artifact/9jgBLbsmiKSGMJg3BnrLhQ (fait, agents, décisions, ce qui dépend de lui, ce qui reste) | ✅ 25/09 03 h 35 |
| 25/09 | Veille de Claudinette (05 h 35) : la BCEAO fixe au 30/09/2026 l'ouverture de PI-SPI par les émetteurs de monnaie électronique des 8 pays UEMOA (paiements instantanés entre particuliers, gratuits, QR standard). À étudier pour le paiement de la place de marché dans ces pays (un QR commun au lieu d'un opérateur par opérateur) — pas avant d'avoir des commandes | idée, rien d'engagé |
| 25/09 | Beau (matin) : « Je t'autorise à mettre staging en ligne sur finjaro.net » | ✅ 25/09 (5ab7799 → 339e35e, avance rapide de 26 commits) ; vérifié : finjaro.net sert le nouveau code (bouton de langue avec confirmation présent) |
| 25/09 | Beau (matin), sur les « pas fait » du rapport : « Jarvis, la prise en main de ton ordinateur, le branchement des connecteurs Supabase, Cloudflare et Vercel par entreprise, le test de sortie du bac à sable… fais » → décisions : (1) test du bac = contrôle défensif des barrières (réseau, écriture, clés), pas de techniques d'évasion ; (2) ordinateur = les Claude de Chrome que Beau utilise déjà se branchent sur Léo (MCP) et prennent les tâches « mon ordinateur », écran visible, arrêt à tout moment ; (3) connecteurs Supabase / Cloudflare / Vercel par entreprise, lecture seule, jeton au coffre ; (4) Jarvis V0 = télécommande vocale de Léo | ✅ 25/09 matin, sur staging : (1) contrôle des barrières du bac : 11/11 au bon état (aucune clé, sites et base fermés, adresses internes fermées, écriture refusée, « … \| sh » refusé) — et un DÉFAUT trouvé et réparé : tout le HTTPS était coupé, npm install ne pouvait pas marcher (969078e, 9dbe8fb) ; (2) « 🖥 Mon ordinateur » au tableau + 3 outils MCP (lister, prendre, rendre), essayé de bout en bout (f817ef1) ; (3) connecteurs Supabase, Cloudflare, Vercel par entreprise, jeton au coffre, lecture seule, 0208 (fcfc9fc, 54db6b0) ; (4) Jarvis V0 : bouton « Parler à Léo » ou Espace tenu, legion-jarvis, 40/40 à l'examen d'Ada, refuse à la voix envoyer / payer / supprimer (f8254c8). Agents : Forge (aides, reprises), Vigie (mauvaises pages, corrigé), Plume (2 phrases fausses retirées), Ada (40 phrases = l'examen), Rigo (plan de vérification). **Pas encore sur finjaro.net : attend le mot de Beau** |
| 25/09 | Beau (matin, capture de l'icône 🏢 « L'immeuble ») : « la première icône du building ne me plaît pas, je veux un truc réel — génère sur Fish, ElevenLabs ou Gemini une vraie icône ; ce qu'on veut, c'est un monde virtuel avec les avatars, le plus réel possible ». Puis : « j'ai plusieurs choses, je vais envoyer captures et messages ; ne réponds pas jusqu'à ce que je dise « Claude répond » — tu lis seulement » | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), Léo — les tours d'abord (captures à venir) : « un immeuble = mon compte ; sa taille dépend de mes agents, de mon entreprise ; peut-être le nombre d'étages que je veux. Plusieurs agents → plusieurs étages, plusieurs bureaux. Je clique, j'entre : il y a la réceptionniste ; j'ai MON avatar réel que je crée ; je peux causer avec la réceptionniste, prendre l'ascenseur, aller dans les pièces. J'aime les vues actuelles quand on clique dans les tours, mais je veux beaucoup plus de visuel, plus dynamique ; mon avatar marche, je le contrôle, il doit être très réel ; je marche, je salue, j'entre dans les salles de réunion. » (« bon, je reprends » : la suite arrive) | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin) : capture de la carte « The live building » (icône 🏢) : « l'icône ici, je vais la changer, je ne l'aime pas » ; référence envoyée : une tour de verre photoréaliste au coucher du soleil dans une skyline (docs/vestiaire/captures-beau/2026-09-25-reference-tour-realiste.png) — « ça doit être ULTRA réaliste » ; « maintenant je clique, et je clique sur Entrer » (la suite arrive) | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), capture de « La ville » actuelle (tours vectorielles, grues, lune) + 4 références (tours de verre, skyline au coucher du soleil, ruelle fleurie, maison avec verrière ; docs/vestiaire/captures-beau/2026-09-25-*) : « quand j'entre, soit mon immeuble avec les étages = mes projets (Atelier de code, Carte, Ville de Léo, Paiements…), soit — mieux — plusieurs immeubles RÉALISTES comme sur les photos, un par projet, leur taille selon le projet ; pas un truc droit vectoriel, une vraie atmosphère ; l'heure et la météo du pays : le matin, l'image du jour, le ciel et la température ; « pense à prendre de l'eau », « il fait beau », il fait chaud → les agents en tenue légère ; et quelqu'un peut choisir un quartier de maisons avec des fleurs au lieu des immeubles » | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), 4 références de plus (rue de maisons, lotissement moderne, grand carrefour de nuit aux enseignes lumineuses, restaurant d'entreprise ; docs/vestiaire/captures-beau/2026-09-25-ref-*) : « chaque agent a sa maison, sa vie ; ils ont un quartier, des restaurants ; tu peux circuler, voir ceux qui sont au restaurant, la montagne, des paysages — vraiment une vie complète, un pays complet » | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), captures de l'immeuble actuel, du rez-de-chaussée (Réception, Salle de réunion, Atelier), de la salle de réunion actuelle, et deux références (prototypes « CodeWhatsApp Studio » : éditeur + escouade d'agents qui se parlent ; « DevEcosystem » : bureau des agents, moral, charge, recrutement de stagiaires) : « j'aime la vue d'ensemble actuelle, MAIS quand j'entre dans l'immeuble (ou l'appartement, ou ce qu'on a choisi), j'ai d'abord un personnage qui marche à gauche, à droite, ULTRA réaliste selon le personnage que j'ai construit — comme dans GTA, pas des cubes avec une tête ronde : il marche, il bouge ; il arrive à la réception, avec de vrais réceptionnistes ; il va à l'ascenseur, ou au salon de l'hôtel ou de la maison où les gens parlent travail ; il prend l'ascenseur, monte les étages. On peut arriver à la vue actuelle (capture 2) ; si je tape Réception, ça me ramène à la réception ; Salle de réunion : je vois les agents en réunion ; je vois les vrais agents en train de travailler ; pareil pour l'atelier de code — comme la capture 3, on voit comment les agents interagissent dans le code, on peut modifier (comme la « core dev squad » Linux). La salle de réunion doit être beaucoup plus réelle. » | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), capture de l'Académie (fiche d'Alpha : 32 compétences, 2 en revue, examens 0/0, 4/19 livrables contestés, « Envoyer en formation ») : « l'Académie est bien, mais encore à améliorer selon ce qu'on a » | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), capture de l'organigramme (Finjaro → 7 départements, cartes d'agents avec une simple initiale ; affiché en anglais ce jour-là) : « l'organigramme, on ne voit pas les photos et tout ça : à améliorer encore » (capture : `docs/vestiaire/captures-beau/2026-09-25-organigramme-actuel.png`) | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin), capture de l'accueil de Léo (« Mes entreprises ») + référence (Paris vu du ciel, tour Eiffel, coucher de soleil) : depuis cet accueil, voir **tout un pays partagé** : toutes les personnes qui ont un compte et un projet construisent leurs immeubles, ce qui fait une atmosphère, un pays. On circule, on voit les entreprises des autres **sans pouvoir y entrer** (pas d'accès) ; on dézoome ville → pays → océans et continents (les lumières) → planète. Certains pourront faire des projets comme des restaurants ; visite **gratuite**, ouverte à tous, où chacun présente son entreprise (captures : `docs/vestiaire/captures-beau/2026-09-25-accueil-leo-mes-entreprises.png`, `…-ref-paris-vue-aerienne.png`). À trancher avec lui plus tard : chaque entreprise choisit ce qu'elle montre (rien de privé visible par défaut) | noté ; en attente de « Claude répond » |
| 25/09 | Beau (matin) : « fais un prompt pour Google AI Studio : n'y donne pas d'ordres, explique juste Léo, tout ce qu'on a dit depuis la création, même ce qui n'est pas fait (dont la partie code interactive) » + « un prompt pour ChatGPT, Gemini, Perplexity : qu'ils donnent LEURS idées, sans se baser sur ce que j'ai dit » ; et « si tu as besoin de photos pour prendre exemple, dis-le » | ✅ 25/09 : `docs/PROMPTS-LEO-25-09.md` (les deux prompts), donnés dans la conversation · attend : ses retours d'AI Studio et des trois IA |
| 25/09 | Beau (matin) : « je colle et je t'envoie les résultats ; pendant ce temps, travaille » → (1) **organigramme avec les vraies photos** (remarque de Beau), l'état de chacun (écrit en ce moment / sa tâche / disponible / en veille), le nombre au travail par département, chef puis équipe quand `chef_id`/`grade` sont remplis, clic → fiche ; l'export PNG/PDF garde les photos ; (2) tâches confiées : **Forge (difficile)** — comment faire un monde ultra-réaliste dans un navigateur de téléphone (5 voies comparées, coûts, avatars) ; **Vigie** — les bureaux virtuels existants ; **Mentor** — 10 améliorations de l'Académie sur données réelles ; **Plume** — les phrases de la réceptionniste (FR/EN) | (1) ✅ 25/09 sur staging, vu en 1600 px et dans le PNG exporté · (2) livrables à relire |
| 25/09 | Suite du même message — **le ciel réel de la Ville** : l'heure et la météo de là où est la personne (ville tirée du fuseau horaire du téléphone, jamais de la langue ni du GPS ; on peut changer de ville), lever du jour / journée / coucher / nuit d'après les vraies heures du soleil, nuages, pluie, neige, brouillard, température (°F seulement aux États-Unis), et « Il fait 32 °C à … : pense à boire de l'eau » au-dessus de 30 °C. Météo Open-Meteo, sans clé. ⚠ Leur API gratuite est réservée à l'usage **non commercial** : avant de faire payer Léo, prendre leur abonnement ou passer par MET Norway (gratuit, commercial permis) | ✅ 25/09 sur staging (vu : « 28 °C · Douala · journée », ciel couvert). Reste le rendu ultra-réaliste (attend l'étude de Forge et les retours AI Studio) |
| 25/09 | Beau a collé les réponses de **cinq IA** au prompt d'idées (≈ 150 propositions) | ✅ 25/09 : tri dans `docs/plans/2026-09-25-idees-des-ia-tri.md` (signal fort : bureau du dirigeant, confiance progressive, carnet des décisions, livrables avec provenance, monde qui montre les blocages ; refusé : humeurs/potins simulés, imiter des personnes réelles) ; vérification des produits et chiffres cités confiée à Vigie · attend : son choix des prochaines briques |
| 25/09 | Beau : « utilise plusieurs outils, même ElevenLabs, pour faire les designs, sinon ce sera trop 2D ; ça doit être RÉEL » | 🟡 25/09 : 2 tours photoréalistes générées (ElevenLabs, Seedream 5 Pro, ~0,15 $ l'image) |
| 25/09 | Beau, à la suite : « les réceptionnistes, ce sont de vraies personnes qui bougent, qui marchent, comme un jeu » ; « c'est un vrai chantier, un vrai projet, pas des blagues » ; « comme God of War, où les gens marchent… de vrais buildings où les gens marchent, passent des appels » ; « et pas des gens en 2D » ; « utilise aussi Fish, on a payé hier, on n'a pas encore testé » | 25/09 : plan `docs/plans/2026-09-25-monde-3d-leo.md` (3 niveaux : 3D navigateur / Unreal + MetaHuman diffusé / vraie Terre). Preuve : un personnage 3D réaliste qui marche dans le navigateur (Microsoft Rocketbox, MIT, 115 personnages, 471 animations dont téléphoner). Étape 1 = la réception jouable · attend Beau : le niveau 2 (coût par heure et par personne) · Fish : à tester (la clé posée ressemblait à une clé OpenAI, à vérifier) |
| 25/09 | Beau (capture des secrets Supabase, `FISH_AUDIO_API_KEY` posée le 24/09 à 20 h 26) : « le budget, ça sera combien pour ce niveau God of War ? » | ✅ 25/09 : chiffrage donné (licence Unreal gratuite sous 1 M$ de revenus ; diffusion : Streampixel 99 €/mois pour 2 personnes simultanées puis 45 €/mois par place, ou ~0,10 $/min chez Eagle 3D ; machine de dev avec carte graphique ~1 500–2 500 $ ; un développeur Unreal indépendant 15–70 $/h, première tranche estimée 200–400 h). Fish : la liste ne montre pas la valeur ; test par un vrai appel quand la voix de la réceptionniste sera branchée · attend : sa décision |
| 25/09 | Beau : « je vais t'envoyer les propositions de Gemini (AI Studio) : prends ce qui peut t'aider, ce qui est innovant, ce à quoi tu n'avais pas pensé ; ne jette pas tout comme je te connais » | attend son envoi · consigne : reprendre largement, dire ce qui est repris et pourquoi, n'écarter que ce qui contredit une règle écrite, en le disant |
| 25/09 | **Beau : budget max 20 € par mois** (« je n'ai pas cet argent ; on va se battre avec ce qui existe pour avoir le meilleur résultat : dépôts Git, API gratuites ») ; « God of War, j'exagérais : c'était pour dire que ça doit être RÉALISTE » ; « moi je voulais même en 4D ». Envoie 3 prototypes Google AI Studio (.zip) : « Léo – monde virtuel des agents IA », « Léo – simulation d'entreprise 3D / orchestration d'agents IA », « Léo – 3D corporate AI simulation » ; un 4e arrive | ✅ 25/09 : les 4 prototypes construits et essayés ; idées reprises dans `docs/plans/2026-09-25-prototypes-gemini-monde.md` · en cours : étude des 3 prototypes (reprendre largement, cf. consigne) · décision : niveau Unreal diffusé écarté (trop cher) ; 3D navigateur avec outils gratuits |
| 25/09 | Beau : 4e prototype « Léo – simulation d'entreprise 4D » ; « ils ont vraiment mal fait, c'est pour les idées ; en graphisme je veux du réalisme, au minimum GTA San Andreas / Vice City / Liberty City, plus si on peut » ; « leur 4D n'est pas la vraie 4D » | noté · idées reprises (même fichier) · cible graphique : au moins San Andreas, avec outils gratuits (three.js, Rocketbox, Poly Haven) |
| 25/09 | Beau : « fais-moi voir à quoi ressemble ta 3D, avec les lumières et le vrai ciel » | 🟡 25/09 : premier jet envoyé (3 captures, `docs/vestiaire/monde-3d/2026-09-25-premier-jet-*.jpg`) : vraie 3D (three.js), avatar et réceptionniste Rocketbox, meubles Poly Haven, ciel réel, salle de réunion avec les agents assis quand une réunion a lieu. Pas fini : la ville dehors en blocs, hall encore vide, lumière à travailler, pas encore branché dans Léo (moteur `src/screens/legion/monde3d/`, fichiers 3D `public/monde3d/`, ~22 Mo, 0 €) |
| 25/09 | Monde 3D **branché dans Léo** (staging) : onglet « Le monde 3D » en tête de « L'immeuble en direct », pour toutes les entreprises ; chargé seulement à l'ouverture (three.js à part). Avatar au choix (14 corps), Z Q S D / flèches / joystick au téléphone, Maj, E, V ; caméras 3e / 1re personne / plan ; ascenseur et raccourcis Réception / Salle de réunion / Atelier ; réceptionniste qui salue, répond sur les vraies données (qui est en réunion, qui travaille, où est un agent) et parle (voix du navigateur) ; écran « Aujourd'hui chez … » avec les vrais chiffres ; agents assis en réunion ou à leur poste seulement quand c'est vrai ; carte de l'agent à portée → sa fiche. Vu dans Léo avec les vraies données (1440 et 390 px) | ✅ 25/09 sur staging · à faire : la ville dehors réaliste, plus de décor, la voix Fish, les écrans des postes avec le vrai code de l'atelier, les agents qui marchent d'une pièce à l'autre |
| 25/09 | Beau : « OK, continue ; après, tu vérifies image par image que tous les détails sont bons, que tout marche parfaitement » | en cours : ville réaliste dehors, décor, lumière (reflets du vrai ciel) ; puis contrôle image par image de tout le parcours (marcher, réceptionniste, E, ascenseur, étages, caméras, téléphone) |
| 25/09 | Beau : « pousse déjà, ensuite continue : les voitures et tout ; je vais tester » ; « quand je clique sur le lien, ça me renvoie à la marketplace » (normal : la racine de staging est la place de marché → lien direct `/legion` donné) ; « les 6 points → Legion me renvoie sur finjaro.net » (défaut : les adresses du sélecteur étaient celles de la production) ; « voitures, motos, passants, restaurants, une ville comme Tokyo » | ✅ 25/09 : sélecteur corrigé (en préproduction, une application de finjaro.net s'ouvre sur la préproduction ; Accounting inchangé) · en cours : la ville vivante (rues, voitures, passants, restaurants) · finjaro.net : attend « oui, pousse sur finjaro.net » (demandé) |
| 25/09 | Beau a testé le monde 3D : « intéressant, mais lent : long à ouvrir, lent à jouer (au téléphone ça va) ; on passe à travers les ascenseurs ; je clique « prendre l'ascenseur » et ça recharge encore et encore » | en cours : (1) chaque étage et la ville construits une seule fois (changement d'étage instantané) ; (2) lumières et effets coûteux retirés, textures partagées, moins d'objets ; (3) murs et obstacles (ascenseurs, chaises, meubles) |
| 25/09 | Beau : « il n'y a pas plusieurs étages » ; « sur ordi ça rame de fou » ; « ce n'est pas bien décoré » | ✅ 25/09 (staging, contrôlé image par image) : un étage par département (vrais départements, bureaux au nom des agents, occupés seulement quand l'agent travaille), ville fusionnée (443 → quelques dizaines d'appels de dessin), résolution qui s'adapte à la puissance, décor du hall, de la salle de réunion et des étages |
| 25/09 | Monde 3D, 2e passe (staging) : **ville vivante** (rues, passages piétons, tours en mur-rideau qui reflètent le vrai ciel, boutiques et restaurants avec enseignes et néons verticaux, lampadaires, bancs, voitures et motos qui circulent, passants, terrasse de café) ; **un étage par département** (vrai nom, bureau de chaque agent avec sa plaque, assis seulement s'il travaille, écran avec sa tâche en cours, salle vitrée à montants noirs, plantes suspendues) ; **hall** : escalier hélicoïdal rouge, bar arrondi à tabourets, bandeaux lumineux, cadres ; **salle de réunion** : moquette, mur boisé à étagères, suspensions laiton, fauteuils orange ; **vitesse** : étages instantanés (construits une fois), 443 → 244 appels de dessin, plus de lumières ponctuelles ni d'occlusion, résolution qui s'adapte ; **corrections** : on ne traverse plus les ascenseurs ni les chaises, les noms ne suivent plus d'un étage à l'autre, caméra qui ne s'écrase plus contre les murs, sélecteur d'applications qui reste sur staging | ✅ 25/09 · à faire : maisons et paysages des agents, allure de la ville selon le pays, salle de marché, voix Fish, écrans avec le vrai code |
| 25/09 | Beau : « pourtant je t'ai donné les skills design » (réponse : ceux présents ici sont pour les pages web, pas la 3D) ; « j'espère que les agents travaillent sur les autres tâches pendant qu'on construit » (oui : les 5 tâches du matin sont rendues, à relire) ; « si tu as besoin de photos, dis-moi » → 5 photos de bureaux : postes en bois clair et caissons blancs, fauteuils noirs en maille, plantes sur les séparations, salle de réunion vitrée à montants noirs, grandes baies, plantes suspendues, espace café au gazon vert avec tables et lustres en bulles ; « c'est quoi lobbies » (= le hall d'accueil) | en cours : étages des départements dans ce style ; vitesse : 443 → 244 appels de dessin, étages instantanés |
| 25/09 | Beau : 2 photos de salle de marché (corbeille de bourse, murs d'écrans et bandeaux de cours, postes à multiples écrans) | idée : le style des étages suit le métier de l'entreprise (ex. « salle de marché » → étage en corbeille avec murs d'écrans ; les cours affichés = vraies données de l'entreprise ou d'une source publique, jamais inventés) · à faire après les étages de départements |
| 25/09 | Beau : 5 photos de salles de réunion (longue table, écran mural, suspensions au-dessus de la table, mur boisé avec étagères, fauteuils orange ou terracotta, moquette, plantes, mur acoustique bleu) | en cours : appliqué à la salle de réunion 3D |
| 25/09 | Beau : 5 photos de plus (bureau vitré à montants noirs, couloir habillé de bois avec bandeaux lumineux, immeuble de verre au crépuscule, escalier hélicoïdal rouge spectaculaire dans un atrium, comptoir-bar arrondi avec tabourets) | en cours : escalier rouge, bar arrondi et bandeaux lumineux dans le hall ; portes vitrées noires et bois aux étages |
| 25/09 | Beau : « tu ne peux pas envoyer un agent prendre les photos sur Google et te les envoyer ? » + 2 photos (tour résidentielle à balcons courbes ; appartement chaleureux avec suspensions, table en bois, plantes) | ✅ 25/09 : tâche à Vigie — planche de 40 références (8 thèmes, liens + détails à reprendre), pour l'inspiration seulement (aucune photo du web copiée dans l'application) · photos notées pour les maisons des agents |
| 25/09 | Beau : 5 photos de ville (terrasse de café parisien à auvent vert et chaises en rotin, immeuble aux fenêtres allumées la nuit, boulevard à terre-plein planté avec circulation, Shibuya aux néons la nuit, foule sur un passage piéton) | en cours : cible de la ville (terrasses, arbres d'alignement, foule, néons de nuit) |
| 25/09 | Beau : 3 photos de Yaoundé (grand rond-point du centre, marché, taxis jaunes) ; 3 de campagne (moutons dans un pré devant une montagne, hameau en pierre, maison fleurie) ; 3 villas avec piscine ; 1 plage (baie, montagne, palmiers) | idées : la ville prend l'allure de la ville de la personne (partout dans le monde) ; campagne, villas et plage = le monde de vie des agents (maisons, paysages) — étape après les étages |
| 25/09 | Beau (téléphone, dans WhatsApp) : le monde 3D reste sur « Loading the 3D world… » puis la page devient blanche ; la ville affiche « 67 °F · Paris » ; 2 références Instagram : des gestes de la main qui pilotent des agents numériques (cerveau simulé), pub emergentlabs « transforme ton idée en application » | ✅ 25/09 (staging) : mémoire graphique au téléphone 416 → 65 Mo (personnages et matières en 512, sans cartes de relief, 3 façades au lieu de 7, pas de passants), pourcentage de chargement, message clair + « Réessayer » au lieu du chargement infini (et conseil d'ouvrir dans Safari/Chrome si WhatsApp bloque), °C à Paris · détail : (1) mémoire graphique trop lourde pour un téléphone (textures en 1024, 15 personnages, ville) → version téléphone allégée ; (2) erreur visible au lieu du chargement infini ; (3) °F retiré hors des États-Unis (l'unité suivait la langue du téléphone) · idée notée : piloter Léo par gestes (caméra) |
| 25/09 | Beau (tests téléphone + ordi) : trop peu de pixels ; voix de la réceptionniste robotique (veut Fish) ; le personnage « court puis réapparaît derrière » ; seul, personne d'autre ; impossible de sortir de la salle de réunion, de descendre l'escalier, de sortir de l'immeuble ; voitures en marche arrière ; pas de passants ni de vendeurs ambulants ; cinématiques en vidéo ElevenLabs ; bâtiments de dehors plus réalistes ; téléphone à l'horizontale « en mode jeu » ; atelier trop vide (tableaux, fleurs, détails) ; « Parler » en plus de « Voir sa fiche », faire appel à un agent à l'atelier ; une seule salle de réunion, personne en réunion, plusieurs réunions en même temps ? ; « ça doit être présent partout, pas que chez Finjaro » ; regarder GitHub pour s'inspirer | ✅ 25/09 (staging) : pixels, course, sortie de l'immeuble + tour vue de dehors, escalier, voitures, passants et vendeurs, plein écran horizontal, Parler/Appeler/Faire venir, convoquer une vraie réunion, une salle par réunion en cours, agents à leur poste (tâche ouverte) et au bar (travail rendu < 30 min) ; vérifié aussi chez Maison Kora (le monde 3D est le même pour toutes les entreprises) · ✅ 25/09 : voix Fish (Clémence / Sarah) · ✅ 25/09 : atelier décoré (bureaux en bois, doubles écrans, tableau blanc des vraies tâches, étagères, coin café, tableaux) ; façades photoréalistes (verre, pierre, résidence, générées sur ElevenLabs, aussi sur notre tour) avec fenêtres allumées la nuit ; cinématique d'arrivée ElevenLabs (8 s, une fois, « Passer », 🎬 pour la revoir, « Bienvenue chez » + nom de l'entreprise) · à faire : dépôts GitHub pour s'inspirer, voitures plus belles |
| 25/09 | Beau : « je teste après, continue les modifs » | ✅ 25/09 : relus Forge (comparatif des moteurs 3D, bon), Vigie (veille des mondes virtuels, honnête), Plume (phrases de la réceptionniste : reprises selon le moment de la journée, corrigée — un agent en veille ne répond pas ; un seul registre, le vous) — retour écrit à chacun dans Léo · ✅ 25/09 (staging) : bouton 🌍 — on monte au-dessus de la ville, puis la Terre apparaît, éclairée comme en ce moment (soleil au-dessus du bon point), repère « Vous êtes ici » sur la ville de la personne, on la fait tourner du doigt, « Redescendre en ville » (continents Natural Earth, domaine public, dessinés pour Léo) · pays commun à toutes les entreprises : pas fait — il faut lire les entreprises des autres, donc une fonction en base : à décider avec Beau |
| 25/09 | Beau : une série de liens à garder et à étudier (01:30 → 14:24) — Notion « 7 GitHub Repos » ; chaîne YouTube (UC0WwtO2rTcy-1xSaPxw1LOA) ; Google Doc « 5 skills pour débutants » ; « 5 liens » (TensorFlow Playground, Gandalf, Teachable Machine, Kaggle, Quick Draw) ; Google Doc « Illegal Seven » ; Notion (guide d'animations au défilement) ; ezye « free creator stack » ; noocap « 5 design repos » ; son lien Léo de staging ; un dossier Drive ; Google Doc « Claude App Company OS » ; github.com/crosstalk-solutions/project-nomad ; skydive.com ; worldmonitor.app ; beehiiv « 5 GitHub repos devs kept quiet » | ✅ 25/09 : fiches vestiaire 37 à 45 (NOMAD, World Monitor, Skydive, 5 dépôts discrets, Company OS, 5 skills débutants, Illegal Seven, Creator Stack, 5 sites pour apprendre l'IA) ; « 7 GitHub Repos » était déjà la fiche 36 · retenu pour Léo : Company OS → un type de réunion « Conseil de lancement » (étiquettes FAIT / HYPOTHÈSE / IDÉE / DONNÉE ABSENTE) ; OpenBB → de vrais cours pour la salle des marchés (à décider) ; World Monitor → des couches de données sur la planète 🌍 ; Gitingest → donner un dépôt entier à lire à l'atelier ; Stop Slop → Plume ; Gandalf → entraînement de Rigo · tâches confiées : Mentor (fiches 42 et 45 → Académie), Orchestre (difficile : le Conseil de lancement) · pas lisibles d'ici : la chaîne YouTube, les deux pages Notion (demandent JavaScript), le dossier Drive (pas d'accès), la page Skydive presque vide → Beau peut me recopier le texte ou les titres |
| 25/09 | Beau : « okay, tu peux pas faire 4D ? » → la 3D existait (chantiers des projets), il manquait la 4e dimension : le temps | ✅ 25/09 (staging) : onglet « La ville » → Ville 3D : une **frise du temps** au-dessus de la ville. On la fait glisser, ou ▶ pour revoir les chantiers grandir jour après jour ; la caméra monte au-dessus du quartier des projets. Tout vient des vraies dates (création du projet ou de sa première tâche, date de rendu de chaque tâche) ; une tâche rendue sans date de rendu ne compte qu'aujourd'hui. « Aujourd'hui » ramène au présent. Réparé au passage : les boutons « Ville 3D / Plan » affichaient leur nom technique. Pas fait : l'avenir (dessiner ce qui n'est pas encore fait serait inventer) |
| 25/09 | Beau : « 4D, c'est genre les graphismes qu'on a faits : maisons, voitures, bâtiments » ; « dans la city, c'est pas possible de faire comme GTA ? J'entre dans une voiture, je peux conduire — GTA San Andreas, Liberty City » ; « et multi trucs » ; « tout le monde doit pouvoir faire ça : si un ami écrit son projet, il entre aussi et a SA city, SA compagnie, son API, ses agents, tout cet environnement » | ✅ 25/09 (staging) : **on monte dans une voiture et on conduit** (Ville 3D et monde 3D, dehors) : 3 voitures garées (berline rouge juste devant l'arrivée de « La ville », SUV en face, taxi rue de gauche) ; « Monter dans la voiture » (F au clavier), Z/S/Q/D ou flèches, Espace frein à main ; au téléphone : joystick pour tourner, pédales ▲ ▼ ; compteur km/h, caméra de poursuite, roues qui tournent et braquent ; on cogne les trottoirs, les autres voitures et la circulation (secousse, vibreur) ; la circulation s'arrête derrière nous ; on descend où on veut et on marche dans toute la ville sans traverser les immeubles ; la voiture reste où on l'a laissée · ✅ vérifié dans deux entreprises (Finjaro et « test », sans projet) : c'est le même monde pour toute entreprise, rien de réservé à Finjaro · reste pour « comme GTA » : feux aux carrefours et voitures qui tournent, motos et bus à conduire, radio, missions liées aux vraies tâches, entrer dans les boutiques, plusieurs joueurs dans la même ville (voir un ami) |
| 25/09 | Beau : « tout peut être en 4D, même les gens » ; « je peux entrer dans une voiture, prendre un hélicoptère, etc., comme GTA, des courses et tout » ; « les voitures sont en 2D au lieu de 4D » ; « tout doit être 4D, même les bâtiments » → pour Beau, « 4D » = de vrais volumes réalistes (nos voitures sont des profils 2D extrudés, les tours des boîtes à façade peinte) | ✅ 25/09 (staging) 1) **vraies voitures en volume** : modèle « Car Concept » (Khronos, licence CC-BY 4.0, crédit dans LICENCES.md) allégé pour Léo — carrosserie galbée, vitres, sièges et volant visibles, jantes ; toute la circulation l'utilise (5 dessins par voiture, 6 400 triangles, 184 Ko) ; celle dans laquelle on monte passe en version détaillée (roues qui tournent et braquent) ; chaque voiture a sa couleur, taxis jaunes avec lanterne ; phares la nuit · ✅ 2) **hélicoptère** sur un héliport (îlot à droite de l'immeuble) : dessiné pour Léo en volumes (bulle vitrée, sièges, poutre, patins, rotors qui tournent, feux) ; « Prendre l'hélicoptère » (F), Z/S avancer/reculer, Q/D tourner, Espace monter, Maj descendre, au téléphone joystick + ▲ ▼ ; altitude et vitesse affichées ; les immeubles l'arrêtent s'il vole plus bas que leur toit ; on ne peut descendre qu'une fois posé · ✅ 3) **courses** : bouton 🏁 Course au volant, circuit autour de notre pâté de maisons (7 portes numérotées + arrivée à damier), chrono mesuré, « votre record » gardé dans le navigateur, rejouer · en cours : 2) hélicoptère à piloter ; 3) courses (circuit, chrono) ; 4) immeubles en relief (balcons, fenêtres en creux, corniches) ; 5) plus de monde dans les rues |
| 25/09 | Beau : « je vais t'envoyer point par point comment était GTA et ce qu'on pouvait faire » ; « dans le monde, on construit comme ça : dans la cité, par exemple, les bâtiments ce sont MES projets, ou les clients de ma boutique, ou mes boutiques » ; « si une personne crée son compte, elle peut choisir d'habiter dans une maison ou une cité » ; « j'ai l'impression que tu fais quelque chose pour le projet Finjaro ; tu ne te rends pas compte que ça sera un Minecraft ou je ne sais quoi » → le monde est CONSTRUIT par les données de chacun, pour tout le monde | à faire : attendre sa liste GTA point par point (la noter en entier) ; plan « la ville de chacun » : chaque bâtiment = une vraie chose de la personne (projet, boutique, client), sa taille = son activité mesurée ; au premier pas dans le monde, choisir maison ou cité ; la ville grandit avec l'activité (comme Minecraft) ; marche pour tout compte neuf |
| 25/09 | Beau (2 images : gros plan d'un personnage de jeu vidéo très détaillé ; une page de jeux de course pour téléphone — volant et pédales à l'écran, compteur rond, positions, nitro, mini-carte) : « pendant que ça charge, il n'y a pas moyen d'utiliser les vrais designs comme ça ? Un graphisme quand même humain » | ✅ 25/09 (staging) : 1) **écran de chargement dessiné** : la ville de Léo en fond (image créée pour Léo), le nom de l'entreprise, barre de progression dorée, un conseil qui change toutes les 4,5 s ; 2) **tableau de bord de course** : compteur rond à aiguille (graduations, zone rouge, jauge de nitro), mini-carte ronde qui tourne avec la voiture (rues, héliport, prochaine porte), au téléphone un **volant à tourner du doigt** et de **vraies pédales** (frein, accélérateur) + bouton **nitro** 🔥 (Maj ou N au clavier), flèche dorée au-dessus de la voiture vers la prochaine porte ; 3) **sensation de vitesse** : le champ de vision s'élargit avec la vitesse et la nitro ; réparé : dans « La ville » la zone 3D dépassait de l'écran du téléphone (volant et pédales coupés) · tâche à Plume : 12 nouveaux conseils de chargement · pas fait : personnages aussi détaillés que la 1re image (il faudrait d'autres modèles de personnages) · les captures servent d'inspiration seulement : rien n'est copié, aucune image reprise |
| 25/09 | Beau : sa liste GTA San Andreas complète, point par point (fonctionnalités, graphismes, véhicules, missions, océan, activités, personnalisation, radio, carte, sauvegarde, IA et police, secrets, technique : moteur, streaming, niveaux de détail, scripts de mission, modding) + https://github.com/gta-reversed/gta-reversed + une recherche GitHub « gta san andreas » (https://github.com/search?q=gta+san+andreas&type=repositories) | ✅ 25/09 : rangée en entier dans la fiche vestiaire 46, chaque point avec « déjà dans Léo / à faire / laissé de côté » ; inspiration seulement : aucun code, modèle, son ni nom de Rockstar repris (gta-reversed et la plupart des dépôts de la recherche reprennent le jeu de Rockstar) ; laissé de côté : violence contre des personnes, drogue, proxénétisme, cambriolages, casino, relations amoureuses · ✅ 25/09 (staging) 1) **la ville de chacun** : quartier des boutiques (une par vraie boutique Finjaro de la personne qui a fondé l'entreprise ; hauteur = commandes livrées + articles en ligne ; enseigne à son nom et sa vraie image), quartier des clients (une maison par client, prénom seulement, un étage par commande ; comptes de test et commandes annulées exclus), les projets restent les chantiers ; rien encore → parcelles tracées au sol et panneaux « terrain à bâtir » ; au premier pas, **« Où habitez-vous ? » maison (villa au bord de la mer, à son nom) ou appartement en cité (tour « Chez [prénom] »)**, bouton 🔑 pour rentrer chez soi, changeable dans le menu ☰ ; le choix est gardé dans la fiche de la personne dans Léo (pas de migration) ; vérifié dans « test » (1 boutique) et pour une entreprise sans boutique · ensuite : 2) missions de ville tirées des vraies tâches ; 3) mer : nager, bateau ; 4) motos, bus, avion ; 5) plusieurs joueurs dans la même ville |
| 25/09 | Beau : « j'ai dev une appli et je voulais que tu la testes : c'est un écosystème d'agents IA où, quand tu crées un projet, ils travaillent pour toi et s'organisent ; tu peux dire que je veux un projet pour… — j'étais en train d'expliquer Léo, je me suis arrêté ici, tu peux compléter pour moi ? » | ✅ 25/09 : message complété et rendu à Beau pour qu'il l'envoie lui-même (rien envoyé en son nom) |
| 25/09 | Beau : « je teste après, continue les modifs, et je veux que ce soit 4D, moi » | ✅ 25/09 (staging) : **immeubles en relief** — vrais balcons avec garde-corps en verre sur les résidences (posés exactement sur le dessin de la façade), piliers d'angle, meneaux et bandeaux en saillie sur les tours de verre (ordinateur), climatisations et châteaux d'eau sur les toits ; le plan de la ville ne change pas ; tout est dessiné en quelques appels (instances) : +7 appels au téléphone · ✅ **bus en volume** (caisse aux angles arrondis, pare-brise incliné, fenêtres en creux avec montants, portes, jupe sombre et roues à jantes visibles, climatisation sur le toit, rétroviseurs) · ✅ **moto en volume** (pneus à jante et disque, réservoir galbé, carénage, garde-boue, fourche double, pot d'échappement, pilote penché les mains au guidon, visière) |
| 25/09 | Beau : « en tout cas ça rame, les voitures sont toujours bien laides, et le graphisme ; j'espère que les messages que j'ai envoyés t'aideront » | ✅ 25/09 (staging) : 1) **ça rame** : les vitres du modèle de voiture étaient en « transmission » (three.js redessinait toute la ville une 2e fois à chaque image) → verre teinté simple : à l'ordinateur 425 → 255 appels de dessin par image ; au téléphone une seule voiture par voie et matières sans vernis : 88 appels ; 2) **voitures laides** : la version légère était trop rabotée (6 400 triangles, air de métal fondu) → 15 500 triangles, contours lissés, peinture satinée au lieu du chrome ondulé · ses messages (liste GTA, captures) sont dans la fiche 46 et servent d'ordre de travail |
| 25/09 | Beau : « NB : ne réponds pas, lis seulement ; on fait comme tout à l'heure : c'est quand je dis « go Claude lis » que tu vas lire tout ce que je t'envoie à partir de maintenant » + 3 captures de Léo en anglais : page de connexion (« Your company, with a team of agents that work every morning », 4 cartes, Google / e-mail ou téléphone / créer un compte), page « My companies » (0 entreprise ; encadré « COMMENT LEGION TRAVAILLE CHEZ TOI » resté en français et avec l'ancien nom Legion), choix du modèle (« Search among 61 industries » ; noms et descriptions des modèles restés en français) | en attente de « go Claude lis » : ne rien traiter ni répondre avant · déjà repéré pour plus tard : textes non traduits en anglais (encadré « Comment Legion travaille chez toi », noms et descriptions des 61 modèles), ancien nom « Legion » encore visible |
| 25/09 | Beau (4 captures téléphone, monde 3D : chargement 39 %, réception, atelier) : « sur le tel les pixels sont trop faibles et ça rame ; le design est horrible, l'arrangement des boutons, tout ça » | ✅ 25/09 (staging) : téléphone plus net (jamais moins d'un pixel par point, jusqu'à 1,6), plus fluide (30 images/s régulières, seulement les îlots proches, vue moins lointaine) ; boutons en une seule ligne en haut (action du lieu, plein écran ⛶, menu ☰ avec la vue, l'avatar, l'intro) ; étiquettes compactes ; onglets sur une ligne qui défile ; le monde 3D prend toute la hauteur · à essayer sur son téléphone |
| 25/09 | Beau (capture de l'onglet « La ville » 2D) : « regarde ici tu as encore rien fait » → c'était l'onglet 2D des projets, le travail est dans « Monde 3D » ; sa ville est réglée sur Paris (style Europe). Proposition : « La ville » devient la ville 3D vue de la rue, chaque projet = un chantier avec grue et vrai avancement. Beau : « oui 4D » | ✅ 25/09 (staging) : l'onglet « La ville » s'ouvre en 3D (bouton « Plan » pour revenir au 2D), on arrive dans la rue face au quartier des projets : chaque projet est un chantier en face de l'immeuble — étages bâtis = tâches rendues, charpente et filets orange = tâches restantes, grue qui tourne tant que ce n'est pas fini, couronne dorée quand c'est fini, gyrophare rouge si la date est dépassée, panneau avec nom, dates, avancement réel et agents au travail ; s'approcher → « Voir le projet » ouvre sa fiche (depuis le Monde 3D aussi) |
| 25/09 | Beau : « ok continue avec la salle de marché » | ✅ 25/09 (staging) : pour les entreprises de finance (modèle « marché » ou projet qui parle d'actions, bourse, trading, crypto…), l'atelier devient une « Salle des marchés » : 3 rangées de pupitres à 4 écrans, mur d'images, bandeau lumineux qui défile ; seulement de vrais chiffres : taux de change du jour (table taux_du_jour), tâches rendues par jour sur 14 jours, heure de New York / Londres / Paris / Tokyo / Hong Kong, et le travail réel des agents — aucun cours de bourse inventé (les cours d'actions demanderaient une source payante ou une fonction serveur : à décider) |
| 25/09 | Beau : « et comment tu dis que tu as déjà tout fait ? » → point honnête : seule la série voitures/arbres était finie ; reste Tokyo + foule, sa ville (Yaoundé), maisons des agents, salle de marché, pays commun + planète, gestes, GitHub, relecture des agents. Beau : « ok vas-y dans cet ordre » | 1) ✅ 25/09 (staging) : foule (16 passants), gens qui traversent aux passages (les voitures s'arrêtent, ne se rentrent plus dedans), néons sous les auvents, enseignes verticales, distributeurs éclairés · 2) ✅ 25/09 (staging) : la ville suit la région de la personne (fuseau horaire ou ville choisie, jamais la langue ; aucun pays écrit) — Afrique : immeubles plus bas, taxis jaunes et motos-taxis, marché de 12 étals sur le trottoir d'en face, grand rond-point avec monument, enseignes COIFFURE / TAILLEUR / ALIMENTATION… ; Europe : immeubles moyens en pierre, terrasse, rond-point, BISTROT / FROMAGERIE… ; Asie : grandes tours, néons partout ; Amériques : tours de verre, DINER / DELI… · 3) ✅ 25/09 (staging) : « 🏡 Chez les agents » (bouton en bas et dans l'ascenseur) — une villa par agent au bord de la mer (nom au portail, terrasse, piscine, baies allumées le soir), plage et palmiers, promenade, collines, montagnes enneigées, hameau de pierre ; règle de vérité : un agent n'y est que s'il est en veille (éteint), la réceptionniste y emmène · pas encore : la salle de marché, le pays commun + la planète, les gestes, GitHub, la relecture des agents |
| 25/09 | Beau : 3 captures WhatsApp — il demande à C. Monteu de tester l'application (Léo : agents IA + partie code façon VS Code) ; C. Monteu répond « le périmètre de test n'est pas formalisé : tu testes quoi ? preuve de concept ou MVP ? qu'est-ce qu'on évalue ? ». Beau demande quoi lui répondre | ✅ 25/09 : message de réponse rédigé pour Beau (bêta, périmètre, ce qu'on évalue, format des retours) — c'est Beau qui l'envoie |
| 25/09 | Beau (sur la route, retour dans 45 min) : « continue les modifs, si tu finis la ville et tout ce que j'ai dit ; je verrai à mon retour » | ✅ 25/09 (staging) : voitures redessinées (vitres teintées, pare-chocs, calandre, rétroviseurs, plaques, ombre au sol ; halos des phares et flaque de lumière sur la route la nuit), taxis jaunes avec lanterne, SUV, bus de ville ; une allure par voie (plus de véhicules qui se traversent) ; 13 arbres d'alignement autour de notre immeuble ; au téléphone, version allégée |
| 25/09 | Beau (après façades + cinématique) : « il peut y avoir les posters des boutiques Finjaro » ; « les mouvements, les agents : là je suis encore seul » ; « le bâtiment n'est pas complet, c'est pas comme un vrai bâtiment » | ✅ 25/09 (staging) : affiches des vraies boutiques Finjaro (comptes de test exclus, leurs propres photos) sur 6 grands écrans des tours voisines et 4 panneaux lumineux de trottoir, qui défilent toutes les 8 s ; agents au hall : les disponibles, et ceux qui attendent leur tâche font des pauses à tour de rôle (assis au salon, en discussion, qui marchent) — la réceptionniste le sait ; immeuble complet : socle en pierre + ailettes de bronze sur les côtés aveugles, poteaux d'angle, nom de l'entreprise sur la façade et en couronne des 4 côtés, toit avec acrotère, locaux techniques, mât et feu rouge clignotant, liseré lumineux · tâches confiées : Forge (difficile) trajets de marche qui contournent les meubles, Plume 12 phrases d'accueil des agents du hall · Vigie bloquée sur la planche de photos (demande des recherches web et la vue des images) |
| 25/09 | Beau (nuit, pendant le branchement atelier ↔ équipe) : « n'oublie pas **Jarvis**, les autres, ce que je disais ; les agents prennent possession de ton ordi, j'espère ; les agents travaillent bien sur toutes les missions qu'ils ont » → trois rappels : (1) Jarvis V0 (ligne du 24/09) toujours pas commencé ; (2) « prendre la main sur l'ordinateur / Chrome » (ligne du 25/09, 01 h 45) : pas fait, rien ne tourne sur son ordinateur aujourd'hui ; (3) relire les livrables des 17 tâches confiées et le dire à chaque agent. Puis : « les agents doivent être surpuissants partout, surtout là où il y a le code » ; « des monstres aussi puissants que Thanos ». Puis : « envoie d'abord le prompt Google AI Studio » → ✅ 25/09, `docs/plans/2026-09-25-prompt-ai-studio-immeuble.md` | à faire, après l'atelier ↔ équipe (§10 : on finit d'abord) |
| 24/09 | **Chantier « Léo apprend tout seul »** (fiche 26) : l'agent écrit sa compétence après une tâche, Rigo l'examine, Beau l'active ; point de Mentor chaque semaine | ✅ lancé le 24/09 au soir (« oui apprentissage ») · 24/09 : code écrit sur staging (migration 0198, legion-travail, legion-examen, legion-action, fiche de l'agent, carte du salon, point de la semaine). **Pas encore en service** : 0198 à appliquer, puis les 3 fonctions à déployer ; essai réel à faire |
| 24/09 | **Atelier de code V0** (plan §1.8) : Worker `finjaro-atelier` + bac à sable Cloudflare sans aucune clé, mode Demander seulement (+ Réfléchir d'abord), écran Atelier (arbre, éditeur, conversation, cartes d'autorisation, modifications, journal, coût, Stop), « Présente-moi comment ça marche », export .zip, **pas d'envoi GitHub** | ✅ code sur staging le 24/09 soir. Attend : les réglages Cloudflare de Beau (`docs/ATELIER-V0.md`), puis un premier vrai essai (bac à sable, modèles, réseau) |
| 24/09 | → code écrit et vérifié en local (tests, construction, migration sur un Postgres jetable, boucle avec un faux bac à sable) ; **pas encore essayé avec le vrai bac à sable Cloudflare** ni avec un vrai modèle ; rien n'est poussé ni déployé | attend les réglages Cloudflare de Beau (0.2) |
| 24/09 | Vérifier finjaro.net après la mise en ligne (bundle, /kit, Retirer le fond, Studio de contenu) | ✅ 24/09 soir : finjaro.net sert 8d559ad — /kit, classeur, modèle et moteur de détourage, textes Léo présents |
| 24/09 | Léo apprend tout seul : **en service** (0198 appliquée, fonctions déployées). Essai réel dans Maison Kora : la chaîne tourne ; aucune proposition encore, car le seul livrable « difficile » a été contesté par un collègue (règle voulue). Première vraie proposition attendue au prochain passage (4 tâches bloquées aujourd'hui) | à vérifier demain matin |
| 24/09 | **Corrigé** : l'enquête (vérifier les chiffres) appelait Google en dur → 429 → agents « bloqués ». Relais par le moteur commun | ✅ 24/09, à vérifier au prochain passage |
| 24/09 | Rappel à Beau à 22 h (heure de son téléphone) : essai Fish Audio + bilan + points du carnet | programmé (20 h UTC) |
| 24/09 | Beau : « les agents doivent pouvoir, s'ils reçoivent un Excel, travailler, modifier et renvoyer en xlsx » → l'agent rend ses modifications, appliquées sur le vrai fichier, renvoyé en « … (modifié).xlsx » | ✅ 24/09 soir, essai réel dans Léo : Kwame a reçu un Excel de 350 lignes, a renvoyé « stock-kora (modifié).xlsx » avec la colonne Marge en formule sur les 350 lignes et une feuille Résumé (SUM, AVERAGE), en 26 s. Reste : la même chose dans la journée de travail (tâches), trier, insérer au milieu |
| 24/09 | Beau (soir) : « Branchons Finia aussi avec Kimi et les autres si Google échoue ; les autres modèles peuvent lire » → relais pour Finia (chat, outils, photos), la lecture des photos d'articles, le copilote vendeuse, la modération. **Pas** les pièces d'identité (vérification d'identité) ni les selfies (miroir) : les envoyer à un autre fournisseur est une décision de Beau | ✅ 24/09 soir : déployé et **essayé en vrai** (Google toujours au plafond) : « une robe, j'ai 20 euros » → 3 vraies robes en € ; « Salut bro » → réponse courte ; « appli camerounaise ? » → « non, place de marché mondiale ». Coût réel du relais visible dans ai_usage. Déployé pour Finia (chat, photos, outils, même consigne), la lecture des photos, le copilote vendeuse, le troc. **Gardés de côté** (patch `scratchpad/relais-conversations-privees-et-moderation.patch`) : la réponse automatique et la modération des chats privés (conversations acheteuse-boutique envoyées à Kimi/DeepSeek = décision de Beau), et la modération des contenus publics (le relais pourrait masquer un article). Corrigé en passant : « marketplace africaine » retiré des consignes du copilote. Reste : le troc estime « pour un marché ouest/centre-africain » en FCFA |
| 24/09 | Essayer « Déposer une ressource » avec un vrai lien, dans Léo | à faire au prochain lien de Beau |
| 24/09 | Bouton « Retirer le fond » dans l'**import en masse** (`VendorProductsBulk.jsx`) | ✅ 24/09 soir sur staging (compile ; pas encore essayé sur téléphone). L'ancienne photo, rattachée à aucun article, est retirée du dossier |
| 24/09 | Surveiller : l'outil `qui_a_fait` donne le **nom** d'acheteurs réels à un agent. Normal dans les entreprises de Beau ; à restreindre avant que Léo ait d'autres clients | à décider |
| 24/09 | Studio de contenu : l'export puis l'import d'un agent **ne reprend pas** ses compétences du modèle | pas fait |
| 24/09 | Fiche 26 : **mode silencieux** pour Vigie et les rapports (ne parler que s'il y a du nouveau) et **chaînage** collecter → trier → rédiger | pas fait |
| 24/09 | Fiche 24 : dans le Studio de contenu, **noter les idées** avant de produire, et **tirer la leçon** du lot publié | pas fait |
| 24/09 | Réunions longues : **résumer à mi-parcours** pour tenir le coût | à vérifier |
| 24/09 | Essayer une vraie **photo d'agent** dès que Google ou OpenAI répond | attend la clé ou le plafond |
| 24/09 | Dire à Claudinette ce qui touche la base commune | ✅ 24/09 (kit, 0196, legion-vestiaire) |
| 24/09 | **Finia commune V0** (« oui Finia commune », 22 h ; allumé par défaut, 22 h 15) : migration 0202 (tables `ia_consentements`, `ia_apprentissage`, `ia_savoirs_communs`, `ia_pays_accord_explicite`), réglage dans Réglages, phrase dans la bulle de Finia, 👍/👎, savoir commun lu par finou-chat (et son relais), boucle du lundi `finia-apprentissage` → Mentor, « À valider », Confirmer ; outil `questions_finia` pour les agents ; politique de confidentialité 1.1 ; contrat pour Accounting `docs/FINIA-COMMUNE.md` | code écrit et vérifié en local (migration sur un Postgres jetable, tests, construction) ; **rien d'appliqué ni déployé**. Ordre : relecture de Beau → 0202 → finou-chat, legion-action, legion-repondre, legion-travail, finia-apprentissage → site. Puis prévenir Claudinette (contrat) |

### 0.4 Ressources reçues de Beau (vestiaire)

Toutes étudiées, une fiche chacune dans `docs/vestiaire/` (voir son README),
lues par Léo et transformées en compétences pour les agents :
01 à 19 (24/09 après-midi) · 20 agency-agents · 21 stack design Loucash ·
22 Top 5 sites vibe coders · 23 PDF bencodezero · 24 theaiagents « 4 agents » ·
25 Claw Code (mis de côté : né de la fuite du code de Claude Code) ·
26 Hermes Agent (boucle d'apprentissage). Doublon : la pub Koban (= fiche 16).
**25/09 (liens renvoyés dans la nuit, jetons `mcp_token` jamais recopiés)** :
Hermes Agent, SkillTree, Public APIs, agent-skills = déjà fiches 26 à 29 ·
nouveaux : **30 Twenty** (CRM libre, AGPL : par ses API seulement → Alpha),
**31 youtube-automation-agent** et **32 MoneyPrinterTurbo** (MIT, machines à
vidéos → comparaison confiée à Forge), **33 Arcads** (méthode retenue pour
Plume, outil payant mis de côté : pas de faux témoignages), **34 Higgsfield**
(visages persistants des agents, payant, en réserve), **35 prompt.pdf** (« une
question à la fois, tester avec 1 puis 10 » → compétence confiée à Mentor, et
accueil de « Construire une application » dans l'atelier). Doublon : le guide
Arcads, envoyé deux fois. **25/09, 1 h 16** : le guide Notion « MoneyPrinterTurbo — Guide complet » → complément de la fiche 32 (publication automatique laissée désactivée, partie promotionnelle écartée). **25/09, ~1 h 20** : « 7 GitHub Repos That Make AI Feel Very Different » (Notion) → **fiche 36** : Atlas (plusieurs agents sur un même projet, mémoire commune) retenu pour l'équipe dans l'atelier ; MiroFish (simulation, AGPL) en réserve ; RuView et ASC mis de côté.

Envoi du 24/09, 20 h 40 (5 liens) :
- page Notion « Top 5 Sites pour Vibe Coders » : déjà traitée (= fiche 22) ✅
- guide Google Docs « Hermes Agent » : déjà traité (= fiche 26) ✅
- 27 skilltree.altari.ai/plan : ✅ fiche 27 (gardé en réserve ; produit payant, chiffres contradictoires ; 1 compétence) (le lien reçu contenait un jeton personnel `mcp_token` : il n'est recopié nulle part)
- 28 page Notion « Public APIs — Guide complet » : ✅ fiche 28 (annuaire de référence, dépôt MIT ; 1 compétence)
- 29 github.com/addyosmani/agent-skills : ✅ fiche 29 (MIT ; 5 compétences pour les agents qui codent et Rigo)

---

_Fichier maître, tenu à jour à chaque cycle. Dernière mise à jour : 4 août
2026. Si un point est traité, il passe en ✅ avec la date — rien n'est
supprimé, pour garder l'historique des décisions de Beau._

> **REPRISE : lire d'abord `docs/SESSION-2026-08-04.md`** — état des lieux
> complet de la session du 04/08 (prix sur demande, CGU, fil infini + règle
> diaspora, Finia enfin corrigée, déconnexion 1 h, app Android prête, secrets
> GitHub en place) et l'ordre des prochains chantiers.

## Circuit de travail (rappel)

- Tout se code sur la branche **`staging`** → déployé automatiquement sur
  **https://staging-finjaro.finjaro.workers.dev** (URL de test, invisible du
  public — confirmé en marche le 31/07 après correction de la config
  Cloudflare, voir ci-dessous).
- **finjaro.net** ne change QUE quand Beau valide et qu'on fusionne `staging`
  dans `claude/finjaro-marketplace-build-xsripr` (branche de production
  surveillée par Cloudflare).
- Base de données : les deux frontends pointent sur le projet Supabase de
  production (`bokwivwizghdlaedczbw`) — toute migration doit donc rester
  additive. Projet de test : `qiyvoaljqmbfldephobp`.
- **Config Cloudflare (Settings > Build)**, pour référence si jamais elle se
  dérègle à nouveau :
  - Deploy command (branche de prod) : `npx wrangler deploy`
  - Non-production branch deploy command (branche staging) :
    `npx wrangler versions upload` — PAS `wrangler deploy --env staging`,
    qui promeut toujours en production quel que soit `--env` et a fait
    fuiter du contenu de test sur finjaro.net le 31/07 avant d'être corrigé.

---

## 1. Bugs signalés par Beau — validés, en attente du « go » point par point

| # | Problème | Diagnostic |
|---|---|---|
| B1 | Profil → « Sign in » affiche « you need to be signed in to do that » au lieu d'ouvrir l'écran de connexion | ✅ Corrigé le 01/08 : c'était B1=B2 (même bug, juste redit deux fois). Le bouton naviguait vers `requireLogin()` au lieu de `/auth` — corrigé dans `UserProfile.jsx`. |
| B2 | (doublon de B1, confirmé par Beau le 01/08) | ✅ Voir B1. |
| B3 | Catégorie Musique absente | ✅ Corrigé et confirmé visible sur staging le 31/07. |
| B4 | « Les pièces enregistrées partent où ? » | Pas un bug : bucket privé `ids` + table `vendor_applications`, lisible uniquement par l'admin via `kyc-ocr`. Confirmé par Beau le 01/08 que B4 n'était qu'une question posée en retour, pas un vrai bug signalé. |
| B5 | Bouton localisation boutique : « ça fait quoi ? » | ✅ Corrigé le 01/08 : le bouton marchait déjà (GPS → base) mais avalait toute raison d'échec dans un `null`, et le seul retour (un toast) disparaissait en 3s sans laisser de trace — d'où « le bouton est resté normal ». Ajout de `getPositionWithReason()` (distingue refusé/délai/indisponible/non supporté) + un message persistant sous le bouton (`VendorShop.jsx`) qui reste affiché tant qu'on ne retente pas. |
| B6 | Photos des nouvelles catégories | ✅ 16 photos reçues, curées et intégrées le 31/07 (voir `src/assets/categories/CREDITS-nouvelles-photos.md`). |

## 2. Renommer « Finou Chou » ✅ fait le 31/07

Renommé en **Finia** partout côté utilisatrice (bulle, messages, écrans
vendeur). Confirmé visible sur staging. Noms techniques internes
(`finou-chat`, `finou-vision`…) inchangés, c'est invisible pour tout le monde.

## 3. Décisions produit prises (ne plus reposer la question)

- **Ventes flash / 2nde main** : PAS de page dédiée — juste un badge sur les
  fiches concernées. (31/07)
- **Bandeau « Garanties »** : ABANDONNÉ — il n'y a pas de garanties réelles
  aujourd'hui, on n'affiche rien de mensonger. (Vérifié : rien à retirer, le
  bandeau n'avait jamais été implémenté.) (31/07)
- **Achat groupé / prix dégressif** : pas important, ce n'est pas Finjaro qui
  baisse les prix. ABANDONNÉ. (31/07)
- **Livraison** : les vendeurs livrent EUX-MÊMES pour l'instant. Agences /
  points relais Europe = plus tard. (31/07)
- **Paiements en ligne (CinetPay, Stripe, commission, séquestre)** : « vraiment
  pas pour maintenant ». (31/07)
- **Appels vidéo/audio, AR, 3D, simulateurs sensoriels** : on laisse tomber —
  infra inexistante. (31/07)

## 4. Backlog fonctionnel (hors IA) — à faire

- [x] **Prix barré / promo (%)** ✅ 01/08 : champ vendeur optionnel (refusé si
  ≤ prix demandé), badge "−X %" sur la carte produit ET la fiche article, prix
  barré affiché en `line-through`. `compare_at_price_fcfa` existait déjà en
  base, ajouté aux requêtes catalogue/recherche/boutique qui en avaient besoin.
- [x] **Badges Ventes flash / 2nde main** ✅ 01/08 : pas de page dédiée
  (décision §3) — la remise EST le repère "vente flash", + badge dédié sur les
  fiches du rayon Seconde main.
- [x] **Recherche dans le catalogue d'une boutique** ✅ 01/08 : champ de
  recherche (filtre local, sans aller-retour serveur) dans l'onglet Produits
  de la fiche boutique.
- [x] **Raccourci « Racheter »** ✅ 01/08 : bouton sur chaque commande dans Mes
  commandes — rajoute au panier au PRIX ET STOCK ACTUELS (jamais l'ancien prix
  payé), prévient si un article a disparu du catalogue depuis.
- [x] **Adresse de livraison enregistrée** ✅ 01/08 : `profiles.address` +
  `profiles.city` (migration 0029, additive), champs dans Modifier le profil,
  pré-remplissage du tunnel de commande (toujours modifiable là aussi).
- [x] **Notifications** ✅ Vérifié 01/08 via les logs Supabase : `send-push`
  répond 200 sur de vrais appels en production (commande reçue, message
  vendeur...), clé Resend et clés VAPID bien configurées en base. Table
  `push_subscriptions` à 0 ligne — normal, personne n'a encore ajouté le site
  à l'écran d'accueil sur iPhone (seule condition pour le push web Apple); le
  canal e-mail, lui, tourne déjà et complète.
- [ ] L'annuaire Prestataires reste vide tant que les boutiques n'ont pas coché
  un métier — TidalEx reclassée le 31/07, les autres vendeurs doivent le faire
  dans « Ma boutique ».

## 4bis. Cycle « marketplace propre » (screenshots Nevo Market, 01/08) ✅ fait

Beau a envoyé 5 captures de Nevo Market comme référence + une liste vocale
d'anomalies. Tout le lot ci-dessous est implémenté le 01/08 :

- ✅ **Tailles/couleurs produit** : éditeur côté vendeur (presets XS–4XL ou
  pointures 36–45 selon le rayon + saisie libre), taille OBLIGATOIRE à
  l'ajout panier quand la fiche en définit, panier par variante (la même robe
  en M et XL = deux lignes), variante transmise à la boutique dans la
  commande (« Robe (XL · Rouge) »).
- ✅ **Miroir IA et taille** (question de la collègue) : le miroir montre le
  STYLE porté, pas l'ajustement d'une taille précise — note honnête ajoutée
  dans la modale. Pas de simulation morphologique par taille (irréaliste avec
  Gemini aujourd'hui, on ne promet pas ce qu'on ne tient pas).
- ✅ **Cycle de commande complet** (le vrai flux supply-chain) :
  nouvelle → [Valider | Refuser (raison optionnelle, transmise)] → validée/en
  préparation → [En livraison / Prête (retrait)] → livrée. Chaque étape
  horodatée (0030) + notification acheteuse. AVANT: un seul bouton sautait de
  « nouvelle » à « envoyée » — le bug exact signalé par Beau.
- ✅ **Suivi acheteuse** : timeline 4 étapes avec dates sur Mes commandes,
  raison de refus affichée, « J'ai bien reçu » clôt vraiment la commande.
- ✅ **Rappel Finia automatique** : pg_cron toutes les 6 h → push+e-mail aux
  boutiques qui laissent des commandes « new » > 6 h (arrêt après 14 j).
  Bannière « X commandes à valider » en haut du tableau de bord vendeur.
- ✅ **Fiche boutique façon Nevo** (aux couleurs Finjaro) : onglets Accueil /
  Produits / Promos (seulement si promos) / Avis / À propos · bouton « Nos
  Reels » près de l'avatar (→ flux filtré sur la boutique) · stats Note/
  Abonnés/Produits/Certifiée · **Garanties de confiance RÉELLES uniquement**
  (certifiée = is_verified, livraison = si proposée, contact direct = si
  WhatsApp/tél renseigné — jamais la même liste automatique partout) ·
  horaires avec badge Ouvert/Fermé en direct · zones de livraison.
- ✅ **Horaires + zones côté vendeur** (Ma boutique) : ouverture/fermeture +
  jours fermés ; zones {nom, frais, délai} affichées sur la fiche ET
  utilisées au checkout (frais par zone, 0 = gratuit).
- ✅ **Checkout nettoyé** : message « dans ce pays, la livraison… » supprimé ;
  paiement par carte MASQUÉ (code conservé, drapeau `CARD_PAYMENTS_ENABLED`
  dans CheckoutCOD.jsx) ; sélecteur de zone quand la boutique en a.
- ✅ **Panier** : « Tout retirer » par boutique + variantes affichées.
- ✅ **Bug catégories « Ma boutique »** : les boutiques portaient des ids
  HÉRITÉS (beaute, mode, bijoux…) invisibles dans les chips — affichés
  maintenant dans un bloc « Anciennes catégories » (tap pour retirer), et les
  catégories s'enregistrent À CHAQUE TAP (plus besoin du bouton Enregistrer).

**Retours de test du 01/08 (2e passe) — tous corrigés :**
- ✅ **Annulation d'une commande EN COURS** (validée ou en livraison), pas
  seulement refus d'une commande « nouvelle » — bouton dédié (icône, à côté
  du bouton principal) sur les étapes Validée et En livraison.
- ✅ **Raison de refus/annulation clairement « (optionnel) »** — le mot est
  maintenant dans le LABEL du champ, plus seulement noyé dans une phrase
  d'aide.
- ✅ **Numéros de commande peu distinguables** (ex. `3F8A2C1B` vs `3F9A2C1D`,
  hex ambigu) → nouveau format `FJ-XXXXXX` sur un alphabet SANS caractères
  ambigus (pas de 0/O, 1/I/L) — lisible sans confusion à l'oral pour le
  suivi/vérification de paiement (migration 0031, appliquée aux deux
  projets).
- ✅ **Présentation des cartes commande** (vendeur ET acheteuse) refaite :
  accent de couleur par statut, pastille d'initiale acheteuse, articles dans
  un encart, bouton « Marquer livrée » en primaire (plus de lien texte
  "grossier" flottant sous le bouton).
- Confirmé déjà en place : l'écran de confirmation après commande dit bien
  « Ta commande a bien été transmise à la boutique » (gros ✓ + numéro) — à
  revérifier sur le lien de test, le test de Beau a pu tomber sur le build
  d'avant le déploiement du cycle de commande.

## 4ter. Redesign global écran par écran (01/08) ✅ validé par Beau

Beau a envoyé des maquettes de référence (style Nevo/prototype) et demandé
un vrai travail visuel, onglet par onglet. Tout est validé (« c'est bon ») :

- ✅ **Accueil** : barre de recherche pleine largeur tappable (au lieu d'une
  icône loupe dans un coin), carrousel héros avec ombre, tuiles catégories
  en relief, bande « Services » en accent doré pour se distinguer du reste,
  icônes devant les titres de section.
- ✅ **Fin (reels)** : sélecteur « Pour toi / Abonnements » en capsule
  translucide — au passage, **vrai bug corrigé** : le texte blanc devenait
  invisible sur une vidéo claire, sur l'écran de chargement ET sur l'écran
  vide. Barre de progression en haut de la vidéo, avatar boutique + bouton
  suivre rapide (+/✓), dégradés de lisibilité haut/bas.
- ✅ **Services** : nouveau `ProviderCard` (couverture, badge métier, avatar
  débordant, portfolio de 3 photos, note + nb d'avis, prix d'appel, boutons
  Détails/Réserver), bandeau « Annuaire & Carte », curseur de rayon en km
  (affiché seulement si une position réelle est connue), grille 1/2/3
  colonnes. **Données toutes réelles** : « Nouveau » si aucun avis, prix
  d'appel = le plus bas du vrai catalogue, portfolio = vraies photos
  produit. Rien d'inventé contrairement aux chiffres de la maquette.
- ✅ **Messages** : deux panneaux sur ordinateur (liste + fil), en-tête de
  conversation avec accès direct WhatsApp/téléphone (affichés seulement si
  le numéro existe), bulles terracotta pleines pour ses propres messages,
  aperçu en gras tant que non lu, conversation active surlignée.
  → Pas d'indicateur « en ligne » : l'app ne suit aucune présence temps
  réel, un point vert serait décoratif et mensonger. Faisable pour de vrai
  (Supabase Realtime Presence) si Beau le demande — chantier à part.
- ✅ **Bandeau d'annonce** (la bande orange du prototype) : table dédiée
  `announcements` (migration 0032) + éditeur dans l'espace admin avec
  aperçu. Le texte est une DONNÉE, jamais codé en dur — une promo figée
  dans le build continuerait de promettre une opération terminée.
  Table à part exprès, surtout pas `app_config` qui contient les clés
  Stripe/VAPID.
- ✅ **BUG LANGUE corrigé** (signalé par Beau : « j'ai choisi français,
  j'ai des champs en anglais ») — deux causes réelles :
  1. `i18n.language` pouvait valoir `fr-FR`, et les **9 endroits** qui
     testent `locale === 'fr'` (dates, heures, noms de pays, format des
     prix) basculaient alors silencieusement en anglais. Réglé par
     `load: 'languageOnly'`.
  2. L'app suivait la langue du TÉLÉPHONE : un appareil en anglais
     affichait tout en anglais sans que personne l'ait demandé. Le
     français est désormais la langue par défaut du produit ; l'anglais
     reste dans Profil > Paramètres et le choix est mémorisé.

**Reste du redesign :** l'onglet **Profil** n'a pas encore été repris.

## 4quater. Espace vendeur, audit global, connexions, admin (01/08)

- [x] **Espace vendeur refondu** : tableau de bord « cockpit » + espace
  **Finances** (comptabilité simple : encaissé, à venir, par mois).
- [x] **Connexion par téléphone (SMS)** ✅ : Twilio branché sur Supabase
  (Account SID + Auth Token + Messaging Service). Testé par Beau, ça marche.
  L'inscription/connexion par SMS ne demande ni e-mail ni mot de passe.
- [x] **Connexion Google** ✅ : client OAuth créé sur Google Cloud (appli
  « Finjaro », publiée « En production » donc ouverte à tous), identifiants
  posés dans Supabase. Bouton « Continuer avec Google » sur l'écran de
  connexion. **Apple non fait** : Apple exige 99 $/an de compte développeur.
- [x] **Audit complet de l'app** ✅ : parcours acheteuse ET vendeuse rejoués
  écran par écran, bouton par bouton (Playwright + captures). Résultat : aucun
  lien mort, zéro erreur console, cycle de commande cohérent des deux côtés
  (valider → en livraison → livrée, avec annulation possible à chaque étape et
  la timeline acheteuse qui suit). Corrigés au passage : le choix
  taille/couleur était enterré sous la description (il conditionne pourtant
  l'ajout au panier) — remonté et la page défile jusqu'à lui si on l'oublie ;
  2 libellés de traduction manquants ; le graphique « ventes par jour » des
  stats vendeur était plat.
- [x] **CNI masquée de l'inscription vendeur** ✅ (demande de Beau, 01/08) :
  exiger — ou même montrer — une pièce d'identité freine les inscriptions.
  Masquée derrière `SHOW_ID_UPLOAD` dans `BecomeVendor.jsx` ; le code, le
  bucket `ids` et la lecture OCR côté admin restent intacts, un seul drapeau à
  rebasculer. **Point légal** : la CNI reste facultative et non collectée —
  c'est le choix le plus sûr au regard du RGPD (on ne collecte pas ce dont on
  n'a pas besoin). Le jour des paiements en ligne, ce sont CinetPay/Stripe qui
  exigeront et stockeront l'identité, pas nous.
- [x] **Console d'administration complète** ✅ : six sections — Résumé (KPI +
  bandeaux d'alerte), Boutiques (annuaire cherchable, chiffres réels par
  boutique, certifier / suspendre), Comptes (suspendre, donner les droits
  admin), Commandes (toute la plateforme, en lecture seule), Modération (file
  des signalements), Contenu (bandeau d'annonce + candidatures vendeur avec
  OCR). Migration `0034_admin_full_rights.sql`.
  **Deux bugs sérieux corrigés au passage** : les signalements n'étaient
  lisibles que par leur auteur (la modération était donc impossible), et les
  statistiques ne comptaient que la navigation de l'admin lui-même — les
  chiffres affichés étaient faux.
  **Volontairement non ouvert** : les conversations privées entre clientes et
  boutiques. Lire les messages privés n'est pas un pouvoir d'administration
  ordinaire ; à décider explicitement si le besoin se présente.
- [x] **Admin séparé de la boutique** ✅ (demande de Beau, 01/08) : la console
  n'est plus une page de l'app. Deux constructions, deux Workers Cloudflare,
  deux domaines — `npm run build` → `finjaro` → finjaro.net ; `npm run
  build:admin` → `finjaro-admin` → admin.finjaro.net. La boutique ne contient
  plus une ligne d'admin et ne laisse plus deviner qu'une console existe (le
  raccourci du menu Profil est retiré).
  **Même dépôt, volontairement** : composants, traductions, charte et base
  Supabase restent partagés — un correctif appliqué une fois vaut des deux
  côtés. Deux dépôts auraient garanti la divergence.

## 4quinquies. Suite du 02/08 — bugs terrain, notifications, géo/devise

**Contexte pour la reprise** : Beau a testé la console admin et l'app en
conditions réelles ce jour-là (finjaro.net en prod, admin sur staging) et a
remonté plusieurs bugs concrets, réglés dans l'ordre ci-dessous. Tout ce qui
suit est sur **staging**, poussé au fil de l'eau ; **rien n'a encore été
fusionné dans la branche de production depuis le déploiement du 01/08 tard**
(commit `9728094` sur `staging`, pas encore mergé). C'est la toute première
chose à faire en reprenant : vérifier avec Beau s'il a fini ses tests, puis
fusionner `staging` → `claude/finjaro-marketplace-build-xsripr` comme les fois
précédentes (`git fetch` les deux branches, `checkout -B` la branche de prod,
`git merge origin/staging`, push).

- [x] **Lien `localhost:3000` sur Google/e-mail** ✅ — Supabase **Site URL**
  était resté sur `http://localhost:3000` (jamais configuré) et **Redirect
  URLs** était vide. Toute connexion Google (et tout lien envoyé par e-mail)
  renvoyait donc vers une adresse qui n'existe que sur un poste de développeur.
  Corrigé **par Beau lui-même** dans le tableau de bord Supabase (Authentication
  → URL Configuration) : Site URL = `https://finjaro.net`, 4 Redirect URLs
  ajoutées (finjaro.net, www., staging-finjaro.workers.dev,
  finjaro-admin.workers.dev). Rien à faire côté code.
- [x] **CNI absente du prix Cameroun→France** — sans rapport avec les prix, mais
  découvert le même jour : `BecomeVendor.jsx` masquait déjà la pièce d'identité
  (`SHOW_ID_UPLOAD = false`, fait le 01/08) — confirmé toujours en place, rien
  à refaire.
- [x] **Console admin séparée : réglage Cloudflare en attente côté Beau** — le
  Worker `finjaro-admin` a été créé (Build command `npm run build:admin`,
  Deploy command `npx wrangler deploy --config wrangler.admin.toml`, Version
  command idem `--config wrangler.admin.toml`). **Sa Production branch est
  restée sur `claude/finjaro-marketplace-build-xsripr` au lieu de `staging`** —
  tant que Beau ne l'a pas changée dans Settings → Build → Branch control, les
  correctifs de l'admin ci-dessous ne s'affichent PAS sur
  `finjaro-admin.finjaro.workers.dev`. **Ce réglage n'est toujours pas confirmé
  fait à la fin de cette session** — c'est la 2e chose à vérifier en reprenant.
  Le domaine `admin.finjaro.net` n'est lui non plus pas encore ajouté (le
  Worker répond pour l'instant seulement sur son adresse `.workers.dev`).
- [x] **Admin : ne défilait pas, Boutiques/Modération en erreur, bandeaux
  morts** ✅ — trois bugs distincts trouvés en testant avec Beau en direct :
  1. Le document ne défile jamais dans cette app (`overflow:hidden` sur
     html/body pour empêcher le clavier iOS de pousser tout l'écran) — chaque
     écran défile dans son propre cadre, et la console livrée le 01/08 n'en
     avait pas. Ajouté dans `AdminApp.jsx`.
  2. `shops.owner_id` et `reports.reporter_id` pointaient vers `auth.users`
     (illisible côté client) et pas vers `profiles` — impossible d'afficher
     "propriétaire" ou "signalé par". Migration `0035` : seconde clé étrangère
     vers `profiles` (même patron que `near_you_listings` déjà en place),
     jointures nommées côté client (`profiles!shops_owner_profile_fk` etc.).
  3. Les bandeaux "signalements/candidatures en attente" du Résumé pointaient
     vers `/admin?s=...`, une adresse qui n'existe plus depuis la séparation —
     devenus de vrais boutons qui changent d'onglet.
- [x] **Icônes d'app réelles (PWA + prérequis Play Store)** ✅ — il n'existait
  qu'un favicon SVG ; iOS l'ignore pour l'écran d'accueil (capture de la page
  au lieu du logo) et Play Store exige du PNG 192/512. `scripts/make-icons.mjs`
  rend le logo via Chromium (aucune lib d'image à installer) en
  192/512/maskable-512/apple-touch-icon. Le logo est redessiné en formes (plus
  de `<text>`, qui dépendait des polices de l'appareil et rendait un F
  mal centré). Manifeste + `index.html` mis à jour. **Piste Play Store** :
  https://www.pwabuilder.com → `finjaro.net` → Package → Android → `.aab`
  déjà signé, 25 $ une fois, pas de Mac requis. **Mis en pause par Beau** —
  il veut d'abord finir de tester le reste. Ne pas relancer sans qu'il le
  redemande.
- [x] **Vendeur en France voyait ses prix en FCFA, non modifiable** ✅ — deux
  causes : (1) le pays de la boutique était figé sur `'CM'` à l'inscription
  (`BecomeVendor.jsx`), (2) **et n'était pas modifiable après coup** — un
  vendeur hors Cameroun restait bloqué en FCFA pour toujours. Corrigé : le
  pays part désormais du pays détecté (`useSettings().country`), et
  `VendorShop.jsx` porte maintenant un champ pays modifiable avec la devise
  résultante affichée en clair.
- [x] **Clochette de notifications in-app** ✅ — Beau a demandé ce que voient
  les comptes créés par téléphone, côté web, sans installation. Réponse
  trouvée en lisant le code : **rien**. Un compte SMS n'a pas d'e-mail
  (`emails_for_users()` exclut `email is null`), le push navigateur exige une
  permission qui, sur iPhone, ne marche même pas sans ajout à l'écran
  d'accueil (restriction Apple) — et surtout, la table `public.notifications`
  était déjà entièrement alimentée par des triggers SQL (nouveau message,
  commande, statut, boutique validée…) et même branchée sur Supabase Realtime,
  **mais aucun écran ne l'affichait**. Construit : `useNotifications()` +
  `NotificationBell` (badge rouge, panneau, marque lu au clic, navigue vers le
  bon endroit), posée sur l'accueil acheteuse et le tableau de bord vendeur.
  Migration `0036` : ajoute `for_role` aux notifications de message pour que
  le clic route vers `/chat/:id` ou `/vendor/messages/:id` sans requête
  supplémentaire.
  **Découverte utile pour plus tard** : `on_vendor_app_status()` (trigger SQL
  existant) implémente déjà tout le mécanisme "candidature en attente → shop
  créé seulement si `status='approved'` → notification à la décision" — mais
  `BecomeVendor.jsx` côté client **contourne ce mécanisme** et crée la
  boutique directement à l'inscription, sans jamais passer par
  `vendor_applications.status`. Si Beau active un jour la vraie validation
  vendeur (mentionné plusieurs fois, jamais tranché), la moitié du travail
  serveur est déjà faite.
- [x] **Prix par défaut en FCFA pour tout le monde, catalogue non régionalisé**
  ✅ — Beau, physiquement en France, ouvrait finjaro.net (déconnecté) et
  voyait des prix FCFA + un catalogue sans lien avec sa région. Deux causes
  vérifiées en base :
  1. `profiles.currency` avait `'FCFA'` en valeur par défaut SQL → tout
     compte naissait estampillé FCFA (24 profils sur 27). Le client adoptait
     ensuite cette valeur à la connexion, écrasant la détection du pays.
     Migration `0037` : le défaut est retiré, les profils qui n'avaient
     jamais rien choisi (aucun pays + FCFA intact) sont remis à `null`.
  2. La détection pays/devise était asynchrone → l'app peignait du FCFA le
     temps de répondre, puis la valeur fautive se figeait en `localStorage`
     et ne se corrigeait plus. `detectCountrySync()` (nouveau, dans
     `countries.js`) est maintenant synchrone — fuseau horaire + langue se
     lisent instantanément, donc le tout premier rendu est déjà juste. Table
     de fuseaux élargie (reste Europe/Amérique du Nord/Afrique).
  3. **Aucun filtrage régional n'existait dans le catalogue** — `homeCache.js`
     réécrit : priorise le pays du visiteur pour produits ET boutiques, puis
     complète avec le reste (jamais un filtre strict — avec 4 boutiques FR et
     6 CM aujourd'hui, ça afficherait une place de marché vide au premier
     visiteur d'un pays non couvert). Vérifié dans 3 fuseaux réels : Paris →
     EUR + boutiques FR en tête ; Douala → FCFA + boutiques CM en tête ;
     Chicago → USD.
- [ ] **Articles « sur commande » — discuté, PAS codé, à reprendre en premier.**
  Beau veut remplir ses 3 boutiques (Beauty Hairs, Camerounian Chanel,
  Décoration) avec « des milliers d'articles » sourcés à la demande auprès de
  vrais fournisseurs — pas de faux stock, pas de fausses boutiques (point
  discuté et validé : une seule boutique réelle, marge prise sur le
  fournisseur, panier/commande normal inchangé — les deux boutons "message" et
  "commander" restent tous les deux, comme aujourd'hui).
  **Ce qui existe déjà en base, prêt à l'emploi** : migration `0038` (fichier
  ajouté le 02/08 pour consigner un `apply_migration` fait plus tôt dans la
  journée) — `products.is_sourced boolean`, `products.sourcing_days
  smallint` (1-60), `order_items.is_sourced boolean` (copie figée au moment
  de l'achat). **Rien côté écran** : le formulaire vendeur, la fiche produit,
  la carte produit, le panier et le suivi de commande n'affichent encore
  aucun badge "sur commande" — une première tentative d'ajouter la case à
  cocher dans `VendorProductEdit.jsx` a été commencée puis abandonnée avant
  d'être commitée (Beau a demandé de rediscuter d'abord) ; le fichier est
  revenu à son état d'avant, RIEN à en récupérer, repartir de zéro sur l'UI.
  **Bloqué en attente de Beau** : il doit envoyer les photos + infos
  (nom, boutique, prix) des articles **ce soir** (message du 02/08) — tâche
  #45 dans le suivi de tâches. Une fois reçues : (1) finir le badge "sur
  commande" + délai sur les 4 écrans listés, (2) créer les fiches produit en
  masse à partir de ce que Beau envoie (pas de recherche web pour trouver des
  photos/produits à sa place — refusé explicitement, voir échange du 02/08 :
  utiliser une photo/fiche dont on ne sait pas si Beau peut réellement la
  livrer recrée exactement le problème des fausses boutiques).

## 5. Finia/Finou 2.0 — état des 23 points (47 capacités), texte d'origine retrouvé

### En cours dans CE cycle (« fait en partie » + « faisable maintenant ») — GO de Beau le 31/07

- [x] **12 (texte) Auto-Listing** ✅ 31/07 : bouton « Remplir la fiche depuis la
  photo » (fiche article vendeur) → titre + description + catégorie (enum des
  vraies catégories) + repère de prix = médiane du catalogue, jamais un chiffre
  inventé. Le détourage/fond studio = coût image à part, plus tard.
- [x] **13 KYC OCR assisté** ✅ 31/07 : section « Candidatures vendeur » dans
  l'admin + bouton « Analyser la pièce » (recto/verso). Compare le nom lu au
  nom déclaré. AIDE seulement — l'IA n'approuve ni ne rejette jamais.
- [x] **10 Évaluateur de troc** ✅ 31/07 : bouton « ⚖️ Évaluer un troc » dans
  l'onglet Annonces → 2 photos → états, valeurs, soulte. Disclaimer affiché.
- [x] **15 (texte) Scripts Reels** ✅ 31/07 : « Générer un script vidéo » sur la
  fiche article (hook, 3-4 plans, CTA, hashtags, bouton copier). Les contrats
  PDF attendent des modèles validés (juridique).
- [x] **17 (V1 photo) Diagnostic BTP/mécanique** ✅ 31/07 : prompt finou-chat —
  panne probable, matériaux, FOURCHETTE annoncée comme approximative, renvoi
  search_services. (Déploiement de finou-chat encore à faire, voir ci-dessous.)
- [x] **20 (V1) Questions sur photo immobilière** : couvert par le chat photo.

**Déploiements de fonctions** : les 6 fonctions (finou-chat, finou-vision,
miroir-ia, send-push, create-checkout, + vendor-copilot/kyc-ocr/troc-eval du
31/07) sont toutes redéployées sur Supabase avec le CORS `*.workers.dev` —
✅ terminé le 01/08.

### Fait (cycles précédents)
1 Caméléon langue/registre ✅ · 2 Voix (navigateur) ✅ partiel · 3 Urgence
texte/photo ✅ partiel · 6 Recherche croisée ✅ (sans PostGIS) · 7 Snap&Buy ✅ ·
8 Planificateur événement ✅ base · 19 Miroir IA ✅ partiel.

### Décision de Beau nécessaire avant de coder (laissés de côté, à sa demande)
- **8 (suite)** Devis groupés AUTONOMES — engage des vendeurs sans accord.
- **11** CO2 → « Graines Finjaro » — le calcul est prêt à faire, mais le
  système de points (valeur, échange) est une décision produit.
- **14** Négociateur auto + arbitre SAV — répondre/rembourser au nom du
  vendeur = risqué, à cadrer.
- **15 (suite)** Contrats PDF — besoin de modèles juridiques validés.
- **23** Matching colocataires (facile) / anti-contrefaçon (déconseillé en
  l'état : pas fiable par photo, risque juridique).

### Abandonné (infra inexistante — décision Beau 31/07)
4-5 (traduction/interprète live), 16 (logistique livreurs), 18 (AR), 20-3D,
21 (acousticien), 22 (simulateur sensoriel), 2 (voix Gemini serveur), 3
(stress vocal audio).

## 6. Phase 2 (plus tard, ordre à décider)
Paiements (CinetPay/Stripe/commission/séquestre) · WhatsApp Business ·
livraison Europe/agences · refonte notifications multi-canal.
