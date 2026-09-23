# Les 200 propositions de Gemini pour Legion — l'état de chacune (D11, D12)

Beau, 23/09 : « voici quelques idées de Gemini que je veux que tu prennes au
sérieux ; des fois tu jettes tout ». Les voici toutes les 200, dans l'ordre de
Gemini, chacune regardée dans le code de Legion au 23/09 au soir (staging).
En bas, les 20 fonctionnalités de place de marché que Gemini a listées,
vérifiées une par une dans le code de Finjaro.

Ce qui est marqué ✅ existe et a été essayé ; rien n'est coché sur la foi
d'une intention. Quand une idée est écartée, la raison est écrite : ce n'est
jamais « trop compliqué », c'est qu'elle inventerait des chiffres, qu'elle ne
sert pas l'utilisateur, ou qu'elle retirerait l'humain des commandes.

| Signe | Veut dire |
| --- | --- |
| ✅ | Fait |
| 🔧 | En partie : ce qui existe et ce qui manque sont écrits |
| 📌 | Pas fait, et ça vaut la peine |
| ⏸ | Attend Beau (un jeton, un compte, une décision) |
| ✗ | Écarté, avec la raison |

**Le compte :** 55 faites, 59 en partie, 33 à faire, 18 en attente de Beau, 35 écartées.

## Les huit à faire ensuite, à mon avis

1. **Un collègue conteste un livrable** (2, et I6) : la relecture croisée entre agents.
2. **Un directeur propose d'engager un agent**, derrière « Confirmer » (3).
3. **Le rapport du soir** : ce qui a été fait aujourd'hui, en une page (11).
4. **Le vote en réunion** (20).
5. **Le tableau par agent** : tâches faites, en retard, renvoyées, et ce qu'il coûte (21, 42, 115).
6. **Un nouveau ticket GitHub ouvre une réunion** (36).
7. **La mémoire propre à chaque agent** : ses livrables et ce qu'on lui a appris (1).
8. **Le rapport de transparence du mois** : dépense, réponses corrigées, actions confirmées (124).

Et une seule chose débloque d'un coup onze lignes ⏸ (27 à 46, 108, 132, 145,
198) : le jeton GitHub **en écriture** pour le studio de code.


