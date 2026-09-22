# LE PLAN COMPLET — tout ce que Beau a demandé, et où ça en est

Beau, 22/09: « Je suis à 97 % d'utilisation, donc je veux d'abord ce plan
sur tous les sujets — bitmoji et tout, tous les sujets depuis ce matin et
les autres jours. Tu me montres. Ensuite, quand tu seras rétabli, on va
continuer. »

Ce fichier est LA liste. Un seul endroit, tout dedans, rien d'oublié.
Les détails techniques restent dans `PLAN-DE-TRAVAIL.md` et `LEGION-PLAN.md`;
ici c'est la vue d'ensemble, dans l'ordre où on va travailler.

Trois états, et un seul compte vraiment:
- ✅ **FAIT** = en ligne, et Beau ou moi l'avons VU marcher.
- 🔸 **COMMENCÉ** = le code existe, ce n'est pas fini, et je sais ce qui manque.
- ⏳ **À FAIRE** = rien n'est commencé.
- ⏸ **ATTEND BEAU** = je ne peux pas avancer sans lui.

Dernière mise à jour: 22/09/2026, en fin de journée.

---

## A. LE PLUS URGENT — ce qui attend un geste de Beau

Court exprès. Sans ça, je tourne à vide.

| # | Ce qu'il faut de lui | Pourquoi |
| --- | --- | --- |
| 1 | **Appuyer sur « Qu'ils choisissent eux-mêmes »** dans Legion → L'équipe | Le moteur est en ligne, mais je ne peux pas me connecter à sa place: il faut son compte pour lancer. Un clic et les 21 agents choisissent leur tête et leur caractère. |
| 2 | **Renvoyer le logo Legion et le logo Accounting** comme il a envoyé la tirelire | Ces deux-là n'arrivent pas jusqu'à moi comme fichiers — je les vois, je ne peux pas les poser dans le code. La tirelire, elle, est passée. |
| 3 | **Le logo Athlo** | Il a dit qu'il le cherchait. |
| 4 | Open source: on pose une licence ? | Le dépôt est déjà public. Ça ne se reprend jamais. |
| 5 | Les 262 Mo de fichiers orphelins, je supprime ? | Du stockage payé pour rien. |
| 6 | Les 17 e-mails de prospection, j'envoie ? | Écrits, pas envoyés. |
| 7 | MTN / Orange: on ouvre un compte marchand ? | Sept concurrents sur huit ont le Mobile Money. Nous, zéro. |
| 8 | Le jeton Cloudflare est valable sur tout le compte | Lui seul peut le restreindre. |

---

## B. LEGION — l'app d'agents

C'est le gros morceau du jour. Ordre de travail, une partie à la fois.
**Une partie n'est finie que quand Beau l'a vue marcher sur son téléphone.**

### B0. Sortir de Legion — ✅ FAIT
La sortie était une icône d'immeuble sans texte. Beau: « je suis entré, je
n'arrive plus à sortir ». C'est un bouton **« ← Finjaro »**, en ligne.

### B1. Les visages — ✅ FAIT, et ils choisissent eux-mêmes
Beau: « les bitmoji ne sont pas les bitmoji comme sur Snap. Je veux que
chaque agent choisisse lui-même et ait une personnalité. » Puis: « et c'est
eux-mêmes qui ont choisi ? Faire les tourner juste pour choisir. »

Ce qu'il y avait: DiceBear style « notionists », un numéro au hasard.
Mesuré: 21 agents, 21 têtes qui se ressemblent, **0 personnalité**.

Ce qui est en ligne:
- style **avataaars** — celui qui ressemble aux bitmoji Snapchat — avec de
  vrais traits: coiffure, couleur de cheveux, peau, yeux, sourcils, bouche,
  vêtement, couleur, lunettes, barbe;
- un agent sur douze **n'est pas humain**: robot, frimousse, personnage de
  dessin animé. C'est le nounours météo dont Beau parlait;
