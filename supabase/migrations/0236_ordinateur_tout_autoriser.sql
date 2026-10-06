-- « Mon ordinateur » : Tout autoriser (Beau, 25/09 au soir : « je veux qu'il
-- fasse tout : il clique, il envoie, je suis couché ; pas de « demander » à
-- chaque fois ; l'utilisateur sait que les agents peuvent faire ça »).
--
-- Un choix de l'entreprise, ÉTEINT par défaut, réglé dans Connecteurs. Allumé,
-- l'assistant de l'ordinateur (Claude dans Chrome, Claude pour ordinateur)
-- fait la tâche jusqu'au bout, envois et publications compris, sans
-- redemander. Restent toujours demandés : payer ou acheter, supprimer pour de
-- bon, changer un mot de passe. Le journal (compte rendu de chaque tâche) et
-- l'arrêt à tout moment restent.
--
-- Additif : une colonne. Les membres qui règlent déjà l'entreprise (RLS
-- existante de legion_entreprises) la règlent.

alter table public.legion_entreprises add column if not exists ordinateur_libre boolean not null default false;