## Intelligence artificielle et comportement des agents (1 à 25)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 1 | Mémoire courte et longue, base vectorielle par agent | 🔧 | Existe : les règles de la maison (Mémoire), la mémoire de chaque salon résumée chaque matin, ce qui s'est dit dans les autres salons, et une base vectorielle pour les documents de l'entreprise (0179). Manque : une mémoire vectorielle propre à CHAQUE agent (ses livrables passés, ce qu'on lui a appris). |
| 2 | Réputation : les agents s'évaluent après chaque livrable | 📌 | Aujourd'hui une relecture vérifie chaque réponse (chiffres inventés, promesses), et le fondateur « Valide » ou « Renvoie ». Les agents ne se notent pas entre eux. À faire : un collègue relit le livrable d'un autre et le conteste (déjà noté en I6). |
| 3 | Auto-recrutement : un manager rédige la fiche et demande un agent | 🔧 | « Renforcer » : Legion propose des agents avec leur fiche complète, le fondateur coche. Un directeur ne peut pas encore le proposer de lui-même dans un salon (il faudrait une action « engager » derrière « Confirmer »). |
| 4 | Personnalités simulées (optimiste, prudent, perfectionniste) | ✅ | Chaque agent a une personnalité écrite, modifiable sur sa fiche, et parle avec elle. |
| 5 | Réunions automatiques, transcription et synthèse des points d'équipe | ✅ | Réunions en direct (23/09) : deux tours, compte rendu avec décidé, écarté, désaccords, à trancher, et tâches créées. Pas encore de réunion lancée seule chaque matin. |
| 6 | Jeu de rôle conflictuel, un avocat du diable permanent | 🔧 | Le 2e tour d'une réunion est contradictoire : chacun doit dire ce qui ne va pas chez l'autre. Pas encore un agent « avocat du diable » attitré. |
| 7 | Un agent s'auto-forme en lisant la documentation du projet | ✅ | Documents de l'entreprise (0179) et compétences : l'agent qui en a le droit lit les documents et cite sa source. |
| 8 | Badges de compétences, certifications internes | 🔧 | Les compétences d'un agent sont affichées sur sa fiche. Pas de badge ni de certification. |
| 9 | Humeur des agents selon la charge et les retours | ✗ | Pas retenu : une « humeur » inventée ne sert pas l'utilisateur et brouille ce qui est vrai. La charge réelle (tâches ouvertes par agent) est déjà visible au tableau. |
| 10 | Agents multilingues | ✅ | Ils répondent dans la langue du message, et en anglais toute la journée de travail si le fondateur lit l'anglais. |
| 11 | Rapport de fin de journée par le directeur général | 🔧 | Chaque matin, plans de la semaine par département et livrables. Pas encore un rapport unique « ce qui a été fait aujourd'hui ». |
| 12 | Déléguer une tâche à un autre département | ✅ | Relais : une tâche passe d'un agent à l'autre avec le livrable du premier. |
| 13 | Alerte proactive en cas d'incohérence | 🔧 | Un agent bloqué pose sa question au fondateur. Pas de veille qui cherche seule les incohérences. |
| 14 | Journal des choix : pourquoi l'agent a décidé ça | 🔧 | Chaque réponse garde ce qui a été vérifié (outils appelés), ses sources et ce que la relecture a corrigé. La fiche montre ce que l'agent reçoit avant de répondre. Pas de journal par agent. |
| 15 | Conscience éthique selon les règles de l'entreprise | ✅ | Règles de la maison relues avant chaque réponse ; « ce qu'il ne fait jamais » par agent (0177). |
| 16 | Négociation de budget entre départements | 📌 | Faisable en réunion (sujet « budget »). Pas de budget par département aujourd'hui, seulement le plafond de l'entreprise. |
| 17 | Un mentor pour les nouveaux agents | ✗ | Pas utile tel quel : un nouvel agent reçoit déjà le contexte complet (mémoire, plans, tâches). |
| 18 | Pauses café entre agents pour des idées inattendues | ✗ | Coûte de l'argent sans demande de l'utilisateur. Les réunions couvrent le besoin quand on le veut. |
| 19 | Agents qui simulent des utilisateurs pour tester l'application | 📌 | Utile pour le studio de code et pour Finjaro. Demande un navigateur de test côté serveur. |
| 20 | Vote à la majorité en comité de direction | 📌 | Simple à ajouter aux réunions (chaque agent vote, le compte rendu le dit). |
| 21 | KPI par agent suivis dans un tableau RH | 📌 | On a les tâches faites, en retard, renvoyées : un tableau par agent est faisable. |
| 22 | Refuser une tâche hors de son métier | ✅ | Le mandat et « ce qu'il ne fait jamais » le permettent ; il le dit et passe la main. |
| 23 | Biographie générée à la création | ✅ | Mandat et personnalité écrits à la création, portrait choisi par l'agent lui-même. |
| 24 | Parrainage senior / junior | ✗ | Même raison que 17. |
| 25 | Mode « silence radio » pour travailler au calme | ✅ | L'interrupteur : un agent éteint ne répond plus et ne coûte rien. |

