# Plan de la semaine du 19/10 — tout ce que Beau a demandé, dans l'ordre

Beau (14/10, fin d'après-midi) : « fais un plan détaillé ; les crédits sont finis ; lundi à 5 h tu fais tout ce qui est dans le
plan : tu publies les vidéos, tu fais toutes les tâches, les agents codent, tout ce qui est dans le plan, vraiment tout ; relis la
conversation, les docs, les notes, ce qui était déjà dans le plan et ce que tu avais omis, et tu fais tout ça proprement. »

**Démarrage : lundi 19/10 à 5 h (heure de Douala, 04:00 UTC)**, par un passage programmé dans cette session.
Sources relues pour ce plan : le carnet `docs/A-FAIRE.md` (13 et 14/10), `docs/plans/2026-10-14-chantiers-de-beau.md`,
`docs/REUNION-RICARDO-2026-10-13.md`, `docs/DECISIONS.md`, `docs/OBJECTIFS.md`, `docs/MARKETING.md`, `docs/POSTS-QUOTIDIENS.md`,
`A-FAIRE-PARTAGE.md` (dépôt Accounting), et la conversation du 14/10.

## Règles d'exécution (valent pour chaque tâche)
- **Fini = vérifié.** Une case ne passe en ✅ qu'avec sa preuve : tests verts, compilation, capture à **1920 px et 390 px** pour un
  écran, essai réel pour un parcours. Jamais « fait » sans preuve (CLAUDE.md §7).
- **Dérouler avant de livrer** (§11) : 1er, 10e, 50e message ; vide ; erreur ; lent ; téléphone et grand écran.
- **Mise en ligne** : staging d'abord, puis finjaro.net / accounting.finjaro.net une fois vérifié (ordre de Beau du 14/10 : « mets en ligne
  sans me demander »). Migrations additives, essayées sur la base de test `qiyvoaljqmbfldephobp` avant la production.
- **Restent au mot de Beau** : l'argent, l'authentification / Site URL / redirections, un accès donné à un tiers, la suppression de
  données ou de comptes.
- **Agents de Léo** (§10) : chaque bloc a sa part pour un agent (tâche `legion_messages`, une « difficile » par jour) ; leur code passe
  par des branches `leo/` que je relis ; rien d'un agent n'est annoncé à Beau sans ma relecture.
- **Publications** : `docs/MARKETING.md` d'abord (ce que la cliente veut, jamais nos coulisses), puis `docs/POSTS-QUOTIDIENS.md`.
- **Limite d'utilisation** : si elle est atteinte en cours de route, je m'arrête proprement : commit, carnet à jour avec « où j'en suis »,
  et le passage suivant reprend à la première case non cochée.

## Étape 0 — lundi 5 h : remettre la maison en marche
- [x] ✅ 19/10 Réactiver les routines mises en pause le 14/10 (liste exacte en bas de ce fichier), à leur cadence d'avant la pause. **15 sur 16** : la revue du jeudi a été refusée par le système de sécurité (à Beau).
- [x] ✅ 19/10 (`trig_01CA7NpwyN1zWutLEMS3BFEP`, 4 h 48 Douala) Créer le passage quotidien « continuer le plan » (5 h, heure de Douala) qui reprend à la première case non cochée, jusqu'à ce que
      tout soit coché.
- [x] ✅ 19/10 (boîte : rien de réel ; Claudinette : rien depuis le 14/10 ; agents : les 4 livrables du 14/10 attendent ma relecture, repris en A3, A6, D1, D7) Lire les réponses arrivées depuis le 14/10 (Claudinette, agents de Léo, boîte Finjaro) et les noter au carnet.
- [x] ✅ 19/10 (publiée sur les 4 réseaux ; 1 visite venue de `?src=v1410` ; fichiers retirés) Vérifier la publication du 14/10 (18 h) sur les quatre réseaux, relever ses premiers chiffres, retirer
      `public/social/2026-10-14-boutique-v3.mp4` (et l'ancien fichier du 14/10) du dépôt.

## A. Finjaro Learn — en premier (demandé « mille et une fois »)
- [x] ✅ 19/10 (Learn 939368e ; discussion de hauteur fixe à 2, 50 et 200 messages : 854 px à 1920, 567 px à 390 ; zone d'écriture toujours en bas ; agents appelés d'un clic ; 4 onglets au téléphone) **A1. Les Espaces deviennent un atelier de groupe, comme l'Atelier de code de Léo.** Trois zones à l'ordinateur :
      à gauche la liste (espaces, membres présents, agents IA, défis) ; au milieu l'espace de travail (éditeur de code partagé « Coder
      ensemble », console) ; à droite la discussion du groupe **et des agents IA** (on appelle Idris, Maya… par @), **hauteur fixe,
      défilement interne, zone d'écriture toujours en bas** (« plus je parle, plus le truc grossit » : fini). Téléphone : onglets en bas
      (Discussion · Code · Défis), comme l'Atelier. Réutiliser `atelier/AtelierProjet.tsx` (grille 220 px / centre / 380 px),
      `CoCode.tsx`, `Defis.tsx`, la logique de `Espaces.tsx`. Preuve : captures 1920 et 390 px, 50 messages sans que la page grandisse.
