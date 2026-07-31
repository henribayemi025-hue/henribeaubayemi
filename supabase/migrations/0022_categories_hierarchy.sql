-- Finjaro — fondations techniques pour une vraie table de catégories
-- hiérarchique (parent/enfant, PRODUCT/SERVICE, libellés FR/EN), en
-- préparation du pivot de catégories à venir.
--
-- PORTÉE DÉLIBÉRÉMENT LIMITÉE (décision produit explicite de Beau): cette
-- migration pose UNIQUEMENT la structure et migre les 25 catégories
-- existantes telles quelles (aucune sous-catégorie inventée) — la vraie
-- arborescence (Immobilier, Véhicules, etc.) arrivera dans un prompt séparé.
-- Idempotent, non destructif: `category`/`categories` restent des colonnes
-- text/text[] identiques pour le code applicatif, seule une contrainte de
-- clé étrangère est ajoutée par-dessus.
--
-- Deux familles de catégories coexistaient déjà dans le code (src/lib/
-- categories.js), jamais dans une table:
--   - CATEGORIES (15) — vendues comme PRODUCT, utilisées par products.category
--     et shops.categories.
--   - SERVICE_CATEGORIES (10) — utilisées uniquement par
--     near_you_listings.category (annonces "Je propose" un service).
-- Reprises ici à l'identique, avec kind='PRODUCT'/'SERVICE' en conséquence.

create table if not exists public.categories (
  id text primary key,
  parent_id text references public.categories(id) on delete restrict,
  kind text not null check (kind in ('PRODUCT', 'SERVICE')),
  label_fr text not null,
  label_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);

alter table public.categories enable row level security;
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);
-- Pas de policy insert/update/delete: seule la console Supabase / le
-- service_role gère la hiérarchie pour l'instant (comme app_config).

-- Les 15 catégories PRODUCT existantes (src/lib/categories.js CATEGORIES),
-- toutes au premier niveau (parent_id NULL) — vérifiées: ce sont exactement
-- les valeurs déjà utilisées dans products.category et shops.categories en
-- production, aucune autre.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('mode',          null, 'PRODUCT', 'Mode',            'Fashion',        1),
  ('chaussures',    null, 'PRODUCT', 'Chaussures',       'Shoes',          2),
  ('sacs',          null, 'PRODUCT', 'Sacs',             'Bags',           3),
  ('maroquinerie',  null, 'PRODUCT', 'Maroquinerie',     'Leather goods',  4),
  ('bijoux',        null, 'PRODUCT', 'Bijoux',           'Jewelry',        5),
  ('montres',       null, 'PRODUCT', 'Montres',          'Watches',        6),
  ('parfums',       null, 'PRODUCT', 'Parfums',          'Fragrance',      7),
  ('beaute',        null, 'PRODUCT', 'Beauté',           'Beauty',         8),
  ('cheveux',       null, 'PRODUCT', 'Cheveux',          'Hair',           9),
  ('deco',          null, 'PRODUCT', 'Déco',             'Decor',         10),
  ('mariages',      null, 'PRODUCT', 'Mariages',         'Weddings',      11),
  ('evenement',     null, 'PRODUCT', 'Événement',        'Events',        12),
  ('mannequinerie', null, 'PRODUCT', 'Mannequinerie',    'Modeling',      13),
  ('art',           null, 'PRODUCT', 'Art',              'Art',           14),
  ('accessoires',   null, 'PRODUCT', 'Accessoires',      'Accessories',   15)
on conflict (id) do nothing;

-- Les 10 catégories SERVICE existantes (src/lib/categories.js
-- SERVICE_CATEGORIES), utilisées par near_you_listings.category.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('reparation',           null, 'SERVICE', 'Réparation & Bricolage',   'Repairs & Handywork', 16),
  ('menage',                null, 'SERVICE', 'Ménage',                   'Cleaning',            17),
  ('cours',                 null, 'SERVICE', 'Cours & Tutorat',          'Tutoring & Lessons',  18),
  ('jardinage',             null, 'SERVICE', 'Jardinage',                'Gardening',           19),
  ('demenagement',          null, 'SERVICE', 'Déménagement',             'Moving',              20),
  ('beaute_domicile',       null, 'SERVICE', 'Beauté à domicile',        'At-home beauty',      21),
  ('ongles',                null, 'SERVICE', 'Ongles & Manucure',        'Nails & Manicure',    22),
  ('coursier',              null, 'SERVICE', 'Coursier & Livraison',     'Courier & Delivery',  23),
  ('evenementiel_service',  null, 'SERVICE', 'Prestataire événementiel', 'Event services',      24),
  ('autre_service',         null, 'SERVICE', 'Autre service',            'Other service',       25)
on conflict (id) do nothing;

-- products.category et near_you_listings.category référencent maintenant la
-- table — vérifié au préalable (execute_sql en lecture seule) que toutes les
-- valeurs déjà en base (14 distinctes, toutes PRODUCT) sont couvertes.
alter table public.products
  drop constraint if exists products_category_fk;
alter table public.products
  add constraint products_category_fk foreign key (category) references public.categories(id);

alter table public.near_you_listings
  drop constraint if exists near_you_listings_category_fk;
alter table public.near_you_listings
  add constraint near_you_listings_category_fk foreign key (category) references public.categories(id);

-- shops.categories est un text[] — pas de FK native sur un tableau en
-- Postgres, donc validation par trigger plutôt que par contrainte.
create or replace function public.validate_shop_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.categories is not null and exists (
    select 1 from unnest(new.categories) c
    where c not in (select id from public.categories)
  ) then
    raise exception 'catégorie(s) invalide(s) dans shops.categories';
  end if;
  return new;
end;
$$;
revoke execute on function public.validate_shop_categories() from public, anon, authenticated;

drop trigger if exists trg_validate_shop_categories on public.shops;
create trigger trg_validate_shop_categories
  before insert or update of categories on public.shops
  for each row execute function public.validate_shop_categories();
