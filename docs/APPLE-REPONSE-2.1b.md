# Réponse à Apple — Guideline 2.1(b) « Information Needed »

Deuxième demande d'informations, **31/08/2026**. Même soumission
`1c6c8e63-4280-4ebd-833e-fdc0cc7e75d0`, examen du 28/08 sur iPad Air 11" (M3)
et iPhone 17 Pro Max, version 1.0 (10).

Apple ne refuse toujours pas l'application. Elle dit: « il semble que l'app
donne accès à du contenu numérique payant, et nous voulons comprendre votre
modèle avant de terminer l'examen. » Quatre questions, toutes autour des
achats intégrés.

---

## Ce qui a déclenché la question

Trois articles publiés par la boutique **Harvice Stream** le 07/08, et
toujours en vente au moment de l'examen:

| Article | Prix | Rayon |
|---|---|---|
| Abonnement IPTV | 30 000 FCFA | hightech_telephones |
| Abonnement Netflix | 2 100 FCFA | hightech_telephones |
| Abonnement Disney + | 3 000 FCFA | hightech_accessoires |

Un examinateur qui parcourt le catalogue voit « Abonnement Netflix » en vente
DANS l'application: il en conclut qu'on vend du contenu numérique, donc que
les achats intégrés devraient s'appliquer.

Beau: « on ne vend pas les articles, on met juste en relation ». C'est exact,
et la réponse le dit. Mais la règle 1.2 oblige l'éditeur à filtrer ce qui est
publié chez lui, et la 5.2 interdit de donner accès à du contenu qui viole
les droits d'autrui — « c'est le vendeur, pas nous » n'exempte pas, ça oblige
à modérer.

Le plus dangereux des trois n'était pas Netflix mais **l'IPTV**: ces
abonnements sont presque toujours du streaming non autorisé, et c'est un
motif de refus pur et simple, pas une question.

## Ce qui a été fait le 31/08

Les trois articles sont **masqués**, pas supprimés: `moderation_hidden_at` +
`is_active = false`, avec un motif que la vendeuse lit dans son espace.
Réversible d'un clic depuis la console.

Vérifié de l'extérieur avec la clé publique, comme un visiteur: la boutique
Harvice Stream ne renvoie plus aucun article, et une recherche
« abonnement » sur tout le catalogue ne renvoie rien.

**Attention pour la suite:** masquer un article demande DEUX écritures.
`moderation_hidden_at` seul ne le retire pas de la vue — les requêtes
publiques filtrent sur `is_active`. C'est bien ce que fait le robot
d'inspection (`moderation-sweep`), mais quiconque le referait à la main
doit le savoir.

---

## Le texte à coller dans « Reply to App Review »

Hello,

Thank you for the questions. Finjaro contains **no paid content, no
subscriptions and no paid features**. Below are detailed answers, preceded by
a description of our model, which we believe explains the confusion.

**Our business model: Finjaro is an intermediary, not a merchant**

Finjaro is an online marketplace. We sell nothing ourselves and we hold no
inventory. Independent sellers — mostly very small businesses and individual
entrepreneurs — open a shop and publish their own catalogue: physical goods
(clothing, shoes, beauty products, household items, school supplies) and
in-person services (plumbing, electrical work, hairdressing, catering,
delivery).

**No payment of any kind is processed in the app.** Finjaro takes no payment,
no commission and no fee. When a buyer places an order, the app notifies the
seller; the two parties then settle directly between themselves — in cash on
delivery, or by whatever local means they choose — entirely outside the app.
No payment processor is active in the application.

Any listing seen during review is a listing published by an independent
seller describing their own offer, not a product sold by Finjaro. The app is
the noticeboard, not the shop.

**How the catalogue is supervised**

We take responsibility for what is published through our platform:

- Every product, shop, video and user profile can be reported by any user,
  directly in the app.
- Users can block any other user.
- An automated review runs every morning over all newly published listings,
  videos and shop descriptions. It removes prohibited content from view
  immediately and flags doubtful content for human decision.
- Following your message, we reviewed the catalogue and removed listings
  offering access to third-party streaming subscriptions, which had been
  published by one seller. The catalogue now contains only physical goods and
  in-person services.

**1. Who are the users that will use the paid content, subscriptions,
features, and services in the app?**

None. There is no paid content, subscription, feature or service in Finjaro.
The app is entirely free for every user — buyers and sellers alike. Opening a
shop is free, listing items is free, and there is no premium tier.

**2. Where can users purchase the content, subscriptions, features, and
services that can be accessed in the app?**

Nothing is purchased from Finjaro, anywhere, at any price. The app displays
catalogues published by independent sellers; any purchase is arranged and
settled directly between the buyer and that seller, outside the app.

**3. What specific types of previously purchased content, subscriptions,
features, and services can a user access in the app?**

None. There is no account to upgrade, no content library, and nothing
unlocked by a purchase made elsewhere. Every feature of the app is available
to every user at no cost.

**4. What paid content, subscriptions, or features are unlocked within the
app that do not use In-App Purchase?**

None. No feature of the app is gated behind any payment.

All goods and services listed are physical items or services performed in the
real world and consumed outside the app. Under App Store Review Guideline
3.1.3(e), these do not require In-App Purchase.

Thank you for your time.

Henri Beau Bayemi
Finjaro

---

## Ce qui reste à décider, hors Apple

La boutique Harvice Stream reste ouverte et son propriétaire n'a pas été
prévenu autrement que par le motif affiché dans son espace vendeur. Beau
voulait gérer la conversation lui-même.
