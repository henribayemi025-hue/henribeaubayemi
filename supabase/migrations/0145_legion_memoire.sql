-- LEGION — la mémoire: ce que les agents retiennent de ce qu'on leur dit.
--
-- Beau, 22/09: « tu dois entraîner l'IA avec toutes les données qu'on a…
-- tout ce que je lui dis, tout doit s'entraîner ».
--
-- On ne ré-entraîne pas un modèle comme Gemini: ses poids ne sont pas à
-- nous. Ce qui marche vraiment, et tout de suite, c'est une MÉMOIRE: quand
-- Beau donne une consigne durable ou corrige un agent, la règle est notée
-- ici, et TOUS les agents de l'entreprise la relisent avant chaque réponse.
-- Le lendemain, dans un autre salon, elle vaut toujours.
--
-- Une règle vient de trois endroits:
--   - 'fondateur': tirée d'un message de Beau par l'agent qui lui répond;
--   - 'claude'   : posée par Claude, à partir de ce que Beau lui a dit
--                  (le fichier CLAUDE.md du dépôt, ses corrections);
--   - 'main'     : écrite à la main dans l'écran Mémoire.
-- Une règle ne se supprime pas: on l'éteint (actif = false), et elle
-- reste visible pour savoir d'où venait un comportement.
--
-- Additive: une table. Rien de retiré.

create table if not exists public.legion_memoire (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  regle text not null check (char_length(regle) between 3 and 400),
  source text not null default 'fondateur' check (source in ('fondateur', 'claude', 'main')),
  message_id uuid references public.legion_messages(id) on delete set null,
  agent_id uuid references public.legion_agents(id) on delete set null,
  cree_par uuid references auth.users(id),
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists legion_memoire_entreprise on public.legion_memoire (entreprise_id, actif, created_at desc);

alter table public.legion_memoire enable row level security;

drop policy if exists "legion_memoire lecture" on public.legion_memoire;
create policy "legion_memoire lecture" on public.legion_memoire
  for select using (public.legion_est_membre(entreprise_id));
drop policy if exists "legion_memoire ajout" on public.legion_memoire;
create policy "legion_memoire ajout" on public.legion_memoire
  for insert with check (public.legion_est_membre(entreprise_id) and source = 'main' and cree_par = auth.uid());
drop policy if exists "legion_memoire eteindre" on public.legion_memoire;
create policy "legion_memoire eteindre" on public.legion_memoire
  for update using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

grant select, insert, update on public.legion_memoire to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.legion_memoire;
exception when duplicate_object then null; when undefined_object then null; end $$;
