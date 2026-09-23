-- CONNEXION UNIQUE ENTRE LES APPLICATIONS FINJARO — le relais (point 47).
-- Plan: docs/CONNEXION-UNIQUE.md. Beau, 23/09: « une seule connexion pour
-- toutes les applications Finjaro, oui ».
--
-- Un code à usage unique, 60 secondes, créé par l'application de départ pour
-- l'utilisateur connecté, échangé par l'application d'arrivée contre une
-- session (fonction edge sso-relais). Aucune redirection d'auth, le Site URL
-- ne bouge pas. Additif: une table, une colonne, un ménage.

create table if not exists public.sso_relais (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cible text,
  cree_le timestamptz not null default now(),
  expire_le timestamptz not null,
  utilise_le timestamptz
);
comment on table public.sso_relais is 'Codes de relais entre applications Finjaro (usage unique, 60 s). Écrits et lus par la fonction sso-relais seulement.';
alter table public.sso_relais enable row level security;
-- Aucune règle: ni lecture ni écriture depuis l'application. Le serveur
-- (service_role) seulement.
create index if not exists sso_relais_expire_idx on public.sso_relais (expire_le);

-- L'adresse d'arrivée d'une application qui sait recevoir un code
-- (vide = pas encore). Le sélecteur d'applications la lit: il demande un
-- code avant d'ouvrir, et ajoute ?code=…&vers=… à cette adresse.
alter table public.finjaro_apps add column if not exists relais text;
comment on column public.finjaro_apps.relais is 'Page d''arrivée du relais de connexion (ex. https://accounting.finjaro.net/#/relais). Vide: l''application se connecte seule.';

-- Ménage: les codes de plus d'un jour ne servent plus à rien.
select cron.unschedule('sso-relais-menage') where exists (select 1 from cron.job where jobname = 'sso-relais-menage');
select cron.schedule('sso-relais-menage', '15 4 * * *', $$delete from public.sso_relais where expire_le < now() - interval '1 day'$$);
