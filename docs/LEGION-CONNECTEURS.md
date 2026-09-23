# Legion — les connecteurs de chaque utilisateur

Beau, 23/09 : « l'utilisateur de Legion peut connecter SON compte Google,
Gmail… Claude, Astra — comme j'utilise Claude avec des connecteurs et des
compétences » ; « ce n'est pas juste pour moi, je construis pour tous les
utilisateurs et futurs utilisateurs ».

Règle commune à tous les connecteurs : **chaque entreprise branche SES
comptes, avec SES accès** ; ses agents lisent ce qui est branché et rien
d'autre ; aucun secret ne revient jamais à l'écran ; rien ne part en son nom
sans son clic.

## Ce qui est branché aujourd'hui

| Connecteur | Ce que les agents en font | État |
| --- | --- | --- |
| Ma boutique sur Finjaro | ventes, stock, avis, messages en attente | ✅ en ligne |
| Mon dépôt GitHub | derniers changements, tickets ouverts (lecture) ; jeton au coffre | ✅ 23/09 |
| Mesures Finjaro | chiffres de toute la place de marché | ✅ réservé à l'équipe Finjaro |
| Recherche sur Internet | événements, concurrents, prospects, avec sources | ✅ 23/09 (pas un branchement : tous les agents l'ont) |

## Google (Agenda, Drive, Gmail) — pour chaque utilisateur

**Comment ça marchera :** un bouton « Brancher mon Google » ; Google demande
à l'utilisateur ce qu'il autorise ; Legion garde son accès au coffre ; les
agents lisent son agenda, les fichiers qu'il a choisis, et préparent des
e-mails qu'il envoie d'un clic.

**Ce qu'il faut d'abord — le geste de Beau (une fois pour tous les
utilisateurs) :**
1. Aller sur console.cloud.google.com avec le compte de Finjaro, créer un
   projet « Finjaro Legion ».
2. « API et services » → activer Google Calendar API et Google Drive API.
3. « Écran de consentement OAuth » → type Externe, nom « Finjaro », logo,
   adresse de contact, domaine finjaro.net, politique de confidentialité.
4. « Identifiants » → « ID client OAuth » → Application Web, adresse de
   retour : `https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-google`.
5. Me donner l'**ID client** (pas le secret dans le chat : on le range
   ensemble dans les secrets du serveur).

**Ce que Google exige, dit franchement :**
- Agenda et « fichiers choisis de Drive » : vérification de l'application
  par Google (quelques jours à quelques semaines), gratuite.
- **Lire les e-mails Gmail** est un accès « restreint » : Google demande en
  plus un audit de sécurité payant par un cabinet agréé. Proposition :
  commencer par Agenda + Drive + **envoyer** un e-mail préparé (accès
  « sensible », sans audit) ; la lecture de Gmail plus tard.

## Brancher son propre Claude (ou un autre assistant) sur Legion

L'idée de Beau, retournée dans le bon sens : plutôt que Legion appelle
Claude avec la clé de quelqu'un (refusé : pas de clé Anthropic), c'est
**l'assistant de l'utilisateur qui se branche sur Legion**. Le standard
existe : un serveur « MCP » (le protocole des connecteurs de Claude, repris
par d'autres assistants). Legion en exposerait un par entreprise :
- lire les salons, la feuille de route, le tableau des tâches ;
- donner un ordre à un agent, cocher une ligne de la feuille de route ;
- avec l'autorisation de l'utilisateur, révocable.

Ainsi quelqu'un qui travaille dans Claude (ou un autre assistant compatible)
parle à SON équipe Legion sans quitter son outil. À construire après
Google ; plan et coût présentés avant.

## Ordre de travail

1. ✅ GitHub par entreprise.
2. ⏸ Google : attend le projet Google de Beau (étapes ci-dessus).
3. 📅 Le serveur MCP de Legion (brancher son Claude).
4. 📅 Accounting dans Legion : les quatre fonctions de lecture de
   Claudinette (feu vert de Beau le 23/09).
