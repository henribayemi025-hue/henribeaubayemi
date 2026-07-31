-- Finjaro — prix sur les annonces. Beau: "quand je propose un service je dois
-- mettre mes prix, ce n'est pas gratuit". La table n'avait effectivement AUCUNE
-- colonne prix: on pouvait décrire une prestation mais jamais la tarifer.
--
-- Nullable des deux côtés, volontairement:
--   - une annonce "je cherche" n'a pas forcément de budget à annoncer;
--   - un prestataire peut vouloir donner son tarif de vive voix (devis).
-- Un prix absent s'affiche "Prix sur demande", jamais "0".
alter table public.near_you_listings add column if not exists price_fcfa integer;
alter table public.near_you_listings add column if not exists price_unit text;

-- Stocké en FCFA canonique comme partout ailleurs (products.price_fcfa): la
-- conversion vers la devise d'affichage se fait au rendu, donc une annonce
-- publiée en euros reste juste vue depuis le Cameroun.
alter table public.near_you_listings drop constraint if exists near_you_listings_price_positive;
alter table public.near_you_listings
  add constraint near_you_listings_price_positive
  check (price_fcfa is null or price_fcfa >= 0);

-- Unité de tarification: un ménage se facture à l'heure, un site web au
-- forfait, une location au mois. Liste fermée pour que l'affichage reste
-- traduisible (nearYou.priceUnit.*).
alter table public.near_you_listings drop constraint if exists near_you_listings_price_unit_valid;
alter table public.near_you_listings
  add constraint near_you_listings_price_unit_valid
  check (price_unit is null or price_unit in ('forfait', 'heure', 'jour', 'mois', 'm2', 'piece'));

-- TidalEx vend des services informatiques (décision de Beau). Elle était
-- enregistrée en "accessoires" faute de catégorie service proposée à
-- l'inscription, ce qui la rendait absente de l'annuaire des prestataires.
update public.shops
   set categories = array['informatique_digital']
 where slug = 'tidalex-data-solution-and-business-shop-1njn';
