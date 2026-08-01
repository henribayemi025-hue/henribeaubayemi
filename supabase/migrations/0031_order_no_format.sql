-- Numéros de commande plus distincts.
--
-- Beau: « les numéros de commande ne doivent pas se ressembler, parce que le
-- vendeur ou nous on peut tracer le numéro de commande pour vérifier, ou même
-- pour le paiement ». L'ancien format (8 caractères hexadécimaux, ex.
-- "3F8A2C1B") mélange des caractères visuellement proches (0/8, B/8, C/G) et
-- ne dit rien sur la commande elle-même.
--
-- Nouveau format: FJ-XXXXXX où XXXXXX pioche 6 caractères dans un alphabet
-- SANS caractères ambigus (ni 0/O, ni 1/I/L) — lisible à voix haute au
-- téléphone sans confusion. L'unicité réelle reste garantie par la contrainte
-- déjà en place (orders_order_no_key) : en cas de collision (improbable sur
-- 32^6 combinaisons), l'insertion échoue et remonte une vraie erreur plutôt
-- que de silencieusement écraser un autre numéro.
create or replace function public.generate_order_no()
returns text
language sql
volatile
as $$
  select 'FJ-' || string_agg(
    substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', (random() * 31)::int + 1, 1),
    ''
  )
  from generate_series(1, 6);
$$;

alter table public.orders alter column order_no set default public.generate_order_no();
