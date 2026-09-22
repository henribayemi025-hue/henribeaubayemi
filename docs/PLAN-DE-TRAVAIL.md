# Le plan de travail — tout ce que Beau a demandé, et où ça en est

Beau, 22/09: « n'oublie pas de faire les plans, parce que mine de rien je te
donne beaucoup de travail, donc note pour que tu n'oublies rien ».

Ce fichier est fait pour ÇA. Il se relit d'un coup d'œil et se met à jour à
chaque fois qu'une ligne bouge. Une chose qui n'est pas ici sera oubliée.

Trois colonnes de vérité:
- **✅ FAIT** = en ligne, vérifié sur le site servi, pas seulement compilé.
- **🔸 EN COURS** = commencé, pas fini, et on sait ce qui manque.
- **⏸ ATTEND BEAU** = je ne peux pas avancer sans une décision ou une action
  de sa part. C'est la colonne la plus importante: elle me coûte zéro et
  elle bloque tout.

Dernière mise à jour: 22/09/2026.

---

## ⏸ CE QUI ATTEND UNE DÉCISION DE BEAU

Rien de tout ça n'avance tant qu'il n'a pas répondu. C'est court exprès.

| # | La question | Pourquoi ça bloque |
| --- | --- | --- |
| 1 | ~~« Mon argent »: application à part ou onglet ?~~ | **Tranché par l'usage**: Beau voulait le voir dans les six points. C'est fait, via l'adresse `finjaro.net/profile/argent`. Une adresse propre (`money.finjaro.net`) reste possible plus tard, sans rien casser. |
| 2 | ~~« Mon argent » en production ?~~ | **EN LIGNE**, vérifié sur le site servi. |
| 3 | **Open source: on pose une licence ?** | Le dépôt est DÉJÀ public. Poser une licence ne se reprend jamais. |
| 4 | **Par quoi je commence côté RH ?** | Congés, feuilles de temps, ou notes de frais. |
| 5 | **Les 262 Mo de fichiers orphelins, je supprime ?** | Du stockage payé pour rien. Je ne supprime rien sans son mot. |
| 6 | **Les 17 e-mails de prospection, j'envoie ?** | Écrits, pas envoyés. |
| 7 | **Le jeton Cloudflare est valable sur tout le compte** | C'est lui qui doit le restreindre, je ne peux pas. |
| 8 | **`.claude/settings.local.json`** | Bloqué en écriture de mon côté. C'est lui qui doit changer les permissions. |
| 9 | ~~Athlo ne se connecte plus~~ | **Réveillé** le 22/09 sur son ordre. Le forfait gratuit n'autorise que 2 projets actifs: `finjaro-staging` est donc **en pause**. finjaro.net et la comptabilité ne sont pas touchés; ça me prive seulement de l'endroit où je répète les migrations. |

---

## 🔸 EN COURS

### Finjaro Planning
Beau: « il y avait aussi Finjaro Planning, attends je t'envoie ». **J'attends
ses captures.** Vérifié en base en attendant: il n'existe AUCUNE table de
planning, d'agenda ou de créneaux. Seulement `events` (journal technique,
8 695 lignes) et `finia_events` — ce ne sont pas ça. Donc contrairement à
« Mon argent », il n'y a pas de données à récupérer: ce sera à construire.

### « Mon argent » — l'écran est COMPLET
Tout ce que ses captures de l'ancienne application montraient existe
maintenant. Fait le 22/09, dans cet ordre:
- le **solde d'un compte se calcule** au lieu de se lire (`accounts.balance`
  est le solde de départ, pas celui du jour);
- **modifier et retirer** un compte;
- l'onglet **Analyste** — mois contre mois, où part l'argent, prévu contre
  réel, six mois en barres;
- le **chat** d'un espace partagé;
- l'**épargne**: le total mis de côté, modifier, retirer, et un montant
  LIBRE à la place des « + 1 000 / + 5 000 » qui supposaient des FCFA;
- **créer** son propre projet, njangi ou espace — avant on ne pouvait que
  rejoindre celui d'un autre avec un code.

Il reste **à le regarder à l'écran avec les vraies données** avant de dire
qu'il marche. Et Beau doit trancher: application à part, ou onglet.

### « Mon argent » est une application À PART — tranché par Beau le 22/09
Devant la première version en ligne: « c'est quoi cette merde, ça doit être
un truc à part entière comme Finjaro Accounting, je t'ai envoyé les photos
même les couleurs ». Puis: « comme Athlo, version ordi et téléphone ».

