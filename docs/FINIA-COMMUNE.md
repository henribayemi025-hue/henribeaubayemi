# La Finia commune — contrat pour Finjaro Accounting

À l'attention de **Claudinette** (la session qui travaille sur Finjaro
Accounting, dépôt `henribayemi025-hue/Automatisation-des-candidatures`).
Écrit le 24/09/2026 depuis le dépôt de la place de marché. **Rien n'a été
écrit dans le dépôt d'Accounting**, et aucune table d'Accounting n'est lue ni
écrite par ce qui suit.

## D'où ça vient

Beau, le 24/09 à 22 h : « oui Finia commune », « oui Accounting », que Finia
apprenne des conversations des gens : oui, « les utilisateurs choisissent
s'ils veulent », « tout ça sera dans la politique de confidentialité ». Puis à
22 h 15 : le réglage est **allumé par défaut** (on peut le refuser), à
condition que ce soit dit clairement la première fois, réglable d'un geste,
et écrit dans la politique de confidentialité.

Une seule Finia pour toutes les applications : un **savoir commun** validé
par un humain, et un **carnet d'apprentissage anonyme** alimenté par les
applications. Même boucle que « Léo apprend tout seul » : une proposition,
puis le « Confirmer » d'un membre de l'équipe Finjaro. Rien ne s'active seul.

## État : V0, côté place de marché seulement

- Migration `supabase/migrations/0202_finia_commune.sql` (dépôt de la place
  de marché). **Pas encore appliquée** tant que ce document n'a pas été
  relu : vérifie dans la base que les tables ci-dessous existent avant de
  t'y brancher.
- La Finia de la place de marché (`finou-chat`) lit déjà les savoirs et
  signale les échanges utiles. Celle d'Accounting se branchera ensuite, par
  ce contrat.

## Les noms (pourquoi ils ne peuvent pas se confondre avec les tiens)

Tes tables sont en `finia_*` (`finia_workspaces`, `finia_members`,
`finia_events`). La place de marché a aussi, pour la liaison commande →
vente, `finia_fx_rates` et `finia_liaison_log` (0127). **Rien de la Finia
commune ne commence par `finia_`** : tout est en `ia_`, comme `ia_traces`
(0167, place de marché). Liste vérifiée le 24/09 sur le projet
`bokwivwizghdlaedczbw` : aucune table `ia_savoirs_communs`,
`ia_apprentissage`, `ia_consentements` ni `ia_pays_accord_explicite`
n'existait avant.

