# Finjaro — chaque page, chaque bouton, ce qu'il fait

Demandé par Beau (audit du 01/10 : « un document où il y a chaque page, chaque
bouton, ce que chaque bouton fait »). Relevé **automatiquement** dans un vrai
navigateur, au téléphone (390 px) et sur ordinateur (1440 px), puis décrit à la
main. Aucun bouton n'a été « essayé pour de vrai » (rien n'est commandé, envoyé
ou publié pendant le relevé).

- **Partie 1 — Visiteur sans compte** (21 pages) : ci-dessous, relevée le 01/10
  sur la préproduction.
- Partie 2 — Acheteuse connectée : à venir.
- Partie 3 — Vendeuse (espace boutique) : à venir.
- Partie 4 — Léo, Mon argent, Learn : à venir.

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
