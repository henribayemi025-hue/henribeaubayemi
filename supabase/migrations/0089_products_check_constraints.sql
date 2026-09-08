-- Trouvé en audit du 08/09 : price_fcfa >= 0 et stock >= 0 n'étaient
-- vérifiés que côté formulaire (VendorProductEdit.jsx) — un appel direct à
-- l'API (authentifié comme la vendeuse propriétaire de l'article) pouvait
-- poser un prix ou un stock négatif, faussant les totaux calculés dans
-- place_order. Vérifié avant d'ajouter la contrainte : aucune ligne
-- existante ne la viole.
alter table public.products
  add constraint products_price_non_negative check (price_fcfa >= 0),
  add constraint products_stock_non_negative check (stock >= 0);
