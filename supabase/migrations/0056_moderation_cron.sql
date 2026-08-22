-- Le passage du matin.
--
-- Beau: « Finia qui passe CHAQUE MATIN ». Sans déclencheur automatique,
-- l'inspection n'est qu'un bouton que personne n'appuie.
--
-- POURQUOI UN JETON ET PAS LE JWT HABITUEL
--
-- Les autres tâches planifiées du projet appellent des fonctions SQL: elles
-- n'ont besoin d'aucune clé. Celle-ci doit appeler une fonction edge (elle
-- parle à Gemini), donc franchir HTTP — et il n'y a aucun secret en coffre
-- sur ce projet. Plutôt que d'y déposer la clé de service, l'appel porte un
-- jeton tiré au hasard, lisible seulement par la clé de service et par les
-- tâches planifiées. La fonction edge refuse tout appel sans ce jeton.
create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

-- Aucune règle d'accès n'est créée volontairement: avec RLS activé et aucune
-- politique, la table est invisible depuis le navigateur, quel que soit le
-- compte. Seule la clé de service la lit.
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (name, value)
values ('moderation_sweep', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create extension if not exists pg_net with schema extensions;

create or replace function public.lancer_inspection_contenus()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  jeton text;
begin
  select value into jeton from public.app_secrets where name = 'moderation_sweep';
  if jeton is null then
    raise notice 'jeton moderation_sweep absent, inspection non lancee';
    return;
  end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/moderation-sweep',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.lancer_inspection_contenus() from anon, authenticated;

-- 6h00 UTC = 7h00 à Douala, 7h00 à Paris en hiver / 8h00 en été. Beau lit ses
-- notifications le matin: l'inspection doit être finie avant qu'il regarde.
select cron.schedule(
  'finjaro-moderation-sweep',
  '0 6 * * *',
  $$select public.lancer_inspection_contenus()$$
);
