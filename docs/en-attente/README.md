# En attente de l'accord de Beau

## Les tâches citées (02/10) — `legion-travail`

Rigo (Qualité) a renvoyé 15 livrables sans les lire : aucun outil des agents
ne lit une tâche ni son livrable. Correctif écrit et essayé (tests verts,
aucune nouvelle erreur de types) : quand une tâche cite des identifiants de
tâches de LA MÊME entreprise, l'agent reçoit leur intitulé et leur dernier
livrable (24 000 caractères au plus). Vaut pour toutes les entreprises de Léo.

Pas mis en ligne : pousser `supabase/functions/**` déploie la fonction en
production (fonctions communes à staging et prod), et le contrôle de sécurité
a refusé la poussée. Il faut le « oui » de Beau.

Pour l'appliquer : `git apply docs/en-attente/legion-travail-taches-citees.patch`,
puis copier `cites.ts.txt` → `supabase/functions/_shared/cites.ts` et
`cites.test.ts.txt` → `supabase/functions/_shared/cites.test.ts`.
Touche Léo seulement ; Accounting n'est pas concerné.

## L'atelier gratuit / Premium (02/10) — Worker `finjaro-atelier` + `atelier-modele`

Beau : « comme VS Code : ça marche même si tu ne payes pas, seulement
certaines fonctionnalités ne marchent pas ». Écrit et essayé (124 tests de
l'atelier verts, dont `atelier/test/formule.test.js` ; types de la fonction
propres) :

- **Gratuit**, tout compte connecté (Léo ou Learn) : éditeur, fichiers,
  aperçu dans le navigateur, agent sur DeepSeek Flash puis Gemini 2.5 Flash,
  0,05 $ par séance, 0,10 $ par jour et par personne, **2 $ par jour pour
  tout le gratuit réuni** (somme lue avec la clé de service, seul usage de
  cette clé), 5 projets ; pas de terminal ni de commande, pas d'équipe.
- **Premium** : membre d'une entreprise Premium (réglée par l'équipe
  seulement) ou identifiant de `ATELIER_UTILISATEURS` — rien ne change.
- Le relais recalcule la formule lui-même : il ne croit pas le Worker.

Pas mis en ligne : pousser `atelier/` déploie le Worker, et
`supabase/functions/**` la fonction, **en production**. Il faut la phrase
explicite de Beau. L'écran (badge, terminal marqué Premium, `/legion/atelier`)
est déjà sur staging et marche avec l'ancien Worker (il ne montre alors rien
de nouveau).

Pour l'appliquer : `git apply docs/en-attente/atelier-gratuit-premium.patch`
(ou `git stash pop` de « atelier gratuit / Premium »). Touche Léo et Learn ;
Accounting n'est pas concerné (il n'appelle ni le Worker ni ce relais).
Réglages facultatifs de la fonction : `ATELIER_PLAFOND_GRATUIT_JOUR_USD`,
`ATELIER_PLAFOND_GRATUIT_TOTAL_USD`.

## Les outils des agents quand Google ne répond pas (03/10) — `_shared/enquete.ts`

Cause trouvée dans les journaux (03/10, 02 h 30 UTC) : les crédits prépayés
Google (Gemini) sont épuisés (`402 prepayment credits are depleted`). La
recherche web et l'appel d'outils des agents passent par Google ; le moteur de
secours (DeepSeek, Kimi…) prend le relais, mais rendait les paramètres sous
d'autres noms (« query », « lien »), emballés ou entourés de texte : les
agents ont passé la nuit avec des recherches « sans requête » et des pages
« refusées ».

Correctif écrit et essayé (4 tests verts dans `args-relais.test.ts`, aucune
nouvelle erreur de types) : le moteur de secours reçoit un exemple avec les
vrais noms de paramètres, et sa réponse est relue (synonymes, valeur emballée,
JSON entouré de texte). Ne remplace pas les crédits Google : sans eux, la
recherche web (`chercher_web`) reste muette ; la lecture de page et la base
remarchent.

Pas mis en ligne : `supabase/functions/**` est commun à staging et à la
production. Pour l'appliquer : `git apply docs/en-attente/agents-outils-secours.patch`
(ou `git stash pop` de « outils des agents »). Touche Léo seulement.


## modeles-image-google.patch (05/10)

Google a arrêté `gemini-2.5-flash-image` le 02/10 et les modèles « -preview » le 25/06. legion-visuel, legion-portrait et miroir-ia passent à `['gemini-3.1-flash-image', 'gemini-3-pro-image']`. Fonctions communes à staging et à la production : déploiement sur la phrase de Beau. Sans effet tant que les crédits Google ne sont pas rechargés.

## cout-openai-agents.patch (05/10) — URGENT

Depuis la panne des crédits Google (03/10), les agents de Léo passent par OpenAI (`gpt-5.4-mini`). `viaOpenAI` (moteur.ts) ne lisait que la table des prix DeepSeek/Kimi : chaque livrable passé par OpenAI coûtait 0 € dans `ai_usage`. Le plafond du mois (10 € pour Finjaro) ne voyait plus rien et ne pouvait plus arrêter les agents. Dernière ligne `ai_usage` de Finjaro : 03/10 08h47, alors que 33 livrables ont été rendus dans les 14 h précédant le 05/10 06h30. Correctif : la table `PRIX_OPENAI` (prix officiels déjà relevés le 24/09, ceux de relais.ts) passe dans moteur.ts et sert aux deux, plus un message dans les journaux pour tout modèle sans prix. `deno check` sans erreur. Fonction commune → phrase de Beau.
