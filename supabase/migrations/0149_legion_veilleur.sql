-- LEGION — le veilleur (chantier 2, étape C).
--
-- Beau, 22/09: « un agent qui part chaque jour sur le net, sur GitHub, il
-- prend des skills, des dépôts, pour s'améliorer constamment ». Chaque
-- matin, la fonction legion-veilleur cherche sur GitHub les dépôts de
-- compétences (SKILL.md) sous licence libre, ajoute leurs fiches au
-- catalogue avec leur source et leur licence, et propose à chaque
-- entreprise celles qui lui servent. Voir docs/LEGION-COMPETENCES.md.
--
-- Même patron que chat-autoreply: un jeton partagé dans app_secrets, que
-- seul le cron connaît.
--
-- Additive: deux tables, une fonction, une tâche planifiée.

-- Les dépôts déjà regardés: on ne relit pas deux fois le même, et on garde
-- pourquoi un dépôt a été écarté (licence, rien d'utilisable…).
create table if not exists public.legion_veille_depots (
  depot text primary key,               -- « propriétaire/nom »
  licence text,
  retenu boolean not null default false,
  raison text,
  fiches integer not null default 0,
  vu_le timestamptz not null default now()
);

-- Le journal de chaque passage: ce qu'il a vu, pris, et ce qui a échoué.
create table if not exists public.legion_veilles (
  id uuid primary key default gen_random_uuid(),
  passe_le timestamptz not null default now(),
  depots_vus integer not null default 0,
  depots_retenus integer not null default 0,
  fiches_ajoutees integer not null default 0,
  propositions integer not null default 0,
  erreurs jsonb not null default '[]'::jsonb
);

alter table public.legion_veille_depots enable row level security;
alter table public.legion_veilles enable row level security;
-- Lecture: l'équipe Finjaro seulement. Écriture: la fonction (service_role).
drop policy if exists "legion_veille_depots admin" on public.legion_veille_depots;
create policy "legion_veille_depots admin" on public.legion_veille_depots for select using (public.is_admin());
drop policy if exists "legion_veilles admin" on public.legion_veilles;
create policy "legion_veilles admin" on public.legion_veilles for select using (public.is_admin());

insert into public.app_secrets (name, value)
values ('legion_veilleur', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_legion_veilleur()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_veilleur';
  if jeton is null then raise notice 'jeton legion_veilleur absent'; return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-veilleur',
    -- La clé publique (anon) passe la porte des fonctions; le jeton, lui,
    -- prouve que c'est bien le cron.
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
end $$;
revoke all on function public.lancer_legion_veilleur() from public, anon, authenticated;

-- Chaque matin à 5 h 15 UTC (6 h 15 à Douala).
select cron.schedule('legion-veilleur', '15 5 * * *', 'select public.lancer_legion_veilleur()');
