# Finjaro — les produits d'après, et ce que Beau en a décidé

Finjaro aujourd'hui, c'est **la place de marché + Services** (en ligne) et
**Finjaro Accounting** (en cours). Ce fichier note les pistes suivantes et
la décision de Beau sur chacune, pour ne pas les rediscuter à zéro.

Mise à jour : 11 septembre 2026.

---

## La matière première qu'on a déjà

Des boutiques inscrites, leurs catalogues, leurs conversations, et bientôt
leur comptabilité. Une piste qui s'appuie là-dessus coûte peu ; toute autre
est un produit à construire depuis zéro. C'est le seul critère de tri
honnête aujourd'hui.

---

## 1. Finjaro Pay — **noté, pas maintenant**

Encaisser dans l'application (Mobile Money, carte). C'est le plus gros
levier de la liste : aujourd'hui la vente se conclut hors de l'app, donc on
ne voit ni le chiffre d'affaires réel ni la moindre commission.

**Décision de Beau (11/09) : pas encore — il n'y a pas encore de société.**
Un encaissement pour le compte d'un tiers demande une entité juridique et un
contrat avec l'opérateur ; sans ça la question ne se pose pas. À reprendre
dès que la société existe.

## 2. Finjaro Livraison — **noté, compliqué**

Mettre en relation vendeuse et livreur, suivre le colis. C'est la pièce
manquante de chaque commande, et les livreurs sont déjà un des 48 métiers
de l'onglet Services.

**Décision de Beau (11/09) : compliqué, mais noté.** Ce n'est pas un
problème de code : c'est du recrutement de livreurs, de la fiabilité et de
la responsabilité en cas de perte. Un produit d'opérations, pas de
logiciel.

## 3. Finjaro Crédit — **écarté**

Avancer de l'argent à une vendeuse sur son historique de ventes.

**Décision de Beau (11/09) : à oublier.** Noté comme écarté, pas comme
reporté.

## 4. Finia vendue à part — **à creuser (voir la question ci-dessous)**

L'assistante IA existe déjà et tourne. La vendre à des boutiques qui ne sont
pas sur Finjaro est la piste la moins chère à tester : le code est écrit.

**Point ouvert soulevé par Beau (11/09) : est-ce que ça restera toujours sur
l'API de Google ?**

État réel aujourd'hui :

- Tout ce qui est IA dans Finjaro passe par **Gemini**, chez Google
  (`generativelanguage.googleapis.com`), avec **une seule clé**
  (`GEMINI_API_KEY`) : Finia, l'auto-réponse, la modération, le Miroir IA,
  la vision, la lecture de pièces d'identité, l'évaluation de troc.
- Le code sait déjà basculer entre deux modèles (`gemini-2.5-flash` et
  `gemini-3.5-flash`) si l'un tombe. Il ne sait pas basculer vers un **autre
  fournisseur**.
- Rien n'oblige à rester chez Google : un appel à un modèle, c'est une
  requête HTTP. Mais aujourd'hui cet appel est recopié dans **neuf fonctions
  différentes** — changer de fournisseur voudrait dire les modifier une par
  une.

Ce qu'il faudrait faire, et qui ne coûte presque rien : **regrouper cet
appel à un seul endroit**. Après ça, changer de fournisseur — ou en mettre
deux en secours l'un de l'autre — devient une modification d'un seul
fichier au lieu de neuf. Tant que ce n'est pas fait, on est dépendant d'une
décision de Google (prix, quota, modèle retiré) sur laquelle on n'a aucune
prise. À faire avant, et pas pendant, une vente de Finia à des clients
extérieurs.

## 5. Finjaro Ads — **après**

Mise en avant payante d'une boutique ou d'un article. Simple à construire.

**Décision de Beau (11/09) : après.** C'est le bon ordre : sans trafic
d'acheteurs, une mise en avant ne vaut rien, et on ne peut pas la facturer
honnêtement.

## 6. Finjaro Pro — **noté, pas maintenant**

L'achat entre professionnels : gros volumes, paniers dix fois plus élevés.
Des boutiques comme Lmp sarl (52 équipements de protection) sont déjà
exactement ce marché-là.

**Décision de Beau (11/09) : d'accord sur le principe, mais pas
maintenant.**

---

## Ce qui reste vrai au-dessus de toute cette liste

Un troisième produit n'est pas ce qui manque. Ce qui manque, c'est
l'acheteur : à ce jour, **aucun clic WhatsApp ne vient d'un vrai acheteur**
— tous sont des auto-clics de vendeuses ou des tests. Pay et Livraison
étaient les deux seules pistes qui servaient aussi à faire venir des
acheteurs, et toutes deux sont bloquées pour de bonnes raisons (société,
opérations). Donc d'ici là, l'effort utile est sur la demande, pas sur un
nouveau produit.
