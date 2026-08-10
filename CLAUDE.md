# Finjaro — ce qu'il faut savoir avant de toucher au code

Ce fichier existe parce que Beau a dû répéter certaines choses plusieurs fois.
Tout ce qui est ici est une décision prise, pas une suggestion.

## 1. Finjaro est une place de marché MONDIALE

**Finjaro n'est pas une application camerounaise.** C'est une place de marché
pour le monde entier — l'ambition est celle d'Amazon, pas celle d'un annuaire
régional.

Le Cameroun est une **stratégie de démarrage**: c'est là qu'on commence, parce
qu'il faut bien commencer quelque part et que c'est le marché que Beau connaît.
Ce n'est pas l'identité du produit.

Conséquences concrètes, à respecter sans exception:

- **Aucun texte visible ne doit enfermer Finjaro dans un pays.** Pas de « le
  marché camerounais », pas de « partout au pays ». J'ai commis exactement
  cette faute le 10/08 dans les écrans d'accueil du premier lancement, et elle
  est partie en production. C'est ce qui a provoqué ce fichier.
- **Aucune devise « par défaut » qui suppose un pays.** Quelqu'un en
  Angleterre voit des livres, quelqu'un au Cameroun des FCFA, quelqu'un au
  Canada des dollars canadiens. Retomber sur FCFA pour un pays inconnu est
  interdit — Beau: « je ne veux plus jamais entendre ça ».
- **Pas de mention publique de « diaspora ».** Le ciblage diaspora existe dans
  la logique interne; il n'apparaît jamais dans l'interface ni la
  communication.
- FCFA reste l'unité de STOCKAGE en base (`price_fcfa`). C'est un détail
  technique interne, jamais une préférence d'affichage.

## 2. Deux points de vue sur un prix, à ne pas confondre

- **Acheteur**: le prix s'affiche dans SA monnaie à lui (`Price`, via
  `useSettings`). Il veut savoir ce que ça lui coûte.
- **Vendeur**: ses écrans affichent la devise de SA boutique (`VendorPrice`,
  via `currencyForCountry(shop.country)`). Elle a saisi ses prix dans cette
  monnaie; les relire dans une autre n'a aucun sens.

La détection automatique du pays se trompe facilement: sans fuseau horaire
exploitable, elle retombe sur la langue du système, et un téléphone
camerounais réglé en « fr-FR » annonce la France. Ne jamais faire dépendre les
chiffres d'un vendeur de cette détection.

## 3. Vérité des contenus

- **Aucun chiffre inventé ou exagéré** dans quoi que ce soit de visible:
  nombre de vendeuses, de commandes, de téléchargements. Si le chiffre n'est
  pas mesuré, il ne s'écrit pas.
- **Aucune photo d'article prise sur le web.** Les visuels viennent des
  vendeuses ou de Beau.

## 4. Base de données — contrainte forte

Le projet Supabase `bokwivwizghdlaedczbw` est **partagé avec deux ou trois
applications tierces** qui utilisent le même `auth.users`.

- Les migrations restent **additives**. Pas de suppression de colonne, pas de
  renommage, pas de suppression de compte.
- Les fonctions edge sont **communes à staging et à la production**: les
  déployer touche les deux d'un coup.

## 5. Branches et mise en ligne

- Travail: **`staging`** → https://staging-finjaro.finjaro.workers.dev
- Production: **`claude/finjaro-marketplace-build-xsripr`** → https://finjaro.net
- **Cloudflare déploie tout seul** à chaque poussée, via sa propre intégration
  Git. La CI GitHub ne fait que compiler: une CI verte ne prouve PAS qu'une
  version est en ligne.
- Les applications Android et iOS chargent `https://finjaro.net`: une mise en
  ligne atteint les utilisateurs sans repasser par les magasins.
- **Ne jamais ouvrir de pull request sans que Beau l'ait demandé.**

## 6. Style — c'est celui de Beau, pas le mien

Crème, terracotta, laiton, grands titres: c'est le « style vintage » que les
gens ont aimé. Ne pas le raboter au nom de la sobriété. Quand Beau parle de
design, il parle le plus souvent des **détails** (icônes, couleurs, libellés),
pas d'une refonte.

Une capture d'écran de téléphone ne suffit pas à valider un changement
visuel: le harnais de test ne rend que 390 px de large, et un recadrage qui
passe sur mobile peut couper un visage en deux sur un écran large.

## 7. Qui est Beau

Fondateur, francophone, **il ne code pas** et il a un emploi à côté. Il dicte
souvent ses messages à la voix, donc le texte arrive parfois déformé — lire
l'intention, pas la lettre. Lui annoncer qu'une chose est faite alors qu'elle
ne l'est pas lui coûte du temps qu'il n'a pas.
