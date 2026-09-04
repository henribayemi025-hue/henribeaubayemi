-- Jetons de notification NATIVE (Firebase Cloud Messaging pour Android,
-- Apple Push Notification service pour iOS plus tard).
--
-- `push_subscriptions` (Web Push/VAPID) ne fonctionne QUE dans un vrai
-- navigateur — pas dans la coque Capacitor de l'app installée depuis le
-- Play Store: sans intégration native (FCM/APNs), l'app fermée ne peut pas
-- être réveillée par l'OS pour afficher une notification. C'est la vraie
-- raison derrière « les gens se plaignent d'avoir pas reçu de notif sur
-- l'app » (Beau, 04/09) — distinct du correctif serveur du même jour
-- (migration 0072) qui, lui, ne concerne que le web.
--
-- Une table séparée plutôt qu'ajouter une colonne à push_subscriptions:
-- les deux jetons ont un format et une durée de vie différents, et le canal
-- d'envoi (Web Push vs FCM/APNs) est entièrement différent côté serveur.
create table if not exists public.native_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists native_push_tokens_user_idx on public.native_push_tokens (user_id);

alter table public.native_push_tokens enable row level security;

-- Même patron que push_subscriptions: chacun gère ses propres jetons.
drop policy if exists native_push_read on public.native_push_tokens;
create policy native_push_read on public.native_push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists native_push_insert on public.native_push_tokens;
create policy native_push_insert on public.native_push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists native_push_delete on public.native_push_tokens;
create policy native_push_delete on public.native_push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.native_push_tokens is
  'Jetons FCM/APNs pour le push natif (app installée), distincts des abonnements Web Push (push_subscriptions, navigateur uniquement).';
