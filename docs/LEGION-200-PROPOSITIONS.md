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

**Le compte :** 121 faites, 21 en partie, 5 à faire, 18 en attente de Beau, 35 écartées.

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
| 1 | Mémoire courte et longue, base vectorielle par agent | ✅ | Mémoire propre à chaque agent (0185, 24/09) : ses livrables, les leçons reçues quand un livrable est renvoyé, ce que le fondateur a aimé — chacun avec son vecteur. Avant de répondre ou de livrer, il retrouve les 3 plus proches (essayé : Nadia s'est servie de ses 2 livrables). Visible et effaçable sur sa fiche. |
| 2 | Réputation : les agents s'évaluent après chaque livrable | ✅ | Un collègue relit chaque livrable (24/09) et ne parle que pour le contester, avec la raison (essayé : Kwame a contesté l'inventaire d'Elodie, incomplet). Sur un livrable, « Faire relire par… » le demande à la main. Plus, sur le tableau de bord, la part des livrables que le fondateur a validés. |
| 3 | Auto-recrutement : un manager rédige la fiche et demande un agent | ✅ | Un responsable propose d'engager un agent (24/09) : il rédige la fiche (nom, poste, département, mission) et rien ne se fait sans « Confirmer » (essayé : Kwame a proposé une spécialiste conformité, créée après confirmation). |
| 4 | Personnalités simulées (optimiste, prudent, perfectionniste) | ✅ | Chaque agent a une personnalité écrite, modifiable sur sa fiche, et parle avec elle. |
| 5 | Réunions automatiques, transcription et synthèse des points d'équipe | ✅ | Réunions en direct (23/09) : deux tours, compte rendu avec décidé, écarté, désaccords, à trancher, et tâches créées. Pas encore de réunion lancée seule chaque matin. |
| 6 | Jeu de rôle conflictuel, un avocat du diable permanent | ✅ | Réunion au format « avocat du diable » (24/09) : un participant attitré conteste chaque proposition, les autres répondent. |
| 7 | Un agent s'auto-forme en lisant la documentation du projet | ✅ | Documents de l'entreprise (0179) et compétences : l'agent qui en a le droit lit les documents et cite sa source. |
| 8 | Badges de compétences, certifications internes | ✅ | Badges (24/09), chacun à un seuil mesuré écrit dans son infobulle : premier livrable, 10 livrables, 5 validés, sans correction (10 réponses relues, aucune corrigée), débloqueur, relais, assidu (5 jours de travail). |
| 9 | Humeur des agents selon la charge et les retours | ✗ | Pas retenu : une « humeur » inventée ne sert pas l'utilisateur et brouille ce qui est vrai. La charge réelle (tâches ouvertes par agent) est déjà visible au tableau. |
| 10 | Agents multilingues | ✅ | Ils répondent dans la langue du message, et en anglais toute la journée de travail si le fondateur lit l'anglais. |
| 11 | Rapport de fin de journée par le directeur général | ✅ | Rapport du soir (24/09) : chaque soir, le directeur écrit dans Direction ce qui a été fait, ce qui suit, ce qui attend le fondateur ; les chiffres viennent de la base, pas du modèle. Aussi à la demande (bouton dans Direction). |
| 12 | Déléguer une tâche à un autre département | ✅ | Relais : une tâche passe d'un agent à l'autre avec le livrable du premier. |
| 13 | Alerte proactive en cas d'incohérence | ✅ | Chaque soir (24/09), des alertes calculées dans la base : tâche bloquée, livrable en attente depuis 2 jours, tâche immobile depuis 7 jours, plafond à 80 %, intérim qui finit, agent silencieux avec du travail ; et « à vérifier » quand deux faits du jour se contredisent. |
| 14 | Journal des choix : pourquoi l'agent a décidé ça | ✅ | Journal des choix sur la fiche de l'agent (24/09) : ses dernières prises de parole, et pour chacune ce qu'il a vérifié (outils), ses sources, ce que la relecture a corrigé et pourquoi, ce qu'elle a coûté. |
| 15 | Conscience éthique selon les règles de l'entreprise | ✅ | Règles de la maison relues avant chaque réponse ; « ce qu'il ne fait jamais » par agent (0177). |
| 16 | Négociation de budget entre départements | ✅ | Réunion au format « budget » (24/09) : chaque participant défend sa part, sur la dépense réelle et le plafond. Il n'existe pas de budget stocké par département : le vote conclut, le fondateur décide. |
| 17 | Un mentor pour les nouveaux agents | ✗ | Pas utile tel quel : un nouvel agent reçoit déjà le contexte complet (mémoire, plans, tâches). |
| 18 | Pauses café entre agents pour des idées inattendues | ✗ | Coûte de l'argent sans demande de l'utilisateur. Les réunions couvrent le besoin quand on le veut. |
| 19 | Agents qui simulent des utilisateurs pour tester l'application | 📌 | Utile pour le studio de code et pour Finjaro. Demande un navigateur de test côté serveur. |
| 20 | Vote à la majorité en comité de direction | ✅ | Réunion au format « vote » (24/09) : chacun vote pour, contre ou s'abstient ; c'est Legion qui compte, pas un agent, et le compte rendu rappelle que l'humain décide. |
| 21 | KPI par agent suivis dans un tableau RH | ✅ | Tableau de bord (24/09), par agent sur 7 ou 30 jours : prises de parole, livrables, tâches faites, ouvertes, bloquées, à valider, renvoyées, relectures et corrections — tout compté dans la base. |
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
| 36 | Une action GitHub déclenche une réunion | ✅ | Option du connecteur GitHub (0188, 24/09) : chaque heure, un ticket NOUVEAU sur le dépôt ouvre une réunion (gravité, qui le prend, que répond-on), au nom du président de séance (essayé : le ticket #16 du dépôt de Finjaro a ouvert une réunion dans l'entreprise de test). |
| 37 | Tests unitaires écrits par un agent qualité | ⏸ | Studio de code. |
| 38 | Audit hebdomadaire de la dette technique | ✅ | Mission « Audit de la dette technique » (24/09), chaque semaine, sur le dépôt branché : les trois dettes qui coûtent le plus et leur correction. |
| 39 | Secrets et clés rangés à part, par entreprise | ✅ | Le jeton GitHub de chaque entreprise est au coffre (vault), jamais relu par l'application. |
| 40 | Architecture en graphe 3D | ✗ | Pas prioritaire : joli, mais n'aide pas à décider. |
| 41 | Importer un agent depuis GitHub | ✅ | Importer un agent (24/09) depuis un fichier ou son lien (un dépôt GitHub) : sa fiche, et ses compétences reprises à leur source, licence vérifiée. |
| 42 | Consommation par agent et par dépôt | ✅ | Chaque message d'agent porte ce qu'il a coûté (24/09) ; le tableau de bord montre le coût du mois de chaque agent. Une entreprise n'a qu'un dépôt : son coût est celui de l'entreprise. |
| 43 | Changelog automatique pour les utilisateurs | ✅ | Mission « Nouveautés de la semaine pour les utilisateurs » (24/09), écrite à partir des changements du dépôt branché, rien d'inventé. |
| 44 | Annuler d'un coup la modification d'un agent | ⏸ | Studio de code (Git le permet). |
| 45 | Dépendances obsolètes et mises à jour sûres | ⏸ | Studio de code. |
| 46 | Environnement de test éphémère par fonctionnalité | ⏸ | Studio de code (aperçu par branche). |
| 47 | Brancher Jira ou Linear | 🔧 | Jira et Linear branchables (0188, 24/09), en lecture seule, jeton au coffre : les agents voient les tickets ouverts. Jira essayé sur le Jira public d'Atlassian (les agents citent les vrais tickets). Linear construit mais pas essayé : il faut une vraie clé Linear. |
| 48 | Signature des contributions des agents | 🔧 | Chaque message et livrable garde son auteur, le modèle utilisé et l'heure. Pas de signature cryptographique. |
| 49 | Taille du contexte adaptée à la tâche | ✅ | Les questions simples partent sur un modèle rapide, les questions de fond sur un modèle plus fort, avec plus de contexte. |
| 50 | Sauvegarde sur stockage décentralisé | ✗ | La base est déjà sauvegardée par Supabase. Aucun besoin exprimé. |

## Interface et expérience (51 à 75)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 51 | Organigramme vivant animé | ✅ | L'organigramme vivant (24/09) : l'entreprise, ses départements, le responsable puis l'équipe ; l'agent qui a écrit dans les dix dernières minutes est cerclé d'or avec un point qui clignote. |
| 52 | Bureau virtuel isométrique avec les avatars au travail | ✅ | Le bureau (24/09) : une pièce par département, chaque agent à son poste avec ce qu'il fait (sa tâche en cours, « écrit en ce moment », ou « en veille ») — tout vient de ce qu'ils font vraiment. |
| 53 | Avatars personnalisés (IA, photo, manga, corporate) | ✅ | Chaque agent choisit son visage ou son bitmoji ; on peut aussi le changer. |
| 54 | Salle de contrôle : vue d'ensemble ↔ un seul agent | ✅ | Accueil = vue d'ensemble (santé, charge, carte d'activité, chaque agent) ; toucher un agent ouvre sa fiche, avec son journal des choix (24/09). |
| 55 | Notifications des agents | ✅ | Le téléphone sonne quand un agent pose une question, propose, décide, ouvre une réunion, ou donne une tâche à un humain. |
| 56 | Tableau des coûts en temps réel | ✅ | Dépense du mois et plafond, par entreprise. |
| 57 | Mode sombre et thèmes | ✅ | Legion a son thème bleu nuit et or. |
| 58 | Commandes rapides (/) pour appeler un agent | ✅ | Commandes « / » dans la case d'écriture (24/09) : /reunion, /rapport, /tache, /appeler, /regle — la liste s'ouvre en tapant « / ». |
| 59 | Frise pour revoir l'état à une date donnée | ✅ | La frise (24/09) : les 30 derniers jours ; toucher un jour montre ses décisions, livrables, réunions, rapports, questions, et l'état du tableau ce soir-là (tâches créées, terminées, ouvertes). |
| 60 | Carte de chaleur de l'activité par département | ✅ | Carte d'activité par département sur 14 jours (24/09) : une case par jour, plus foncée quand les agents ont plus parlé. |
| 61 | Cartes de visite des agents | ✅ | La fiche de l'agent (visage, poste, mandat, personnalité, ce qu'il reçoit). |
| 62 | Mode « présentation investisseur » | ✅ | La présentation (24/09) : des diapositives faites de ce qui est dans Legion (projet, équipe, plan, feuille de route, ce qui est mesuré, décisions), plein écran, et PDF à imprimer. Aucun chiffre financier inventé. |
| 63 | Dicter ses ordres à la voix | ✅ | Vocaux transcrits, et appel vocal d'un agent (23/09). |
| 64 | Interface traduite | ✅ | Français et anglais ; d'autres langues à ajouter. |
| 65 | Raccourcis clavier | ✅ | Raccourcis clavier (24/09) : Alt+1…5 pour les onglets, Ctrl/⌘+K pour chercher, « / » pour écrire, B le bureau, I les idées, « ? » l'aide, Échap pour fermer. |
| 66 | Jauge de santé du projet | ✅ | Santé de l'équipe (24/09) : chaque agent en forme, à surveiller ou en difficulté selon une règle écrite et affichée (« comment c'est calculé ») : silence avec du travail, blocages, livrables qui attendent, tâches immobiles, renvois, corrections, budget. |
| 67 | Mode focus : cacher les agents inactifs | ✅ | Le bouton « Allumés » de la liste des agents cache ceux qui sont éteints (il existait déjà ; la ligne disait le contraire, corrigée le 24/09). |
| 68 | Galerie des avatars filtrable par rôle | ✅ | Galerie (24/09) : les portraits en grand, filtrés par département ; la recherche filtre par nom, poste et département. |
| 69 | Exporter l'organigramme en PDF ou image | ✅ | L'organigramme s'exporte en PNG, en SVG et en PDF (24/09). |
| 70 | Mini-jeu pour « motiver » les agents | ✗ | Pas retenu : ne sert pas le travail. |
| 71 | Trophées aux grandes étapes | ✅ | Trophées (24/09) : les étapes de la feuille de route que le fondateur a cochées, avec leur date. Rien n'est décerné par un modèle. |
| 72 | Conférence de presse simulée | ✅ | Réunion au format « conférence de presse » (24/09) : des journalistes posent les questions difficiles, l'entreprise répond. |
| 73 | Charge globale de l'entreprise | ✅ | Charge (24/09) : tâches ouvertes de l'entreprise, par agent allumé, et la barre de charge de chaque agent. |
| 74 | Ton des agents (formel, décontracté…) | ✅ | Par la personnalité de chaque agent. |
| 75 | Météo et ambiance sonore | ✗ | Pas retenu. |

## Métier, conseil et marketing (76 à 100)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 76 | Étude de marché et veille concurrentielle en continu | ✅ | Recherche sur Internet avec sources, pour les tâches qui regardent dehors ; experts « Étude de marché » à la mission. |
| 77 | Campagnes publicitaires complètes (textes, visuels, ciblage) | ✅ | Mission « Campagne publicitaire complète » (24/09) : objectif, public, accroches, textes par réseau, budget, mesure — et pour les visuels un brief, jamais une image prise sur Internet (règle de la maison). |
| 78 | Entretiens simulés avec des clients (personas) | ✅ | Réunion au format « clients » (24/09) : les participants jouent des clients (personas) et disent ce qui les ferait acheter ou partir. |
| 79 | Rentabilité et modèle financier | ✅ | Excel rendu avec formules (marge, taux, totaux) ; avec Accounting branché, sur les vrais chiffres (0180). |
| 80 | Business plan mis à jour quand une variable change | ✅ | Mission « Business plan mis à jour », chaque mois (24/09), sur les chiffres mesurés branchés ; chaque chiffre dit d'où il vient. |
| 81 | Charte graphique et kit marketing | ✅ | Mission « Charte graphique et kit marketing » (24/09) : ton, mots, couleurs et typographies avec leurs codes, présentation, fiche presse ; pour les images, un brief. |
| 82 | Retours utilisateurs → propositions produit | ✅ | Mission « Retours des utilisateurs → propositions », chaque semaine (24/09) : regroupés par thème avec leur fréquence réelle, trois propositions produit. |
| 83 | Prix testés sur des marchés simulés | ✗ | Un marché simulé donnerait des chiffres inventés. Mieux : « prix conseillé » à partir des vrais prix (déjà fait sur Finjaro, idée 59). |
| 84 | Contrats et conditions générales par des agents juristes | ✅ | Mission « Conditions générales / contrat type » (24/09) : un PROJET en langage clair et la liste de ce qu'un avocat doit vérifier avant tout usage. |
| 85 | Plan de communication de crise | ✅ | Mission « Plan de communication de crise » (24/09) : cinq crises probables, qui parle, premier message, canaux, qui prévenir dans l'heure. |
| 86 | Publications réseaux sociaux programmées | 🔧 | Le calendrier des publications est préparé chaque vendredi (tâche récurrente). ⏸ Publier soi-même attend les comptes et l'accord de Beau. |
| 87 | Analyse des tunnels de conversion | ✅ | Avec « Mesures Finjaro » (équipe Finjaro) ou la boutique branchée : vues, paniers, commandes. |
| 88 | Séminaires de cohésion des agents | ✗ | Pas retenu. |
| 89 | Lettre d'information hebdomadaire | ✅ | Mission « Lettre d'information de la semaine » (24/09) : un brouillon chaque semaine. ⏸ L'envoi attend une boîte mail branchée : rien ne part sans le fondateur. |
| 90 | Empreinte carbone des serveurs | ✗ | Pas de chiffre mesurable fiable aujourd'hui (règle : aucun chiffre inventé). |
| 91 | Personas détaillés sur données réelles | ✅ | Mission « Personas sur données réelles » (24/09) : chaque trait dit sur quoi il repose, le supposé est marqué comme tel. |
| 92 | Audit SEO et mots-clés | ✅ | Mission « Audit SEO et mots-clés », chaque mois (24/09), avec la recherche sur Internet et ses sources ; aucun volume de recherche inventé. |
| 93 | Négociations commerciales simulées | ✅ | Réunion au format « négociation » (24/09) : un agent joue le partenaire en face. |
| 94 | Supports de formation pour les futurs employés | ✅ | Un agent peut les écrire à partir des documents de l'entreprise. |
| 95 | Tendances technologiques mondiales | ✅ | Recherche web avec sources. |
| 96 | Matrice des risques mise à jour | ✅ | Mission « Matrice des risques », chaque mois (24/09) : probabilité, impact, ce qui a changé, parade et responsable (essayé : la tâche revient seule, une seule fois par période). |
| 97 | Parrainage et fidélisation | ✅ | Mission « Parrainage et fidélisation » (24/09) : mécanisme, gains, coût maximal, abus évités, mesure. Côté Finjaro, le parrainage existe déjà. |
| 98 | Analyse des avis sur les magasins d'applications | 📌 | Demande un connecteur vers les stores. |
| 99 | Gamification de l'application | ✅ | Mission « Gamification du produit » (24/09) : trois mécaniques liées à ce que l'utilisateur veut faire, sans manipulation ni fausse urgence. |
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
| 110 | Coupure d'urgence globale ou par département | ✅ | Interrupteur par département sur l'accueil (24/09), en plus de l'interrupteur général, de celui de chaque agent et du plafond du mois. |
| 111 | Provenance et licence du code importé | ✅ | Les compétences GitHub ne sont prises que sous licence libre vérifiée, avec leur source. |
| 112 | Sauvegarde des choix stratégiques | ✅ | Comptes rendus de réunion, plans et feuille de route gardés. |
| 113 | Pannes et cyberattaques simulées | ✗ | Pas maintenant. |
| 114 | Intégrité des modèles | 🔧 | Chaque réponse garde le nom du modèle utilisé. |
| 115 | Budget de calcul par agent | ✅ | Budget du mois par agent (24/09), réglé sur le tableau de bord : atteint, l'agent ne répond plus, ne livre plus et ne parle plus en réunion jusqu'au mois suivant (essayé : « Anaïs : budget du mois atteint »). |
| 116 | Traçabilité des sources | ✅ | Sources sous chaque message (Internet, documents). |
| 117 | Rotation des mots de passe et jetons | 🔧 | Jetons de connexion MCP révocables ; jeton GitHub effaçable. |
| 118 | Audit externe par un humain | ✅ | On invite un membre dans l'entreprise ; il voit les salons et le tableau. |
| 119 | Détection des boucles entre agents | ✅ | Une réunion a deux tours et 45 minutes au plus ; une réponse ne relance pas une chaîne d'agents sans fin. |
| 120 | Vote d'urgence pour remplacer un agent défaillant | ✅ | Pour un agent « en difficulté » au tableau de bord (24/09) : « Réunir l'équipe : faut-il le remplacer ? » ouvre une réunion au format vote ; le vote éclaire, le fondateur décide. |
| 121 | Chiffrement des mémoires au repos | 🔧 | Assuré par l'hébergeur de la base ; rien de plus. |
| 122 | Fuites de données dans les requêtes envoyées aux IA | ✅ | Les outils ne renvoient jamais d'e-mail, de téléphone ni d'adresse. |
| 123 | Normes ISO 27001 | ✗ | Pas maintenant. |
| 124 | Rapport de transparence mensuel | ✅ | Rapport de transparence (24/09), le 1er de chaque mois, sans modèle : ce que Legion a coûté par fonction, réponses relues et corrigées, actions proposées et confirmées, règles et documents ajoutés. |
| 125 | Validation éthique des grandes fonctionnalités | ✅ | Réunion au format « impact » (24/09) : effets sur les clients, l'équipe, la société, et ce qui pourrait mal tourner, avant une grande décision. Plus l'étude de l'intérim (LEGION-INTERIM-ETUDE.md). |

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
| 134 | Avatars compressés | ✅ | Les portraits (PNG d'environ 1,5 Mo) ont maintenant une miniature JPEG 256 px (essayé : 11 Ko), servie partout ; l'original reste pour la photo en grand. Les anciens portraits sont allégés à l'ouverture de l'entreprise, sans rien payer (24/09). |
| 135 | Indexation instantanée des documents | ✅ | Documents découpés et indexés par le sens à l'ajout (0179). |
| 136 | Surveillance mémoire et processeur | ✗ | Géré par l'hébergeur. |
| 137 | Listes virtualisées pour des milliers d'agents | 🔧 | La liste et la galerie des agents se dessinent 60 par 60 au fil du défilement (24/09) : des milliers d'agents ne chargent plus tout d'un coup. Ce n'est pas encore une vraie liste virtualisée (les lignes déjà dessinées restent). |
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
| 152 | Exporter un agent en fichier | ✅ | Exporter un agent en fichier (24/09) : sa fiche et la liste de ses compétences (pas de donnée personnelle : c'est une fiche de poste). |
| 153 | Plusieurs humains dirigent la même entreprise | ✅ | On invite des membres ; chacun parle aux agents. |
| 154 | Commenter le travail des agents | ✅ | Commentaires sur une tâche du tableau. |
| 155 | Agents dans de vraies visioconférences | ✗ | Pas maintenant ; l'appel vocal d'un agent existe. |
| 156 | API ouverte pour piloter les agents | ✅ | Serveur MCP : Claude, ChatGPT, Claude Code… lisent et écrivent dans les salons avec les droits de la personne. |
| 157 | Publier les réussites sur LinkedIn | ⏸ | Attend les comptes et l'accord de Beau ; rien n'est publié en son nom sans lui. |
| 158 | Parrainage avec crédits de calcul | 📌 | À décider avec le prix des formules (Beau : plus tard). |
| 159 | Forum communautaire | ✗ | Pas maintenant. |
| 160 | Hackathons entre départements | ✗ | Pas retenu. |
| 161 | Flux RSS et veille partagée | ✅ | Veille RSS (0188, 24/09) : chaque heure, les articles jamais vus des flux branchés (RSS ou Atom) sont déposés en une liste avec leurs liens, sans modèle (essayé avec Le Monde et The Verge). |
| 162 | Experts invités pour une mission | ✅ | « Un expert pour une mission », avec date de fin (23/09). |
| 163 | Vote communautaire sur les compétences | ✗ | Pas maintenant. |
| 164 | Adaptation culturelle par marché | 🔧 | Langue de l'utilisateur ; pas de pays par défaut. |
| 165 | Wiki interne tenu par les agents | 🔧 | Documents de l'entreprise + mémoire. Pas de wiki écrit par les agents. |
| 166 | Tableau blanc collaboratif | ✅ | Le tableau d'idées (0187, 24/09) : des notes de couleur que les membres posent et votent, en temps réel ; une idée devient une tâche ou part à l'équipe en un geste. |
| 167 | Historique des décisions consultable | ✅ | Comptes rendus (genre « décision ») dans les salons. |
| 168 | Encourager un agent | ✅ | « Encourager » sur la fiche de l'agent (24/09) : ce que le fondateur a aimé entre dans SA mémoire, et il le retrouve quand on lui demande quelque chose de proche. Les réactions emoji restent. |
| 169 | Podcast de la semaine | ✅ | Le vendredi (24/09), le rapport du soir couvre la semaine ; un bouton « Écouter » le lit avec la voix du téléphone (rien ne part au serveur). |
| 170 | Modèles de projets (lancement, levée de fonds…) | ✅ | Modèles d'entreprise et feuille de route. |
| 171 | Agendas partagés | ⏸ | Google Agenda attend le projet Google de Beau. |
| 172 | Badges pour les utilisateurs actifs | ✗ | Pas retenu. |
| 173 | Passerelle vers le no-code | ✗ | Pas maintenant. |
| 174 | Livre blanc annuel | ✅ | Mission « Livre blanc annuel », chaque année (24/09), sur les chiffres mesurés de l'année avec leur source. |
| 175 | Rétrospective de fin de sprint | ✅ | Réunion au format « rétrospective » (24/09) : relit les tâches des sept derniers jours — ce qui a marché, ce qui a coincé, ce qu'on change. |

## Le futur (176 à 200)

| # | L'idée | État | Dans Legion aujourd'hui |
| --- | --- | --- | --- |
| 176 | Économie de marché simulée avec des concurrents virtuels | ✗ | Donnerait des chiffres inventés. |
| 177 | Les agents voient les maquettes et critiquent le design | ✅ | Les photos envoyées sont décrites aux agents avant qu'ils répondent. |
| 178 | Réflexion approfondie la nuit | ✅ | Le travail de fond tourne la nuit et le matin (plans, livrables). |
| 179 | Musique d'ambiance générée | ✗ | Pas retenu. |
| 180 | Organigramme en réalité augmentée | ✗ | Pas retenu. |
| 181 | Agents qui jouent des investisseurs | ✅ | Réunion au format « investisseurs » (24/09) : les participants jouent un comité d'investissement. |
| 182 | Journal secret du directeur général | ✗ | Pas retenu : rien de caché au fondateur. |
| 183 | Fusion des meilleures consignes | ✅ | Emprunter les compétences d'un collègue (24/09) : ses fiches d'experts sont reprises à leur source pour un autre agent. Pas d'« évolution génétique » automatique : c'est le fondateur qui choisit. |
| 184 | Scénarios de crise | ✅ | Réunion au format « crise » (24/09) : un scénario de crise, et qui fait quoi dans l'heure. |
| 185 | Rédaction de brevets | ✅ | Mission « Projet de brevet » (24/09) : problème, solution, nouveauté, revendications, art antérieur à vérifier — relu par un conseil en propriété industrielle avant tout dépôt. |
| 186 | Impact social des décisions | ✅ | Réunion au format « impact » (24/09). |
| 187 | Réunions à l'oral avec des voix réalistes | ✅ | « Écouter la réunion » (24/09) : chaque agent a sa voix (celles du téléphone, dans la langue de l'entreprise) ; pas de voix de synthèse payante. |
| 188 | Musée des versions | ✗ | Pas retenu. |
| 189 | Analyse du ton de voix de l'utilisateur | ✗ | Pas retenu : intrusif. |
| 190 | « Et si on avait fait autrement il y a 3 mois ? » | ✅ | Réunion au format « et si » (24/09) : relit les plans et décisions passés et imagine l'autre chemin. |
| 191 | Bourses pour former les agents juniors | ✗ | Pas retenu. |
| 192 | Humour réglable | ✅ | Par la personnalité. |
| 193 | Mascotte animée | ✅ | Le veilleur (24/09) : une chouette en laiton et terracotta, dessinée en code (aucune image du web), qui cligne des yeux dans les écrans vides de Legion. |
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
| 16 | Plusieurs langues et monnaies selon le lieu | ✅ | Français et anglais ; prix dans la monnaie de chacun (165 monnaies), au taux du jour mis à jour chaque nuit ; le Canada voit des dollars canadiens ; le prix saisi par la vendeuse est gardé dans sa monnaie (23/09, en ligne). |
| 17 | Tableaux de bord des administrateurs | ✅ | Console Finjaro : commandes, boutiques, personnes, modération, relances, veille. |
| 18 | Publication de contenus (blog, actualités) | 🔧 | Vidéos courtes, stories, annonces et bandeau depuis la console. Pas de blog. |
| 19 | Partage sur les réseaux, liens d'affiliation | 🔧 | Partage d'une boutique, d'une vidéo, d'une invitation. Pas d'affiliation. |
| 20 | Documents (factures, reçus, conditions générales) | 🔧 | Conditions générales, confidentialité, suppression de compte. Pas de facture ni de reçu automatiques sur la place de marché (Accounting tient les livres de la vendeuse). |

**Le compte :** 10 faites, 10 en partie, aucune absente.
