-- LEGION / Léo — choisir un MODÈLE précis, pas seulement un fournisseur
-- (Beau, 24/09 : « Auto quand tu arrives ; si quelqu'un veut, il choisit
-- Gemini Pro ou Flash et il continue à travailler avec — comme on choisit
-- Opus ou Fable »). Additif : vide = Auto.
alter table public.legion_entreprises add column if not exists modele text;
comment on column public.legion_entreprises.modele is 'Modèle précis choisi pour les agents (ex. gemini-3.1-pro-preview, ds:deepseek-v4-pro) ; vide = Auto (0193).';
