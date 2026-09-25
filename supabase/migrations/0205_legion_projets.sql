-- Léo : les PROJETS (la Ville de Léo, proposition du 25/09 à Beau). Chaque
-- projet est une tour : daté (un à deux mois), il pousse avec les tâches
-- rendues. Les tâches s'y rattachent par meta.projet_id (aucune colonne
-- ajoutée à legion_messages). Les tâches sans projet vont dans la tour
-- « Au quotidien », calculée à l'écran.
--
-- Additif : une table, ses règles d'accès, la diffusion en direct.

create table if not exists public.legion_projets (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  nom text not null check (char_length(nom) between 2 and 80),
  but text check (but is null or char_length(but) <= 600),
  debut date not null default current_date,
  fin date not null default (current_date + 30),
  responsable uuid references public.legion_agents(id) on delete set null,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'en_pause', 'fini')),
  cree_par uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (fin >= debut)
);
create index if not exists legion_projets_entreprise on public.legion_projets (entreprise_id, statut, debut);

alter table public.legion_projets enable row level security;
drop policy if exists "legion_projets lecture" on public.legion_projets;
create policy "legion_projets lecture" on public.legion_projets
  for select using (public.legion_est_membre(entreprise_id));
drop policy if exists "legion_projets ecriture" on public.legion_projets;
create policy "legion_projets ecriture" on public.legion_projets
  for all using (public.legion_peut_agir(entreprise_id)) with check (public.legion_peut_agir(entreprise_id));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'legion_projets') then
    alter publication supabase_realtime add table public.legion_projets;
  end if;
end $$;
