-- LEGION — des plans écrits, et une journée de travail chaque matin.
--
-- Beau, 22/09: « le directeur ne sait pas ce qu'on va faire aujourd'hui,
-- demain. Quel est le plan de la semaine ? Du mois ? La stratégie ? Rien…
-- Tout le monde me dit "on est en train de travailler". Donne-moi le
-- résultat. Je veux des gens autonomes, une entreprise qui fonctionne. »
--
-- Jusqu'ici, un agent n'existait que quand on lui écrivait. Maintenant,
-- chaque matin (fonction legion-travail):
--   - chaque responsable de département écrit (ou renouvelle, une fois par
--     semaine) le PLAN de la semaine et du mois, à partir des vrais
--     chiffres, des consignes du fondateur et de ce qui est ouvert;
--   - chaque agent allumé prend sa tâche la plus ancienne et rend un
--     LIVRABLE: une analyse avec les chiffres vérifiés, une proposition, un
--     brouillon — un document, pas une action; la tâche passe « à revoir ».
--
-- Additive: une table, un secret, une fonction, une tâche planifiée.

create table if not exists public.legion_plans (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  departement text not null,
  agent_id uuid references public.legion_agents(id) on delete set null,
  horizon text not null check (horizon in ('semaine', 'mois')),
  contenu text not null,
  created_at timestamptz not null default now()
);
create index if not exists legion_plans_recents on public.legion_plans (entreprise_id, departement, horizon, created_at desc);

alter table public.legion_plans enable row level security;
drop policy if exists "legion_plans lecture" on public.legion_plans;
create policy "legion_plans lecture" on public.legion_plans for select using (public.legion_est_membre(entreprise_id));
grant select on public.legion_plans to authenticated;

insert into public.app_secrets (name, value)
values ('legion_travail', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_legion_travail()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_travail';
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-travail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end $$;
revoke all on function public.lancer_legion_travail() from public, anon, authenticated;

-- Chaque matin à 6 h 30 UTC (7 h 30 à Douala), après le veilleur.
select cron.schedule('legion-travail', '30 6 * * *', 'select public.lancer_legion_travail()');
