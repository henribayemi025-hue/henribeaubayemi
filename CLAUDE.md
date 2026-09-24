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

## 8. Ce qui est PARTAGÉ entre les applications Finjaro — lire avant de toucher

Finjaro n'est plus une application mais un **environnement**: plusieurs
applications, **un seul projet Supabase**, **un seul `auth.users`**.

| Application | Adresse | Dépôt |
| --- | --- | --- |
| Finjaro (place de marché) | `https://finjaro.net` | `henribayemi025-hue/henribeaubayemi` |
| Finjaro Accounting | `https://accounting.finjaro.net` | `henribayemi025-hue/Automatisation-des-candidatures` |
| Console Finjaro (équipe) | `https://finjaro-admin.finjaro.workers.dev` | place de marché |

Projet Supabase commun: **`bokwivwizghdlaedczbw`** (production, eu-west-3).
Projet de test: `qiyvoaljqmbfldephobp`.

Chaque application est correcte chez elle et peut casser l'autre **sans le
savoir**, parce qu'on ne voit qu'un dépôt à la fois. D'où les règles
ci-dessous. Elles ne sont pas des préférences: ce sont des pannes déjà
évitées de justesse.

### Le Site URL de Supabase ne se change JAMAIS

`Authentication → URL Configuration → Site URL` reste
**`https://finjaro.net`**, quoi qu'on développe.

Ce réglage est **global au projet**, pas propre à une application. Il sert de
base aux liens des e-mails d'authentification. Or `signUp()` de la place de
marché ne passe **aucun `emailRedirectTo`** (voir `src/hooks/useAuth.jsx`):
le lien de confirmation de chaque nouvelle inscription est donc construit à
partir du Site URL.

Le mettre sur une autre application ferait atterrir **toute personne qui
s'inscrit sur finjaro.net** dans un outil qui n'est pas le sien, sans pouvoir
valider son compte. Les inscriptions sont aujourd'hui la seule chose qui
fonctionne vraiment sur Finjaro — c'est exactement ce qu'il ne faut pas
casser.

Proposé le 15/09 par une session travaillant sur Accounting, refusé pour
cette raison. Sans angle mort: depuis ce dépôt-là, la proposition paraissait
logique.

### Pour qu'une application revienne chez elle après connexion

On **AJOUTE** son adresse dans `Redirect URLs`, on ne déplace rien:

```
https://finjaro.net/**
https://accounting.finjaro.net/**
https://finjaro-admin.finjaro.workers.dev/**
https://staging-finjaro.finjaro.workers.dev/**
```

Le `/**` est nécessaire: on revient sur la page exacte, pas sur la racine.
Et le code appelant doit passer `redirectTo`. Supabase **ignore en silence**
une adresse absente de cette liste et retombe sur le Site URL — c'est ce qui
faisait rebondir Accounting vers finjaro.net, sans le moindre message
d'erreur.

Une entrée ne se retire que lorsque plus aucune application ne sert à cette
adresse.

### Les autres réglages communs

- **Migrations additives**, toujours. On ajoute; on ne supprime pas une
  colonne, on ne renomme pas, on ne supprime pas un compte. Le projet est
  aussi partagé avec deux ou trois applications tierces sur le même
  `auth.users`.
- **Les fonctions edge sont communes** à la préproduction et à la production:
  en déployer une touche les deux d'un coup.
- **Les tables ne se mélangent pas.** Celles d'Accounting ne sont pas celles
  de la place de marché, et inversement. On ne lit pas celles de l'autre sans
  que Beau l'ait décidé.
- **`profiles.is_test` et `compte_reel()`** valent pour tout l'environnement:
  aucun chiffre montré à quelqu'un ne doit inclure les comptes de test.

### En cas de doute

Un changement qui touche l'authentification, le Site URL, les redirections,
`auth.users`, une fonction edge ou une migration **concerne les deux
applications**. On le dit à Beau avant, en nommant l'autre application qui
peut être affectée. Il n'a pas à arbitrer entre deux avis qui s'ignorent.

## 9. Tout noter — ordre de Beau (24/09)

« Tout ce que je t'envoie, note ça. Note, note, note. » Chaque demande,
lien, capture ou idée de Beau est écrite **le jour même** dans
`docs/A-FAIRE.md`, section 0 « Carnet de Beau », même si on est occupé
ailleurs, et même si elle ne sera traitée que plus tard. Y figurent aussi ce
qu'on attend de lui (décisions, clés, essais sur téléphone) et ce qu'on a
promis sans l'avoir encore fait. On coche ✅ avec la date, on ne supprime
jamais. Les ressources d'entraînement ont en plus leur fiche dans
`docs/vestiaire/`.

## 10. Toujours partager le travail avec les agents de Léo — ordre de Beau (24/09)

« Dans tous nos futurs travaux, tu dois toujours diviser les tâches entre Léo
et toi. Des fois, donne-leur les trucs durs, comme ça ils s'entraînent. Après,
tu vérifies ; s'ils ont mal fait, tu corriges. »

- Chaque chantier se découpe : une partie pour moi, une partie pour les agents
  de l'entreprise Finjaro dans Léo (et Claudinette pour Accounting).
- Une tâche d'agent = une ligne `legion_messages` (`genre 'tache'`,
  `assigne_a`, `meta.statut 'a_faire'`, `meta.par_claude true`), puis
  `legion-travail` (chaque agent prend sa tâche ouverte la plus ancienne, une
  par jour).
- Régulièrement une tâche **difficile** (`meta.difficile true`).
- Je relis chaque livrable : ce qui est juste est repris, ce qui est faux est
  corrigé et dit à l'agent (c'est comme ça qu'il apprend). Rien de ce qu'un
  agent produit n'est annoncé à Beau sans cette relecture.
- Ce que les agents construisent ne doit jamais être réservé à Beau : tout
  utilisateur de Léo doit pouvoir avoir des agents aussi capables.
- **Une remarque de Beau en cours de route ne fait pas dérailler le travail**
  (24/09, minuit) : on la NOTE tout de suite dans le carnet, et on termine
  ce qu'on faisait avant de passer à la suite du plan. « Sinon tu vas
  embrouiller encore tellement de choses. »
