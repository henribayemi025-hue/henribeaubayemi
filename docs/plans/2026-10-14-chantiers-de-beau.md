# Chantiers demandés par Beau le 14/10 — qui fait quoi

Beau (14/10) : « divise le travail, fais-en un maximum chaque jour sans griller ta limite, je veux te voir
bosser ». Une ligne par chantier : où on en est, ce qui suit, qui le fait, comment on saura que ça marche.
Détail des demandes : `docs/A-FAIRE.md`, lignes du 14/10 13h00 à 13h40.

| # | Chantier | État au 14/10 | Suite | Qui | On saura que ça marche quand… |
|---|---|---|---|---|---|
| 1 | **Mot de passe oublié (Accounting)** | Branche prête (`claudinette/mot-de-passe-oublie`), vérifiée à la lecture. **Fusion vers `main` refusée par le système de sécurité** (authentification, sans explication). | Accord clair de Beau + permission côté outil → fusion → essai réel en production → retrait du cache `?essai=mdp`. | Claude | une personne qui perd son mot de passe se reconnecte seule |
| 2 | **Inviter quelqu'un (Accounting)** | ✅ En ligne : le message dit la vérité (aucun e-mail ne part tout seul), boutons WhatsApp / e-mail / copie, bouton « Inviter » visible dans la Discussion. | **E-mail automatique** avec lien (fonction `finia-invitation`, Resend, sans toucher à l'authentification ni au Site URL). | Claudinette | une invitation envoyée passe de « Pas encore connecté » à « Actif » |
| 3 | **Discussion façon Google Chat (Accounting)** | Existe : canaux, projets, @assistant, photos. Manquent : discussions 1:1 et de groupe, fils, réactions, appels. ⚠️ **Contredit la décision du 13/10** (Accounting = stock et finances, « chat simple, ne rien ajouter ») : Beau tranche. | Jalon 1 : « Nouvelle discussion » avec un membre + groupe ; appel par lien de réunion. Jalon 2 : fils, réactions, @mentions, accusés de lecture. Jalon 3 : tâches assignées, recherche, épingler, historique. | Claudinette, design Alpha | deux personnes s'écrivent et s'appellent depuis l'écran, sans quitter Accounting |
| 4 | **Léo : accueil allégé** | ✅ Staging : neuf blocs repliés, trois chiffres, plus de paragraphes ; « Tâches ouvertes » au lieu du cumul. | À mettre en ligne sur finjaro.net après le coup d'œil de Beau. | Claude | l'accueil tient en deux écrans, on trouve un outil sans descendre |
| 5 | **Léo : colonne de gauche** | ✅ Staging : un seul visage par département (le responsable), plus de mosaïque. | idem | Claude | — |
| 6 | **Léo : appel vocal conversationnel, Jarvis** | Spécification confiée à Forge (tâche difficile). Aujourd'hui : on touche le micro à chaque phrase. | Étape 1 gratuite : l'agent dit bonjour, écoute en continu, se laisse interrompre. Voix Manon seulement quand Beau décide d'une dépense. Jarvis par claquement de mains : possible tant que l'onglet est ouvert ; « externe » = application installée. | Forge puis Claude | on parle à l'agent sans appuyer entre les phrases |
| 7 | **Espaces de travail façon « atelier de code »** | Noté. | Page de travail en trois zones (liste, espace du sujet au milieu, discussion à droite, fixe) pour Learn et les agents ; la discussion ne grossit plus. | Ada (spécification), Claude | la discussion garde la même hauteur au 50e message |
| 8 | **Réseau d'agents qui se parlent** | Plan « Place des agents » déjà confié à Orchestre (13/10). | Deux niveaux : (a) entre nos agents, déjà possible dans les salons ; (b) réseau extérieur, volontaire, rien de privé n'en sort. **Attend l'accord de Beau** (oui/non). | Orchestre, Vigie | — |
| 9 | **Site web Finjaro (vitrine du groupe)** | Plan du site confié à Plume. | Variantes de structure → textes courts FR/EN → l'Atelier construit. Images : Beau ou les vendeuses, jamais le web. | Plume, puis Atelier | une personne comprend en dix secondes ce que fait Finjaro |
| 10 | **Learn : étoiles, voix, anglais** | ✅ Étoiles corrigées (Markdown mis en forme, la voix ne lit plus les signes). **Anglais** : exercice « Prompt engineering » exige encore des libellés français : confié à Ada. | Voir 11. | Claude, Ada | aucune étoile, aucun mot français en mode anglais |
| 11 | **Learn : parcours complet** | Structure confiée à Ada (tâche difficile) ; modules SQL, R, C++, Power BI confiés à Mentor. | Leçon = explication + exemple + exercices ; fin de module = 3 exercices (facile, moyen, difficile) + projet validé par l'IA ; où en suis-je et où dire « terminé » ; quiz cliquables. | Ada, Mentor, Claude | une personne finit un module et voit son projet validé |

## Ce que j'ai mesuré en cherchant
- Léo, base de production : **947** tâches en tout ; **610 en revue** (livrables d'agents en attente de relecture), 262 terminées, 34 en cours, 27 à faire, 14 faites. L'écran en montrait 143. Le vrai problème n'est donc pas 143 : c'est **610 livrables jamais relus**. Proposition : trier les plus anciens (garder / clore) et ne plus créer de tâche sans relecture prévue. Rien n'est supprimé sans l'accord de Beau.
- Accounting : l'invitation n'écrivait **qu'une ligne en base**, sans aucun message à la personne ; le texte affiché laissait croire le contraire.

## Règles tenues
Relecture de chaque livrable d'agent avant d'en parler à Beau (CLAUDE.md §10). Pas de dépense, pas d'authentification, pas de suppression sans lui (§12). Un changement visuel est vérifié à 1920 px et à 390 px (§6).
