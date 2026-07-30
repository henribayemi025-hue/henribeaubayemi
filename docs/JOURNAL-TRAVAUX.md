# Journal des travaux — Finjaro

_Ce qui a été fait sur le projet, regroupé par sujet plutôt que par date.
Établi à partir de l'historique Git réel, pas de mémoire._

Un thème revient souvent: **plusieurs des problèmes les plus graves n'avaient
été signalés par personne.** Ils ont été trouvés en allant vérifier le code
plutôt qu'en supposant qu'il faisait ce qu'il annonçait. Ils sont marqués
🔎 ci-dessous.

---

## 1. Miroir IA — de complètement cassé à fonctionnel

L'essayage virtuel renvoyait une erreur 502 **à chaque tentative**, sans
exception.

**Cause réelle**: l'API Gemini accepte les champs en `snake_case` mais répond en
`camelCase`. Le code ne lisait que la forme `snake_case`, donc il ne trouvait
jamais l'image pourtant bien renvoyée. Corrigé en lisant les deux formes.

Améliorations apportées ensuite:
- Bascule vers un modèle conçu pour la ressemblance des visages
- La vraie photo du produit est envoyée à l'IA, plus seulement son nom
- Conseil de cadrage selon la catégorie (poignet pour une montre, pieds pour des
  chaussures…)
- Choix explicite «Prendre une photo» / «Choisir une photo», au lieu de forcer
  l'appareil photo
- Connexion demandée **avant** d'ouvrir l'outil, pas après avoir tout rempli
- Nouvel essai automatique si l'IA répond du texte au lieu d'une image
- La vraie raison du refus est affichée, au lieu d'un message générique inutile

---

## 2. Sécurité

Audit complet mené sur demande («attaque le site»). Corrigé:

- **Élévation de privilèges** — un compte pouvait s'accorder des droits qu'il
  n'avait pas
- **Listing des fichiers du stockage** trop permissif
- **Aucune limite d'appel sur les fonctions IA** 🔎 — n'importe qui pouvait
  marteler l'API et brûler tout le budget Gemini. Quota par compte et par
  adresse IP ajouté
- **Plafond de dépense IA** (20 €/mois) avec alerte automatique
- **Performance des règles de sécurité** — `auth.uid()` était réévalué à *chaque
  ligne* examinée au lieu d'une fois par requête. Invisible sur 114 articles,
  mais c'était le principal coût en cas de vrai trafic. 47 règles corrigées,
  uniquement sur les tables Finjaro

Détail complet dans `docs/AUDIT-SECURITE-2026-07.md`.

---

## 3. Images et rapidité

**🔎 82 % du catalogue était invisible.** Les images pointaient vers un domaine
qui n'existait plus depuis la migration vers Cloudflare. Personne ne l'avait
signalé — les photos ne s'affichaient tout simplement pas.

- Vignettes légères générées pour toutes les grilles et tous les avatars
- Icônes de catégorie réduites de 640 à 480 px (830 Ko → 345 Ko)
- Carrousel d'accueil: seules les diapositives voisines sont chargées, au lieu
  des 8 d'un coup
- Deux vraies causes de lenteur corrigées sur l'accueil — **mesurées, pas
  supposées**

---

## 4. Finou Chou — d'une bavarde à une assistante qui agit

Au départ, Finou ne faisait que parler: elle inventait des produits et des prix.

Elle interroge désormais **réellement** la base et peut agir:

| Outil | Ce qu'elle fait |
|---|---|
| `search_products` | Cherche de vrais articles, vrais prix, vrai stock |
| `get_trending_products` | Les articles les plus vus |
| `get_my_orders` | Les commandes de la personne connectée |
| `get_my_shop_stats` | Chiffre d'affaires réel d'une vendeuse |
| `find_shops` | Boutiques par nom, ville, pays |
| `add_to_cart` | Ajoute au panier après accord explicite |
| `message_shop` | Écrit à une boutique à la place de l'utilisatrice |
| `follow_shop` | Abonnement à une boutique |
| `create_product` | Crée une fiche article pour une vendeuse |
| `set_rotation` | Règle les arrivages tournants |

**Deux garde-fous importants**, tous deux ajoutés après des tests qui ont révélé
un vrai problème:
- Tous les outils s'exécutent avec les droits de l'utilisatrice, jamais en
  administrateur — même si le modèle demandait les commandes de quelqu'un
  d'autre, la base refuserait
