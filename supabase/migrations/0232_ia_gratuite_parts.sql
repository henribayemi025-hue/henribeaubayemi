-- Une part de l'IA gratuite pour chaque application. Beau, 06/10 : « oui pour
-- 2000 neurones pour Finia ».
--
-- Jusqu'ici un seul compteur (0231) : les agents de Léo le vidaient chaque
-- soir (7 934 puis 7 900 neurones sur 8 000), et rien ne restait pour Finia,
-- l'assistante d'Accounting. Désormais chaque application a sa part, et le
-- plafond commun de 8 000 reste au-dessus des deux (la part gratuite de
-- Cloudflare, 10 000 par jour, vaut pour tout le compte) :
--   leo   6 000
--   finia 2 000
--
-- Additif : une table et trois fonctions. ia_gratuite_reserver/rendre (0231)
-- restent telles quelles et tiennent toujours le total.
--
-- Corrigé au passage : quand un appel consomme plus que son estimation,
-- l'ancien code inscrivait le surplus avec ia_gratuite_reserver(-n), qui
-- refuse tout nombre négatif. Le surplus n'était jamais compté.
-- ia_gratuite_inscrire_app l'inscrit, même au-delà du plafond : le
-- dépassement arrête alors les appels suivants, comme prévu en 0231.

create table if not exists public.ia_gratuite_part (
  jour      date    not null,
  app       text    not null,
  neurones  integer not null default 0,
  appels    integer not null default 0,
  primary key (jour, app)
);
alter table public.ia_gratuite_part enable row level security;
revoke all on public.ia_gratuite_part from anon, authenticated;

-- La part de chaque application. Une application inconnue n'a rien.
create or replace function public.ia_gratuite_plafond_app(p_app text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_app when 'leo' then 6000 when 'finia' then 2000 else 0 end;
$$;

-- Réserve p_neurones sur la part de p_app ET sur le total du jour (8 000).
-- Rend false si l'une des deux serait dépassée : l'appel ne part pas.
create or replace function public.ia_gratuite_reserver_app(p_neurones integer, p_app text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  plafond integer := public.ia_gratuite_plafond_app(p_app);
  v_jour date := (now() at time zone 'utc')::date;
  ok boolean;
begin
  if p_neurones is null or p_neurones <= 0 or p_neurones > plafond then
    return false;
  end if;
  insert into public.ia_gratuite_part as j (jour, app, neurones, appels)
  values (v_jour, p_app, p_neurones, 1)
  on conflict (jour, app) do update
    set neurones = j.neurones + excluded.neurones, appels = j.appels + 1
    where j.neurones + excluded.neurones <= plafond
  returning true into ok;
  if not coalesce(ok, false) then
    return false;
  end if;
  -- Le total commun. S'il est plein, la part est rendue aussitôt.
  if not public.ia_gratuite_reserver(p_neurones) then
    update public.ia_gratuite_part
       set neurones = greatest(0, neurones - p_neurones), appels = greatest(0, appels - 1)
     where jour = v_jour and app = p_app;
    return false;
  end if;
  return true;
end;
$$;

-- Rend la part réservée et non consommée, sur la part et sur le total.
create or replace function public.ia_gratuite_rendre_app(p_neurones integer, p_app text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer := greatest(0, coalesce(p_neurones, 0));
begin
  update public.ia_gratuite_part
     set neurones = greatest(0, neurones - n)
   where jour = (now() at time zone 'utc')::date and app = p_app;
  perform public.ia_gratuite_rendre(n);
end;
$$;

-- Inscrit un surplus consommé (estimation trop basse), sans condition.
create or replace function public.ia_gratuite_inscrire_app(p_neurones integer, p_app text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer := greatest(0, coalesce(p_neurones, 0));
  v_jour date := (now() at time zone 'utc')::date;
begin
  if n = 0 then return; end if;
  insert into public.ia_gratuite_part as j (jour, app, neurones, appels)
  values (v_jour, p_app, n, 0)
  on conflict (jour, app) do update set neurones = j.neurones + excluded.neurones;
  insert into public.ia_gratuite_jour as j (jour, neurones, appels)
  values (v_jour, n, 0)
  on conflict (jour) do update set neurones = j.neurones + excluded.neurones;
end;
$$;

revoke all on function public.ia_gratuite_plafond_app(text) from public, anon, authenticated;
revoke all on function public.ia_gratuite_reserver_app(integer, text) from public, anon, authenticated;
revoke all on function public.ia_gratuite_rendre_app(integer, text) from public, anon, authenticated;
revoke all on function public.ia_gratuite_inscrire_app(integer, text) from public, anon, authenticated;
grant execute on function public.ia_gratuite_plafond_app(text) to service_role;
grant execute on function public.ia_gratuite_reserver_app(integer, text) to service_role;
grant execute on function public.ia_gratuite_rendre_app(integer, text) to service_role;
grant execute on function public.ia_gratuite_inscrire_app(integer, text) to service_role;
