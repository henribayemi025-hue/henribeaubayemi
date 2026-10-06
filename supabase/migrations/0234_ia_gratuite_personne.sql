-- Finia d'Accounting sur sa part d'IA gratuite (0232). Claudinette, 06/10 :
-- l'assistante d'Accounting ne passe pas par moteur.ts mais par son propre
-- Worker, qui n'a ni clé service_role ni binding AI. Elle appellera la
-- fonction finia-gratuit avec le jeton de la personne connectée ; la
-- fonction réserve sur la part « finia » (2 000 neurones par jour).
--
-- Ce compteur-ci borne chaque personne, pour qu'un seul compte ne vide pas
-- la part de toutes les commerçantes : quelques appels par jour, en secours
-- quand Gemini refuse (402/429).
--
-- Additif : une table et deux fonctions, réservées au serveur. Elle ne lit
-- aucune table d'Accounting (finia_*).

create table if not exists public.ia_gratuite_personne (
  jour     date not null,
  app      text not null,
  user_id  uuid not null,
  appels   integer not null default 0,
  primary key (jour, app, user_id)
);
alter table public.ia_gratuite_personne enable row level security;
revoke all on public.ia_gratuite_personne from anon, authenticated;

-- Compte un appel pour p_user ; rend false si p_max est déjà atteint.
create or replace function public.ia_gratuite_personne_compter(p_user uuid, p_app text, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ok boolean;
begin
  if p_user is null or p_max is null or p_max <= 0 then
    return false;
  end if;
  insert into public.ia_gratuite_personne as j (jour, app, user_id, appels)
  values ((now() at time zone 'utc')::date, p_app, p_user, 1)
  on conflict (jour, app, user_id) do update
    set appels = j.appels + 1
    where j.appels < p_max
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

-- Rend l'appel compté quand il n'est jamais parti (part du jour épuisée).
create or replace function public.ia_gratuite_personne_rendre(p_user uuid, p_app text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ia_gratuite_personne
     set appels = greatest(0, appels - 1)
   where jour = (now() at time zone 'utc')::date and app = p_app and user_id = p_user;
$$;

revoke all on function public.ia_gratuite_personne_compter(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.ia_gratuite_personne_rendre(uuid, text) from public, anon, authenticated;
grant execute on function public.ia_gratuite_personne_compter(uuid, text, integer) to service_role;
grant execute on function public.ia_gratuite_personne_rendre(uuid, text) to service_role;
