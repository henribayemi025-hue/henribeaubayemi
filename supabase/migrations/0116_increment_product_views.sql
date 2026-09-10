-- Audit du 10/09: la fiche article incrémentait `views` par un UPDATE
-- direct sur products. La politique RLS d'écriture (products_write) ne
-- laisse passer que la propriétaire de la boutique: pour toute cliente,
-- l'UPDATE touchait zéro ligne, sans erreur. Résultat: les vues ne
-- comptaient que… la vendeuse qui regarde sa propre fiche. « Article le
-- plus vu » (bilan hebdo, 0115) et les tris par popularité reposaient sur
-- un compteur faux. La fonction ci-dessous compte pour tout le monde,
-- connecté ou non, sans ouvrir d'autre écriture sur products.
create or replace function public.increment_product_views(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
  set views = coalesce(views, 0) + 1
  where id = p_product_id and is_active = true;
$$;

grant execute on function public.increment_product_views(uuid) to anon, authenticated;
