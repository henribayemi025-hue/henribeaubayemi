-- Demande de suppression de compte (droit d'effacement, CGU art. 20).
--
-- Volontairement PAS une suppression instantanée: le projet Supabase
-- bokwivwizghdlaedczbw héberge, en plus de Finjaro, au moins deux autres
-- applications sans rapport (tables njangi_*, projects/shared_spaces,
-- produits/boutiques/offres_service) qui partagent le même auth.users.
-- Un DELETE en cascade sur auth.users depuis une action du seul client
-- Finjaro est trop dangereux dans ce contexte. La demande est donc posée
-- ici, traitée à la main par l'administratrice (Beau), qui peut alors
-- vérifier avant toute suppression définitive.
alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_reason text;

comment on column public.profiles.deletion_requested_at is
  'Horodatage de la demande de suppression de compte (art. 20 des CGU). NULL = pas de demande en cours.';
comment on column public.profiles.deletion_reason is
  'Raison optionnelle donnée par l''utilisateur au moment de la demande.';
