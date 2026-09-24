-- LEGION / Léo — un modèle précis pour UN agent (Beau, 24/09 : « Ada sur
-- DeepSeek Pro pour le code, les autres sur Flash »). Additif : vide = le
-- choix de l'équipe (legion_entreprises.modele, 0193), puis Auto.
alter table public.legion_agents add column if not exists modele text;
comment on column public.legion_agents.modele is 'Modèle précis pour cet agent ; vide = celui de l''équipe (0197).';
