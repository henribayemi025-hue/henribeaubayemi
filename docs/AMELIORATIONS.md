# Améliorations quotidiennes — registre

Ordre de Beau (05/10/2026) : « les agents IA dans Léo doivent continuer avec
les différentes sessions et ton accord à améliorer automatiquement Finjaro,
Accounting, Léo, Learn, Athlo et My Finance — design, fonctionnalités,
technique — et finir leurs tâches. Chaque jour au moins 5 améliorations
réelles. Autonomes, sous ton contrôle : c'est toi qui acceptes ou modifies,
tu as la décision finale. »

## Règles du registre

- Une ligne par amélioration **réellement faite**, avec sa preuve (commit,
  test, capture, mesure avant/après). Une idée ou une tâche ouverte n'est pas
  une amélioration.
- « Réelle » veut dire qu'une personne la voit ou qu'une mesure change : un
  écran plus clair, un bouton qui marche, une page plus rapide, une erreur qui
  disparaît, une faille fermée.
- L'auteur est noté : Claude, un agent de Léo (relu par Claude), ou
  Claudinette (Accounting).
- Où elle en est : staging, en ligne, ou en attente du mot de Beau.

## Les six produits

| Produit | Où est le code | Qui le touche |
| --- | --- | --- |
| Finjaro (place de marché) | ce dépôt, branche staging | Claude, agents de Léo par branches leo/ |
| Finjaro Accounting | dépôt Automatisation-des-candidatures | Claudinette ; propositions par le canal direct |
| Léo | ce dépôt (src/screens/legion, supabase/functions/legion-*) | Claude, agents |
| Learn | dépôt Finjaro-learn, importé ici dans public/learn | Claude (import), session Learn |
| Mon argent (My Finance) | ce dépôt (src/screens/money) | Claude, agents |
| Athlo | dépôt non branché à cette session ; base en pause depuis le 01/10 | à décider avec Beau |

## Registre

