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
