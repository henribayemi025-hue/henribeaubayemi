-- Le dernier passage de chaque agent, lisible par les membres de
-- l'entreprise (Beau, 28/09, B9 : « ça doit être dans les deux » — la raison
-- d'un choix doit être dans le journal lisible, pas seulement dans le
-- journal technique de la fonction).
--
-- legion-travail y écrit, à chaque passage : quand, s'il a livré, et sinon
-- pourquoi (budget du mois atteint, aucune IA disponible, tâche déjà en
-- cours, pas de tâche ouverte, livrable vide…). La fiche de l'agent l'affiche
-- en tête de son journal des choix.
--
-- Additif : une colonne. Les membres lisent déjà legion_agents (RLS
-- existante) ; seul le serveur écrit cette colonne.

alter table public.legion_agents add column if not exists dernier_passage jsonb;