- [x] ✅ 19/10 (Learn 866368f ; bouton 🤖 dans la barre de la leçon ; page fixe à 1920 et 390 px avec 50 échanges) **A2. Même cadre pour travailler un sujet avec un agent** : quand on choisit « travailler avec les agents IA », la page de travail
      s'ouvre avec, au milieu, ce que demande le sujet : code (éditeur + console), prompts (prompt à gauche, réponse du modèle à
      droite), notes et schémas pour les sujets sans code (neurosciences…) ; à droite l'agent du sujet.
- [x] ✅ 19/10 en partie (Learn 8f16cb5 : « J'ai terminé » toujours visible, vérifié par le code ; fin de module JavaScript 3 exercices + projet ; leçon visible au premier écran du téléphone, 870 → 670 px). **Reste** : les fins des autres modules (agents, avec `npm run test:exos`). Spécification d'Ada relue : la structure de page est juste ; les tables, l'ORM et les routes serveur sont faux pour Learn (contenu dans le code, vérification dans le navigateur). **A3. La leçon** (spécification d'Ada, tâche `c2d1ca0f`, à relire puis construire) : explication courte + un exemple + des
      exercices ; à la fin du module **3 exercices (facile, moyen, difficile)** puis **un projet complet validé par l'IA** (critères
      vérifiables exécutés par du code, le modèle ne calcule pas) ; toujours visible : où j'en suis, et le bouton « J'ai terminé » ; page
      plus courte ; « Start my first lesson » mène vraiment à la leçon.
- [x] ✅ 19/10 en partie (Learn c51a520 : mécanisme `lessonsEn.ts`, Prompt engineering et JavaScript traduits, test 32/32). **Reste** : 52 leçons avec du français dans le code (liste : `node` sur `fr-scan`, voir le carnet). **A4. Anglais intégral** : en mode anglais, plus aucun mot français, y compris les identifiants et libellés des exercices
      (`construit(role, tache…)`, « Rôle : »).