## Architecture technique et GitHub (26 à 50)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 26 | Synchronisation avec les dépôts GitHub | 🔧 | Chaque entreprise branche SON dépôt : les agents lisent les derniers changements et les tickets (lecture seule). ⏸ L'écriture attend le jeton GitHub en écriture de Beau. |
| 27 | Exécuter du code dans un bac à sable | ⏸ | Studio de code : Gemini sait exécuter du Python sans rien installer ; le reste attend le jeton GitHub en écriture. |
| 28 | Analyse statique et sécurité du code | ⏸ | Studio de code, même jeton. |
| 29 | Pull requests validées par le responsable technique | ⏸ | Studio de code, même jeton ; rien ne fusionne sans le fondateur. |
| 30 | Versions des consignes et des compétences dans Git | 🔧 | Les compétences viennent de dépôts GitHub publics (licence vérifiée), chacune avec sa source. |
| 31 | Installer des bibliothèques par une phrase | ⏸ | Studio de code. |
| 32 | Déploiement automatique orchestré par un agent | ⏸ | Studio de code. Toujours validé par un humain. |
| 33 | Détection des conflits entre agents codeurs | ⏸ | Studio de code : une branche par agent (vidéo « Claude Squad », J1). |
| 34 | Documentation du code tenue à jour | ⏸ | Studio de code. |
| 35 | Optimisation des requêtes SQL par un agent base de données | ⏸ | Studio de code. |
| 36 | Une action GitHub déclenche une réunion | 📌 | Faisable dès que le dépôt est branché : un nouveau ticket ouvre une réunion. |
| 37 | Tests unitaires écrits par un agent qualité | ⏸ | Studio de code. |
| 38 | Audit hebdomadaire de la dette technique | 🔧 | Possible aujourd'hui en tâche récurrente sur un dépôt branché (lecture). Pas encore proposé par défaut. |
| 39 | Secrets et clés rangés à part, par entreprise | ✅ | Le jeton GitHub de chaque entreprise est au coffre (vault), jamais relu par l'application. |
| 40 | Architecture en graphe 3D | ✗ | Pas prioritaire : joli, mais n'aide pas à décider. |
| 41 | Importer un agent depuis GitHub | 🔧 | On importe des COMPÉTENCES depuis GitHub (catalogue, licence vérifiée). Pas un agent entier. |
| 42 | Consommation par agent et par dépôt | 🔧 | Ce que Legion coûte ce mois-ci, par entreprise, avec un plafond (Dépense). Pas encore le détail par agent. |
| 43 | Changelog automatique pour les utilisateurs | 📌 | Faisable à partir du dépôt branché. |
| 44 | Annuler d'un coup la modification d'un agent | ⏸ | Studio de code (Git le permet). |
| 45 | Dépendances obsolètes et mises à jour sûres | ⏸ | Studio de code. |
| 46 | Environnement de test éphémère par fonctionnalité | ⏸ | Studio de code (aperçu par branche). |
| 47 | Brancher Jira ou Linear | 📌 | Même mécanisme que GitHub : un connecteur par entreprise. |
| 48 | Signature des contributions des agents | 🔧 | Chaque message et livrable garde son auteur, le modèle utilisé et l'heure. Pas de signature cryptographique. |
| 49 | Taille du contexte adaptée à la tâche | ✅ | Les questions simples partent sur un modèle rapide, les questions de fond sur un modèle plus fort, avec plus de contexte. |
| 50 | Sauvegarde sur stockage décentralisé | ✗ | La base est déjà sauvegardée par Supabase. Aucun besoin exprimé. |

## Interface et expérience (51 à 75)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 51 | Organigramme vivant animé | 🔧 | L'organigramme se construit à la fondation et les salons suivent les départements. Pas d'animation selon l'activité. |
| 52 | Bureau virtuel isométrique avec les avatars au travail | 📌 | Beau aime le style : faisable en 2D légère sur l'accueil. |
| 53 | Avatars personnalisés (IA, photo, manga, corporate) | ✅ | Chaque agent choisit son visage ou son bitmoji ; on peut aussi le changer. |
| 54 | Salle de contrôle : vue d'ensemble ↔ un seul agent | 🔧 | Accueil de l'entreprise ↔ fiche d'un agent. À enrichir. |
| 55 | Notifications des agents | ✅ | Le téléphone sonne quand un agent pose une question, propose, décide, ouvre une réunion, ou donne une tâche à un humain. |
| 56 | Tableau des coûts en temps réel | ✅ | Dépense du mois et plafond, par entreprise. |
| 57 | Mode sombre et thèmes | ✅ | Legion a son thème bleu nuit et or. |
| 58 | Commandes rapides (/) pour appeler un agent | 🔧 | On appelle un agent par « @Prénom ». Pas de commandes « / ». |
| 59 | Frise pour revoir l'état à une date donnée | 📌 | Les messages, plans et tâches sont datés : une frise est faisable. |
| 60 | Carte de chaleur de l'activité par département | 📌 | Faisable à partir des messages et des tâches. |
| 61 | Cartes de visite des agents | ✅ | La fiche de l'agent (visage, poste, mandat, personnalité, ce qu'il reçoit). |
| 62 | Mode « présentation investisseur » | 🔧 | Un agent peut écrire le dossier dans un salon. Pas de diapositives générées. |
| 63 | Dicter ses ordres à la voix | ✅ | Vocaux transcrits, et appel vocal d'un agent (23/09). |
| 64 | Interface traduite | ✅ | Français et anglais ; d'autres langues à ajouter. |
| 65 | Raccourcis clavier | 📌 | Petit travail. |
| 66 | Jauge de santé du projet | 📌 | À construire à partir des tâches en retard, des blocages et du plafond. |
| 67 | Mode focus : cacher les agents inactifs | 🔧 | Les agents éteints sont grisés. Pas de filtre qui les cache. |
| 68 | Galerie des avatars filtrable par rôle | 🔧 | Liste par salon et par département. |
| 69 | Exporter l'organigramme en PDF ou image | 📌 | Petit travail. |
| 70 | Mini-jeu pour « motiver » les agents | ✗ | Pas retenu : ne sert pas le travail. |
| 71 | Trophées aux grandes étapes | 📌 | Possible avec la feuille de route (étape franchie). |
| 72 | Conférence de presse simulée | 🔧 | Faisable en réunion avec des experts en communication. Pas de mode dédié. |
| 73 | Charge globale de l'entreprise | 📌 | Même source que 60. |
| 74 | Ton des agents (formel, décontracté…) | ✅ | Par la personnalité de chaque agent. |
| 75 | Météo et ambiance sonore | ✗ | Pas retenu. |