- **une personnalité par agent**: caractère, façon d'écrire, manie;
- **le moteur qui les fait choisir eux-mêmes** (fonction `legion-se-choisir`):
  chacun lit son poste, son département, son mandat, et décide. Deux
  comptables ne répondent pas pareil;
- chaque fiche dit **« il a choisi lui-même »** ou **« composé par défaut »**,
  pour que Beau sache toujours ce qui est vrai;
- toucher un visage en tire un autre.

**Il reste:** que Beau appuie sur le bouton (point A1). Et plus tard,
choisir une vraie photo du web à la place du dessin.

### B2. L'interrupteur — ✅ FAIT
Beau: « je dois avoir le pouvoir de désactiver et réactiver. »
- un interrupteur **Allumé / Éteint** sur chaque fiche;
- **« Tout éteindre »** et **« Tout rallumer »**;
- un agent éteint ne tourne pas, donc **ne coûte rien**;
- l'écran annonce toujours trois nombres: agents, allumés, qui ont choisi.

### B3. Garder les nécessaires, éteindre les autres — ⏳ À FAIRE
Beau: « quand ils finissent, tu éteins les non nécessaires et on va d'abord
rester avec les nécessaires. »

Ma proposition pour Finjaro (21 agents), **à valider par lui**:
- **On garde allumés (6):** Alpha (technique), Claudinette (comptabilité),
  Vigie (concurrence), Traque (prospection vendeurs), Écho (marketing),
  Lien (relation clients).
- **On éteint les 15 autres** jusqu'à ce qu'il y ait de quoi les occuper.

### B4. La messagerie comme WhatsApp — ✅ FAIT (regardé à 1280 et à 390)
Beau a envoyé quatre maquettes: « voilà exactement ce que je te demande de
faire ». L'écran est maintenant le leur, en Terre & Or:
- le rail des départements, la colonne des salons et des agents avec leur
  interrupteur, la conversation façon WhatsApp Web, le tableau des tâches;
  sur téléphone, quatre onglets (Salons / Discussion / Équipe / Tâches);
- **le clavier d'emojis** (10 familles, recherche en français, récents);
- **les photos** et **les messages vocaux** (rangement `legion`, réservé
  aux membres de l'entreprise);
- la mention **@Nom**, la citation, la copie, « en faire une tâche », les
  réactions groupées;
- **la recherche** d'un agent par nom, poste ou département;
- le dernier message et l'heure sous chaque salon;
- la fiche de chaque agent avec son **niveau d'autonomie** (supervisé /
  semi / autonome).

**Reste:** voir qui est dans un salon; la liste des salons sur téléphone
peut encore montrer le nombre de non-lus.

### B5. L'écran d'accueil et la connexion — ⏳ À FAIRE
Beau: « pour se connecter, ça doit être comme les autres: se connecter avec
Google, avec ton compte Finjaro, ou tu crées un compte. Pas que tout le
monde peut entrer et voir mes choses. »

**Vérifié, et c'est important: ses affaires ne sont PAS ouvertes.** Chaque
table Legion a une serrure en base (`legion_est_membre`): quelqu'un qui n'est
pas membre ne lit rien. Le problème est que l'écran ne le dit jamais.

À faire: un écran d'entrée qui explique Legion en trois phrases, et qui
propose **Google / mon compte Finjaro / créer un compte**. Sa page
`legion_homepage.html` sert de référence de style. (Cette page décrit Legion
comme un cabinet de conseil en carrière: je la prends pour le STYLE, pas
pour la définition du produit — à confirmer.)

### B6. Les agents qui travaillent vraiment — 🔸 COMMENCÉ, le trou principal est bouché
Beau a écrit « salut tout le monde » et personne n'a répondu. **Depuis ce
soir, quelqu'un répond** (fonction `legion-repondre`): l'agent en face dans
un message privé, celui qu'on nomme avec @, sinon le directeur du
département du salon. Il répond avec sa personnalité, en lisant les vingt
derniers messages, et peut se donner une tâche qui apparaît dans le
tableau. Un agent éteint ne répond pas, et l'écran le dit. Un message n'a
qu'une réponse; un agent ne répond jamais à un agent (sinon deux machines
se parlent toute la nuit sur le compte de Beau).

