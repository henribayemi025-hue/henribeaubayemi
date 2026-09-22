-- LEGION — qui fait parler un agent.
--
-- Beau, 22/09: « tu pourras écrire dans Legion… te donner même un nom ».
-- Claude (Claude Code) entre dans Legion comme un collègue à part entière,
-- sous son propre nom — pas en empruntant la voix d'Alpha.
--
-- Mais il ne passe pas par Gemini: il lit et écrit lui-même, à ses passages.
-- Il faut donc que le moteur de réponse (legion-repondre), la fabrique de
-- photos (legion-portrait) et le choix des visages (legion-se-choisir) le
-- laissent tranquille. D'où cette colonne.
--
-- Additive: une colonne avec une valeur par défaut, rien de retiré.

alter table public.legion_agents
  add column if not exists moteur text not null default 'gemini';

do $$ begin
  alter table public.legion_agents
    add constraint legion_agents_moteur_check check (moteur in ('gemini', 'claude-code'));
exception when duplicate_object then null; end $$;

comment on column public.legion_agents.moteur is
  'Qui fait parler l''agent: gemini (legion-repondre) ou claude-code (Claude, à ses passages; les fonctions Gemini ne le font jamais parler).';
