-- Trace du traitement d'une demande de suppression de compte (audit C-4).
--
-- Jusqu'ici, « marquer comme traitée » vidait deletion_requested_at : il ne
-- restait aucune preuve qu'une demande avait été reçue ni quand elle avait
-- été satisfaite. Le RGPD demande de pouvoir le montrer.
--
-- Additif seulement (CLAUDE.md §4) : on ne supprime pas la ligne du
-- auth.users commun. Une suppression traitée = profil anonymisé, données
-- place de marché effacées, connexion bloquée pour toujours (adresse
-- remplacée, identités et sessions retirées, compte banni).
alter table public.profiles
  add column if not exists deletion_processed_at timestamptz;

comment on column public.profiles.deletion_processed_at is
  'Date à laquelle la demande de suppression a été traitée (profil anonymisé, connexion bloquée). NULL = jamais traitée.';
