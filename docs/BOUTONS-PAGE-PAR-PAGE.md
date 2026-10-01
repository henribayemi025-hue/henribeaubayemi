# Finjaro — chaque page, chaque bouton, ce qu'il fait

Demandé par Beau (audit du 01/10 : « un document où il y a chaque page, chaque
bouton, ce que chaque bouton fait »). Relevé **automatiquement** dans un vrai
navigateur, au téléphone (390 px) et sur ordinateur (1440 px), puis décrit à la
main. Aucun bouton n'a été « essayé pour de vrai » (rien n'est commandé, envoyé
ou publié pendant le relevé).

- **Partie 1 — Visiteur sans compte** (21 pages) : ci-dessous, relevée le 01/10
  sur la préproduction.
- **Partie 2 — Acheteuse connectée** (12 pages) : plus bas, relevée le 01/10 sur la **base de test** avec un compte de test.
- **Partie 3 — Vendeuse** (13 pages de l'espace boutique) : plus bas, relevée le 01/10 sur la base de test avec une boutique d'essai.
- **Partie 4 — Finjaro Learn** : plus bas (préproduction sans compte, et base de test avec un compte de test). **Léo et Mon argent** : à venir, après la mise à jour de la base de test (il lui manque leurs tables).

## Ce qui revient sur presque toutes les pages

| Bouton | Ce qu'il fait |
|---|---|
| **Finjaro** (logo, en haut) | Revient à l'accueil. Sur Mon argent et Léo, ouvre la page des applications. |
| **Applications Finjaro** (6 points) | Ouvre le menu des applications : Finjaro, Mon argent, Accounting, Léo, Athlo (et Learn sur la préproduction seulement). |
| **Panier** | Ouvre le panier. |
| **Finia** (bulle en bas à droite) | Ouvre l'assistante Finia : on lui demande un article, une boutique, un conseil. |
| Barre du bas (téléphone) : **Accueil · Fin · Services · Messages · Profil** | Accueil ; Fin (vidéos des boutiques) ; Services (prestataires et boutiques autour de soi) ; Messages (demande de se connecter) ; Profil. |
| **Retour** (flèche) | Revient à la page précédente. ⚠️ Sur plusieurs pages il s'annonce « Back » (anglais) aux lecteurs d'écran : à traduire. |
| **Refuser / Accepter** (bandeau du bas, première visite) | Refuse ou accepte le pixel publicitaire de Meta. Rien n'est activé sans « Accepter ». |
| **Passer / Suivant** (première ouverture) | Fait défiler ou saute la présentation de l'application. |

## Accueil — `/`

| Bouton | Ce qu'il fait |
|---|---|
| **Rechercher un produit, une boutique…** | Ouvre la recherche. |
| **Autour de moi** | Ouvre Services, centré sur les boutiques et prestataires proches. |
| Grandes images du carrousel (8 articles mis en avant) | Ouvre la fiche de l'article. |
| **Tout voir** | Affiche toutes les catégories. |
| **Catégories** (Femme, Beauté, Bijoux, Événementiel, Homme, Mode, Enfants, Maison, High-Tech, Sport & Loisirs, Alimentaire, Musique, Seconde main, Électroménager, Jus naturels, Santé, Livres, Jardin, Animaux, Véhicules, Équipement pro, Immobilier, Autre) | Ouvre la liste des articles de cette catégorie. « Autre » sert à signaler un rayon qui manque. |
| **Services à domicile** | Ouvre Services (ménage, coiffure, plomberie, BTP…). |
| **Voir tout** (boutiques) | Ouvre la liste de toutes les boutiques. |
| **Trouve-moi une robe wax** | Exemple de question : ouvre Finia avec cette demande déjà écrite. |
| Cartes articles (64) | Ouvre la fiche de l'article. |
| Cartes boutiques (60) | Ouvre la page de la boutique. |

## Recherche — `/search`

| Bouton | Ce qu'il fait |
|---|---|
| Champ de recherche | Cherche dans les articles et les boutiques pendant qu'on écrit. |
| Cartes articles (24 pour « robe ») | Ouvre la fiche de l'article. |

## Boutiques — `/boutiques`

| Bouton | Ce qu'il fait |
|---|---|
| Cartes boutiques (67) | Ouvre la page de la boutique. |

## Services — `/services`

| Bouton | Ce qu'il fait |
|---|---|
| **Demander à Finia** | Ouvre Finia pour décrire le service cherché. |
| **Métiers** | Filtre par métier (coiffure, couture, plomberie…). |
| **Changer ma localisation** (liste) | Choisit la ville ou le pays d'où l'on cherche. |
| **Autour de moi** | Trie par distance (demande la position si on l'accepte). |
| **Boutiques (67)** / **Annonces** | Bascule entre la liste des boutiques et les petites annonces de services. |
| **Carte géolocalisée** | Affiche les boutiques sur une carte. |
| **Contacter** | Ouvre la conversation avec la boutique (demande de se connecter). |
| **Réserver** | Ouvre la prise de rendez-vous avec la boutique (demande de se connecter). |
| **Voir 55 boutique(s) de plus** | Charge la suite de la liste. |
| **Publier une annonce** | Ouvre le formulaire pour proposer un service (demande de se connecter). |

## Fin (vidéos) — `/fin`

| Bouton | Ce qu'il fait |
|---|---|
| **Pour toi** / **Suivis** | Toutes les vidéos, ou seulement celles des boutiques suivies. |
| Toucher la vidéo | Active ou coupe le son. |

Lors du relevé, aucune vidéo ne s'est affichée côté visiteur : seuls les deux onglets étaient visibles (à vérifier dans la partie 2).

## Fiche article — `/product/:id`

| Bouton | Ce qu'il fait |
|---|---|
| **Retour** | Revient à la page précédente. |
| **Vendu par …** | Ouvre la page de la boutique. |
| **Signaler** | Signale l'article à l'équipe (contenu interdit, arnaque…). |
| Questions toutes prêtes : **Encore disponible ?**, **Quel prix ?**, **Autres tailles ou couleurs ?**, **Livraison possible ?**, **Poser une question à la vendeuse** | Ouvrent WhatsApp avec la boutique, la question déjà écrite avec le nom de l'article. |
| **Contacter le vendeur** | Ouvre le choix du moyen de contact (WhatsApp ou discussion Finjaro après connexion). |
| **Demander le prix** (article « prix sur demande ») | Envoie la demande de prix à la boutique. Pour un article à prix fixe, ce bouton devient **Ajouter au panier** (avec taille, couleur, quantité). |
| Articles proches / de la même boutique | Ouvrent leurs fiches (avec le prix ou « Prix sur demande », et la promo s'il y en a une). |

## Page boutique — `/boutique/:slug`

| Bouton | Ce qu'il fait |
|---|---|
| **Retour** | Revient à la page précédente. |
| **Partager la boutique** | Partage ou copie le lien de la boutique. |
| **Signaler** | Signale la boutique à l'équipe. |
| Nom de la boutique | Affiche les informations de la boutique. |
| **Suivre** | Suit la boutique (ses vidéos arrivent dans « Suivis »). |
| **Contacter le prestataire** (ou la vendeuse) | Ouvre la discussion Finjaro (demande de se connecter). |
| **WhatsApp** | Ouvre WhatsApp avec la boutique. |
| Onglets **Prestations** (ou Produits) · **Promos** · **Avis** · **À propos** | Change ce qui est affiché. |
| **Voir tous les produits** | Affiche tout le catalogue de la boutique. |
| Cartes articles | Ouvrent leurs fiches. |
| **Réessayer** | N’apparaît que si la boutique n’a pas pu se charger (réseau coupé). Vu une fois pendant le relevé ; 16 chargements de contrôle ensuite, tous bons. |

## Panier — `/cart`

| Bouton | Ce qu'il fait |
|---|---|
| **Continuer mes achats** (panier vide) | Revient à l'accueil. |
| **– / + / Retirer** (panier plein) | Change la quantité ou retire l'article. |
| **Commander** (par boutique) | Passe à la commande : avec compte, paiement à la livraison ; sans compte, demande envoyée à la boutique (« Ma commande »). |
| **Tout commander** | Commande le panier entier, boutique par boutique. |

## Ma commande — `/ma-commande`

| Bouton | Ce qu'il fait |
|---|---|
| (lien reçu par WhatsApp) | Affiche le suivi d'une demande passée sans compte : reçue, prix proposé, acceptée, livrée. |

## Profil (sans compte) — `/profile`

| Bouton | Ce qu'il fait |
|---|---|
| **Se connecter** | Ouvre la page de connexion. |

## Paramètres — `/profile/settings`

| Bouton | Ce qu'il fait |
|---|---|
| **Français / English** | Change la langue de toute l'application. |
| **EUR / FCFA / USD / GBP / CAD** et la liste de toutes les monnaies | Affiche les prix dans cette monnaie (taux du jour). Par défaut, la monnaie du pays de la personne. |
| **Rates By Exchange Rate API** | Ouvre le site d'où viennent les taux. |
| **En savoir plus** (pixel) | Ouvre la politique de confidentialité. |
| **Google Play** | Ouvre la page de l'application Android. |
| **Revoir la présentation** | Relance les écrans d'accueil du premier lancement. |
| **À propos de Finjaro** | Ouvre la page À propos. |
| **Conditions générales** / **Politique de confidentialité** | Ouvrent les textes légaux. |
| **Supprimer mon compte** | Ouvre la page qui explique comment demander la suppression du compte. |

## Aide — `/profile/help`

| Bouton | Ce qu'il fait |
|---|---|
| **Nous écrire sur WhatsApp** | Ouvre WhatsApp avec l'équipe Finjaro. |
| **Nous écrire** | Ouvre un e-mail à l'équipe. |

## À propos — `/a-propos`

| Bouton | Ce qu'il fait |
|---|---|
| **Écrire à l'équipe Finjaro** | Ouvre un e-mail à l'équipe. |

## Applications — `/apps`

| Bouton | Ce qu'il fait |
|---|---|
| **Mon argent** | Ouvre Mon argent (comptes, budget, épargne, njangis). |
| **Finjaro Accounting** | Ouvre Accounting (caisse, stock, factures), avec la même connexion si on est connecté. |
| **Léo** | Ouvre Léo (entreprise d'agents IA). |
| **Finjaro Learn** | Préproduction seulement : ouvre Learn. |
| **Athlo** | Ouvre Athlo. ⚠️ Ne fonctionne plus depuis le 01/10 : sa base est en pause (voir carnet). |
| **Proposer mon application** | Formulaire pour proposer d'ajouter une application au menu. |

## Connexion — `/auth`

| Bouton | Ce qu'il fait |
|---|---|
| **Français / English** | Change la langue. |
| **E-mail / Téléphone** | Choisit de se connecter avec une adresse ou un numéro. |
| **Afficher** | Montre le mot de passe tapé. |
| **Mot de passe oublié ?** | Envoie un lien pour choisir un nouveau mot de passe. |
| **Se connecter** | Connecte avec l'adresse (ou le numéro) et le mot de passe. |
| **Continuer avec Google** / **Continuer avec Apple** | Connecte avec un compte Google ou Apple. |
| **Pas encore de compte ? S'inscrire** | Passe au formulaire d'inscription. |
| **Continuer sans compte** | Revient à l'accueil sans se connecter. |

## Mon argent — `/argent` et Léo — `/legion` (sans compte)

| Bouton | Ce qu'il fait |
|---|---|
| **Continuer avec Finjaro** | Se connecte avec le compte Finjaro. |
| **Continuer avec Google** | Se connecte avec Google. |
| **Créer un compte** | Ouvre l'inscription. |

## Présentation — `/landing`

| Bouton | Ce qu'il fait |
|---|---|
| **EN** | Passe la page en anglais. |
| **Se connecter** | Ouvre la page de connexion. |
| Badges des magasins | Ouvrent l'application dans Google Play / l'App Store. |

## Textes légaux — `/legal/terms`, `/legal/confidentialite`, `/suppression-compte`

Pages de lecture : seul le bouton **Retour** y figure.

---

# Partie 2 — Acheteuse connectée

Relevée sur la base de test (`qiyvoaljqmbfldephobp`) avec un compte de test,
pour ne rien commander ni envoyer sur la vraie base. Cette base est une copie
ancienne : deux écrans (Messages, Messages personnels) n'ont pas pu se charger
et affichent « Réessayer » ; leurs boutons seront relevés quand la base de test
sera remise à jour.

## Première connexion — fenêtre « Pourquoi viens-tu ? »

| Bouton | Ce qu'il fait |
|---|---|
| **Je viens acheter** | Garde l'application en mode acheteuse (accueil, recherche, panier). |
| **Je viens vendre** | Mène à l'ouverture de la boutique (« Devenir vendeur »). C'est gratuit. |
| **Plus tard** | Ferme la fenêtre ; elle ne revient plus. |

## Bandeau en haut (quand l'équipe en publie un)

| Bouton | Ce qu'il fait |
|---|---|
| Le bandeau (ex. « Seconde main & Ventes flash ») | Ouvre la rubrique annoncée. |
| **Fermer** | Masque le bandeau. |

## Accueil connecté — `/`

Les mêmes boutons que pour le visiteur (partie 1), plus :

| Bouton | Ce qu'il fait |
|---|---|
| **Activer** (notifications) | Demande l'autorisation d'envoyer des notifications (commande, message, baisse de prix). |

## Profil — `/profile`

| Bouton | Ce qu'il fait |
|---|---|
| **Modifier le profil** | Ouvre la modification du nom et de la photo. |
| **Tu vends des articles ? Ouvre ta boutique Finjaro** | Ouvre l'ouverture de boutique. Gratuit jusqu'en novembre. |
| **Commandes** / **Mes commandes** | Ouvre la liste de ses commandes. |
| **Favoris** / **Mes favoris** | Ouvre les articles mis en favori. |
| **Mon argent** | Ouvre Mon argent. |
| **Messages personnels** | Ouvre les conversations avec d'autres personnes (pas les boutiques). |
| **Inviter des amis** | Ouvre la page d'invitation (lien de parrainage). |
| **Applications Finjaro** | Ouvre la page des applications. |
| **Paramètres** · **Aide** · **Conditions générales** · **Politique de confidentialité** | Ouvrent ces pages. |
| **Déconnexion** | Ferme la session sur cet appareil. |

## Modifier le profil — `/profile/edit`

| Bouton | Ce qu'il fait |
|---|---|
| **Choisir une image** | Choisit la photo de profil depuis le téléphone ou l'ordinateur. |
| **Enregistrer** | Enregistre le nom et la photo. |

## Mes commandes — `/profile/orders` · Mes favoris — `/profile/favorites`

| Bouton | Ce qu'il fait |
|---|---|
| (liste vide sur le compte de test) | Chaque commande ouvre son détail (suivi, accepter le prix proposé par la boutique) ; chaque favori ouvre la fiche de l'article. |

## Trouver quelqu'un — `/profile/people`

| Bouton | Ce qu'il fait |
|---|---|
| Champ de recherche | Cherche une personne par son nom pour lui écrire. |

## Inviter des amis — `/profile/invite`

| Bouton | Ce qu'il fait |
|---|---|
| **Copier** | Copie son lien d'invitation. |
| **Partager mon lien** | Ouvre le partage du téléphone (WhatsApp, SMS…) avec le lien. |

## Messages (boutiques) — `/inbox` · Messages personnels — `/profile/messages`

Non relevés : la base de test n'a pas encore ces tables (écran « Réessayer »).

## Panier — `/cart`

Comme pour le visiteur ; une fois connectée, **Commander** mène au paiement à la livraison avec l'adresse et la zone de livraison.

## Devenir vendeur — `/become-vendor`

| Bouton | Ce qu'il fait |
|---|---|
| **Pays** (liste de tous les pays) | Choisit le pays de la boutique ; la monnaie des prix en découle. |
| **Des articles** · **Des services** · **Les deux** | Ce que la boutique propose. |
| **Rayons** (Mode Femme, Mode Homme, Enfants, High-Tech, Beauté, Bijoux, Maison, Événementiel, Alimentaire, Jus naturels, Seconde main, Véhicules, Immobilier, Musique, Sport, Électroménager, Livres, Santé, Animaux, Jardin, Équipement pro, Autre) | Choisit le ou les rayons de la boutique. |
| **Continuer** | Passe à l'étape suivante (nom, WhatsApp, photo), puis envoie la demande d'ouverture. |

## Paramètres connectée — `/profile/settings`

Les mêmes que pour le visiteur, plus :

| Bouton | Ce qu'il fait |
|---|---|
| **Activer les notifications** | Demande l'autorisation des notifications sur cet appareil. |
| Case **E-mails** | Reçoit ou non les e-mails de Finjaro (commandes, messages). |
| Case **Finia commune** | Autorise ou non Finia à apprendre de ses questions (sans effet sur les comptes de test). |
| Case **Publicité** (site web seulement) | Accepte ou refuse le pixel publicitaire. |
| **Supprimer mon compte** (bouton) | Envoie la demande de suppression du compte (le lien du même nom explique la démarche). |

---

# Partie 3 — Vendeuse (espace boutique, `/vendor`)

Relevée sur la base de test avec une boutique d'essai (un article). Les prix y
sont dans la devise **de la boutique** (euros pour une boutique en France,
FCFA au Cameroun, dollars canadiens au Canada…), jamais dans celle du
téléphone.

## Ce qui revient sur toutes les pages de l'espace boutique

| Bouton | Ce qu'il fait |
|---|---|
| Barre de l'espace boutique : **Tableau de bord · Produits · Commandes · Boutique · Apprendre** | Passe d'une partie à l'autre de l'espace boutique. |
| **Finjaro** (logo) | Revient au tableau de bord de la boutique. |
| **Applications Finjaro** · **Finia** | Comme côté acheteuse. |

## Tableau de bord — `/vendor`

| Bouton | Ce qu'il fait |
|---|---|
| **Notifications** | Ouvre les dernières alertes (commandes, messages, avis). |
| **Statistiques** | Ouvre les chiffres de la boutique. |
| **Mode acheteur** | Repasse côté acheteuse (accueil, panier), sans se déconnecter. |
| Cartes du jour (d’après le code : statut du jour, articles sans prix, commandes à traiter…) | Ouvrent l’écran concerné ; elles n’apparaissent que s’il y a quelque chose à faire (aucune sur la boutique d’essai). |

## Produits — `/vendor/products`

| Bouton | Ce qu'il fait |
|---|---|
| **Ajouter un produit** | Ouvre le formulaire d'un nouvel article. |
| **En masse** | Ajoute plusieurs articles d'un coup à partir de photos. |
| **En ligne (n)** · **Brouillons (n)** · **Arrivages passés (n)** | Filtre la liste : articles visibles, non publiés, ou arrivages retirés automatiquement. |
| Un article de la liste | Ouvre sa modification. |
| **Retirer** | Retire l'article de la vente (il reste dans les brouillons). |

## Nouvel article — `/vendor/products/new` · Modifier — `/vendor/products/:id`

| Bouton | Ce qu'il fait |
|---|---|
| **Ajouter des photos** | Choisit les photos (le fond peut être détouré automatiquement). |
| **Tu as plusieurs articles différents ? Ajoute-les tous d'un coup** | Ouvre l'ajout en masse. |
| Case **Prix sur demande** | L'article s'affiche sans prix ; les clientes demandent le prix. |
| **Rayon** puis **sous-rayon** (listes) | Range l'article dans la bonne catégorie. |
| **XS · S · M · L · XL · XXL · 3XL · 4XL** et **Ajouter** | Choisit les tailles proposées ; « Ajouter » crée une taille ou une couleur personnalisée. |
| **Générer avec l'IA** | Écrit la description à partir du nom et des photos. |
| **Générer un script vidéo (Reel/TikTok)** | Propose un petit texte pour filmer l'article. |
| **Corriger** (modification) | Corrige l'orthographe de la description. |
| Case **Article permanent** | L'article n'est jamais retiré automatiquement par la rotation des arrivages. |
| **Supprimer** (modification) | Supprime l'article (après confirmation). |
| **Enregistrer** | Publie ou enregistre les changements. |

## Ajouter plusieurs articles — `/vendor/products/bulk`

| Bouton | Ce qu'il fait |
|---|---|
| **Choisir mes photos** | Choisit plusieurs photos : un article est préparé par photo, à compléter (nom, prix) avant de publier. |

## Commandes — `/vendor/orders`

| Bouton | Ce qu'il fait |
|---|---|
| **Prix demandés** · **Nouvelles** · **En cours** · **Livrées** · **Annulées** | Filtre les commandes par étape. |
| (sur une commande — d’après le code, la boutique d’essai n’en a pas) Proposer un prix · Accepter · Préparer · Livrée · Annuler · WhatsApp | Fait avancer la commande ; la cliente est prévenue à chaque étape. |

## Messages — `/vendor/messages`

Non relevé : la base de test n'a pas encore ces tables (écran « Réessayer »).

## Reels — `/vendor/reels`

| Bouton | Ce qu'il fait |
|---|---|
| **Publier un reel** | Choisit une vidéo, la relie à un article, et la publie dans Fin. |

## Ma boutique — `/vendor/shop`

| Bouton | Ce qu'il fait |
|---|---|
| **Partager la boutique** | Partage le lien de la boutique (WhatsApp, statut…). |
| **Passer en mode acheteur** | Repasse côté acheteuse. |
| **Choisir une image** | Change la photo ou la bannière de la boutique. |
| **Rayons** (articles) et **métiers** (services : coiffure à domicile, ménage, BTP, informatique, électricité, livraison, traiteur, location, photo, couture, mécanique, soins, garde d'enfants, transport, cours, événementiel, médecin, coaching, design, community manager, vidéaste, makeup, comptable, voyage, pressing, imprimerie… et « Autre service ») | Dit ce que la boutique vend ou propose ; sert aux filtres de Services et de la recherche. |
| **dim. · lun. · mar. · mer. · jeu. · ven. · sam.** | Choisit les jours d'ouverture (horaires). |
| **Je suis en direct** | Signale qu'on est ouverte ou en vente en direct maintenant. |
| Case **Livraison** et frais | Dit si la boutique livre, et à quel prix (dans la devise de la boutique). |
| **Ajouter une zone** | Ajoute une zone de livraison avec son prix. |
| **Définir la position de ma boutique** | Place la boutique sur la carte (pour « Autour de moi »). |
| **Pays** (liste) | Pays de la boutique ; il fixe la devise des prix. |
| **Enregistrer** | Enregistre la boutique. |

## Statistiques — `/vendor/stats` · Finances — `/vendor/finances`

| Bouton | Ce qu'il fait |
|---|---|
| **7j · 30j · 3 mois · 1 an** | Change la période affichée. |
| **Exporter** (statistiques) | Télécharge les chiffres. |
| **Télécharger le relevé (Excel/CSV)** (finances) | Télécharge le relevé des ventes et des encaissements. |

## Classement des vendeurs — `/vendor/leaderboard`

Page de lecture (points des vendeuses) : seul le bouton **Retour**.

## Apprendre — `/vendor/learn`

| Bouton | Ce qu'il fait |
|---|---|
| **Publier ton premier article** | Ouvre Produits ; la leçon se valide quand un article est vraiment publié. |
| **Répondre à une cliente** | Ouvre Messages ; validée quand une vraie réponse est envoyée. |
| **Mener une commande jusqu'au bout** | Ouvre Commandes ; validée quand une commande est livrée. |
| **Ouvrir Finjaro Accounting** | Ouvre Accounting pour tenir la caisse et le stock. |

---

# Partie 4 — Finjaro Learn (`/learn/`, préproduction seulement)

Relevée le 01/10 sur la version 5e5ddf2 : sans compte sur la préproduction,
puis connectée sur la base de test.

## En haut, sur tous les écrans

| Bouton | Ce qu'il fait |
|---|---|
| **Connexion** / **Déconnexion** | Se connecte avec le compte Finjaro (le même que la place de marché), ou se déconnecte sur cet appareil. |
| **Changer de thème (Finjaro / Noir)** | Passe du thème crème et terracotta au thème noir, et inversement. |
| **Sans** / **IA** | Travailler sans intelligence artificielle, ou avec le tuteur IA. |
| **EN** / **FR** | Change la langue. |
| **Leçons · Espaces · Outils · Entraide** | Les quatre parties de Learn. |

## Leçons

| Bouton | Ce qu'il fait |
|---|---|
| Cartes des parcours (Programmation, Data science, IA et deep learning, AI engineering, Prompt engineering) | Choisit le parcours ; un parcours s'ouvre quand le précédent est fini. |
| Liste des leçons (1, 2, 3…) | Ouvre la leçon. |
| Zone **À toi de jouer** | On y écrit son code (JavaScript ou Python). |
| **Lancer** | Exécute le code et vérifie s'il réussit la leçon (« Bravo, ça marche ! » ou « Pas encore »). |
| **Un indice** | Donne un indice sans la réponse. |
| **Voir la solution** | Montre la solution. |
| 🔊 | Lit l'explication à voix haute (voix du navigateur). |

## Espaces (connectée)

| Bouton | Ce qu'il fait |
|---|---|
| Nom de l'espace et **type** (liste) | Nomme le groupe et choisit son type (amis, classe, équipe…). |
| **Créer** | Crée l'espace ; on y invite ensuite par lien, on y discute en direct, on y code à plusieurs et on y lance des défis. |

## Outils (connectée)

| Bouton | Ce qu'il fait |
|---|---|
| **Fiches de révision** · **CV et lettres** · **Actualités** | Choisit l'outil. |
| Zone **Colle ici le texte de ton cours…** | Le texte à transformer en fiches. |
| Nombre de fiches (5, 8, 12, 15) et de questions (3, 5, 8, 10) | Règle la quantité. |
| **Créer mes fiches** | Fabrique les fiches de révision et le quiz à partir du texte. |

## Entraide (connectée)

| Bouton | Ce qu'il fait |
|---|---|
| Pseudo et **Enregistrer** | Choisit le pseudo affiché aux autres (demandé une seule fois). Ensuite : poser une question, répondre, choisir la meilleure réponse, signaler. |