| Date | Produit | Amélioration | Auteur | Preuve | État |
| --- | --- | --- | --- | --- | --- |
| 05/10 | Finjaro | Photos : vrai format vérifié avant l'envoi, plus d'AVIF déguisé en PNG de 2,5 Mo | Claude | 877b258, 3 tests | en ligne 05/10 |
| 05/10 | Léo | Outils « qui a fait / fiche personne » réservés à Finjaro (fuite vers les autres entreprises fermée) | Claude | 1528e25, code en ligne vérifié (legion-repondre v147) | en ligne |
| 05/10 | Léo | Coût des agents passés par OpenAI enfin compté : le plafond du mois les arrête de nouveau | Claude | 1528e25 | en ligne |
| 05/10 | Finjaro | Pays et ville approximative de chaque visite (Cloudflare /geo) | Claude | 9a71f81, 2 tests ; visite réelle sur finjaro.net enregistrée avec pays et ville | en ligne 05/10 |
| 05/10 | Learn | Lettre de l'IA n° 2 publiée et vérifiée à 390 et 1440 px | Claude | bcaf8f1 | staging (Learn reste fermé sur finjaro.net) |
| 05/10 | Accounting | Base de test alignée sur la production (garde « membre retiré ») | Claude | empreinte md5 identique | test |
| 05/10 | Finjaro | Athlo retiré du menu des applications tant que sa base est en pause (le lien menait à une connexion cassée) | Claude | finjaro_apps.is_active = false | en ligne |
| 05/10 | Finjaro | Mise en ligne de tout staging sur finjaro.net (origine des visiteurs ?src=, bandeau « Devenir vendeur », Léo, politique de confidentialité 1.4) | Claude | 43b8d8c ; 13 pages × 2 tailles sans erreur sur staging, contrôle sur finjaro.net | en ligne |
| 05/10 | Léo + Finjaro | IA gratuite de Cloudflare branchée pour les agents et Finia, avant tout moteur payant, avec un compteur qui coupe à 8 000 neurones par jour (zéro facture) | Claude | 29ea0b3 + 0231 ; essai réel par la fonction de Léo : réponse en 10 s, coût 0, compteur à jour ; faux jeton refusé | en ligne |
| 05/10 | Mon argent | Budget : on peut enfin saisir le RÉEL d'une ligne au fil du mois, la corriger ou la supprimer (on ne pouvait que l'ajouter) | Claude | MonArgent.test.jsx (3 tests) | en ligne 05/10 |
| 05/10 | Mon argent | Projets communs : bouton « Ajouter ma part » (la barre montrait le reçu, personne ne pouvait contribuer) | Claude | MonArgent.test.jsx | en ligne 05/10 |
| 05/10 | Mon argent | Njangi : « J'ai payé le tour N » et « retirer mon paiement » (la liste disait qui avait payé, personne ne pouvait le dire) | Claude | MonArgent.test.jsx (2 tests) | en ligne 05/10 |
| 05/10 | Mon argent | Espaces partagés : entrée/sortie saisie dans la page au lieu de deux fenêtres surgissantes (mal affichées dans l’application installée) | Claude | MonArgent.test.jsx | en ligne 05/10 |
| 05/10 | Mon argent | Montants tapés avec une virgule (« 12,50 ») lus correctement partout : avant, ils devenaient 0 sans rien dire | Claude | montant.test.js (4 tests) | en ligne 05/10 |
| 05/10 | Accounting | Page de connexion en anglais : 4 textes restaient en français | Claude | 7e3e6d8, vérifié sur accounting.finjaro.net en anglais | en ligne |
| 05/10 | Léo + Finia | IA gratuite : réflexion de Gemma 4 coupée — les réponses longues n'étaient plus coupées ni hors délai (les agents retombaient sur OpenAI payant) | Claude | 714bd94 ; essai sur finjaro.net : 11 jetons au lieu d'environ 150 | en ligne |
| 05/10 | Mon argent | Essai réel (compte de test) : montants à centimes affichés « 120,50 » (et non « 120,5 »), « pas encore saisi » au lieu de « −0 », titre qui ne se coupe plus sur téléphone | Claude | 8b7e463, montant.test.js ; essai sur staging | en ligne |
| 05/10 | Mon argent | Une ligne de budget peut être rattachée à un compte : le solde du compte bouge enfin avec le budget (Caisse 120,50 → −391,90 après un loyer de 512,40) | Claude | 8b7e463, MonArgent.test.jsx ; essai réel | en ligne |
| 05/10 | Mon argent | Analyste : choix du mois (‹ ›) et plus gros poste de dépense dit en clair (idées de Tirelire relues) | Claude | Analyste.test.jsx (2 tests) ; essai réel | en ligne |
| 05/10 | Mon argent | Après un ajout, on n'est plus renvoyé à la liste (espace partagé), et l'activité montre le nom de qui a payé au lieu de « Quelqu'un » | Claude | 08b6bb6, 368253f ; essai réel | en ligne |
| 05/10 | Léo + Finia | IA gratuite : JSON abîmé des petits modèles réparé, et champs rangés sous un autre nom remis à leur place, au lieu de retomber sur OpenAI payant | Claude | ba522a7, 625dde7 ; 13 tests | en ligne (fonctions) |
| 05/10 | Léo (toutes les entreprises) | Les agents lisent le code avec ses numéros de ligne, et les fichiers trouvés sont lus d'office quand Google ne répond pas | Claude | 36e5025, 4 tests ; après correction, Ada et Nino citent de vraies lignes (CheckoutCOD.jsx:286) au lieu de « ligne 0 » | en ligne (fonctions) |
| 05/10 | Finjaro | Accueil : seulement les articles avec un prix affiché (décision de Beau, remarque de Miroir) | Claude | e6efed5, 3 tests ; finjaro.net mesuré : 8 « sur demande » avant, 0 après, 52 articles affichés | en ligne 05/10 |
| 05/10 | Mon argent | Petits textes violets lisibles : contraste 4,1:1 → 6,6:1 (relevé par Nino, calcul refait et ligne corrigée) | Nino (relu) + Claude | f2fe46a ; 17 tests money ; finjaro.net sert la classe (06/10, 02h55) | en ligne |
| 05/10 | Accounting | Date du jour en heure locale (la caisse du soir ne bascule plus au lendemain en UTC), sans réécrire le passé | Claudinette | 074b79d ; accounting.finjaro.net /api/health 200 | en ligne |
| 05/10 | Accounting | Vente « à crédit » possible dans le rattrapage | Claudinette | 662838b | en ligne |
| 06/10 | Léo | Plus d'« Initiative du jour » en double : une tâche déjà prise par un autre passage (souvent un échec) n'en fait plus créer une nouvelle à chaque tranche ; 35 doublons de la soirée du 05/10 clos (marqués `annulee`, `doublon`, rien supprimé) | Claude | 4096ddf ; fonction déployée (action verte) ; tâches ouvertes 127 → 92 | en service |
| 06/10 | Léo, Accounting (Finia) | IA gratuite : les réponses de Gemma qui recopiaient le schéma autour du livrable, ou rendaient une liste nue, sont remises en forme au lieu d'être rejetées. À 02h37, 6 livrables écrits par Gemma étaient perdus et le passage retombait sur OpenAI sans crédit | Claude | 1c0050f + eba066a (un champ exigé mais vide, « besoin », n'est plus un manque) ; 19 tests ; fonctions déployées. Effet réel pas encore vu : le quota gratuit du 06/10 (7 900 / 8 000) était déjà brûlé par les deux passages en échec ; à vérifier au premier passage après 00:00 UTC | en service, à confirmer |
| 06/10 | Léo, Accounting (Finia) | Moteurs : retrait de « gemini-3.1-pro », qui n'existe pas (250 erreurs 404 en 24 h, autant de secondes perdues avant le moteur suivant) ; un modèle inconnu du fournisseur est mis de côté 24 h | Claude | a91efa2 ; 41 tests des fonctions | en service |
| 06/10 | Finjaro | Message de Finjaro à un acheteur sans compte : écrit depuis la console (Commandes › « Écrire à l'acheteur »), affiché en haut de sa page « Ma commande ». Rien ne part plus par WhatsApp (décision de Beau) | Claude | 0233 appliquée et vérifiée (table privée, écriture réservée à l'équipe) ; 2 tests | staging + base en ligne |
| 06/10 | Léo, Accounting (Finia) | IA gratuite : une part par application (Léo 6 000, Finia 2 000) sous le total de 8 000 ; le surplus d'un appel est enfin compté | Claude | 64d65a0 + 0232 appliquée ; essai : 1 réservé pour Finia, 2 001 refusé, application inconnue refusée | en service |
| 06/10 | Finjaro (Finia) | Finia parle aux vendeuses dans la monnaie de LEUR boutique : prix donnés et relus, articles, commandes reçues, ventes. Avant, « prix en FCFA » : 25 £ dits par une vendeuse à Londres devenaient 25 FCFA | Claude | 179abfd ; test de la liste pays → monnaie identique à l'application ; 436 tests | en service (fonction) |
| 06/10 | Léo | La fiche d'un agent dit son dernier passage : livré, ou pourquoi rien (budget, aucune IA, tâche déjà prise, livrable vide) — et l'erreur dit en clair quand toutes les IA sont à sec | Claude | 974aa13 ; 0235 appliquée | en service (fonction) ; écran sur staging |
| 06/10 | Finjaro | Fiches plus rapides : les écrans ne se préchargent plus pendant que la grande photo arrive (préchargement à la fin du chargement + 2,5 s) | Claude | a095c25 ; mesuré en local : fiche à 0,2 s, préchargement à 2,7 s | staging |
| 06/10 | Léo, Finjaro | Cinq correctifs écrits début octobre et jamais mis en ligne : tâches citées lues, outils par le moteur de secours, plusieurs dépôts GitHub, modèles d'image Google, e-mails réessayés (M-21) | Claude | 0e64cd2, da1cff5 ; 65 tests des fonctions ; aucune erreur de types ajoutée | en service (fonctions) |
| 06/10 | Léo (atelier) | Chercher dans tout le projet : bouton, Ctrl+Maj+F ou palette ; chaque ligne trouvée, rangée par fichier ; un clic ouvre la ligne | Claude | c4893d5 ; 6 tests | staging (site + Worker) |
| 06/10 | Léo (atelier) | Avant / après côte à côte : quand l'agent propose de modifier un fichier, l'aperçu montre la page actuelle et la page proposée | Claude | e630d56 | staging |
| 06/10 | Léo (atelier) | Points de retour : une photo de tout le projet, et le retour d'un clic (annulable : un point est posé avant chaque retour), 5 au plus | Claude | fea4c01 ; 3 tests | staging (site + Worker) |
| 06/10 | Léo (atelier) | Barre d'activité à gauche sur ordinateur (arbre repliable, recherche, modifications, points, journal, tâches, GitHub, entretien) | Claude | f35480e | staging |
| 06/10 | Léo (atelier) | Entretien d'embauche mesuré d'un agent qui code : 3 exercices, tests cachés posés seulement au moment de noter, bulletin (tests, temps, appels, coût, erreurs corrigées, 5 signes de triche, grade proposé) | Mentor (conception) + Claude (harnais) | 80b20f5 ; 11 tests, dont le script des tests cachés lancé par Node contre des solutions de référence, un tricheur et une boucle sans fin ; rendu vérifié à 390 et 1440 px | staging (site + Worker) |