- [x] ✅ 19/10 (Learn 367d244 : « compléter » sur les 206 leçons à exercice, « remettre dans l'ordre » sur 102, 0 défaut ; construits depuis la solution, sans modèle) **A5. Interactif** : quiz cliquables (choix, glisser, compléter) dans chaque leçon, comme Gemini.
- [x] ✅ 19/10 SQL (Learn 2e519d8 : 7 leçons exécutées dans le navigateur, 7/7 en français et en anglais). C++ existait (lecture vérifiée par compilateur). **Reste** : R (webR, lourd : à essayer) et Power BI (ne s'exécute pas dans un navigateur : module de lecture DAX + équivalents pandas). Livrable de Mentor (`b0d21a39`) vide : à refaire. **A6. Les modules qui manquent** (programmes de Mentor, tâche `b0d21a39`, à relire) : **SQL** (exécution dans le navigateur),
      **R**, **C++**, **Power BI** — et dire honnêtement ce qui ne s'exécute pas dans le navigateur et quelle alternative on donne.
- [x] ✅ 19/10 en partie (Learn 8e033fb : cartes de l'accueil allégées, 4 518 → 3 382 px). **A7. Le site n'est plus « laid »** : passe de design (typographie, cartes, espacement, cohérence avec le style de Finjaro).
- [x] ✅ 19/10 (lien « Mot de passe oublié ? » qui envoie le lien de connexion existant ; aucun changement d'authentification) **A8. Mot de passe oublié dans Learn** (absent ; un « lien par e-mail » existe).
- [x] ✅ 19/10 (Learn 8e033fb dans `public/learn`, staging) **A9.** Réimporter Learn dans la place de marché (`scripts/importer-learn.sh`), vérifier sur staging ; Learn reste fermé sur
      finjaro.net tant que Beau ne l'a pas validé.

## B. Finjaro Accounting (priorité du 13/10)
- [ ] **B1. Discussion « tout Google Chat »** sur la base posée le 14/10 (migration 0245, contrat dans `A-FAIRE-PARTAGE`). Si
      Claudinette n'a pas livré l'écran : je le construis moi-même, en accord avec elle. Jalon 1 : nouvelle discussion à deux, de groupe,
      Espace nommé ; messages en temps réel ; non lus ; réactions ; @mentions ; épingler ; appel voix/vidéo par lien. Jalon 2 : fils,
      accusés de lecture, recherche, tâches assignées. Jalon 3 : historique réglable, résumé par l'IA, badge « Externe », alerte sur
      données sensibles, bots et webhooks. Preuve : circuit réel à deux comptes de test.
- [ ] **B2. L'invitation part par e-mail** (fonction `finia-invitation`, Resend, sans toucher à l'authentification ni au Site URL),
      puis mesure : invitations → personnes « Actif ».
- [ ] **B3. Flux inverse du stock** : écran « Publier sur Finjaro » (photo obligatoire, boutique choisie), synchro du stock après chaque
      mouvement, coût repris pour les articles connus (Claudinette) ; **essai du circuit complet** par moi (publier → commander → livrer
      → stock des deux côtés).
- [ ] **B4.** Vérifier le défaut vu le 14/10 : après connexion sur un appareil neuf, l'assistant de démarrage (« Quelle est votre
      activité ? ») s'affiche alors que le compte a un espace.
- [ ] **B5. Vidéo tutoriel d'Accounting** (vendre, reçu WhatsApp, dettes), aussi utilisée pour les posts.
- [ ] **B7. L'assistant d'Accounting agit sur les réglages** (Beau, 14/10, capture : il a écrit « mets le mode light » et l'assistant
      a répondu qu'il n'existe que Simple / Expert, alors que l'application a un thème clair / sombre). L'assistant doit connaître
      tous les réglages réels (thème clair / sombre, langue, mode Simple / Expert, devise…) et **les appliquer quand on le lui demande**
      (« mets le mode clair » → c'est fait, avec un mot pour revenir en arrière). Preuve : essai de chaque phrase dans l'application.
- [ ] **B6. Tableau de la concurrence d'Accounting** (Caisse Boutique, Chopmoney, MoMoGram, Transify, Excel…), sources citées.

## C. Place de marché
- [ ] **C1. Mise en ligne sur finjaro.net** du lot staging (accueil de Léo allégé, un seul visage par département, Learn sans étoiles,
      documents) après vérification.
- [ ] **C2. Discussion interne en premier sur la fiche article, WhatsApp en second** (décision de la réunion), avec mesure avant/après
      des contacts (`contact_intent` par source) et en vérifiant que les vendeuses reçoivent bien les notifications.
- [ ] **C3. Démonstration de la place de marché sans compte** (comme celle d'Accounting), boutique d'exemple exclue des statistiques.
- [ ] **C4. Prix par quantité incohérents** : vu le 14/10 sur un article réel (« dès 10 pièces » plus cher à la pièce que le prix
      unitaire) : contrôle à la saisie et message clair à la vendeuse.
- [ ] **C5.** Tester puis appliquer `stats-vendeuses-equipe.sql` (statistiques vendeuses).

## D. Léo
- [ ] **D1. Appel vocal comme avec Gemini** (spécification de Forge, tâche `7c1a3e83`, à relire) : l'agent dit bonjour en premier,
      écoute en continu, se laisse interrompre ; étape gratuite d'abord (reconnaissance du navigateur, voix locale) ; voix Manon seulement
      quand Beau décide d'une dépense.
- [ ] **D2. Jarvis** : réveil par deux claquements de mains (page ouverte, micro autorisé) ; dire ce qui exige une application installée.
- [ ] **D3. Pages de travail façon atelier pour les agents** (même cadre que A2) : discussion à droite de hauteur fixe.
- [ ] **D4. Moins 80 % de texte sur les autres écrans de Léo** (salons, fiche d'agent, tableau des tâches, connecteurs).
- [ ] **D5. Les 610 livrables « en revue »** : tri des plus anciens (garder / clore avec une ligne de relecture), sans rien supprimer ;
      plus de nouvelle tâche sans relecture prévue.
- [ ] **D6. Agent « pilote »** (souris et clavier, plan confié à Forge le 13/10) : faire le point et avancer, avec les garde-fous
      (« Confirmer » avant tout geste irréversible, aucun mot de passe gardé, journal, arrêt immédiat).
- [ ] **D7. Site web de Finjaro** (vitrine du groupe) : relire le plan de Plume (tâche `bcfacff2`), puis le construire (Atelier).

## E. Publications (une par jour, `docs/MARKETING.md`)
- [ ] **E1.** Lundi : vidéo **Accounting** (« Gère ton stock et tes finances avec Finjaro Accounting. Gratuit pour démarrer. »), 18 h
      Paris, quatre réseaux. Puis vidéo mardi, jeudi, samedi ; **flyer les autres jours : créer la routine des flyers** (elle n'existe pas).
- [ ] **E2.** Les chiffres de chaque post le lendemain (vues, visites venues de `?src=`) au rapport du soir.
- [ ] **E3.** LinkedIn (Léo seulement, Typefully) : publier les brouillons dès que Beau a dit « ok ».

## F. Le travail des agents de Léo cette semaine
Une tâche par bloc au moins, dont une difficile par jour : A2 (Ada), A6 (Mentor), B6 (Vigie), C4 (Atelier), D1 (Forge), D7 (Plume puis
Atelier), relecture de textes (Miroir). Je relis chaque livrable, je reprends ce qui est juste, je corrige le reste et je le leur dis.

## G. Le carnet : 216 lignes encore ouvertes (24/09 → 14/10)
Ce plan ne couvre pas tout : le carnet garde **216 lignes sans ✅** (atelier de code de Léo, Jarvis, réceptionniste vocale,
appels qui sonnent, agents sur les réseaux, connecteurs par utilisateur, espace code de Learn demandé dès le 02/10, clés à poser…).
La liste complète est dans `docs/plans/2026-10-19-carnet-ouvert.md`.
- [ ] **G1.** Lundi, après l'étape 0 : un verdict par ligne (fait / à faire / à Beau / dépassé), écrit dans le carnet.
- [ ] **G2.** Les lignes « à faire » rejoignent ce plan à leur place ; on les fait avec les blocs qui touchent le même écran.
- [ ] **G3.** Les lignes « à Beau » s'ajoutent à ses gestes, six au plus par jour, les plus importantes d'abord.

## Ce que j'avais laissé de côté (relu le 14/10)
Les Espaces de Learn façon atelier (A1, demandé plusieurs fois), le mot de passe oublié de Learn (A8), la discussion interne d'abord sur
la fiche article (C2), la démonstration de la place de marché (C3), la vidéo tutoriel et le tableau de concurrence d'Accounting (B5,
B6), la routine des flyers (E1), les chiffres des posts (E2), les 610 livrables en revue (D5), le défaut d'accueil d'Accounting (B4) et
les prix par quantité incohérents (C4).

## Ce qu'il faut de Beau (six gestes au plus)
1. « Gratuit jusqu'en novembre » est écrit dans l'application alors que la décision du 13/10 est « aucune date de fin publique » : que met-on ?
2. L'e-mail « mot de passe oublié » est en anglais et signé « powered by Supabase » (commun aux deux applications) : le mettre en français, à ton nom ?
3. Retirer le drapeau de la bio TikTok et la ville du nom de la page Facebook.
4. M'envoyer trois posts Instagram que tu aimes (captures) : je copie leur structure.
5. Dire « ok » ou « non » aux deux posts LinkedIn sur Léo.
6. La pub : où elle tourne, quel budget, et mettre `?src=pub-…` sur le lien.

## Routines mises en pause le 14/10 (à réactiver à l'étape 0)
Dans cette session : `trig_018NV2jvgXzeEWQJpp2aTPbR` (agents, mer./sam. 23:37), `trig_01Duw14RFzwtgSZfq82qLUn8` (vidéo, mar./jeu./sam.),
`trig_01NqbbEKKjDd8GFztcVtqDks` (moteurs gratuits, ven.), `trig_018xRmHXvfrn4suLKqsY7uPC` (améliorations, mer./ven.),
`trig_017UEdiXJMPpqxWjEWgebiVB` et `trig_01RsuYTCe76h1KdB6ASNFVJH` (Lettre de l'IA, mer./ven.), `trig_01SwgyTRb8vs4yBbNVakxtHG`
(boîte Finjaro, 12:23), `trig_011H8QSLiZfoB4m1uWT46S4G` (contrôle Claudinette/Léo, 17:43), `trig_01J7TiTVEc7Aij729DyRerW5` (revue du jeudi),
`trig_018Zcc8SbxcfzWf4siYHKjzb` (réunion du matin, 7:00), `trig_01J7N62rNGfRpLebZLBSMjmj` (rappel du soir, 19:00),
`trig_01AE674JaDL1uKcTboY1UBnz` (stockage, 7:00).
Session de Claudinette : `trig_01F1jZdnyQbE7VvhNgA5vvP2` (veille, 5:00), `trig_0186tgTu5KnGtC5f8ajBLvfE` (revue du jeudi),
`trig_01ABNxQZXV2Kjd3ktUbBFfPA` (réunion quotidienne, 6:00).
Session à part : `trig_01H2EhMEzGNcHJ27ZJg6UwoJ` (veille réponses et salle commune, toutes les 5 h).
Laissées actives (elles tombent lundi) : les deux audits du lundi et le rappel du 19/10 07:30 UTC.
