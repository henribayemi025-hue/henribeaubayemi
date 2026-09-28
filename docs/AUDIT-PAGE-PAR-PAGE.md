# Audit page par page — Finjaro

Demandé par Beau le 28/09 : « ce qu'il faut faire, c'est un audit complet page
par page de toutes les fonctionnalités » et « l'objectif, à part les vidéos,
c'est d'aller page par page sur Finjaro et Accounting, le design etc. »

Ce fichier grandit au fil des passages. Chaque constat est **mesuré** : soit sur
la base de production en se faisant passer pour une visiteuse (`set local role
anon`), soit sur le fichier réellement servi par finjaro.net — jamais sur une
simple lecture du code.

---

## Méthode, et pourquoi elle a changé

Le 28/09 au matin j'ai annoncé deux défauts qui **n'existaient pas**. Les deux
fois, la cause est la même : j'avais lu le code des écrans et conclu qu'un
filtre manquait, **sans regarder ce que la base fait toute seule**.

Depuis, la règle est : avant d'annoncer qu'un filtre manque, vérifier les
politiques RLS, les déclencheurs et les fonctions serveur — puis **compter le
résultat réel en se faisant passer pour une visiteuse**.

---

## ✅ Corrections de mes propres constats

### 1. Les boutiques de test ne sont PAS visibles au catalogue

C'est le point **A4** du rapport. Mon audit du matin disait « 65 articles de
test sur 466, soit 14 % du catalogue ». **C'est faux.**

Mesuré en production, en se faisant passer pour une visiteuse non connectée :

| | |
|---|---|
| Articles visibles | **406** |
| Dont articles de comptes de test | **0** |
| Boutiques visibles | **66** |

La base les écarte toute seule, par deux politiques RLS :

- `products_read` : `is_active = true AND NOT boutique_de_test(shop_id)`
- `shops_read` : `status = 'active' AND NOT boutique_de_test_par_id(id)`

Ces deux fonctions remontent bien jusqu'à `profiles.is_test`. J'avais cherché
le filtre dans les écrans, il était en base — au meilleur endroit, celui qu'on
ne peut pas oublier.

**Conséquence : A4 n'est plus une décision à prendre.** Il n'y a rien à cacher.

### 2. La modération cache bien les boutiques et les articles

J'ai annoncé que le fil d'accueil « ignorait `moderation_hidden_at` », donc
qu'une boutique masquée s'afficherait quand même. **Ce n'était pas vrai non
plus.** Bloquer un contenu ne pose pas seulement l'horodatage :

- un article passe aussi `is_active = false`
- une boutique passe aussi `status = 'suspended'`

et le déclencheur `garde_moderation()` empêche la vendeuse de revenir en
arrière toute seule. Les deux champs que l'accueil filtrait déjà suffisaient
donc.

La migration 0214 que j'ai appliquée **ne répare rien** : elle ajoute une
ceinture en plus de la bretelle. Elle est juste et sans effet de bord — un
futur code qui ne poserait que l'horodatage serait couvert — mais je ne la
compte pas comme une correction.

---

## 🔴 Défaut réel n° 1 — les frais de livraison sont saisis en FCFA, pour tout le monde

**Écran : Ma boutique → Zones de livraison (`/vendor/shop`).**

Le champ était étiqueté **« Frais (FCFA) »** quelle que soit la boutique, et le
nombre tapé partait **tel quel** en base :

```js
fee_fcfa: Math.max(0, Math.round(Number(z.fee_fcfa) || 0))
```

Aucune conversion. Une vendeuse en France qui tape « 5 » en pensant 5 €
enregistre **5 FCFA**, soit moins d'un centime — et l'acheteuse voit « 0,01 € »
de livraison. Même chose pour le champ « Frais de livraison » plus bas.

C'est deux règles cassées à la fois : la devise de la vendeuse (point 2 du
guide) et **aucun texte visible n'enferme Finjaro dans un pays** (point 1).

**Personne n'a encore été touché** : une seule boutique hors Cameroun a des
zones, elle est en Côte d'Ivoire (même unité) et ses frais sont à 0. Le piège
était armé, il n'avait pas encore servi.

**Corrigé** : saisie et relecture dans la devise de la boutique, conversion en
FCFA au moment d'enregistrer (le FCFA reste l'unité de stockage), et les deux
libellés portent maintenant la devise. Arrondi à deux décimales pour qu'un
aller-retour ne rende pas « 4,999999 » là où elle avait tapé 5.

---

## 🔴 Défaut réel n° 2 — un article survit à sa boutique

La règle d'accès de `products` ne regarde que deux choses :

```
is_active = true AND NOT boutique_de_test(shop_id)
```

Elle **ne regarde pas l'état de la boutique**. Un article reste donc lisible
quand sa boutique, elle, ne l'est plus — suspendue par la modération, ou
retirée. Mesuré en production, comme une visiteuse : **1 article dans ce cas.**