| Objet | Rôle | Qui écrit | Qui lit |
| --- | --- | --- | --- |
| `ia_savoirs_communs` | ce que Finia sait, validé par un humain | la boucle de la semaine (proposé, éteint) ; `legion-action` (Confirmer) | toute application : **seulement les lignes `actif`** (politique RLS) |
| `ia_consentements` | l'accord de chaque personne, **commun à toutes les applications** | fonctions `ia_consentement_*` | la personne, sa propre ligne |
| `ia_pays_accord_explicite` | pays où l'on demande un « oui » d'abord (vide aujourd'hui) | l'équipe, à la main | fonctions seulement |
| `ia_apprentissage` | échanges utiles, anonymisés, 12 mois au plus | `ia_apprendre()` seulement | clé de service (la boucle), `ia_questions_frequentes()` |

## 1. Lire le savoir commun

Depuis le navigateur (clé anonyme ou jeton de la personne, peu importe :
un savoir actif ne contient aucune donnée personnelle) :

```js
const { data } = await supabase
  .from('ia_savoirs_communs')
  .select('id, titre, texte, langue, portee, valide_le')
  .eq('actif', true)
  .in('portee', ['accounting', 'toutes'])
  .order('valide_le', { ascending: false })
  .limit(200);
```

Champs :

- `titre` (≤ 120 caractères), `texte` (≤ 600) : une consigne écrite pour
  Finia (« Quand on te demande…, … »).
- `langue` : `fr`, `en` ou `toutes`. Finia sait traduire : la langue sert à
  départager, pas à exclure.
- `portee` : `marketplace`, `accounting`, `leo` ou `toutes`. **Ne lis que
  `accounting` et `toutes`.**

Règles :

1. Ne verse pas tout dans la consigne : prends les **3 ou 4 savoirs dont
   les mots touchent le plus la question**, 600 caractères chacun au plus.
   La place de marché fait exactement ça dans
   `supabase/functions/_shared/savoirs.ts` (`savoirsPour`) : tu peux recopier
   la méthode (mots de plus de 3 lettres, sans accents, un point par mot
   commun, à égalité le plus récent).
2. Garde la liste en mémoire quelques minutes (5 chez nous) : pas une
   lecture par message.
3. Ta Finia n'a pas d'IA aujourd'hui (réponses locales) : tu peux déjà
   montrer un savoir quand la question le touche, tel quel. Quand elle aura
   un modèle, ajoute-les à sa consigne sous un titre du genre « Ce que
   l'équipe Finjaro a vérifié ».
4. **Tu n'écris jamais dans cette table.** Un savoir se propose par la boucle
   de la semaine, ou par l'équipe dans Léo ; il s'active par un humain.

## 2. L'accord de la personne (le même que sur la place de marché)

Un seul accord pour tout l'environnement : si la personne a refusé sur
finjaro.net, c'est refusé chez toi aussi, et inversement. Trois fonctions,
appelées **avec le jeton de la personne connectée** (jamais pour un invité) :

| Appel | Rend | Quand |
| --- | --- | --- |
| `rpc('ia_consentement_etat')` | `{ connecte, choix, informe, accord_explicite, par_defaut, permis, compte_reel }` | à l'ouverture de ta Finia |
| `rpc('ia_consentement_informer', { p_app: 'accounting' })` | rien | **au moment où tu montres la phrase** (voir plus bas) |
| `rpc('ia_consentement_regler', { p_oui, p_app: 'accounting' })` | le nombre d'échanges effacés | le réglage, ou la réponse à la question |

Règles :

1. Si `compte_reel` est `false` (compte de test ou de l'équipe) : rien n'est
   jamais gardé ; ne montre ni phrase ni question.
2. Si `informe` est `false` et `accord_explicite` est `false` : montre, **de
   façon visible, dès l'ouverture**, une phrase du genre « Quand je ne sais
   pas répondre, ou si tu me corriges, l'échange m'aide à m'améliorer —
   anonymisé, sans ton nom ni tes coordonnées. Tu peux refuser ici. », avec
   un lien vers le réglage, et appelle `ia_consentement_informer`. **La base
   ne garde rien tant que cette phrase n'a pas été montrée.**
3. Si `accord_explicite` est `true` et `choix` est `null` : pose une question
   Oui / Non à la place de la phrase, et appelle `ia_consentement_regler`.
4. Le réglage « Aider Finia à s'améliorer » : case cochée si `permis`.
   Décocher appelle `ia_consentement_regler({ p_oui: false })`, qui **efface**
   aussi tout ce qui avait été gardé de cette personne (toutes applications).
   Sur la place de marché, il est dans Réglages (`/profile/settings#finia`) :
   tu peux y renvoyer au lieu de dupliquer le réglage.

## 3. Envoyer une question sans réponse (ou une correction)

Un seul appel, **avec le jeton de la personne** :

```js
await supabase.rpc('ia_apprendre', {
  p_app: 'accounting',
  p_genre: 'sans_reponse',     // ou 'correction', ou 'pouce_bas'
  p_question: 'ce que la personne a demandé',
  p_reponse: 'ce que Finia a répondu',          // facultatif
  p_correction: null,                           // pour 'correction' : ce que la personne a répondu
  p_langue: 'fr',                               // la langue de l'écran
  p_ecran: '/tableau',                          // le chemin, sans paramètre
});
// → true si l'échange est gardé, false sinon (refus, invité, compte de test, limite du jour)
```

Ce que la base fait pour toi (tu n'as rien à vérifier toi-même) :

- elle ne garde **rien** si la personne ne l'a pas permis, n'a pas vu la
  phrase, est un compte de test ou de l'équipe (`compte_reel()`), ou n'est
  pas connectée ;
- elle **nettoie** le texte avant de le ranger (`ia_nettoyer`) : e-mails,
  téléphones (8 chiffres et plus), adresses, noms après une présentation ou
  une civilité, le nom du compte lui-même, pseudos, liens, numéros de
  commande et suites longues de chiffres ;
- elle ne range **aucun user_id** : seulement une empreinte de la semaine
  (sel secret + compte + semaine), qui sert à compter les personnes et à
  effacer en cas de refus ;
- 30 échanges par personne et par jour au plus ; effacement après 12 mois.

Ce que TU dois respecter :

1. **Seulement les échanges utiles** : une question à laquelle ta Finia n'a
   pas su répondre, une correction de la personne, un pouce vers le bas. Pas
   toute la conversation, pas les bonjours.
2. **Jamais de chiffres de la comptabilité** : pas de montant, pas de nom de
   client ou de fournisseur, pas de libellé d'écriture. Si la question
   contient ces éléments, envoie la question **sans eux** (« combien j'ai
   gagné en [mois] ? ») ou ne l'envoie pas. Le nettoyage de la base ne
   reconnaît pas un nom de client comme « Établissements Nana ».
3. Ne lis jamais `ia_apprentissage` directement (tu ne peux pas : aucune
   politique ne le permet, c'est voulu).

## 4. Ce qui se passe ensuite

- Le lundi à 7 h UTC, la fonction `finia-apprentissage` (commune à staging et
  à la production) lit les échanges de la semaine, fait proposer au plus 5
  savoirs par le moteur commun, les relit sans modèle (aucune donnée
  personnelle, aucun nombre absent des échanges, jamais « diaspora »), puis
  Mentor les présente dans Léo (entreprise Finjaro, salon « À valider ») avec
  « Confirmer » / « Écarter ». Portée `accounting` : les tiens.
- Les agents de Léo (Écho, Traque, Plume, Lien…) lisent un **résumé anonyme**
  des questions de la semaine (`ia_questions_frequentes`, outil
  `questions_finia`). Les échanges d'Accounting y figurent avec `app:
  'accounting'`.

## Avant de te brancher

- Dis-le à Beau : ça touche la vie privée des gens d'Accounting, et la
  politique de confidentialité d'Accounting doit dire la même chose que celle
  de la place de marché (article 4 de `src/legal/privacy.js`, version 1.1).
- Vérifie que la migration 0202 est appliquée (`ia_consentement_etat` doit
  répondre).
- Aucun changement de Site URL ni de redirection n'est nécessaire.
