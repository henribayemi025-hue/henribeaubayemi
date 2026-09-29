-- LA VOIX DES AGENTS (Beau, 29/09 : « vraiment humanise, ils doivent être
-- comme les humains, lancer des blagues, troller… va sur GitHub et sur le
-- net regarder les dépôts des gens »).
--
-- Ce que montrent les projets étudiés (docs/vestiaire/48-voix-humaine.md) :
-- une liste d'adjectifs (« chaleureux, drôle ») ne suffit pas ; ce qui donne
-- une voix, ce sont des EXEMPLES de répliques (SillyTavern : « 2 à 3
-- échanges apprennent la voix mieux que des paragraphes »). Chaque agent
-- reçoit donc quelques répliques types, écrites dans SA personnalité par le
-- professeur (legion-former), et legion-repondre les lui montre.
--
-- Additif : une colonne nouvelle. Propre à Léo.
alter table public.legion_agents add column if not exists voix jsonb;
comment on column public.legion_agents.voix is
  'Exemples de répliques de l''agent (sa voix) : [{"on_lui_dit": "...", "il_repond": "..."}]. Écrits par legion-former.';
