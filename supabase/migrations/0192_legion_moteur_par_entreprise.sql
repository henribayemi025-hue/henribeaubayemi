-- LEGION / Léo — le choix de l'IA qui fait parler les agents, par entreprise
-- (Beau, 24/09 : « un réglage pour toute l'équipe »). Additif seulement.
--   auto     : DeepSeek d'abord, Kimi en relève, puis Gemini (ce qui tourne aujourd'hui)
--   deepseek : DeepSeek seul
--   kimi     : Kimi seul
--   gemini   : Gemini (Google) seul
-- Un moteur dont la clé n'est pas posée retombe sur « auto ».
alter table public.legion_entreprises add column if not exists moteur text not null default 'auto';
do $$ begin
  alter table public.legion_entreprises add constraint legion_entreprises_moteur_check check (moteur in ('auto', 'deepseek', 'kimi', 'gemini'));
exception when duplicate_object then null; end $$;
comment on column public.legion_entreprises.moteur is 'L''IA des agents pour toute l''entreprise : auto, deepseek, kimi ou gemini (0192).';
