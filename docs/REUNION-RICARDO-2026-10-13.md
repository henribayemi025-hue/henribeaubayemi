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
