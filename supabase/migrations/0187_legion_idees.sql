-- LEGION — le tableau d'idées (idée 166 des 200, 24/09) : des notes que les
-- membres posent, votent, et envoient en tâche ou à l'équipe.
--
-- Additive : une table, et son ajout au temps réel (les notes des autres
-- apparaissent sans recharger).

create table if not exists public.legion_idees (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  texte text not null check (length(texte) between 2 and 500),
  couleur text not null default 'creme' check (couleur in ('creme', 'terracotta', 'laiton', 'turquoise')),
  user_id uuid not null default auth.uid(),
  votes uuid[] not null default '{}',
  tache_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists legion_idees_entreprise on public.legion_idees (entreprise_id, created_at desc);

alter table public.legion_idees enable row level security;
drop policy if exists legion_idees_lire on public.legion_idees;
create policy legion_idees_lire on public.legion_idees for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_idees_poser on public.legion_idees;
create policy legion_idees_poser on public.legion_idees for insert with check (public.legion_est_membre(entreprise_id) and user_id = auth.uid());
-- Voter, envoyer en tâche : tout membre (le texte ne change que par son auteur, côté écran).
drop policy if exists legion_idees_modifier on public.legion_idees;
create policy legion_idees_modifier on public.legion_idees for update using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));
drop policy if exists legion_idees_retirer on public.legion_idees;
create policy legion_idees_retirer on public.legion_idees for delete using (
  public.legion_est_membre(entreprise_id)
  and (user_id = auth.uid() or exists (select 1 from public.legion_entreprises e where e.id = entreprise_id and e.owner_id = auth.uid()))
);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'legion_idees') then
    alter publication supabase_realtime add table public.legion_idees;
  end if;
end $$;
