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
- **Partie 4 — Finjaro Learn** : plus bas (préproduction sans compte, et base de test avec un compte de test). 
- **Partie 5 — Léo et Mon argent** (connectée) : tout en bas, relevée **d'après le code** (la base de test n'a pas leurs tables).

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

---

# Partie 5 — Léo (`/legion`) et Mon argent (`/argent`), connectée

**Relevée d'après le code** (version 357c8e6 de la préproduction), le 01/10, et
**pas dans un navigateur** : la base de test n'a pas les tables de Léo ni de
Mon argent, et pour les y mettre il faudrait rejouer 226 migrations. Chaque
libellé ci-dessous est recopié du code, tel que la personne le lit en français.
Les écrans affichent la même chose en anglais quand on choisit EN.

## Léo — Mes entreprises (`/legion`)

| Bouton | Ce qu'il fait |
|---|---|
| **← Finjaro** | Revient à la page des applications. |
| **Palette sombre / Palette claire (Finjaro)** | Passe du thème sombre de Léo au thème crème de Finjaro, et inversement (revient sur tous les écrans de Léo). |
| **Se déconnecter** | Déconnecte de Léo et de Finjaro sur cet appareil. |
| **Nouvelle entreprise** | Ouvre « Fonder une entreprise ». C'est le seul bouton de ce nom sur la page. |
| Carte d'une entreprise (nom, métier, taille, visages de l'équipe qui défilent) | Ouvre l'entreprise. La carte montre les agents allumés, les tâches ouvertes et, en orange, ce qui attend une réponse. |
| **Tu n'as pas encore d'entreprise.** (quand il n'y en a aucune) | Ouvre « Fonder une entreprise ». |
| **Reprendre « nom »** (actions rapides) | Rouvre la première entreprise. |
| **Retourner sur Finjaro** | Revient à la page des applications. |

La colonne de droite ne montre que des nombres comptés (entreprises, agents
allumés, en attente, tâches ouvertes) et les quatre étapes « Comment Léo
travaille chez toi ». Aucun bouton.

## Léo — Fonder une entreprise (`/legion/fonder`)

| Bouton | Ce qu'il fait |
|---|---|
| **← (retour)** | Revient à Mes entreprises. |
| **Chercher parmi N secteurs…** | Filtre la liste des métiers (cabinet comptable, laboratoire, école…). |
| Carte d'un secteur | Choisit ce modèle : son concept, ses départements et ses postes s'affichent en dessous. |
| **Voir les N secteurs** | Affiche tous les modèles (12 au départ). |
| **Ton secteur n'est pas là ?** : champ + **Créer le modèle** | Léo écrit les départements et les métiers du secteur décrit (environ une minute). Le modèle entre au catalogue pour tout le monde. |
| Zone **Le concept** | Le texte se modifie : c'est ta version, les agents la liront. |
| **3 · 25 · 150 · 1 500 · 10 000** et le champ nombre | Fixe la taille de l'équipe. Les postes s'ouvrent selon la taille. |
| **Ajouter un métier** | Ouvre le catalogue : on cherche parmi tous les métiers de tous les secteurs, ou on l'écrit soi-même (poste, département, mandat), puis **Ajouter**. |
| Visage dans la bande ou dans l'organigramme | Ouvre la fiche du poste : **Réécrire** ou **Garder ce mandat**, **Demander à Léo** de l'adapter, **Retirer de l'équipe** / **Remettre dans l'équipe**. |
| **Léo t'aide à composer l'équipe** : champ + **Demander à Léo** | Léo propose qui ajouter, qui retirer, et réécrit des mandats. |
| **Envoyer un fichier** | Lit une liste de postes (texte ou CSV, 400 Ko au plus). Un CSV bien rangé est lu sans IA. |
| Cases des propositions, puis **Appliquer (N)** / **Annuler** | Applique seulement ce qui est coché. |
| **Nom de l'entreprise**, **Qui es-tu ?**, **Ce que tu veux obtenir**, **Le projet** | Ce que les agents liront sur toi et ton but. |
| **Tes outils de travail** (Excel, Google Sheets, Word, WhatsApp, Gmail, Notion, Canva, Finjaro Accounting…) et **D'autres ?** | Les agents rendent leurs livrables dans ces formats. |
| **Fonder « nom »** | Crée l'entreprise et ses agents, puis l'ouvre. Il reste grisé tant qu'il n'y a pas de nom ou de compte connecté. |

## Léo — Rejoindre (`/legion/rejoindre/…`, lien d'invitation)

| Bouton | Ce qu'il fait |
|---|---|
| **Rejoindre** | Entre dans l'entreprise qui a invité. Le lien ne sert qu'une fois. |
| **Entrer** (si on en fait déjà partie) | Ouvre l'entreprise. |
| **← Léo** | Revient à Mes entreprises (aussi quand le lien est inconnu, déjà servi ou expiré). |

## Léo — L'entreprise (`/legion/:id`) : en haut et en bas

| Bouton | Ce qu'il fait |
|---|---|
| **← Finjaro** (téléphone) | Revient à la page des applications. |
| **Ma photo** (ton visage) | Change ta photo dans Léo. |
| **FR / EN** | Change la langue de Léo. Les plans et les livrables du matin suivent ce choix. |
| **Palette** | Thème sombre ou thème Finjaro. |
| **Se déconnecter** | Déconnecte sur cet appareil. |
| **De vraies photos (N)** | Fabrique un portrait pour chaque agent qui n'en a pas. ⚠️ **Cela coûte** : chaque image est payée, contrairement au dessin (c'est écrit au survol). Aucune personne réelle n'est utilisée. |
| **Interrupteur général** | Allume ou éteint tous les agents d'un coup. Un agent éteint ne répond pas. |
| **Tableau des tâches** (ordinateur) | Affiche ou cache la colonne des tâches. |
| Barre du bas (téléphone) : **Accueil · Salons · Discussion · Équipe · Tâches** | Les cinq écrans de l'entreprise. Au clavier : Alt + 1 à 5. |
| Rail de gauche (ordinateur) ou pastilles (téléphone) : **Mes entreprises**, **Tous les salons**, un département, **L'immeuble**, **Atelier de code** | Change de département, ou ouvre l'immeuble ou l'atelier. L'atelier n'apparaît que quand il est ouvert à l'entreprise. |
| **Parler à Léo** (micro en bas, ou maintenir Espace) | Jarvis, la télécommande vocale : la première fois, une fenêtre explique ce qui est écouté (**D'accord, j'écoute** / **Annuler**). Ensuite on dit « ouvre la ville », « une tâche pour Ada »… Léo répète ce qu'il a compris et attend **Oui, vas-y** ou **Non** avant d'agir. |
| **?** (clavier) | Montre les raccourcis : Ctrl/⌘ + K pour chercher, / pour écrire, B pour le bureau, I pour les idées, Échap pour fermer. |

