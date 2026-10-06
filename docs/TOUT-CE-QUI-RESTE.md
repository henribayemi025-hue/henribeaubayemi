# Tout ce qui reste — l'inventaire de toutes nos listes

Demandé par Beau le 06/10 : « n'oublie pas les listes et les plans que tu avais
faits ; depuis là, on n'a jamais tout fait, profite pour faire ça ».

Ce fichier rassemble TOUTES les listes en une seule, vérifiées dans le code le
06/10 (et non recopiées de mémoire). Il remplace la lecture des quinze autres
pour savoir où on en est ; les autres restent comme archives.

Sources relues : `A-FAIRE.md` (carnet, 211 lignes avec un point ouvert),
`plans/2026-09-25-releve-et-plan.md`, `FEUILLE-DE-ROUTE-OCT-DEC.md`,
`LEGION-200-PROPOSITIONS.md`, `IDEES-LEGION-23-09.md`, `PLAN-COMPLET.md`,
`en-attente/` et `correctifs-en-attente/` (correctifs écrits jamais mis en
ligne), les remises de côté de Git (« stash »), et les quatre grandes listes
d'idées (`plans/2026-09-25-*`).

Signes : ✅ fait · 🔧 en cours · ⬜ à faire · ⏳ attend Beau · ✗ écarté (avec raison).

---

## 1. Fait le 06/10 (reprise des listes)