## Métier, conseil et marketing (76 à 100)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 76 | Étude de marché et veille concurrentielle en continu | ✅ | Recherche sur Internet avec sources, pour les tâches qui regardent dehors ; experts « Étude de marché » à la mission. |
| 77 | Campagnes publicitaires complètes (textes, visuels, ciblage) | 🔧 | Les textes et le ciblage, oui. Les visuels : non (règle : aucune photo d'article prise sur le web ; les visuels viennent des vendeuses ou de Beau). |
| 78 | Entretiens simulés avec des clients (personas) | 📌 | Faisable en réunion avec des agents « clients ». À proposer comme modèle de réunion. |
| 79 | Rentabilité et modèle financier | ✅ | Excel rendu avec formules (marge, taux, totaux) ; avec Accounting branché, sur les vrais chiffres (0180). |
| 80 | Business plan mis à jour quand une variable change | 🔧 | Le plan de la semaine et du mois est réécrit chaque semaine. Pas de business plan vivant. |
| 81 | Charte graphique et kit marketing | 🔧 | Texte oui ; images non (même règle que 77). |
| 82 | Retours utilisateurs → propositions produit | 🔧 | Avec la boutique branchée, les agents lisent les avis. Pas de synthèse automatique. |
| 83 | Prix testés sur des marchés simulés | ✗ | Un marché simulé donnerait des chiffres inventés. Mieux : « prix conseillé » à partir des vrais prix (déjà fait sur Finjaro, idée 59). |
| 84 | Contrats et conditions générales par des agents juristes | 🔧 | Modèle « Cabinet d'avocats », expert « Relecture de contrats ». Toujours relu par un humain. |
| 85 | Plan de communication de crise | 🔧 | Faisable par un agent ; pas de modèle prêt. |
| 86 | Publications réseaux sociaux programmées | 🔧 | Le calendrier des publications est préparé chaque vendredi (tâche récurrente). ⏸ Publier soi-même attend les comptes et l'accord de Beau. |
| 87 | Analyse des tunnels de conversion | ✅ | Avec « Mesures Finjaro » (équipe Finjaro) ou la boutique branchée : vues, paniers, commandes. |
| 88 | Séminaires de cohésion des agents | ✗ | Pas retenu. |
| 89 | Lettre d'information hebdomadaire | 🔧 | Un agent peut la rédiger ; ⏸ l'envoyer attend la boîte mail branchée. |
| 90 | Empreinte carbone des serveurs | ✗ | Pas de chiffre mesurable fiable aujourd'hui (règle : aucun chiffre inventé). |
| 91 | Personas détaillés sur données réelles | 🔧 | Avec la boutique ou les mesures branchées. Sinon, sur les documents de l'entreprise. |
| 92 | Audit SEO et mots-clés | 🔧 | Faisable avec la recherche web ; pas d'outil SEO branché. |
| 93 | Négociations commerciales simulées | 📌 | Réunion avec un agent qui joue le partenaire. |
| 94 | Supports de formation pour les futurs employés | ✅ | Un agent peut les écrire à partir des documents de l'entreprise. |
| 95 | Tendances technologiques mondiales | ✅ | Recherche web avec sources. |
| 96 | Matrice des risques mise à jour | 📌 | Tâche récurrente à proposer dans les modèles. |
| 97 | Parrainage et fidélisation | 🔧 | Côté Finjaro, le parrainage existe. Dans Legion, un agent peut le concevoir. |
| 98 | Analyse des avis sur les magasins d'applications | 📌 | Demande un connecteur vers les stores. |
| 99 | Gamification de l'application | 🔧 | Idées oui, par un agent. Rien de construit. |
| 100 | Expansion internationale pays par pays | ✅ | Faisable par un agent, avec recherche web et sources. Finjaro est mondiale : pas de pays par défaut. |

## Sécurité, gouvernance et éthique (101 à 125)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 101 | Garde-fous contre les dérives | ✅ | Règles de la maison, « ce qu'il ne fait jamais », relecture de chaque réponse, rien n'est envoyé sans « Confirmer ». |
| 102 | Chiffrement des échanges internes | 🔧 | Connexions chiffrées (HTTPS) et base protégée par des règles d'accès par entreprise. Pas de chiffrement de bout en bout. |
| 103 | Isoler les agents sensibles (finances…) | ✅ | Droits par agent (0177) : un agent sans le droit « comptabilité » ne consulte pas les comptes (vérifié le 23/09). |
| 104 | Journal inaltérable des décisions | 🔧 | Messages et comptes rendus datés, avec leur auteur. Pas de journal inaltérable. |
| 105 | Double validation humaine pour les actions critiques | ✅ | Toute action passe par « Confirmer » ; un livrable passe par « Valider ». |
| 106 | Détection des biais dans les analyses | 🔧 | La relecture retire les chiffres et faits inventés ; pas de détection de biais statistiques. |
| 107 | Pas de données personnelles non autorisées | ✅ | Les agents ne voient jamais un e-mail, un téléphone ou une adresse ; prénom de la cliente au plus. |
| 108 | Tests d'intrusion par une équipe rouge | ⏸ | Studio de code. |
| 109 | Rôles et permissions fins pour les humains | 🔧 | Propriétaire et membres invités. Pas de rôles plus fins. |
| 110 | Coupure d'urgence globale ou par département | 🔧 | L'interrupteur par agent, et le plafond du mois qui arrête tout. Pas d'interrupteur par département. |
| 111 | Provenance et licence du code importé | ✅ | Les compétences GitHub ne sont prises que sous licence libre vérifiée, avec leur source. |
| 112 | Sauvegarde des choix stratégiques | ✅ | Comptes rendus de réunion, plans et feuille de route gardés. |
| 113 | Pannes et cyberattaques simulées | ✗ | Pas maintenant. |
| 114 | Intégrité des modèles | 🔧 | Chaque réponse garde le nom du modèle utilisé. |
| 115 | Budget de calcul par agent | 🔧 | Plafond par entreprise (Dépense). Pas encore par agent. |
| 116 | Traçabilité des sources | ✅ | Sources sous chaque message (Internet, documents). |
| 117 | Rotation des mots de passe et jetons | 🔧 | Jetons de connexion MCP révocables ; jeton GitHub effaçable. |
| 118 | Audit externe par un humain | ✅ | On invite un membre dans l'entreprise ; il voit les salons et le tableau. |
| 119 | Détection des boucles entre agents | ✅ | Une réunion a deux tours et 45 minutes au plus ; une réponse ne relance pas une chaîne d'agents sans fin. |
| 120 | Vote d'urgence pour remplacer un agent défaillant | 🔧 | Le fondateur éteint ou remplace un agent. Pas de vote. |
| 121 | Chiffrement des mémoires au repos | 🔧 | Assuré par l'hébergeur de la base ; rien de plus. |
| 122 | Fuites de données dans les requêtes envoyées aux IA | ✅ | Les outils ne renvoient jamais d'e-mail, de téléphone ni d'adresse. |
| 123 | Normes ISO 27001 | ✗ | Pas maintenant. |
| 124 | Rapport de transparence mensuel | 📌 | Faisable : dépense, réponses corrigées par la relecture, actions confirmées. |
| 125 | Validation éthique des grandes fonctionnalités | 🔧 | Étude de l'intérim avec la loi et ce qui a mal tourné ailleurs (LEGION-INTERIM-ETUDE.md). |

## Performance et échelle (126 à 150)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 126 | Des milliers d'agents en parallèle | 🔧 | L'effectif va jusqu'à 10 000 à la fondation ; seuls ceux à qui l'on parle, ou qui ont une tâche, travaillent (et coûtent). |
| 127 | Cache des réponses fréquentes | 📌 | Utile pour le coût. |
| 128 | Petits modèles pour les tâches simples, grands pour le fond | ✅ | Déjà le cas. |
| 129 | Compression des longues conversations | ✅ | Chaque salon est résumé chaque matin (mémoire du salon). |
| 130 | Plusieurs fournisseurs d'IA | 🔧 | Moteur interchangeable ; aujourd'hui Gemini, avec plusieurs modèles de secours quand Google est saturé. Claude et ChatGPT peuvent se brancher via le connecteur MCP. |
| 131 | Modèles locaux hors ligne | ✗ | Pas sur un téléphone d'entrée de gamme. |
| 132 | Optimiser les requêtes des agents développeurs | ⏸ | Studio de code. |
| 133 | Nettoyer les agents inactifs | ✅ | Un intérimaire s'éteint seul le lendemain de sa date de fin (0177). |
| 134 | Avatars compressés | 📌 | La place de marché sert ses photos en miniature ; les portraits des agents pas encore. |
| 135 | Indexation instantanée des documents | ✅ | Documents découpés et indexés par le sens à l'ajout (0179). |
| 136 | Surveillance mémoire et processeur | ✗ | Géré par l'hébergeur. |
| 137 | Listes virtualisées pour des milliers d'agents | 📌 | À faire avant les très grands effectifs. |
| 138 | Organigramme en WebGL | ✗ | Pas prioritaire. |
| 139 | Reprise après coupure réseau | ✅ | Plusieurs modèles de secours, délais bornés, message clair quand Google est saturé. |
| 140 | Économie d'énergie des serveurs | ✗ | Hors de notre main. |
| 141 | Tests de charge | 📌 | Avant une grosse campagne. |
| 142 | Synchronisation en arrière-plan | ✅ | Travail en fond (réunions, lecture des documents). |
| 143 | Workers web pour ne pas bloquer l'écran | 🔧 | Le travail lourd est côté serveur. |
| 144 | Compatibilité des anciennes versions d'agents | ✅ | Migrations additives : rien de ce qui existe ne casse. |
| 145 | Profilage du code généré | ⏸ | Studio de code. |
| 146 | Moins de données échangées | 🔧 | Au cas par cas. |
| 147 | File prioritaire pour le fondateur | 🔧 | Le fondateur est servi à la demande ; le travail de fond passe la nuit et le matin. |
| 148 | Stockage local hors ligne | 🔧 | Finjaro a un bandeau hors ligne ; Legion demande le réseau. |
| 149 | Petits modèles spécialisés affinés | ✗ | Pas avant d'avoir beaucoup d'usage réel. |
| 150 | Micro-services | ✅ | Une fonction par métier (répondre, travailler, réunion, renfort, documents…). |

## Collaboration et écosystème (151 à 175)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 151 | Partager un organigramme complet (modèles) | ✅ | Catalogue de modèles : 3 737 postes, dont « Construire une application de A à Z » (200 postes) et « Agence d'intérim IA » ; un modèle se génère pour n'importe quel secteur. |
| 152 | Exporter un agent en fichier | 📌 | Petit travail (JSON de sa fiche). |
| 153 | Plusieurs humains dirigent la même entreprise | ✅ | On invite des membres ; chacun parle aux agents. |
| 154 | Commenter le travail des agents | ✅ | Commentaires sur une tâche du tableau. |
| 155 | Agents dans de vraies visioconférences | ✗ | Pas maintenant ; l'appel vocal d'un agent existe. |
| 156 | API ouverte pour piloter les agents | ✅ | Serveur MCP : Claude, ChatGPT, Claude Code… lisent et écrivent dans les salons avec les droits de la personne. |
| 157 | Publier les réussites sur LinkedIn | ⏸ | Attend les comptes et l'accord de Beau ; rien n'est publié en son nom sans lui. |
| 158 | Parrainage avec crédits de calcul | 📌 | À décider avec le prix des formules (Beau : plus tard). |
| 159 | Forum communautaire | ✗ | Pas maintenant. |
| 160 | Hackathons entre départements | ✗ | Pas retenu. |
| 161 | Flux RSS et veille partagée | 🔧 | Le veilleur prend chaque matin de nouvelles compétences sur GitHub ; recherche web pour les tâches. Pas de flux RSS. |
| 162 | Experts invités pour une mission | ✅ | « Un expert pour une mission », avec date de fin (23/09). |
| 163 | Vote communautaire sur les compétences | ✗ | Pas maintenant. |
| 164 | Adaptation culturelle par marché | 🔧 | Langue de l'utilisateur ; pas de pays par défaut. |
| 165 | Wiki interne tenu par les agents | 🔧 | Documents de l'entreprise + mémoire. Pas de wiki écrit par les agents. |
| 166 | Tableau blanc collaboratif | 📌 | À voir. |
| 167 | Historique des décisions consultable | ✅ | Comptes rendus (genre « décision ») dans les salons. |
| 168 | Encourager un agent | 🔧 | Réactions emoji sur les messages. |
| 169 | Podcast de la semaine | 📌 | Synthèse vocale déjà utilisée pour l'appel ; faisable. |
| 170 | Modèles de projets (lancement, levée de fonds…) | ✅ | Modèles d'entreprise et feuille de route. |
| 171 | Agendas partagés | ⏸ | Google Agenda attend le projet Google de Beau. |
| 172 | Badges pour les utilisateurs actifs | ✗ | Pas retenu. |
| 173 | Passerelle vers le no-code | ✗ | Pas maintenant. |
| 174 | Livre blanc annuel | 🔧 | Un agent peut l'écrire. |
| 175 | Rétrospective de fin de sprint | 📌 | Réunion récurrente à proposer. |

## Le futur (176 à 200)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 176 | Économie de marché simulée avec des concurrents virtuels | ✗ | Donnerait des chiffres inventés. |
| 177 | Les agents voient les maquettes et critiquent le design | ✅ | Les photos envoyées sont décrites aux agents avant qu'ils répondent. |
| 178 | Réflexion approfondie la nuit | ✅ | Le travail de fond tourne la nuit et le matin (plans, livrables). |
| 179 | Musique d'ambiance générée | ✗ | Pas retenu. |
| 180 | Organigramme en réalité augmentée | ✗ | Pas retenu. |
| 181 | Agents qui jouent des investisseurs | 📌 | Réunion « comité d'investissement ». |
| 182 | Journal secret du directeur général | ✗ | Pas retenu : rien de caché au fondateur. |
| 183 | Fusion des meilleures consignes | 🔧 | Compétences combinées par agent ; pas d'« évolution génétique ». |
| 184 | Scénarios de crise | 📌 | Réunion sur scénario. |
| 185 | Rédaction de brevets | 🔧 | Faisable par un agent juriste ; relu par un avocat. |
| 186 | Impact social des décisions | 🔧 | En réunion, sur demande. |
| 187 | Réunions à l'oral avec des voix réalistes | 🔧 | Appel vocal avec UN agent (voix du téléphone). Pas encore de réunion à plusieurs voix. |
| 188 | Musée des versions | ✗ | Pas retenu. |
| 189 | Analyse du ton de voix de l'utilisateur | ✗ | Pas retenu : intrusif. |
| 190 | « Et si on avait fait autrement il y a 3 mois ? » | 📌 | Réunion sur les plans passés : faisable. |
| 191 | Bourses pour former les agents juniors | ✗ | Pas retenu. |
| 192 | Humour réglable | ✅ | Par la personnalité. |
| 193 | Mascotte animée | 🔧 | Finou existe côté Finjaro. |
| 194 | Fusions-acquisitions simulées | ✗ | Pas retenu. |
| 195 | Subventions et partenariats à saisir | ✅ | Recherche web avec sources, par un agent. |
| 196 | Cerveau collectif : une seule réponse de tous | ✅ | Le compte rendu de réunion rassemble les avis en une décision. |
| 197 | Hymne d'entreprise | ✗ | Pas retenu. |
| 198 | Les agents améliorent le code de Legion lui-même | ⏸ | Studio de code sur le dépôt de Finjaro, jeton en écriture ; toujours validé par un humain. |
| 199 | Évolution sur 10 ans en accéléré | ✗ | Chiffres inventés. |
| 200 | Mode « Singularité » : 100 % autonome | ✗ | Pas retenu : Legion garde l'humain aux commandes (« Confirmer », « Valider »). C'est aussi ce que la loi européenne sur l'IA demande pour les décisions qui comptent. |

## Les 20 fonctionnalités de place de marché listées par Gemini — Finjaro les a-t-il ?

Vérifié dans le code de Finjaro le 23/09 au soir.

| # | Fonctionnalité | Finjaro | Ce qui existe, ce qui manque |
| --- | --- | --- | --- |
| 1 | Comptes et profils (clients, vendeuses, prestataires, administrateurs), rôles | ✅ | Connexion e-mail, Google et Apple ; devenir vendeuse ; prestataires ; console d'administration. |
| 2 | Catalogue avec recherche, filtres, tris, suggestions | 🔧 | Recherche (articles, boutiques, métiers), catégories, boutiques près de chez soi. Manque : filtres de prix et tris dans une catégorie. |
| 3 | Commande en quelques clics, plusieurs paniers | ✅ | Un panier pour plusieurs boutiques, qui devient une commande par boutique (chacune livre de son côté). |
| 4 | Paiement intégré (carte, portefeuille, partage des commissions) | 🔧 | Paiement à la livraison, avec le montant dans la monnaie de l'acheteur. Le paiement par carte est écrit mais masqué depuis le 01/08 (décision de Beau). ⏸ Mobile Money : Beau, « pas maintenant ». Pas de portefeuille ni de partage automatique des commissions. |
| 5 | Messagerie en direct acheteur ↔ vendeuse | ✅ | Discussion par boutique, messages directs, modération ; pour une boutique Premium, une réponse automatique (marquée comme telle) quand la vendeuse tarde. |
| 6 | Tableau de bord des vendeuses (ventes, stock, chiffre, classement) | ✅ | Tableau de bord, statistiques, finances, classement des vendeuses. |
| 7 | Réservation de services avec calendrier et créneaux | 🔧 | Les rendez-vous existent dans Finjaro Accounting, avec un lien depuis le tableau de bord de la vendeuse. Pas encore de prise de rendez-vous par l'acheteur sur la place de marché. |
| 8 | Avis, notes, réputation, modération automatique | ✅ | Avis et étoiles, badge vérifié, modération automatique des contenus et des discussions. |
| 9 | Suivi de livraison en temps réel sur une carte | 🔧 | Statuts de commande, preuve de livraison, « J'ai bien reçu » ; carte des boutiques proches. Pas de suivi du livreur en direct. |
| 10 | Codes promo, réductions, cartes cadeaux, fidélité | 🔧 | Prix barré et pourcentage de réduction (seulement une vraie baisse). Pas de code promo, de carte cadeau ni de fidélité. |
| 11 | Parrainage | ✅ | Lien d'invitation ; le parrainage tient aussi quand on s'inscrit avec Google ou Apple (corrigé). |
| 12 | Abonnements récurrents (premium) | 🔧 | Premium des boutiques, activé à la main par Beau après paiement ; pas de prélèvement automatique tant que Mobile Money n'est pas branché. |
| 13 | Centre d'aide (FAQ, assistant 24 h/24) | ✅ | Page d'aide avec FAQ, support dans la console, Finou (l'assistante) à toute heure. |
| 14 | Litiges, remboursements, réclamations | 🔧 | Signaler un article, une boutique, une vidéo, un commentaire ou une personne ; annulation avec sa raison ; commandes sans réponse annulées seules après dix jours (stock rendu). Pas de circuit de litige ni de remboursement (le paiement se fait à la livraison). |
| 15 | Notifications push | ✅ | Sur le web et dans les applications Android et iOS. |
| 16 | Plusieurs langues et monnaies selon le lieu | 🔧 | Français et anglais ; prix dans la monnaie de chacun. À corriger : le Canada voit des dollars américains au lieu de canadiens, et les taux sont fixes dans le code (celui du dollar est décalé d'environ 5 %). Proposition faite à Beau : un taux par jour. |
| 17 | Tableaux de bord des administrateurs | ✅ | Console Finjaro : commandes, boutiques, personnes, modération, relances, veille. |
| 18 | Publication de contenus (blog, actualités) | 🔧 | Vidéos courtes, stories, annonces et bandeau depuis la console. Pas de blog. |
| 19 | Partage sur les réseaux, liens d'affiliation | 🔧 | Partage d'une boutique, d'une vidéo, d'une invitation. Pas d'affiliation. |
| 20 | Documents (factures, reçus, conditions générales) | 🔧 | Conditions générales, confidentialité, suppression de compte. Pas de facture ni de reçu automatiques sur la place de marché (Accounting tient les livres de la vendeuse). |

**Le compte :** 9 faites, 11 en partie, aucune absente.
