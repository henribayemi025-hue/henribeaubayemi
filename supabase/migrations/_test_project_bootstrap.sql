-- Finjaro — amorçage d'un projet Supabase NEUF (staging/test), PAS un fichier
-- de migration Finjaro numéroté. Nom volontairement hors séquence (préfixe
-- `_`) pour ne jamais être confondu avec 0001…, et pour qu'un outil qui
-- rejoue "0001 à 000N" dans l'ordre ne l'exécute pas par erreur sur un projet
-- qui n'en a pas besoin (la production, notamment).
--
-- POURQUOI CE FICHIER EXISTE
-- En vérifiant les 21 migrations avant de les rejouer sur le nouveau projet de
-- test (comme demandé — "lis-les d'abord, ne suppose rien"), une dépendance
-- cachée est apparue : les migrations Finjaro commencent par
-- `alter table public.profiles add column if not exists …` (0001) et
-- référencent `public.push_subscriptions` (0002) et `public.is_admin()`
-- (0015) SANS JAMAIS LES CRÉER. En production (bokwivwizghdlaedczbw), ces
-- trois éléments existaient déjà avant le premier commit Finjaro — ils
-- viennent du prototype d'origine / de l'app partagée qui occupe le même
-- projet (voir MIGRATION_NOTES.md §2). Rejouer 0001+ tel quel sur un projet
-- vide échoue donc immédiatement. Ce fichier fournit le strict minimum pour
-- que 0001…0021 s'appliquent sans erreur, avec le même schéma que ce que
-- Finjaro lit/écrit réellement (vérifié colonne par colonne contre la prod).
--
-- CE QUI N'EST VOLONTAIREMENT PAS REPRIS ICI
-- La prod héberge aussi 5 tables d'un ancien prototype, elles-mêmes
-- durcies (pas créées) par 0010_security_hardening.sql section 4 :
-- commentaires, messages, follows, demandes_service, offres_service — toutes
-- avec des clés étrangères vers `produits`/`boutiques`, les tables françaises
-- de CET ANCIEN PROTOTYPE, pas de Finjaro. Elles ne sont ni utilisées ni
-- lues par le code actuel de l'app. Les recréer dans le projet de test
-- n'apporterait rien à la vérification de Finjaro et dupliquerait le schéma
-- d'une autre application — hors périmètre. La section 4 de
-- 0010_security_hardening.sql est donc SAUTÉE sur le projet de test (elle est
-- appliquée telle quelle en production, où ces tables existent réellement).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default now(),
  is_admin boolean not null default false
);
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

-- `profiles.is_admin` (ci-dessus) et cette fonction sont TOUTES DEUX absentes
-- des 21 migrations Finjaro alors que 0010_security_hardening.sql et
-- 0015_rls_initplan_perf.sql les utilisent déjà — même dérive que ai_usage
-- (voir 0021) : posées directement en prod à un moment, jamais versionnées.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
