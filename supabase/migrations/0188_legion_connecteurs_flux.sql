-- LEGION — trois connecteurs de plus (idées 36, 47 et 161 des 200, 24/09) :
--   * la veille RSS : des flux lus chaque heure, les nouveaux articles
--     déposés en une liste dans un salon ;
--   * un nouveau ticket sur le dépôt GitHub branché ouvre une réunion ;
--   * Linear et Jira, en lecture seule, comme GitHub : les agents voient les
--     tickets ouverts. Le jeton va au coffre (vault) et ne revient jamais.
--
-- Additive : trois types de connecteurs, quatre fonctions, un jeton de tâche
-- planifiée, une tâche planifiée. legion_brancher_github garde désormais les
-- options (réunion sur ticket, salon) quand on le rebranche.

alter table public.legion_connecteurs drop constraint if exists legion_connecteurs_type_check;
alter table public.legion_connecteurs add constraint legion_connecteurs_type_check
  check (type = any (array['finjaro-mesures', 'finjaro-boutique', 'github', 'google', 'finjaro-accounting', 'rss', 'linear', 'jira']));

create or replace function public.legion_brancher_github(p_entreprise uuid, p_depot text, p_jeton text default null, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_depot text := trim(both '/' from regexp_replace(coalesce(p_depot, ''), '^(https?://)?(www\.)?github\.com/', '', 'i'));
        v_nom text := 'legion_github_' || p_entreprise::text;
        v_secret uuid;
begin
  if not public.legion_est_membre(p_entreprise) then raise exception 'Pas membre de cette entreprise.'; end if;
  if p_actif and v_depot !~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' then
    raise exception 'Le dépôt s''écrit « propriétaire/nom », par exemple « finjaro/boutique ».';
  end if;
  select id into v_secret from vault.secrets where name = v_nom;
  if coalesce(trim(p_jeton), '') <> '' then
    if v_secret is null then
      v_secret := vault.create_secret(trim(p_jeton), v_nom, 'Jeton GitHub d''une entreprise Legion');
    else
      perform vault.update_secret(v_secret, trim(p_jeton));
    end if;
  end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, 'github', p_actif, auth.uid(), jsonb_build_object('depot', v_depot, 'avec_jeton', v_secret is not null))
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par,
        config = case when excluded.actif then public.legion_connecteurs.config || excluded.config else public.legion_connecteurs.config end;
end $$;

-- Brancher la veille RSS, Linear ou Jira.
create or replace function public.legion_brancher_outil(p_entreprise uuid, p_type text, p_config jsonb, p_jeton text default null, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_nom text := 'legion_' || p_type || '_' || p_entreprise::text;
        v_secret uuid;
        v_config jsonb := '{}'::jsonb;
        v_flux jsonb;
begin
  if not public.legion_est_membre(p_entreprise) then raise exception 'Pas membre de cette entreprise.'; end if;
  if p_type not in ('rss', 'linear', 'jira') then raise exception 'Connecteur inconnu.'; end if;
  if p_actif then
    if p_type = 'rss' then
      select coalesce(jsonb_agg(u), '[]'::jsonb) into v_flux
        from (select distinct trim(x) u from jsonb_array_elements_text(coalesce(p_config->'flux', '[]'::jsonb)) x
               where trim(x) ~ '^https://[^\s]+$' limit 5) s;
      if jsonb_array_length(v_flux) = 0 then raise exception 'Il faut au moins un flux qui commence par https://'; end if;
      v_config := jsonb_build_object('flux', v_flux);
    elsif p_type = 'jira' then
      if coalesce(p_config->>'site', '') !~ '^https://[A-Za-z0-9.-]+(/[^\s]*)?$' then raise exception 'L''adresse Jira commence par https:// (ex. https://monequipe.atlassian.net).'; end if;
      v_config := jsonb_build_object('site', rtrim(p_config->>'site', '/'), 'email', nullif(trim(coalesce(p_config->>'email', '')), ''), 'projet', nullif(upper(trim(coalesce(p_config->>'projet', ''))), ''));
    else
      v_config := jsonb_build_object('equipe', nullif(upper(trim(coalesce(p_config->>'equipe', ''))), ''));
    end if;
  end if;
  select id into v_secret from vault.secrets where name = v_nom;
  if coalesce(trim(p_jeton), '') <> '' then
    if v_secret is null then v_secret := vault.create_secret(trim(p_jeton), v_nom, 'Jeton d''un connecteur Legion');
    else perform vault.update_secret(v_secret, trim(p_jeton)); end if;
  end if;
  if p_actif and p_type = 'linear' and v_secret is null then raise exception 'Linear demande une clé d''API personnelle.'; end if;
  v_config := v_config || jsonb_build_object('avec_jeton', v_secret is not null);
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, p_type, p_actif, auth.uid(), v_config)
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par,
        config = case when excluded.actif then public.legion_connecteurs.config || excluded.config else public.legion_connecteurs.config end;
end $$;
revoke all on function public.legion_brancher_outil(uuid, text, jsonb, text, boolean) from public, anon;
grant execute on function public.legion_brancher_outil(uuid, text, jsonb, text, boolean) to authenticated;

-- Les options d'un connecteur : la réunion sur ticket, le salon où déposer.
create or replace function public.legion_connecteur_options(p_entreprise uuid, p_type text, p_options jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v jsonb := '{}'::jsonb;
begin
  if not public.legion_est_membre(p_entreprise) then raise exception 'Pas membre de cette entreprise.'; end if;
  if p_options ? 'reunion_sur_ticket' then v := v || jsonb_build_object('reunion_sur_ticket', coalesce((p_options->>'reunion_sur_ticket')::boolean, false)); end if;
  if p_options ? 'salon_id' then
    if p_options->>'salon_id' is null or exists (select 1 from public.legion_canaux c where c.id = (p_options->>'salon_id')::uuid and c.entreprise_id = p_entreprise) then
      v := v || jsonb_build_object('salon_id', p_options->'salon_id');
    end if;
  end if;
  update public.legion_connecteurs set config = config || v where entreprise_id = p_entreprise and type = p_type;
end $$;
revoke all on function public.legion_connecteur_options(uuid, text, jsonb) from public, anon;
grant execute on function public.legion_connecteur_options(uuid, text, jsonb) to authenticated;

-- Le jeton en clair, pour les fonctions du serveur SEULEMENT.
create or replace function public.legion_jeton_outil(p_entreprise uuid, p_type text)
returns text language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'legion_' || p_type || '_' || p_entreprise::text limit 1;
$$;
revoke all on function public.legion_jeton_outil(uuid, text) from public, anon, authenticated;
grant execute on function public.legion_jeton_outil(uuid, text) to service_role;

-- Chaque heure : les flux et les tickets (fonction legion-flux).
insert into public.app_secrets (name, value)
values ('legion_flux', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_legion_flux()
returns void language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_flux';
  if jeton is null then return; end if;
  if not exists (select 1 from public.legion_connecteurs where actif and (type = 'rss' or (type = 'github' and (config->>'reunion_sur_ticket')::boolean))) then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-flux',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.lancer_legion_flux() from public, anon, authenticated;

select cron.unschedule('legion-flux') where exists (select 1 from cron.job where jobname = 'legion-flux');
select cron.schedule('legion-flux', '20 * * * *', $$select public.lancer_legion_flux()$$);
