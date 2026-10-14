# Réunion du 13/10 avec Ricardo (notes de Gemini) — ce qui est décidé, à construire, à vérifier

Source : notes de Gemini de la réunion du 13/10 « Cadrage et Stratégie Commerciale 2 »
(Drive de Beau). Aucun nom de tiers au-delà de celui du collaborateur. Prochaine
réunion : **mercredi 21/10**.

## Décisions en accord
1. Toutes les conversations clients et vendeurs restent dans le **chat interne** (pas WhatsApp).
2. **Pas de livraisons gérées** au démarrage ; **retours et litiges reportés** avec elles.
3. **Pénétration par Accounting** : on acquiert les commerçants d'abord, les acheteurs ensuite.
4. **Stock d'Accounting relié au catalogue de Finjaro tout de suite** (pas dans trois ans).
5. Périmètre d'Accounting : **gestion de stock et finances seulement** (ni marketing, ni service client, ni web).
6. **Application mobile d'Accounting reportée** jusqu'à 20 utilisateurs.
7. **Tutoriels vidéo** pour que chacun teste et s'inscrive seul.
8. Cibles : commerçants traditionnels, TPE, PME ; puis multiboutiques ; puis cabinets comptables.
9. Déploiement : Yaoundé et Douala. Mobile money Orange et MTN : horizon d'un an, inscrit au plan de suivi.
10. À rediscuter : la gratuité à vie des boutiques inscrites avant la campagne (plan financier).

## Vérifié dans le code et en ligne le 14/10 (« on dit que c'est là, mais on n'est pas sûr »)
| Affirmation | Résultat |
| --- | --- |
| « Le seul moyen de quitter Finjaro est de supprimer l'application » | **Faux pour les deux applications** : « Supprimer mon compte » existe dans les réglages de la place de marché (avec sa page publique) et d'Accounting. À mieux montrer, pas à construire. |
| Accounting : lecteur de codes-barres USB/Bluetooth | **Vrai** : la caisse écoute le lecteur (saisie clavier) et retrouve l'article par code ou référence. |
| Accounting : impression de tickets | **Partiel** : un ticket 80 mm s'imprime par le navigateur ; **pas d'impression Bluetooth directe**. |
| Accounting : fonctionne hors ligne / se « punaise » sur le téléphone | **Vrai** : fichier de service servi (200) et manifeste présents. |
| Accounting : le propriétaire invite par e-mail, voit qui est en ligne et l'historique | **Vrai** (invitations, présence et journal d'événements dans le code). |
| Accounting : les opérations ne se modifient pas à la main | **Vrai** d'après les audits (écritures produites par le moteur, une erreur se corrige par une écriture inverse). |
| Place de marché : conversations dans le chat interne | **Faux aujourd'hui** : la fiche article met en avant **WhatsApp** (gros bouton vert et questions toutes prêtes) ; le chat interne n'est qu'une petite icône. **À changer.** |
| Accounting en application mobile | **Non** (web seulement) : conforme à la décision d'attendre. |
| Boutiques de test séparées des statistiques | **Oui pour les comptes de test** (`is_test`, `compte_reel()`), mais **rien de prévu** pour les boutiques de démonstration d'une future place de marché de démo. |
| Place de marché sur Google Play partout, sur l'App Store sauf l'Europe ; 24 € à vie / 99 € par an | **Non vérifié** (ni lisible ici, ni dans le code). Les montants sont ceux dits en réunion. |
| Douala 33 % et Yaoundé 19 % des PME du Cameroun | **Non vérifié** : chiffre cité en réunion, pas de source. Ne pas l'écrire dans un texte visible. |

