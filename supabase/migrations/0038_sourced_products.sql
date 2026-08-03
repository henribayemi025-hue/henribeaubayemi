-- Article « sur commande »: la boutique ne l'a pas physiquement en stock,
-- elle le source auprès d'un fournisseur au moment de la commande. Décision
-- de Beau (02/08): il veut remplir ses propres boutiques (Beauty Hairs,
-- Camerounian Chanel, Décoration...) avec un vrai catalogue sourcé à la
-- demande — légitime tant que c'est affiché clairement (une seule boutique
-- réelle par article, jamais un faux stock).
--
-- Additif, comportement par défaut inchangé pour tout article existant
-- (is_sourced = false partout).
--
-- Appliquée directement en base le 02/08 (apply_migration, nom
-- "sourced_products") avant ce fichier — celui-ci ne fait que la consigner
-- dans le dépôt. `if not exists` / `if not exists` rendent le fichier
-- rejouable sans erreur si jamais reconstruit ailleurs.
alter table public.products
  add column if not exists is_sourced boolean not null default false,
  add column if not exists sourcing_days smallint;

do $$
begin
  alter table public.products
    add constraint products_sourcing_days_range
    check (sourcing_days is null or (sourcing_days between 1 and 60));
exception when duplicate_object then null;
end $$;

-- La commande garde une copie de l'état "sourcé" au moment de l'achat: la
-- boutique peut désactiver is_sourced sur le produit plus tard (rupture chez
-- le fournisseur, article maintenant en stock…) sans que ça réécrive
-- l'historique de ce qui a réellement été acheté.
alter table public.order_items
  add column if not exists is_sourced boolean not null default false;
