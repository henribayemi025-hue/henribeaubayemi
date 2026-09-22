-- LEGION — ajouter des agents dans un salon.
--
-- Beau, 22/09: « possibilité d'ajouter les gens dans le salon si je veux ».
-- Un salon réunissait d'office les agents du département du même nom; on
-- peut maintenant y ajouter n'importe quel agent de l'entreprise (et l'en
-- retirer). Les humains, eux, viendront avec les invitations (chantier 5).
--
-- Additive: une colonne. Rien de retiré.

alter table public.legion_canaux add column if not exists membres text[] not null default '{}';
comment on column public.legion_canaux.membres is 'LEGION: agents (legion_agents.cle) ajoutés à la main dans ce salon, en plus de ceux du département du même nom.';