Trouvé en chemin: les tables Legion n'étaient pas dans la diffusion temps
réel — une réponse n'arrivait jamais sans recharger. Réparé (0140).

Il reste tout le reste:

Ce que Beau veut qu'ils sachent faire, dans son ordre à lui:
1. **Se connecter à ses outils** — e-mail, calendrier, Supabase, Drive,
   « comme HappyCapy ». *C'est la première brique: sans accès, un agent ne
   peut que parler.*
2. **Répondre dans les salons**, avec leur personnalité.
3. **Prendre une tâche et travailler en arrière-plan**, puis revenir avec le
   résultat.
4. **Coder en autonomie** — écrire, tester, déboguer, déployer.
5. **Enchaîner des tâches**: recherche → analyse → rédaction → envoi.
6. **Gérer un flux métier**: trier une boîte mail, relancer les impayés,
   tenir le CRM.
7. **S'équiper de compétences prises sur GitHub** — les 571 du catalogue.
8. **Un veilleur qui part chaque matin** chercher de nouvelles compétences,
   sur GitHub et d'autres plateformes gratuites.
9. **Apprendre en travaillant**: chaque tâche finie laisse une note que
   l'agent relit avant la suivante. *Beau: pareil pour Finou et Finia.*
10. **Négocier entre eux** — deux agents qui discutent prix et conditions.
11. **Recherche scientifique** — hypothèses, expériences, analyse.
12. **Naviguer le web / piloter un ordinateur** — possible mais coûteux et
    fragile: à ne pas promettre avant que le reste tourne.
13. *Jouer à des jeux vidéo: pas pour Finjaro.*

### B7. Plusieurs humains dans la même entreprise — ⏳ À FAIRE
Beau: « plusieurs humains peuvent travailler dessus sur le même truc. »
La table des membres existe; l'invitation, non.

### B8. Relié au reste de Finjaro — ⏳ À FAIRE
Beau: « si par exemple il y a une transaction, Accounting doit être au
courant. » Legion branché sur la place de marché et sur Accounting — **pas**
sur ce qui est personnel (Mon argent, Athlo, qui restent privés).

### B9. Ce que ça coûte — ⏳ À FAIRE
Un compteur visible: gratuit, payé, et un plafond que Beau fixe lui-même.
Aujourd'hui rien ne coûte tant que personne n'appuie sur le bouton.

### B10. Les métiers — ✅ FAIT
355 métiers écrits à la main, chacun avec son mandat, et chaque modèle dit
son concept et ses effectifs habituels: produit 267, conseil 88, juridique 82
(dont 21 experts pays), cinéma 81, recherche 74, marché 62, croissance 57.
Effectif libre de 1 à 10 000, réparti exactement.

**Reste:** un modèle « sur mesure » (choisir soi-même ses métiers), et
traduire les postes venus du catalogue qui sont restés en anglais
(« Devils Advocate », « Startup Cto »).

### B11. Le mot « agent » — ⏸ pas tranché
Beau: « agent, agent, ce n'est pas final. » Ça ne bloque rien.

---

## C. LES LOGOS ET LE DESIGN

| Application | Logo | État |
| --- | --- | --- |
| Mon argent | tirelire jaune | ✅ **en ligne** — `finjaro.net/logos/argent.png` |
| Legion | figure ailée | ⏸ **le fichier ne m'arrive pas** |
| Finjaro Accounting | swoosh bleu et orange | ⏸ **le fichier ne m'arrive pas** |
| Athlo | — | ⏸ Beau le cherche |
| Finjaro (place de marché) | — | ⏳ pas de logo fourni |

La plomberie est faite: colonne `logo_url`, et les six points affichent le
vrai logo dès qu'un fichier est là. Beau veut le logo « dans tous les six
boutons et partout ».

**Une remarque, une seule:** la tirelire porte un **$**. Notre règle est
qu'aucune devise ne suppose un pays. C'est son logo, c'est son choix; je le
signale, je ne le change pas.

