-- Adresse de livraison enregistrée sur le profil.
--
-- Avant, l'adresse n'existait QUE sur la commande (`orders.address/city/
-- country`): il fallait la retaper intégralement à chaque achat, alors que
-- pour la même personne elle ne change quasiment jamais. On la garde donc
-- sur le profil et le tunnel de commande la pré-remplit.
--
-- Strictement ADDITIF (la base est partagée entre staging et la production):
-- des colonnes nullables en plus, aucune donnée existante touchée, aucune
-- politique RLS modifiée. `profiles` a déjà `phone` et `country`; il ne
-- manquait que la rue et la ville.
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;

comment on column public.profiles.address is
  'Rue/quartier de livraison par défaut. Pré-remplit le tunnel de commande, jamais partagé avec les boutiques tant qu''aucune commande n''est passée.';
comment on column public.profiles.city is
  'Ville de livraison par défaut, même usage que profiles.address.';