**Fait le jour même, et regardé à l'écran avant de pousser cette fois:**
- adresse `/argent`, hors de la place de marché — ni sa barre, ni Services,
  ni son crème; la présentation du premier lancement et la bannière
  d'installation n'y entrent plus;
- ses couleurs à elle (`money.*`): noir, violet, les six pastilles de compte
  qui étaient déjà en base; barre du bas sur téléphone, colonne à gauche sur
  ordinateur;
- la monnaie choisie à côté de chaque montant, sans conversion.

**Leçon, écrite pour ne pas la refaire:** j'avais compilé et poussé sans
regarder. Beau l'a vue avant moi. `video-work/voir-mon-argent.mjs` rend
l'application aux deux largeurs avec de vraies formes de données — il a
attrapé un plantage de l'onglet Analyste que la compilation ne voyait pas.

**Reste, plus tard:** une adresse propre (`money.finjaro.net`) plutôt que
`finjaro.net/argent`. Ça demande un enregistrement DNS et une route
Cloudflare; rien ne casse en attendant.

### Retravailler le DESIGN des applications
Demandé par Beau le 22/09.

Ce que ça ne veut PAS dire: une refonte. Quand Beau parle de design, il parle
le plus souvent des **détails** — icônes, couleurs, libellés (CLAUDE.md §6).
Le style vintage — crème, terracotta, laiton, grands titres — est celui que
les gens ont aimé; on ne le rabote pas au nom de la sobriété.

Ce qui saute aux yeux aujourd'hui, et qui est vrai:

- **Les applications ne se ressemblent pas entre elles.** « Mon argent » est
  l'ancien Finjaro repeint aux couleurs de la place de marché; Accounting a
  les siennes; Athlo est noir et vert. Quelqu'un qui passe de l'une à l'autre
  par les six points a l'impression de changer de maison. C'est le premier
  chantier, et c'est celui que les six points rendent visible.
- **Le sélecteur d'applications** lui-même: quatre carrés désormais, sans
  hiérarchie ni état (laquelle est à moi, laquelle dort).
- **« Mon argent » n'a pas été regardé à l'écran** avec de vraies données,
  seulement compilé. Sept onglets sur une barre à 390 px, c'est beaucoup.

⚠️ **Une capture de téléphone ne suffit pas à valider un changement visuel**:
le harnais ne rend que 390 px de large, et un recadrage qui passe sur mobile
peut couper un visage en deux sur un écran large.

**Réponse de Beau, par l'exemple, le 22/09:** chaque application garde SON
style. « Mon argent » est noir et violet comme le premier Finjaro, Athlo est
noir et vert, la place de marché reste crème et terracotta. Ce qui est
commun, c'est le compte et les six points — pas les couleurs.

### Le SMS Mobile Money qui remplit « Mon argent » tout seul
Beau, 22/09: « est-ce possible que Finjaro aille fouiller les messages de la
personne pour sortir ses finances et mettre à jour son Mon argent si elle
oublie de le faire ? »

**Ce que j'ai répondu d'abord était trop catégorique, et Beau a eu raison
d'insister** (« mais l'app Finjaro est dans le tél »). Vérifié dans le dépôt
plutôt que de mémoire:

Finjaro n'est PAS une simple page web enveloppée. C'est **Capacitor**
(`capacitor.config.json`, dossiers `android/` et `ios/`), donc un vrai projet
natif, qui demande déjà `CAMERA` et `ACCESS_FINE_LOCATION`. Ajouter une
permission et un greffon natif est dans nos cordes.

**Donc, précisément:**
- **Sur Android: techniquement POSSIBLE.** Le mur n'est pas le téléphone,
  c'est **Google Play**: `READ_SMS` et `RECEIVE_SMS` sont des permissions
  sous contrôle. Il faut remplir une déclaration et entrer dans une courte
  liste d'usages autorisés — « lire les SMS Mobile Money » n'y figure pas.
  Des applications de finance s'y sont cassé les dents. Le risque n'est pas
  un refus technique, c'est le retrait de l'application du magasin.
  (L'API « SMS Retriever », elle, n'est pas contrôlée — mais elle ne lit que
  les messages portant une signature destinée à notre application. Un SMS de
  MTN ou d'Orange ne l'a pas.)
- **Sur iPhone: vraiment impossible.** Aucune interface n'existe, pour
  personne, quel que soit le type d'application.
