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