Un seul aujourd'hui, mais la fiche boutique le filtrait déjà (elle fait une
jointure stricte) tandis que **la recherche, les rayons et Finia ne le
faisaient pas** : l'article s'affichait avec un nom de boutique vide, et le
clic menait vers une fiche qui n'existe plus. Le nombre grandira à chaque
suspension.

**Corrigé** dans les quatre écrans concernés (recherche, rayons, Finia, fiche
article) : la boutique doit exister et être visible pour que l'article le soit.
Un article orphelin donne maintenant une page « introuvable », ce qui est la
vérité.

Corriger la règle d'accès elle-même serait plus propre — un seul endroit au
lieu de quatre — mais ça touche la lecture de tout le catalogue en production.
À faire posément, pas un vendredi soir.

---

## 🟠 Ce que voit vraiment une visiteuse — les chiffres du catalogue

Mesuré comme une visiteuse non connectée, comptes de test exclus par la base :

| | Nombre | Part |
|---|---|---|
| Articles visibles | 406 | |
| **Sans description** | **271** | **67 %** |
| Sans aucune photo | 2 | 0,5 % |
| Stock à zéro | 2 | 0,5 % |
| Nom trop court (< 4 lettres) | 0 | |
| Boutiques visibles | 66 | |
| **Boutiques sans aucun article** | **20** | **30 %** |

Deux points à regarder, dans cet ordre :

1. **20 boutiques vides sur 66.** Une visiteuse qui ouvre l'annuaire tombe une
   fois sur trois sur une page sans rien. C'est pire qu'un article sans prix :
   il n'y a rien à regarder du tout. Elles ne sont pas toutes récentes :
   **38 jours d'ancienneté en moyenne**, la plus ancienne **58 jours**, et
   **11 n'ont même pas de photo de boutique**. Cinq seulement ont été ouvertes
   ce mois-ci — les autres ont eu le temps, et ne sont pas revenues.
2. **67 % des articles n'ont pas de description.** Sur une place de marché en
   paiement à la livraison, où la confiance est tout, une fiche sans un mot
   d'explication laisse l'acheteuse seule avec une photo.

Les photos et les stocks, eux, sont sains : 2 articles sur 406 dans chaque cas.

---

## 🔴 Défaut réel n° 3 — une commande sans compte ne reçoit jamais rien

Déjà relevé dans le carnet du 28/09, repris ici parce qu'il appartient à
l'audit du parcours acheteur.

Le déclencheur qui prévient l'acheteur d'un prix proposé, d'une confirmation ou
d'un refus écrit à `buyer_id`. **Une commande passée sans compte n'a pas de
`buyer_id`** : la notification ne part vers personne, en silence.

Mesuré sur 60 jours : 12 commandes, 3 sans compte, **2 d'entre elles refusées**.
Deux personnes refusées sans jamais l'apprendre. Et le cas vivant : la commande
**FJ-4Y8MK2**, 15 000 FCFA proposés par Patysha le 27/09 à 21 h 25 — l'acheteur
n'a **reçu aucune notification** et n'a toujours pas répondu.

Ce n'est pas un défaut d'affichage : c'est le parcours qui s'arrête. À réparer
avec la messagerie Finjaro → utilisateur (point B2, passé en urgent par Beau).

---

## ✅ Ce qui a été vérifié et qui va bien

- **Publier un article sans prix est impossible.** Le formulaire refuse
  d'enregistrer sans prix, sauf si la vendeuse coche « prix sur demande ».
  Compté en base : 184 avec prix, 222 sur demande, **0 sans ni l'un ni l'autre**.
  Les 222 viennent de dépôts en masse — ByFlora kids 93 articles le même jour,
  MTGBA 50, Lmp sarl 24 — où tout a été coché « sur demande » plutôt que de
  saisir les prix un par un. C'est une corvée de saisie, pas une faille.
- **Le panier accepte « prix sur demande »** et ne fait pas payer : il met en
  relation, la vendeuse chiffre, l'acheteur accepte ou refuse.
- **Aucun texte visible n'enferme plus Finjaro dans un pays** : après la
  correction des zones de livraison, il ne reste aucun « FCFA » en dur dans les
  textes des deux langues, hors la note qui explique la parité du franc CFA
  avec l'euro — qui est un fait, pas un positionnement.

---

## À faire au prochain passage

- Parcours acheteur : fiche article, recherche, annuaire, panier, commande —
  écran par écran, sur un vrai téléphone et sur grand écran.
- Espace vendeuse : les écrans qu'on n'a pas encore ouverts (statistiques,
  finances, classement, apprendre).
- Les 19 boutiques vides : leur proposer quelque chose, ou ne pas les montrer.
