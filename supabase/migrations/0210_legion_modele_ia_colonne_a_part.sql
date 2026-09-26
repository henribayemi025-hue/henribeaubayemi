-- LEGION — le choix d'un modèle IA précis pour l'équipe (0193) écrivait dans
-- `legion_entreprises.modele`, sans savoir que cette colonne existait déjà
-- depuis 0136 pour tout autre chose : le MODÈLE D'ENTREPRISE choisi à la
-- fondation (`references studio_modeles(cle)`, ex. « cabinet-d-architecture »).
-- `add column if not exists modele text` (0193) n'a donc rien créé : la
-- colonne existait déjà, avec sa clé étrangère vers studio_modeles.
--
-- Conséquence trouvée le 26/09 (Beau, dans Direction) : choisir un modèle IA
-- écrivait une valeur comme « ds:deepseek-v4-pro » dans CETTE colonne, ce qui
-- viole toujours la clé étrangère (« gemini-3.1-pro-preview » n'est pas un
-- secteur de studio_modeles) — l'écran affichait l'erreur Postgres brute, et
-- personne n'a jamais pu fixer un modèle IA depuis que ce réglage existe.
--
-- Additif : nouvelle colonne, l'ancienne ne bouge pas (le secteur de
-- fondation reste dans `modele`, lu par legion-modele, legion-mcp, Fonder,
-- Mes entreprises).
alter table public.legion_entreprises add column if not exists modele_ia text;
comment on column public.legion_entreprises.modele_ia is 'Modèle IA précis choisi pour les agents (ex. gemini-3.1-pro-preview, ds:deepseek-v4-pro) ; vide = Auto. Distinct de `modele` (le secteur choisi à la fondation, 0136).';
