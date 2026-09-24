-- LEGION — l'examen des compétences (fonction legion-examen, Beau 24/09).
--
-- Rigo vérifie qu'une compétence rend vraiment un agent meilleur : 3 cas de
-- test, chacun traité SANS puis AVEC la fiche, notés à l'aveugle. Le
-- verdict (« garde » / « à revoir ») est une proposition : rien n'est
-- désactivé automatiquement.
--
-- Additive : une table, un jeton pour la tâche planifiée, une fonction qui
-- la lance, une tâche cron, et le nom de la fonction dans la liste des coûts.

create table if not exists public.legion_examens (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  competence_id uuid not null references public.legion_competences(id) on delete cascade,
  agent_id uuid not null references public.legion_agents(id) on delete cascade,
  -- Les 3 cas : la demande, ses critères, les deux réponses, l'ordre A/B tiré
  -- au hasard, les notes du correcteur et le gagnant. Tout est gardé, pour
  -- relire le déroulé et pas seulement le verdict.
  cas jsonb not null default '[]'::jsonb,
  score_avec numeric(4,2),            -- note moyenne sur 10, avec la fiche
  score_sans numeric(4,2),            -- note moyenne sur 10, sans la fiche
  gagnes smallint,                    -- cas gagnés par la fiche
  nb_cas smallint,
  -- « en_cours » le temps de l'examen ; « echec » quand un modèle n'a pas
  -- répondu (ce n'est pas un jugement sur la fiche).
  verdict text not null default 'en_cours' check (verdict in ('en_cours', 'garde', 'a_revoir', 'echec')),
  raison text,                        -- l'infraction relevée, ou la cause d'un échec
  par text not null default 'membre' check (par in ('membre', 'tache')),
  demande_par uuid,                   -- le membre qui a lancé l'examen (vide pour la tâche du lundi)
  modele text,                        -- les modèles qui ont répondu et corrigé
  cout_eur numeric(10,6) not null default 0,
  created_at timestamptz not null default now(),
  fini_le timestamptz
);
create index if not exists legion_examens_competence on public.legion_examens (competence_id, created_at desc);
create index if not exists legion_examens_entreprise on public.legion_examens (entreprise_id, created_at desc);

alter table public.legion_examens enable row level security;
-- Lecture pour les membres ; l'écriture passe par la fonction (clé de
-- service) : aucune politique d'insertion ni de modification.
drop policy if exists legion_examens_lire on public.legion_examens;
create policy legion_examens_lire on public.legion_examens for select using (public.legion_est_membre(entreprise_id));
grant select on public.legion_examens to authenticated;

-- La tâche planifiée : le lundi, cinq passages d'heure en heure (2 h à 6 h
-- UTC). Chaque passage examine UNE compétence par entreprise, au plus 5 par
-- semaine, et seulement sous le plafond du mois (la fonction le vérifie).
-- Un seul passage ne suffirait pas : un examen prend une à deux minutes, et
-- cinq d'affilée dépasseraient le temps qu'une fonction a pour travailler.
insert into public.app_secrets (name, value)
values ('legion_examen', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_legion_examen()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_examen';
  if jeton is null then return; end if;
  -- Aucune compétence active nulle part : on n'appelle rien.
  if not exists (select 1 from public.legion_competences where actif) then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-examen',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.lancer_legion_examen() from public, anon, authenticated;

select cron.unschedule('legion-examen') where exists (select 1 from cron.job where jobname = 'legion-examen');
select cron.schedule('legion-examen', '0 2-6 * * 1', $$select public.lancer_legion_examen()$$);

-- Le compteur de dépense accepte « legion_examen ». On AJOUTE le nom à la
-- liste telle qu'elle est en base au moment d'appliquer (et non à une copie
-- écrite ici) : un nom ajouté par une autre migration entre-temps n'est pas
-- perdu. Sans contrainte existante, on ne crée rien.
do $$
declare
  v_def text;
  v_noms text[];
begin
  select pg_get_constraintdef(oid) into v_def
    from pg_constraint
   where conname = 'ai_usage_fn_check' and conrelid = 'public.ai_usage'::regclass;
  if v_def is null then return; end if;
  -- Postgres l'écrit « ARRAY['a'::text, …] » ou « '{a,…}'::text[] » selon
  -- la façon dont elle a été créée : on lit les deux.
  select array_agg(m[1]) into v_noms from regexp_matches(v_def, '''([^'']+)''', 'g') as m;
  if array_length(v_noms, 1) = 1 and left(v_noms[1], 1) = '{' then v_noms := v_noms[1]::text[]; end if;
  if v_noms is null or 'legion_examen' = any (v_noms) then return; end if;
  v_noms := v_noms || 'legion_examen'::text;
  alter table public.ai_usage drop constraint ai_usage_fn_check;
  execute 'alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array['
    || (select string_agg(quote_literal(n), ', ') from unnest(v_noms) as n) || ']))';
end $$;