## À construire / à changer (ordre proposé ; Accounting d'abord)
1. **Mot de passe oublié d'Accounting** : prêt sur une branche, en attente du « 1 » de Beau.
2. **Liaison stock Accounting → catalogue Finjaro** : la fonction de publication d'un article existe (0242) ; il manque le **sens inverse du stock** (vente sur la place de marché qui baisse le stock d'Accounting) et l'écran qui l'appelle. Claudinette + Alpha.
3. **Chat interne en premier** sur la fiche article (WhatsApp en second). Alpha. ⚠️ À mesurer : les vendeuses répondent sur WhatsApp aujourd'hui ; vérifier que les notifications du chat les atteignent avant de retirer quoi que ce soit.
4. **Démonstration de la place de marché** sans compte, sur le modèle de celle d'Accounting, avec boutique d'exemple exclue des statistiques.
5. **Tutoriel vidéo d'Accounting** (démonstration : vendre, reçu WhatsApp, dettes) : Alpha, voix ElevenLabs ou Piper, aussi pour les posts.
6. **Analyse de la concurrence d'Accounting** : tableau à partir de la veille (Caisse Boutique, Chopmoney, MoMoGram, Transify, Excel). Alpha + Claudinette.
7. **Nom** : une seule appellation (« Finjaro » ou « Finjaro Marketplace ») partout, y compris le nom de la page Facebook (contient une ville) et la bio TikTok (contient un drapeau).
8. Filtrer les fonctions d'Accounting hors périmètre (projets, chat d'équipe) : **ne rien ajouter** ; garder le chat simple.

## Pour Beau (gestes à lui)
- Dire « 1 » ou « 2 » pour le mot de passe oublié d'Accounting.
- Envoyer à Ricardo la preuve promise ; fournir la facture électronique « Adam » ; acheter le livre *The 4 Disciplines of Execution*.
- Faire valider le parcours comptable d'Accounting par un comptable.
- Espace cloud de l'entreprise (dossier partagé) : à créer avec lui, c'est un accès donné à un tiers.
- Corriger la bio TikTok (drapeau) et le nom de la page Facebook (ville).

## Le chat, en détail (relu le 14/10 à la demande de Beau)

**Ce qui a été dit dans la réunion (trois passages) :**
1. *Chat de la place de marché.* Beau demande si les vendeurs préfèrent WhatsApp (il économiserait du
   stockage). Ricardo objecte : WhatsApp fait perdre les données, rend impossible la gestion des litiges et
   la vérification des paiements. **Décision : tout reste dans le chat interne.**
2. *Espace d'équipe d'Accounting.* Le propriétaire invite des collaborateurs par e-mail, voit qui est en ligne
   et l'historique des actions. Beau le décrit comme un « chat professionnel » avec des discussions
   séparées par projet et des accès par collaborateur.
3. *Projets et messages.* Les projets servent à des cas précis (ouvrir une boutique, acheter du stock).
   **Ricardo : garder le chat simple et basique**, une messagerie complète demandant trop de ressources et
   éloignant du cœur du logiciel. Puis, sur le périmètre : **stock et finances seulement**, sans projets de
   marketing, de service client ou de développement web.

**Ce que fait vraiment le chat d'Accounting (lu dans le code) :** un canal « Général » et un canal par projet ;
messages partagés en direct et conservés dans l'historique ; **photos jointes** (bucket privé `finia-chat`) ;
**mention @assistant** : l'IA répond dans le fil avec le contexte du projet ; **une photo de facture déclenche
l'IA**, qui propose d'enregistrer la dépense (clic pour valider) ; indicateur « n en ligne ». Ce n'est donc
**pas un chat basique** : c'est déjà une messagerie avec IA. La lecture de photo ne marche pas aujourd'hui
(plus de crédit Gemini).

**Ce que fait la liste des projets :** sept types, dont **« Publicité ou lancement » (marketing)**. C'est le seul
type que la décision « pas de marketing » écarte clairement ; les autres suivent des coûts (ouverture, chantier,
événement, matériel, importation).

**Mesuré en production le 14/10 (comptes réels seulement) :**
- Accounting : **0 message, 0 photo de chat**. Les seules actions réelles jamais enregistrées : 17 mises à jour
  de l'entreprise (6 espaces), 4 ventes (2 espaces, dernière le 23/09), 1 ouverture de session.
- Place de marché, 30 derniers jours : **0 message** dans le chat interne (59 depuis le début) ; **16 intentions
  de contact** : **12 par WhatsApp** (8 depuis le gros bouton, 4 depuis les questions toutes prêtes) et **4 par le
  chat interne**.

**Ce que ça change :**
- Le débat « WhatsApp ou chat » se joue sur **aucun usage réel** : passer au chat interne seul est un
  changement de comportement pour des vendeuses qui répondent sur WhatsApp. À faire avec un essai : chat
  interne en premier, WhatsApp en second, et on mesure.
- Pour Accounting, « garder le chat simple » veut dire **ne rien ajouter** ; retirer le type « Publicité ou
  lancement » est une petite modification, à décider avec Claudinette.