- **Dans le navigateur: impossible aussi** (`WebOTP` lit un code à usage
  unique, rien d'autre).

**Ce que ça donne en clair:** ça marcherait pour une partie des utilisateurs
seulement, au prix d'un risque sur la présence dans le Play Store.

**Trois chemins qui marchent, du plus faisable au plus lourd:**
1. **Elle PARTAGE le SMS** — appui long sur le message MoMo → « Partager » →
   Finjaro. Un geste, aucune permission, et ça marche dans une application
   web installée (Web Share Target). Finia lit le message et crée la ligne.
   **C'est celui que je ferais.**
2. **Capture d'écran ou copier-coller** — la vision de Finia existe déjà
   (idée 16). Zéro code natif.
3. **L'API Mobile Money MTN / Orange** — officiel, avec l'accord de la
   personne, et ça donne l'historique complet au lieu de messages isolés.
   C'est l'idée 9.

**Ce qui n'est pas technique et qui compte autant:** une application qui lit
TOUS les messages de quelqu'un se fait désinstaller. Le partage volontaire
donne le même résultat, marche sur les DEUX systèmes, ne demande aucune
autorisation, et se laisse expliquer en une phrase.

**Rien n'est décidé. À dire par Beau.**

### Hors ligne
Demandé par Beau le 22/09. Le service worker existe déjà et met la coque en
cache: **l'application s'ouvre sans réseau, mais elle est vide.** Ce qui
manque, c'est garder les données et mettre les écritures en file d'attente.
Règle retenue: **hors ligne on AJOUTE, on ne MODIFIE pas** — détail dans
`IDEES-FINJARO.md` §10. Par quoi commencer: la vente au comptoir.

### Le RH qui manque, par ordre de difficulté
La grille d'un ERP est déjà couverte aux trois quarts (détail dans
`IDEES-FINJARO.md` §7). Ce qui manque vraiment:
1. **Demandes de congé** — le statut « congé » existe dans `Staff`, le
   circuit demande → réponse non. Petit.
2. **Feuilles de temps** — heures par personne et par jour. Petit, et ça
   nourrit la paie qui existe déjà.
3. **Notes de frais de l'employé** — il photographie un reçu, on rembourse.
   `Expenses` est la sortie comptable; l'entrée manque.
4. **Bons d'expédition** — détachés de la commande.

Gros et sans demande mesurée, à ne pas ouvrir: recrutement, fabrication,
enquêtes, gestion d'association.

### Le partage avec Claudinette — réglé le 22/09

**Elle prend** — et c'est en cours chez elle:
- **L'avertissement des seuils**: FAIT et en ligne. Trois moments, un seul
  message à la fois — 10 M (comptabilité + DSF au 15 mai), les neuf dixièmes
  du seuil de reclassement, puis le dépassement. Hors du Cameroun il se tait.
- **Le RH**, dans l'ordre: congés, feuilles de temps, notes de frais. Les
  bons d'expédition en dernier, et seulement si quelqu'un les demande.

**Le carnet de crédit: je l'avais proposé à tort.** Il existait déjà chez
elle — écran Créances, solde par tiers, relance, règlement partiel. Elle a
vérifié avant de commencer au lieu de me croire, et ça a évité du travail
perdu. Ce qu'elle a fait à la place est mieux: à la caisse, choisir une
cliente montre maintenant ce qu'elle doit **déjà**, et depuis combien de
jours. C'est le geste du cahier — regarder la page avant d'ajouter une
ardoise.

**Elle est d'accord sur le mode simple/expert: non.** Le seuil des 10 M est
le premier « ça apparaît quand ça sert ».

**Je garde « Mon argent ».** Aucun chevauchement.

---

## ⏸ POSÉ DE CÔTÉ, SUR SA DÉCISION

- **Finjaro Work** — migration `0134` et écran écrits, appliqués au projet de
  TEST seulement, non branchés. Beau: « ne lance pas encore ». Question non
  mesurée: combien de boutiques ont plus d'une personne ?
- **Covoiturage**, **dépôt d'applications**, **vente de l'API**,
  **microfinance** — raisons écrites dans `IDEES-FINJARO.md` §4.

---

## 📌 LE PRIX — ce que Beau a relevé aujourd'hui

Dolibarr est un logiciel libre, mais son hébergement se paie: **14 € HT par
mois et par instance**, 30 jours d'essai. Beau: « mais nous on fait
gratuitement dans le travail ».

⚠️ **Règle qui ne bouge pas:** dans tout ce qui est visible, on écrit
**« gratuit jusqu'en novembre »**, jamais « gratuit » tout court. Promettre
la gratuité pour toujours est une promesse qu'on ne pourra pas tenir.

