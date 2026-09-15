# Ce qui reste à faire — tableau partagé entre les deux sessions

Beau (15/09): « j'aimerais que vous deux vous remplissiez tout ce qu'il y a à
faire, d'abord à part, ensuite dans le même ».

Deux sessions Claude travaillent sur l'environnement Finjaro:

- **Alpha** — la place de marché (`henribeaubayemi`), la base Supabase, la
  console d'équipe, les applications mobiles.
- **Claudinette (bêta)** — Finjaro Accounting
  (`Automatisation-des-candidatures`).

Chacune remplit **sa** section. La troisième est commune: on n'y écrit rien
sans le dire à l'autre, parce que ça touche les deux applications.

**Règle de tenue:** un point réglé passe en ✅ avec la date, il ne s'efface
pas. C'est ce qui permet à quelqu'un qui arrive de comprendre l'historique des
décisions.

---

## Partie commune — ne rien y toucher seul

Tout ce qui suit concerne les DEUX applications. Voir la section « Ce qui est
PARTAGÉ » du `CLAUDE.md` de chaque dépôt avant d'y toucher.

| Sujet | État | Qui |
| --- | --- | --- |
| Site URL Supabase = `https://finjaro.net` | ✅ ne bouge jamais (15/09) | — |
| Redirect URLs: les 6 adresses déclarées | ✅ 15/09 | Beau |
| Migrations additives uniquement | règle permanente | les deux |
| Fonctions edge = préproduction ET production d'un coup | règle permanente | les deux |
| `profiles.is_test` / `compte_reel()` dans tout chiffre affiché | règle permanente | les deux |
| Un seul compte utilisateur pour tout l'environnement | acquis | — |

**À décider ensemble, pas encore tranché:**

- Faut-il un `net.finjaro.accounting` distinct sur les magasins, ou une seule
  application avec un sélecteur ? (voir prompt de lancement Claudinette)
- Que se passe-t-il quand une vendeuse existe dans les deux outils: mêmes
  données de boutique, ou cloisonnées ?

---

## Alpha — place de marché, base, mobile

### Bloqué sur une action de Beau

- Déposer le `.aab` Android sur Play Console.
- Envoyer iOS 1.0.1 build 13 en vérification.
- Corriger les textes « camerounaise » dans les deux fiches magasins.
- Créer l'application Meta pour l'API WhatsApp Business.
- Supprimer ses 3 vidéos Beauty hairs (62 Mo, déjà invisibles du public).
- Ouvrir les accès d'Henri: Claude Code, GitHub en lecture, rôle Supabase en
  lecture seule (script prêt dans `docs/ACCES-ANALYSTE-LECTURE-SEULE.md`).

### En attente d'une décision de Beau

- **Bilan hebdo aux vendeuses** — envoi automatique DÉSACTIVÉ le 15/09 à sa
  demande (« demande-moi avant d'envoyer »). Deux formes proposées: n'écrire
  qu'aux boutiques ayant réellement quelque chose (4 sur 42 cette semaine), ou
  transformer le bilan en conseil utile envoyé à toutes. **Ne pas réactiver le
  cron 15 sans son accord.**
- Mobile Money MTN + Orange: pas commencé.
- Série vidéo « transformation vendeuse ».

### À faire, sans blocage

- **Le bilan hebdo ne filtre pas les comptes de test.** Le 14/09 il a annoncé
  « 1 conversation sans réponse » à Décoration évents et Crea Lab — les trois
  conversations en attente venaient toutes des comptes de Beau. À corriger
  avec `compte_reel()` quelle que soit la forme retenue.
- L'événement `comment` se déclenche à l'OUVERTURE du panneau, pas à la
  publication d'un commentaire. Les chiffres qui en découlent sont faux.
- Les tickets Finia (`contacter_finjaro`) n'arrivent que comme pastille dans
  l'admin, sans e-mail ni notification vers Beau.
- « Prix sur demande »: 204 articles sur 409, dont 185 chez 4 boutiques. Beau
  doit d'abord appeler ByFlora kids et MTGBA — **ne rien changer avant**.
- Guider les vendeuses sur la qualité des photos à l'envoi, et signaler celles
  qui portent le filigrane d'une autre marque (question juridique autant
  qu'esthétique).

### Réglé récemment

- ✅ 12/09 — Messages: une seule boîte (boutiques + personnes), Finia ne
  couvre plus le bouton d'envoi, pastille de non-lus.
- ✅ 12/09 — Compression des vidéos avant envoi (89 % de moins, MP4 garanti).
- ✅ 13/09 — Articles et boutiques de test invisibles du public
  (migrations 0125, 0126).
- ✅ 15/09 — Fil personnel: photo en plein écran et transfert d'un message.
- ✅ 15/09 — Les fonctions edge ne confondent plus « secret illisible » et
  « appelant non autorisé » (un passage sur deux échouait en silence).

---

## Claudinette — Finjaro Accounting

*Section à remplir par la session qui travaille sur ce dépôt. Ce qui suit
n'est que ce qu'Alpha peut constater de l'extérieur.*

- ✅ 15/09 — Nouveau domaine `https://accounting.finjaro.net` en service.
- ✅ 15/09 — `CLAUDE.md` créé à la racine du dépôt (il n'y en avait aucun).
- ⚠️ 15/09 — Proposition de changer le Site URL Supabase **refusée**: elle
  aurait cassé la confirmation d'inscription sur finjaro.net. La bonne
  correction était d'ajouter l'adresse dans Redirect URLs. Angle mort, pas
  erreur de compétence — d'où le `CLAUDE.md`.
- À venir: applications Android et iPhone pour Accounting (voir le prompt de
  lancement fourni à Beau le 15/09).
