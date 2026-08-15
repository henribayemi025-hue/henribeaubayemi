-- La surveillance des contenus, chaque matin, par Finia.
--
-- Beau: « Finia qui passe chaque matin pour vérifier les contenus, me
-- signaler et bloquer les contenus mauvais — sex toys, pédo, trucs trafiqués,
-- bref les trucs mauvais ».
--
-- Jusqu'ici la modération était uniquement RÉACTIVE: la file d'attente ne se
-- remplissait que si une personne signalait quelque chose. Zéro signalement
-- reçu à ce jour — ce qui ne prouve pas que tout est propre, seulement que
-- personne n'a cliqué. Un article illégal pouvait donc rester en ligne
-- indéfiniment, avec le nom de Finjaro dessus.
--
-- Ce qui suit permet à une inspection AUTOMATIQUE de déposer ses constats
-- dans la même file, et de retirer immédiatement de la vente ce qui est
-- manifestement interdit — sans jamais rien supprimer, pour qu'une erreur de
-- la machine reste réversible d'un clic.

-- 1) Les signalements peuvent venir de la machine, pas seulement d'une personne.
alter table public.reports alter column reporter_id drop not null;

alter table public.reports
  add column if not exists source text not null default 'user',
  add column if not exists severity text,
  add column if not exists detail text;

comment on column public.reports.source is
  'user = signalé par quelqu''un; auto = repéré par l''inspection quotidienne.';
comment on column public.reports.severity is
  'block = retiré de la vente immédiatement; review = douteux, attend Beau.';
comment on column public.reports.detail is
  'Ce que l''inspection a lu et pourquoi elle a tranché — en clair, pour Beau.';

-- 2) Retirer de la vente SANS supprimer.
--
-- `is_active = false` suffirait à masquer l'article, mais serait
-- indiscernable d'un retrait volontaire par la vendeuse: impossible ensuite
-- de savoir quoi remettre si l'inspection s'est trompée, ni d'expliquer à la
-- vendeuse pourquoi son article a disparu.
alter table public.products
  add column if not exists moderation_hidden_at timestamptz,
  add column if not exists moderation_reason text;

alter table public.shops
  add column if not exists moderation_hidden_at timestamptz,
  add column if not exists moderation_reason text;

create index if not exists products_moderation_idx
  on public.products (moderation_hidden_at) where moderation_hidden_at is not null;

-- 3) Mémoire de la dernière inspection, pour ne relire que le nouveau.
create table if not exists public.moderation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  checked_count integer not null default 0,
  blocked_count integer not null default 0,
  flagged_count integer not null default 0,
  error text
);

alter table public.moderation_runs enable row level security;

-- Personne n'y touche depuis le navigateur: seule la fonction d'inspection
-- (clé de service) écrit ici, et l'administration lit via ses propres droits.
drop policy if exists moderation_runs_admin_read on public.moderation_runs;
create policy moderation_runs_admin_read on public.moderation_runs
  for select using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- 4) L'article retiré par la modération sort du catalogue public.
--
-- On ne touche pas aux règles existantes: on ajoute une condition à la vue
-- que le catalogue utilise déjà via `is_active`. L'inspection passe
-- `is_active` à false ET horodate `moderation_hidden_at`; le premier suffit
-- à le masquer, le second dit pourquoi.
