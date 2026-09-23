-- Le nombre de non-lus sur la liste des salons (plan complet, B4).
--
-- Comme WhatsApp: à côté de chaque salon, combien de messages sont arrivés
-- depuis la dernière fois qu'on l'a ouvert. On retient, par personne et par
-- salon, le moment où elle l'a lu — en base et pas dans le navigateur, pour
-- que le téléphone et l'ordinateur disent la même chose.
--
-- Additive: une table. Chacun ne lit et n'écrit que ses propres lignes, et
-- seulement dans une entreprise dont il est membre.

create table if not exists public.legion_lectures (
  user_id uuid not null references auth.users(id) on delete cascade,
  canal_id uuid not null references public.legion_canaux(id) on delete cascade,
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  lu_le timestamptz not null default now(),
  primary key (user_id, canal_id)
);
create index if not exists legion_lectures_entreprise on public.legion_lectures (user_id, entreprise_id);

alter table public.legion_lectures enable row level security;
drop policy if exists "legion_lectures les miennes" on public.legion_lectures;
create policy "legion_lectures les miennes" on public.legion_lectures
  for all using (user_id = auth.uid() and public.legion_est_membre(entreprise_id))
  with check (user_id = auth.uid() and public.legion_est_membre(entreprise_id));
