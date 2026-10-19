-- 0246 — Compteur de visites d'Accounting (Beau, 19/10 : « ajoute le compteur de visites de la démo »).
-- Pourquoi : on ne savait pas si les personnes qui voient les posts ouvrent Accounting ou sa démonstration sans compte.
-- ADDITIVE : une table et une fonction neuves, rien d'existant touché. Tables finia_* seulement (Accounting n'utilise que celles-là).
--
-- Ce qui est gardé : le jour, un numéro de VISITE (tiré au hasard à l'ouverture de l'onglet, effacé à sa fermeture : ce n'est pas
-- une personne), l'étape atteinte et le mot du lien (?src=). Ni adresse IP, ni e-mail, ni appareil, ni identifiant durable.
-- Personne ne lit la table par l'API (aucune politique) ; on la lit avec la clé de service (voir docs/AUDITS ou la requête ci-dessous).
-- Une même visite ne compte qu'une fois par étape et par jour (clé unique) ; un plafond global limite un envoi en rafale.

create table if not exists public.finia_visites (
  id         bigint generated always as identity primary key,
  jour       date not null default current_date,
  visite     text not null check (visite ~ '^[a-f0-9-]{16,40}$'),
  etape      text not null check (etape in ('accueil', 'demo_vue', 'demo_ouverte', 'demo_creer_compte')),
  src        text check (src is null or src ~ '^[a-z0-9_-]{1,40}$'),
  created_at timestamptz not null default now(),
  unique (jour, visite, etape)
);
create index if not exists finia_visites_jour on public.finia_visites (jour, etape);

alter table public.finia_visites enable row level security;
revoke all on public.finia_visites from public, anon, authenticated;

create or replace function public.finia_noter_visite(p_etape text, p_visite text, p_src text default null)
returns void
language plpgsql security definer set search_path to 'public' as $function$
declare v_src text;
begin
  -- Jamais d'erreur renvoyée au visiteur : une mesure qui échoue ne doit rien casser.
  if p_etape is null or p_etape not in ('accueil', 'demo_vue', 'demo_ouverte', 'demo_creer_compte') then return; end if;
  if p_visite is null or p_visite !~ '^[a-f0-9-]{16,40}$' then return; end if;
  -- Plafond : au plus 120 enregistrements par minute pour tout le monde (une rafale ne gonfle pas la table).
  if (select count(*) from finia_visites where created_at > now() - interval '1 minute') >= 120 then return; end if;
  v_src := nullif(left(regexp_replace(lower(coalesce(p_src, '')), '[^a-z0-9_-]', '', 'g'), 40), '');
  insert into finia_visites (visite, etape, src) values (p_visite, p_etape, v_src) on conflict do nothing;
end;
$function$;

revoke all on function public.finia_noter_visite(text, text, text) from public;
grant execute on function public.finia_noter_visite(text, text, text) to anon, authenticated;

comment on table public.finia_visites is 'Compteur de visites d''Accounting (arrivée, démonstration vue / ouverte, clic « Créer mon compte »). Aucune donnée personnelle. Lecture : clé de service seulement.';

-- Lecture (clé de service). Les lignes 1 à 9 du 19/10 sont des ESSAIS de la mise en place (la suppression n'a pas pu être
-- exécutée par l'outil) : toujours lire avec « id > 9 ».
--   select jour, etape, coalesce(src, '(sans étiquette)') as src, count(*) as visites
--     from finia_visites where id > 9 and jour >= current_date - 7 group by 1, 2, 3 order by 1 desc, 2;
-- Entonnoir d'une semaine, par étiquette de lien :
--   select coalesce(src, '(sans étiquette)') as src,
--          count(*) filter (where etape = 'accueil') as arrivees, count(*) filter (where etape = 'demo_vue') as demo_vue,
--          count(*) filter (where etape = 'demo_ouverte') as demo_ouverte, count(*) filter (where etape = 'demo_creer_compte') as creer_compte
--     from finia_visites where id > 9 and jour >= current_date - 7 group by 1 order by 2 desc;