## Léo — Accueil de l'entreprise (la tour de contrôle)

| Bouton | Ce qu'il fait |
|---|---|
| **Entrer dans les salons** | Ouvre les salons de discussion. |
| **Tableau des tâches (N)** | Ouvre les tâches. |
| **Interrupteur général** (carte) | Comme en haut : tout allumer ou tout éteindre. |
| **Donner un ordre, tout de suite** : département, consigne, **Transmettre** | Envoie l'ordre au département choisi ; son agent le reçoit et répond dans le salon. |
| **Pour démarrer :** (exemples d'ordres) | Remplit la consigne et le département avec un exemple. |
| **L'immeuble en direct** → **Entrer** | Ouvre l'immeuble (voir plus bas). |
| **L'immeuble · La frise · La présentation · Le tableau d'idées · Le wiki · L'atelier de code** | Ouvre la grande vue choisie (voir plus bas). |
| **🔌 Connecteurs** | Descend directement jusqu'aux connecteurs. |
| **Passer à Premium** · **Nous contacter** · **Une suggestion**, puis **Demander Premium** / **Envoyer** | Envoie un mot à l'équipe Finjaro, qui répond par e-mail. La carte montre aussi le crédit offert du mois (dépensé sur offert) ; quand il est épuisé, les agents se mettent en pause jusqu'au mois suivant. |
| Carte d'un département : interrupteur | Allume ou éteint tout le département. |
| Carte d'un département : visage d'un agent | Ouvre sa fiche. |
| Carte d'un département : salon | Ouvre le salon du département. |
| **1:1** (à côté du chef) | Ouvre une discussion privée avec le chef du département. |
| **Chantiers** → **Tout voir**, ou une tâche | Ouvre le tableau des tâches. |
| **Trombinoscope** : visage / nom / interrupteur | Ouvre la fiche ; écrit à l'agent en privé ; l'allume ou l'éteint. |
| **… et N autres** | Ouvre l'onglet Équipe. |

Plus bas sur le même écran :

| Section | Boutons et ce qu'ils font |
|---|---|
| **Le tableau de bord** | **7 jours / 30 jours** changent la période ; **Comment c'est calculé** montre les règles (tout est compté dans la base, aucun score inventé) ; un agent ouvre sa fiche ; **Réunir l'équipe : faut-il le remplacer ?** convoque une réunion sur un agent « en difficulté ». Plus bas, les trophées (étapes cochées de la feuille de route). |
| **La bibliothèque de missions** | **Qui :** choisit l'agent ; **Lancer** une fois ; **Chaque semaine / mois / année** pour qu'elle revienne seule ; **Arrêter** une mission qui revient ; **Voir les N missions** / **Moins**. |
| **Feuille de route** | Onglets **Aujourd'hui · Semaine · Mois · Trimestre** et flèches ‹ › pour changer de période ; case **Fait / Pas encore fait** ; **Commenter** puis **OK** ; **Ajouter une ligne** (quoi, qui) puis **Ajouter**. |
| **Les plans** | **Au travail maintenant** fait écrire leur plan à tous les responsables tout de suite ; chaque plan (du jour, de la semaine, du mois) s'ouvre ou se replie. |
| **Les compétences** | **Qu'ils s'équipent** : chaque agent sans compétence choisit les trois fiches d'experts qui lui serviront le plus. |
| **Ce qu'ils ont retenu** (mémoire) | Écrire **Une règle à retenir…** ; **Oublier cette règle** ; **Tout voir (N)** / **Moins**. |
| **Le journal des décisions** | **Vérifier** contrôle que la chaîne des empreintes signées n'a pas été modifiée (message rouge sinon). |
| **Inviter quelqu'un** (propriétaire seulement) | **Créer un lien d'invitation** puis **Copier** ; **Un autre lien pour une autre personne**. Le lien sert une fois. |
| **Les membres** | Le propriétaire choisit pour chaque membre **membre** ou **lecteur** (un lecteur lit tout mais n'écrit rien) ; les autres voient seulement le rôle. |
| **Le marché de l'entreprise** | Choisit le pays où l'entreprise vend surtout (ou **Aucun pays en particulier**) : les agents adaptent monnaie, exemples, jours fériés et cadre légal. |
| **Ce que les agents peuvent lire** (connecteurs) | **Ma boutique sur Finjaro** (branchée d'office si on en a une) ; **Ma comptabilité sur Finjaro Accounting** (sinon **Ouvrir Finjaro Accounting**) ; **Mon dépôt GitHub** (**Se connecter avec GitHub**, **Choisir d'autres dépôts**, ou adresse + jeton) ; **Ma veille (flux RSS)** (**Brancher**, **Lire maintenant**, **Débrancher**) ; Linear, Jira ; Supabase, Cloudflare, Vercel (**Brancher**, **Changer**, **Débrancher**, **Effacer le jeton**) ; **Mon assistant (Claude, ChatGPT…)** : nom, **Durée du jeton**, **Créer un jeton**, **Copier** (l'adresse ne s'affiche qu'une fois), **Remplacer**, **Révoquer** (cinq jetons au plus). Tout est en lecture seule, sauf l'assistant, qui peut écrire dans un salon à ton nom. |
| **Les documents de l'entreprise** | **Déposer un document** (PDF, Excel, CSV, texte, 10 Mo au plus) ou coller un texte puis **Ajouter ce texte** ; **Retirer** ; **Trier une demande client** : coller un message reçu, puis **Trier et préparer la réponse**, puis **Copier la réponse**. Rien n'est envoyé au client par Léo. |
| **Ce que Léo coûte ce mois-ci** | **Plafond du mois** puis **Fixer** : au-delà, les agents s'arrêtent jusqu'au mois suivant ; **Formule Gratuite / Complète** ; **L'IA des agents** (Auto, ou un modèle précis pour toute l'équipe). |

## Léo — Salons et Équipe

| Bouton | Ce qu'il fait |
|---|---|
| **Chercher un agent, un poste, un salon…** | Filtre la colonne. |
| **Salons / Agents** et **Allumés** | Montre les salons, ou les agents, ou seulement les agents allumés. |
| Un salon | Ouvre la discussion. Le chiffre rond = messages non lus. |
| **+ Agent** (Nouvel agent) | Crée un agent à la main : nom, poste, département, personnalité, ce qu'il ne fait jamais, son IA, fin de mission (intérim) ; **Créer l'agent**. Il peut aussi être pris dans le catalogue des postes. |
| **Renforcer** | Renforcer un service (on décrit ce qu'il fait aujourd'hui) ou prendre un expert pour une mission ; **Voir les agents proposés**, puis **Modifier la demande** ou **Engager (N)**. Avec une date de fin, ce sont des intérimaires qui s'éteignent seuls. |
| **Galerie** | Affiche les agents en grands portraits, filtrables par département. |
| Interrupteur d'un agent | **Allumer / Éteindre**. |
| **Fiche agent** | Ouvre sa fiche (voir plus bas). |

## Léo — Discussion (un salon)

| Bouton | Ce qu'il fait |
|---|---|
| **Retour** (téléphone) | Revient aux salons. |
| **Changer la photo du salon** | Met une image au salon. |
| **Appeler « nom »** (salon privé) | Appel vocal avec l'agent : on touche le micro et on parle, il répond à voix haute ; **Raccrocher**. |
| **Rapport** | Le directeur écrit le rapport du département tout de suite (sinon il arrive seul chaque soir). |
| **Réunion** | Convoque une réunion : **Le format** (vote, avocat du diable, crise…), **Le sujet**, **Autour de la table** (deux à cinq agents allumés), case **Chercher des faits sur Internet avant de commencer**, puis **Ouvrir la réunion**. Pendant la séance : **Intervention**, **Conteste le livrable de…**, **Conclure** ; après : **Écouter la réunion** / **Arrêter**. |
| **Membres** | Montre qui est dans le salon ; **Ajouter / Retirer** des agents en plus de ceux du département. |
| **Tableau des tâches** | Ouvre les tâches. |
| Sur un message : **Répondre**, **Copier**, **En faire une tâche**, **Faire relire par…**, **Un autre emoji**, **Voir en grand**, **Voir le détail / Replier** | Ce qui est écrit. **Sources**, **Vérifié dans la base**, **Relu et corrigé** disent d'où vient la réponse. |
| **Action proposée** par un agent : **Confirmer** / **Refuser** (avec **Pourquoi ?**) | Rien ne part ni ne se modifie sans ce clic. Même chose pour **Activer la compétence…** et **Apprendre à Finia…**. |
| **+** (à gauche du champ) | **Photo**, **Fichier (Excel, CSV, PDF)** lu par l'équipe, **Nommer quelqu'un** (@), et le genre du message : **Info · Question · Proposition · À trancher · Tâche · Réunion** (certains font sonner le téléphone). |
| **/** dans le champ | Commandes : **/reunion**, **/rapport**, **/tache texte**, **/appeler Prénom**, **/regle texte**. |
| **IA : Auto** | Choisit le modèle pour ce message. |
| **Emoji** · **Envoyer** · **Message vocal** / **Arrêter** | Écrire, envoyer, ou parler (l'agent entend le message vocal). Sans réseau, le message attend sur le téléphone et part au retour du réseau. |

Une personne **lecteur** voit tout mais n'a pas le champ d'écriture.

## Léo — Tâches

| Bouton | Ce qu'il fait |
|---|---|
| **Nouvelle tâche** | Ce qu'il faut faire, et pour qui (un agent, **Personne encore (libre)** ou **Mon ordinateur (mon assistant)**) ; **Créer la tâche**. |
| Filtre **Tous** / un département | Trie les colonnes. |
| Livrable rendu : **Valider** ou **Renvoyer** (avec une remarque, et la case **En faire une règle pour toute l'équipe**) | Valide le travail, ou le renvoie : l'agent retient la leçon. |
| **Lui demander où il en est** | L'agent répond dans le salon. |
| **Fermer** | Ferme le tableau (un onglet reste pour le rouvrir). |

## Léo — Fiche d'un agent

| Bouton | Ce qu'il fait |
|---|---|
| **Modifier** | Change son nom, son poste, sa personnalité, ses limites, son IA, sa fin de mission. Cela ne change rien dans les autres entreprises. |
| Interrupteur **Opérationnel / En veille** | L'allume ou l'éteint. |
| **Ses limites** / **Jusqu'où il va sans demander** / **Ses droits** | Ce qu'il peut faire seul et ce qu'il doit faire confirmer. |
| **Ses compétences** : **Qu'il choisisse**, **Chercher une compétence**, **Faire passer l'examen**, **Lire la fiche**, **Activer / Écarter**, **Retirer**, **Emprunter les compétences de… un collègue** | Gère ses fiches d'expert (4 au plus). L'examen compare ses réponses avec et sans la fiche. |
| **Sa mémoire** : **Oublier**, et **Encourager** (ce que tu as aimé) | Ce qu'il retient de ses livrables, renvois et encouragements. |
| **Ce qu'il reçoit avant chaque réponse** | Montre tout ce qu'on lui donne à lire : qui il est, sa mission, les règles de la maison, le contexte, les règles fixes de Léo. |
| **Une autre tête** | Change son visage dessiné. |
| **Sa vraie photo** | ⚠️ Fabrique un portrait : **payant**, comme « De vraies photos ». |
| **Exporter** / **Importer un agent** (**Un fichier…** ou un lien, puis **Lire**) | Emporte sa fiche dans un fichier pour le recréer dans une autre entreprise Léo. |
| **Voir comment il travaille** | Ce qu'il fait maintenant, comment il s'y est pris (modèle, chiffres vérifiés, sources Internet), son coût du jour. |
| **Lui écrire en privé** | Ouvre la discussion à deux. |

## Léo — L'immeuble et les grandes vues

| Bouton | Ce qu'il fait |
|---|---|
| **Le monde 3D · La ville · L'immeuble · Salle de réunion · Académie · Le bureau · L'organigramme** | Les pièces de l'immeuble. Tout ce qui bouge correspond à un vrai travail (message, tâche prise, réunion, formation). |
| **Le monde 3D** | **Quitter la 3D**, **Plein écran**, **Allumer / Couper le son**, **Aller au suivant** (agent suivant au travail), **Convoquer une réunion**, **Faire venir un agent**, **Menu** → **Chez les agents**, **Chez moi**, **Vue de la planète**, **Étages**, **Mon avatar**, **Où habitez-vous ?**, **Revoir l'intro**, **Pause**, **Revoir les chantiers grandir**. **Réessayer** s'il ne s'ouvre pas sur l'appareil. |
| **La ville** | Une tour par projet. **Nouveau projet** (nom, du… au…, but) puis **Créer la tour** ; dans une tour : **Marquer fini**, **Mettre en pause**, **Reprendre**, **Ajouter ici** des tâches sans projet ; **Changer de ville** (le ciel suit l'heure et la météo de la ville choisie). |
| **L'immeuble** | Accueil, salle de réunion, atelier, Académie, avec qui est où. Un agent ouvre un panneau « ce qu'il fait maintenant » ; **Ouvrir sa fiche**. |
| **Salle de réunion** | Les réunions en direct ou terminées, leur compte rendu et leurs actions. |
| **Académie** | Pour chaque agent : compétences, examens ; **Envoyer en formation**. |
| **L'organigramme** | **PNG · SVG · PDF** pour le télécharger. |
| **La frise** | Ce qui s'est passé chaque jour (tâches créées, terminées). |
| **La présentation** | Des diapositives faites de ce qui est dans Léo (projet, équipe, plan, chiffres mesurés) ; **Plein écran**, flèches pour avancer. |
| **Le tableau d'idées** | **Poser** une idée ; **En faire une tâche**, **L'envoyer à l'équipe (Direction)**, **Retirer**. |
| **Le wiki** | **Mettre à jour maintenant** (le directeur l'écrit) ; **Corriger cette page**, puis **Enregistrer / Annuler**. |
| **L'atelier de code** | L'agent « Codeur » écrit dans l'éditeur sous tes yeux. Arbre **Fichiers**, **Enregistrer**, **Télécharger ce fichier**, **Nouveau terminal / Fermer ce terminal**, choix du modèle, et une proposition qui **attend ton accord**. S'ouvre seulement si le serveur de l'atelier est en place et l'entreprise autorisée. |

## Mon argent (`/argent`)

En haut (ordinateur) ou en bas (téléphone), sept onglets :
**Comptes · Budget · Épargne · Njangi · Projets · Analyste · Espaces**.
L'argent s'affiche dans la monnaie de la personne.

| Bouton | Ce qu'il fait |
|---|---|
| **Applications Finjaro** | Revient à la page des applications. |
| **Se déconnecter** | Déconnecte sur cet appareil. |
| **Comptes** : **Ajouter un compte** (nom, solde de départ) puis **Ajouter** / **Annuler** | Ajoute un compte. Le solde total les additionne. |
| **Modifier « compte »** / **Retirer « compte »** | Change le nom ou le solde de départ ; retire le compte. Ses lignes de budget sont gardées, simplement plus rattachées au compte. |
| **Budget** : **Mois précédent** / **Mois suivant** | Change de mois. |
| **Reprendre mes lignes du mois dernier** | Recopie les lignes du mois précédent dans ce mois. |
| **Ajouter une ligne** (Dépense ou Revenu, Quoi, Prévu, Réel) | Ajoute une ligne. « Il te reste » se recalcule. |
| **Épargne** : **Nouvel objectif** (pour quoi, combien il faut) | Crée un objectif. |
| **Ajouter à « objectif »** (montant) · **Modifier** · **Retirer** | Met de l'argent de côté, change l'objectif, ou le retire (ce qui y est noté est perdu). |
| **Njangi** : **Créer un njangi** (nom, montant par tour, fréquence) · **Rejoindre un njangi avec un code** | Crée une tontine, ou en rejoint une avec le code reçu. Chaque njangi montre le tour en cours, pour qui il est, et qui a payé. |
| **Projets** : **Créer un projet** (nom, émoji, objectif) · **Rejoindre un projet avec un code** | Crée une cagnotte commune, ou en rejoint une. Le code d'invitation s'affiche sur la carte. |
| **Analyste** | Aucun bouton à part le mois : sur les comptes, mis de côté, il te reste, entré et sorti, où part l'argent, prévu contre réel, ce qui dépasse le prévu, les six derniers mois. |
| **Espaces** : **Créer un espace** · **Rejoindre un espace avec un code** | Un espace d'argent partagé à plusieurs, avec sa discussion. |
| Dans un espace : **Argent entré** / **Argent sorti** (pour quoi, combien) | Note qui a payé quoi. Sans réseau, c'est gardé sur le téléphone et envoyé au retour du réseau. |
| Dans un espace : **Écrire un message** + **Envoyer le message** | La discussion de l'espace. |
| **Mes espaces** | Revient à la liste des espaces. |

⚠️ **Constat** : dans **Njangi** et **Projets**, aucun bouton ne permet de noter
qu'on a payé son tour ou versé sa part. L'écran affiche qui a payé, mais seul
l'écran ne permet pas de le saisir (le code n'écrit rien dans ces deux
onglets, à part la création et l'entrée par code). À décider : ajouter un
bouton « J'ai payé ce tour » / « Verser ».
