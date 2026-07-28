-- Finjaro — Maintenance Cycle 2: durcissement sécurité.
-- Idempotent. Corrige les failles trouvées lors de l'audit RLS du 28/07.
--
-- CRITIQUE corrigé ici :
--   1. Élévation de privilège — un utilisateur pouvait faire
--      `update profiles set is_admin = true where id = <soi>` et devenir admin
--      (is_admin() lit cette colonne, et la policy `own profile` FOR ALL
--      autorisait l'écriture de TOUTES les colonnes de sa propre ligne).
--      Il pouvait aussi se dé-suspendre (is_suspended) et remettre
--      report_count à 0.
--   2. push_subscriptions — une policy FOR ALL USING(true) WITH CHECK(true)
--      annulait les trois bonnes policies par-utilisateur (les policies
--      permissives s'additionnent en OR). N'importe qui pouvait lire les
--      endpoints push de tout le monde et les supprimer.
--   3. events — WITH CHECK(true) laissait écrire des lignes au nom d'un
--      AUTRE user_id : de quoi épuiser à distance le quota Miroir IA
--      quotidien d'une victime (déni de service ciblé).
--   4. Tables héritées d'un ancien prototype (messages, follows,
--      commentaires, demandes_service, offres_service) : ouvertes en
--      lecture/écriture à `anon`. Aucune n'est utilisée par l'app actuelle
--      (elle utilise chat_messages / shop_follows / reel_comments), mais
--      elles restaient une surface d'attaque : insertion illimitée par des
--      anonymes, suppression du contenu des autres.

-- ---------------------------------------------------------------------------
-- 1. PROFILES — empêcher l'auto-élévation de privilège.
-- La policy RLS ne peut pas comparer OLD et NEW : on passe par un trigger
-- BEFORE UPDATE qui restaure de force les colonnes sensibles. Le service_role
-- (edge functions, admin back-office) contourne le trigger via un GUC dédié.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Le service_role (clé serveur) a le droit de tout écrire : c'est lui qui
  -- promeut un admin ou suspend un compte depuis le back-office.
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  new.is_admin      := old.is_admin;
  new.is_suspended  := old.is_suspended;
  new.report_count  := old.report_count;
  new.referral_code := old.referral_code;   -- immuable : sert au parrainage
  new.referred_by   := old.referred_by;     -- fixé une fois à l'inscription
  new.id            := old.id;
  return new;
end;
$$;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;

drop trigger if exists trg_protect_profile_privileges on public.profiles;
create trigger trg_protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- 2. PUSH_SUBSCRIPTIONS — supprimer la policy fourre-tout.
-- Les trois policies par-utilisateur (push_sub_read/insert/delete) existent
-- déjà et suffisent ; celle-ci les neutralisait.
-- ---------------------------------------------------------------------------
drop policy if exists "Gérer ses propres abonnements push" on public.push_subscriptions;

-- ---------------------------------------------------------------------------
-- 3. EVENTS — interdire d'écrire au nom d'un autre utilisateur.
-- user_id null reste autorisé : c'est le tracking des visiteurs non connectés.
-- ---------------------------------------------------------------------------
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert with check (user_id is null or user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. TABLES HÉRITÉES — fermer l'écriture anonyme et l'effacement croisé.
-- On ne supprime pas les tables (données d'un ancien prototype), on les rend
-- inertes pour un attaquant : lecture publique conservée là où elle l'était,
-- écriture réservée aux comptes connectés et propriétaire de la ligne.
-- ---------------------------------------------------------------------------
drop policy if exists "Tout le monde peut commenter" on public.commentaires;
create policy commentaires_insert on public.commentaires
  for insert with check (auth.uid() is not null);
drop policy if exists "Supprimer un commentaire" on public.commentaires;
create policy commentaires_delete on public.commentaires
  for delete using (auth.uid() is not null and auteur = auth.uid()::text);

drop policy if exists "Envoyer un message" on public.messages;
create policy messages_insert on public.messages
  for insert with check (acheteur_id = auth.uid());
drop policy if exists "Lecture publique des messages" on public.messages;
create policy messages_read on public.messages
  for select using (acheteur_id = auth.uid());

drop policy if exists "Suivre une boutique" on public.follows;
create policy follows_insert on public.follows
  for insert with check (follower_id = auth.uid());
drop policy if exists "Se désabonner" on public.follows;
create policy follows_delete on public.follows
  for delete using (follower_id = auth.uid());

drop policy if exists "Poster une demande" on public.demandes_service;
create policy demandes_insert on public.demandes_service
  for insert with check (acheteur_id = auth.uid());
drop policy if exists "Mettre à jour sa demande" on public.demandes_service;
create policy demandes_update on public.demandes_service
  for update using (acheteur_id = auth.uid());

drop policy if exists "Poster une offre" on public.offres_service;
create policy offres_insert on public.offres_service
  for insert with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 5. Fonctions internes — retirer l'exécution via l'API REST publique.
-- Ce sont des fonctions de trigger : rien ne doit pouvoir les appeler
-- directement depuis le client.
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('award_seller_points','rls_auto_enable','notify_new_message',
                        'add_njangi_owner','add_owner_as_member','add_space_owner',
                        'on_reel_comment')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- search_path figé (sinon un rôle peut détourner la résolution des noms).
alter function public.notify_new_message() set search_path = public;
alter function public.similar_products(uuid, integer) set search_path = public;

-- ---------------------------------------------------------------------------
-- 6. RATE LIMITING — table + fonction partagées par les edge functions.
-- Fenêtre glissante par (clé, action). La table n'est jamais lisible ni
-- écrivable par le client : seul le service_role (edge functions) y touche.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,        -- ex: 'miroir-ia:<user_id>' ou 'finou:<ip>'
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_bucket_time_idx
  on public.rate_limits(bucket, created_at desc);

alter table public.rate_limits enable row level security;
-- Aucune policy : RLS activée sans policy = tout est refusé au client.
revoke all on public.rate_limits from anon, authenticated;

-- Renvoie true si l'appel est AUTORISÉ (et l'enregistre), false si la limite
-- est atteinte. SECURITY DEFINER, non exposée au client.
create or replace function public.check_rate_limit(
  p_bucket text, p_limit int, p_window_seconds int
) returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.rate_limits
    where created_at < now() - make_interval(secs => p_window_seconds * 4);

  select count(*) into n from public.rate_limits
    where bucket = p_bucket
      and created_at > now() - make_interval(secs => p_window_seconds);

  if n >= p_limit then
    return false;
  end if;

  insert into public.rate_limits(bucket) values (p_bucket);
  return true;
end;
$$;
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