| Point | D'où il venait | Ce qui a changé |
| --- | --- | --- |
| ✅ Finia parle aux vendeuses dans la monnaie de LEUR boutique | relevé 25/09, F1 | Avant : « prix en FCFA » ; une vendeuse à Londres qui disait 25 £ créait un article à 25 FCFA. Prix, articles, commandes reçues et ventes sont maintenant dans la monnaie de la boutique (179abfd) |
| ✅ La raison d'un « rien rendu » sur la fiche de l'agent | carnet 28/09 (B9) et 25/09 (idée d'Orchestre) | « Dernier passage » en tête du journal des choix : livré, ou pourquoi pas (budget, aucune IA, tâche déjà prise…) (974aa13, migration 0235) |
| ✅ Message clair quand TOUTES les IA sont à sec | carnet 26/09 | L'erreur ne pointe plus seulement Google (974aa13) |
| ✅ Fiches plus rapides à l'ouverture | carnet 05/10 (LCP « Poor ») | Les écrans ne se préchargent plus pendant que la grande photo arrive (a095c25) |
| ✅ Tâches citées lues par l'agent | en attente depuis le 02/10 | Rigo renvoyait 15 livrables sans pouvoir les lire (0e64cd2) |
| ✅ Outils des agents par le moteur de secours | en attente depuis le 03/10 | Paramètres relus, plus de recherches « sans requête » (0e64cd2) |
| ✅ Modèles d'image Google remplacés | en attente depuis le 05/10 | gemini-2.5-flash-image arrêté par Google le 02/10 (0e64cd2) |
| ✅ E-mails réessayés (send-push, M-21) | audit du 01/10 | Un lot refusé est réessayé 3 fois (0e64cd2) |
| ✅ Plusieurs dépôts GitHub par entreprise | en attente depuis le 02/10 | Ada → Finjaro Learn (da1cff5) |
| ✅ F3 « qui_a_fait » | relevé 25/09 | Vérifié : seule l'entreprise Finjaro y a accès, et seule l'équipe Finjaro peut le brancher. Rien à changer |
| ✅ Plafond d'agents au travail en même temps | carnet 25/09 | Déjà en place (tranches de 6, deux ou trois à la fois) |

## 2. À faire par moi — dans cet ordre

| # | Point | Source | Remarque |
| --- | --- | --- | --- |
| 1 | ✅ Atelier : panneau « Tâches en arrière-plan » (C8) | relevé 25/09, lot 4 | fc34ae1 |
| 2 | ✅ Atelier : les tâches de code des agents visibles dans l'atelier (C10) | relevé 25/09, lot 4 | fc34ae1 (statut, branche, demande de fusion) |
| 3 | ✅ Atelier : messages du Worker dans la langue du compte (C4) | relevé 25/09 | 330f05b |
| 4 | ✅ Appeler un agent : ça sonne, il décroche (« Allô ? »), mains libres, voix d'homme ou de femme propre à chaque agent (D3) | relevé 25/09, lot 4 | cebbac0 |
| 5 | ✅ Jarvis : réveil d'un signe de la main (D1), réglage « Geste » éteint par défaut, rien gardé ni envoyé | relevé 25/09 | 662abfc |
| 6 | ✅ Immeuble : vraie icône au lieu de 🏢 (A13) ; les raccourcis Hall / Réunion / Atelier existaient déjà dans le monde 3D | relevé 25/09 | 1847bfa |
| 7 | ✅ Une image créée dans un salon s'affiche en grand et entière (A16) | relevé 25/09 | 5bd… voir registre |
| 8 | ✅ L'import d'un agent garde ses compétences (F6) | relevé 25/09 | 008f664 |
| 9 | ✅ « Mon ordinateur » : réglage « Tout autoriser » (propriétaire, éteint par défaut ; payer, supprimer, mot de passe toujours demandés) | carnet 25/09 | 88b9faa |
| 10 | ⬜ Monde 3D — la vie des agents (se lever, marché, travail, sport, dormir) (E9) | relevé 25/09, lot 3.2 | |
| 11 | ⬜ Monde 3D — grande carte sans plantage (E10), conducteur visible, trottoir, passagère (E8) | lot 3.3-3.4 | |
| 12 | ⬜ Monde 3D — police (poursuite), basket, stade, arcade (E6, E11) | lot 3.5-3.6 | |
| 13 | ⬜ Monde 3D — monde de rêve, pays commun à toutes les entreprises (E12, E18) | lot 3.7-3.9 | |
| 14 | ✅ Salut humain : déjà en place (plusieurs agents répondent à un salut, en une ou deux phrases, par la voie rapide du 28/09) ; vérifié dans legion-repondre | carnet 26/09 | ne marche que quand une IA est disponible |
| 15 | ✅ Connecteurs : vérifié le 06/10 — GitHub (« Se connecter avec GitHub », plusieurs dépôts par entreprise), Supabase, Cloudflare et Vercel (lecture seule, 0208) existent par entreprise. Reste Gmail par personne : demande une application Google vérifiée (section 3) | relevé 25/09, carnet 26/09 | |
| 16 | 🔧 Les 15 éléments des 5 prototypes AI Studio (C13) : vérifié le 06/10, 10 sont faits (onglets, barre d'état, Ctrl+K, erreurs soulignées, demander sur une sélection, terminaux, tâches en arrière-plan, plusieurs agents, renfort, équipe). Recherche dans tout le projet faite le 06/10 (bouton, Ctrl+Maj+F, un clic ouvre la ligne). Avant / après côte à côte fait le 06/10 (l'aperçu montre la page actuelle et la page avec la proposition). Points de retour faits le 06/10 (5 au plus, retour d'un clic, annulable). Barre d'activité à gauche faite le 06/10 (ordinateur : fichiers repliables, recherche, modifications, points, journal, tâches, GitHub). Reste 1 : entretien d'embauche mesuré | relevé 25/09 | |
| 17 | ✅ Lettre de l'IA affichée dans Learn : déjà en place (numéros publiés dans Learn, importés sur staging) | carnet 02/10 | |
| 18 | ⬜ Les quatre grandes listes d'idées : les trier puis faire ce qui est retenu (section 4) | | avec les agents |

Chaque point fait est coché ici et noté au registre (`AMELIORATIONS.md`).

## 3. Attend Beau (une ligne chacun)

| Point | Ce qu'il faut |
| --- | --- |
| ⏳ Recharger une IA payante | dépense : les agents n'ont que ~100 appels gratuits par jour pour 41 |
| ⏳ Atelier gratuit / Premium | ouvre une dépense (jusqu'à 2 $ par jour pour le gratuit) ; correctif prêt (stash) |
| ⏳ Recompresser les 64 photos lourdes déjà en ligne | touche les photos de la production (copie de sauvegarde avant) |
| ⏳ Deux comptes de test (Learn, Rigo, Accounting par téléphone) | touche `auth.users`, commun |
| ⏳ Interrupteur « mots de passe compromis » de Supabase | console Supabase, authentification commune |
| ⏳ Vérifier le SMTP Resend dans Supabase | authentification commune |
| ⏳ Purge du cache Supabase pour 2 fichiers de conversation | demande au support |
| ⏳ Politique de confidentialité d'Accounting | nom légal et adresse (pas encore de société) |
| ⏳ Publier (TikTok, LinkedIn, Instagram, Facebook) | Beau publie ; aucun accès de publication ici |
| ⏳ Accord écrit des personnes des photos utilisées dans les pubs | droit à l'image |
| ⏳ Les deux clés Gemini viennent-elles du même compte Google ? | |
| ⏳ Prix face à « Caisse Boutique », reprise du catalogue dans Accounting | décisions |
| ⏳ Ouvrir Learn sur finjaro.net | décision (« on ne se presse pas », 01/10) |
| ⏳ Gmail branché par chaque personne dans Léo | une application Google vérifiée (console Google, écran de consentement, examen par Google) : démarche à son nom |

## 4. Les quatre grandes listes d'idées — jamais triées en entier

| Liste | Idées | État |
| --- | --- | --- |
| `plans/2026-09-25-atelier-300-propositions.md` | 300 | ⬜ à trier |
| `plans/2026-09-25-immeuble-300-claude.md` | 300 | ⬜ à trier |
| `plans/2026-09-25-gemini-plateforme-100.md` | 100 | ⬜ à trier |
| `plans/2026-09-25-agents-autonomes-100.md` | 100 | 🔧 18 cochées |
| `LEGION-200-PROPOSITIONS.md` | 200 | ✅ triée (150 faites, le reste écarté ou en attente, avec raison) |

Méthode (partage avec les agents, règle 10) : chaque liste est confiée à un
agent de Léo, qui classe chaque idée — déjà faite (avec l'endroit), à faire,
ou écartée (avec la raison). Je relis son classement contre le code, je
corrige ce qui est faux, puis je fais les « à faire » retenus, un lot par
jour, au registre.