---

## 💡 LES 20 IDÉES DU 22/09 — état de chacune

Elles étaient dans `IDEES-FINJARO.md` §3 et pas ici; Beau les a réclamées.
Le détail et les raisons restent là-bas, l'ÉTAT est ici.

★ = seul Finjaro peut le faire, parce qu'il a les commandes, les livres et Finia.

### Vendre
| # | Idée | État |
| --- | --- | --- |
| 1 | ★ Appel vidéo depuis la fiche article | à faire |
| 2 | ★ Vente en direct | à faire |
| 3 | ★ Commande vocale | à faire |
| 4 | Essayage virtuel | **existe déjà**, en Premium, sous-utilisé |
| 5 | ★ Le prix conseillé | à faire |

### L'argent
| # | Idée | État |
| --- | --- | --- |
| 6 | ★ Carnet de crédit | ✅ **existait déjà chez Claudinette**, et elle a ajouté l'ardoise à la caisse |
| 7 | ★ Avance sur ventes | à faire |
| 8 | Tontine / njangi | ✅ **en ligne** dans « Mon argent » |
| 9 | Mobile Money MTN + Orange | pas commencé |
| 10 | ★ Achat groupé | à faire |

### L'équipe
| # | Idée | État |
| --- | --- | --- |
| 11 | Pointage, paie, CNPS | ✅ pointage et paie existent (`Staff`); congés et feuilles de temps **en cours chez Claudinette** |
| 12 | ★ Preuve de livraison | à faire |
| 13 | ★ Écart de caisse | à faire |
| 14 | Réassignation d'une tâche | posé avec Finjaro Work |

### Finia
| # | Idée | État |
| --- | --- | --- |
| 15 | ★ Vocal → décisions → tâches + écritures | à faire |
| 16 | Photo → fiche article complète | la vision **existe déjà** |
| 17 | ★ Finia répond la nuit | l'autoreply **existe et dort** — à réveiller |
| 18 | Traduction automatique des fiches | à faire |

### Les autres métiers
| # | Idée | État |
| --- | --- | --- |
| 19 | ★ Rendez-vous pour les prestataires | la page Services **existe déjà** |
| 20 | Hors ligne complet | 🔸 **le prochain que je prends** |

**Les trois que je garderais si Beau doit choisir:** le 17 (il existe et il dort
— le moins cher), le 1 (la vidéo, la sienne), le 7 (ce qui rend Finjaro
irremplaçable).

---

## ✅ FAIT — en ligne et vérifié

| Quoi | Où |
| --- | --- |
| Annulation automatique d'une commande sans réponse | production |
| Fermeture de 14 fonctions ouvertes à tout compte connecté | production |
| Finia connaît Finjaro Accounting et l'ouvre par un BOUTON | production |
| Liens cliquables dans les réponses de Finia | production |
| Le bouton de commande ne refuse plus en silence | production |
| Montant en espèces dans la monnaie qu'on va tendre | production |
| La visite guidée ne recouvre plus l'écran de paiement | production |
| Démonstration `/demo` | production |
| « Mon argent »: comptes, budget mensuel, épargne, njangi, projets, espaces | préproduction |
| Le budget redevient mensuel (colonne `period` enfin filtrée) | préproduction |
| Le solde d'un compte se calcule au lieu de se lire | préproduction |
| Modifier et retirer un compte | préproduction |

---

## 🗓 LE RESTE, qui n'est pas oublié

- **Athlo** (`Ton suivi sport, poids et calories`, sur Netlify) tourne sur son
  PROPRE projet Supabase `tyemqrbosgjvvnagypgu` — rien à voir avec Finjaro,
  et rien de ce qu'on a changé ne l'a cassé. Il est simplement **en pause**:
  un projet gratuit s'endort tout seul après une semaine sans usage. Il se
  rallume, mais il n'y a que deux places actives sur le forfait gratuit.

- **Écrire à l'acheteuse bloquée** au paiement, et appeler les deux boutiques
  dont quelqu'un a cliqué pour les joindre. (Beau, pas moi: le dépôt est
  public, aucun nom ne s'écrit ici.)
- **`alert_admins` n'a aucun contrôle d'appelant** — à revoir déclencheur par
  déclencheur avant de la fermer.
- WhatsApp Business API.
- Publication Play Store et App Store.
- Les textes « camerounaise » dans les fiches des magasins d'applications.
- Mobile Money MTN et Orange.