- 🔎 Finou a été prise en train d'annoncer «c'est fait !» pour un ajout au
  panier qui avait en réalité échoué. Rien n'avait été ajouté (la sécurité a
  tenu), mais le message mentait. Consigne d'honnêteté renforcée et revérifiée

Ajouté aussi: **la dictée vocale**.

---

## 5. Arrivages tournants — nouvelle fonctionnalité

Pour les vendeuses qui travaillent par arrivage: les articles quittent le
catalogue automatiquement après N jours (7 par défaut), un robot passe chaque
nuit, et la vendeuse est prévenue.

Trois choses trouvées en construisant:

- **🔎 Aucun moyen de publier ou retirer un article n'existait dans l'app.**
  Les fiches créées par Finou (volontairement en brouillon) étaient donc
  invisibles **pour toujours**. Bug préexistant, sans rapport avec la rotation,
  mais qui l'aurait rendue inutilisable. Bouton ajouté
- Le compte à rebours partait de la date de *création*: un article republié
  aurait été supprimé la nuit suivante. Corrigé avec une date de publication
- «Mes articles» séparé en trois onglets (En ligne / Brouillons / Arrivages
  passés) pour ne pas noyer les vrais brouillons

**Un point où j'avais tort et où Beau avait raison**: j'avais refusé la
suppression réelle, par peur de casser l'historique des commandes. Vérification
faite, c'était faux — les commandes gardent une copie du nom et du prix, et
l'app supprimait déjà pour de bon ailleurs. La rotation supprime donc vraiment,
comme demandé.

---

## 6. Notifications par e-mail

Le seul canal était la notification navigateur. **Sur iPhone, elle ne fonctionne
que si le site a été ajouté à l'écran d'accueil** — donc une bonne partie des
utilisatrices ne recevait jamais rien.

- E-mail ajouté via Resend, domaine `finjaro.net` vérifié
- 🔎 Défaut corrigé au passage: l'ancien code abandonnait dès qu'aucune
  notification navigateur n'était trouvée — il aurait donc privé d'e-mail
  exactement les personnes qui en avaient le plus besoin
- Réglage «Recevoir les e-mails» dans les paramètres
- Les adresses restent dans `auth.users`, jamais recopiées: une table publique
  avec les adresses de tout le monde serait une fuite ambulante
- **🔎 `support@finjaro.app` était affiché comme adresse de contact** — avec un
  `.app`, pas `.net`. Ce domaine n'existe pas: tout message envoyé là rebondissait
  sans que personne ne le sache. Remplacé par `fin.finjaro@gmail.com`

Livraison confirmée par les journaux Resend, vers une adresse tierce.

---

## 7. Interface et affichage

- **iPhone**: le clavier faisait sauter la page, la barre de navigation flottait
  au milieu de l'écran, des icônes se superposaient. Corrigé (champs à 16 px,
  hauteur d'écran suivant le clavier)
- **🔎 Fiche produit géante sur ordinateur** — cette page était la seule sans
  limite de largeur: la photo occupait tout l'écran avant même le nom et le prix
- **🔎 Les avis n'apparaissaient jamais sur une fiche produit** — la page les
  cherchait par article, alors que le formulaire les enregistre par *commande*.
  Cette section serait restée vide pour toujours
- Boutiques sans photo: dégradé propre à chaque boutique avec son initiale, au
  lieu d'un cadre gris «image cassée». Bannières et avatars
- Miroir IA et Finou rendus visibles depuis l'accueil et les grilles — avant, il
  fallait déjà savoir qu'ils existaient
- Photos jamais recadrées: fond flou plutôt que couper un visage
- Mot de passe oublié, commentaires sur les reels, deux photos de démonstration
  portant une marque tierce remplacées

---

## 8. Catégories

- **Maroquinerie** ajoutée (15ᵉ), juste après «Sacs»
- «Mannequinerie» existait déjà — c'était une confusion de nom, pas un manque

---

## Ce qui reste

Voir `docs/PROJET-FINJARO.md` §7. En résumé: quelques améliorations prêtes à
construire, quatre décisions produit en attente, et toute la partie paiement en
phase 2 — bloquée pour une raison administrative, pas technique.