**⏳ L'écran de Beau est en ANGLAIS** (« Message someone », « Write to the
team »). Ce n'est pas un défaut au sens strict — Finjaro s'adapte à la langue
du téléphone, et c'est voulu pour une place de marché mondiale — mais lui
doit pouvoir forcer le français. À faire: un choix de langue visible.

**⏳ Retravailler le design des applications.** Les applications ne se
ressemblent pas entre elles. Beau parle surtout des **détails** — icônes,
couleurs, libellés — pas d'une refonte. Le style vintage (crème, terracotta,
laiton) reste.

---

## D. LE RESTE DE FINJARO — ce qui n'est pas Legion

### ✅ Fait et vérifié en ligne
- **Mon argent** est une application à part entière (`/argent`), avec ses
  couleurs, sa barre du bas sur téléphone et sa colonne sur ordinateur.
  Comptes, budget, épargne, njangis, projets, analyste, chat d'espace.
- **Le solde d'un compte se calcule** au lieu de se lire.
- **La connexion Google** revient là où on était, au lieu de renvoyer à
  l'accueil.
- **Hors ligne — la lecture**: ce qui a été vu reste lisible sans réseau,
  avec un bandeau « Hors ligne — voici ce que tu avais ».
- **Finjaro Learn** (`/vendor/learn`): ce qu'une vendeuse doit faire pour
  démarrer, avec ses vrais chiffres.
- **La messagerie d'équipe** (`/equipe`): salons, messages privés, tâches,
  réactions, réunions. C'est elle qui est devenue Legion.
- **Legion dans les six points.**

### 🔸 Commencé
- **Le SMS Mobile Money qui remplit Mon argent tout seul** — Claudinette a
  livré le partage depuis le téléphone. Lire les SMS automatiquement est
  interdit par Google Play; le partage manuel, non.
- **Le RH**, chez Claudinette: congés → feuilles de temps → notes de frais.
  ⏸ Beau doit dire par quoi commencer.

### ⏳ À faire
- **Finjaro Planning** — Beau devait envoyer ses captures. Vérifié en base:
  il n'existe aucune table de planning. Ce sera à construire, pas à
  récupérer.
- **Les appels vidéo** (« le truc Google Meet ») — posé de côté le temps de
  finir Learn.
- **Hors ligne — l'écriture**: pouvoir agir sans réseau et que ça parte
  quand le réseau revient.
- **L'ERP complet** (le Dolibarr / ERPNext qu'il a montré): RH, stock,
  achats, projets, CRM. Gratuit, là où Dolibarr prend 14 €.
- **Expert / simple**: deux niveaux de profondeur pour que les experts
  soient à l'aise sans noyer les autres.

---

## E. COMMENT ON TRAVAILLE — ce que Beau m'a repris

Trois reproches de la journée, que je note pour ne pas les refaire:

1. **« Tu ne m'apportes pas de solution, tu te bases juste sur ce que j'ai
   dit. »** → chaque semaine, venir avec quelque chose que personne n'a
   demandé.
2. **« Tu te lances sans avoir réfléchi, sans avoir un plan. »** → ce
   fichier. Une partie à la fois, et on ne passe à la suivante que quand la
   précédente est vue.
3. **« Ça fatigue de faire tout à la fois. »** → ne plus ouvrir cinq
   chantiers le même jour.

Et une règle que je me donne: **ne jamais annoncer qu'une chose marche avant
de l'avoir vue marcher.** J'ai poussé « Mon argent » sans regarder l'écran,
et c'est Beau qui a trouvé la faute avant moi.

---

## F. QUAND ON REPREND — les trois premières choses

1. Beau recharge, passe en français, appuie sur **« Qu'ils choisissent
   eux-mêmes »**, écrit « salut » dans Direction et voit **qui répond**.
   Puis on **éteint les non nécessaires** (B3).
2. Je fais **l'écran d'accueil et la connexion** de Legion (B5).
3. **Se connecter à ses outils** (e-mail, calendrier, Drive) — la première
   brique pour que les agents fassent autre chose que parler (B6-1).
