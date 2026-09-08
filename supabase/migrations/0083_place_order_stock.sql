-- Trouvé en audit du 08/09 : place_order vérifie bien `stock >= qty` avant
-- d'accepter une commande, mais ne décrémente JAMAIS `products.stock`
-- ensuite — le stock affiché ne bouge jamais, quel que soit le nombre de
-- commandes passées dessus. Risque de survente : deux acheteuses peuvent
-- toutes les deux "réussir" leur commande sur le dernier exemplaire.
--
-- Deux changements dans le même bloc, tous deux nécessaires ensemble :
--   1. `for update` sur la lecture du produit : verrouille la ligne pendant
--      la transaction, pour qu'une deuxième commande simultanée sur le même
--      article attende son tour au lieu de lire un stock pas encore à jour.
--   2. La décrémentation elle-même, juste après la vérification.
-- Le reste de la fonction est recopié à l'identique de la définition
-- actuellement en base (aucun autre comportement ne change).
--
-- CONTREPARTIE OBLIGATOIRE, dans le même fichier : si le stock descend
-- désormais à la commande, il doit remonter à l'annulation — sinon une
-- vendeuse qui refuse une commande perdrait ce stock pour de bon, sans
-- jamais l'avoir vendu. Trigger séparé, après coup (AFTER UPDATE), qui
-- restitue exactement les quantités de `order_items` dès qu'une commande
-- passe à `cancelled`.
create or replace function public.place_order(
  p_shop_id uuid,
  p_method text,
  p_payment_status text default 'cod'::text,
  p_buyer_name text default null::text,
  p_buyer_phone text default null::text,
  p_address text default null::text,
  p_city text default null::text,
  p_country text default null::text,
  p_zone_index integer default null::integer,
  p_items jsonb default '[]'::jsonb
)
returns table(id uuid, order_no text, shop_id uuid, total_fcfa integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_buyer    uuid := auth.uid();
  v_shop     record;
  v_zone     jsonb;
  v_fee      int := 0;
  v_subtotal int := 0;
  v_order_id uuid;
  v_item     jsonb;
  v_prod     record;
  v_qty      int;
  v_name     text;
begin
  if v_buyer is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if p_method not in ('pickup', 'delivery') then
    raise exception 'bad_method' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = 'P0001';
  end if;

  select s.id, s.status, s.delivery_fee_fcfa, s.delivery_zones
    into v_shop
    from shops s where s.id = p_shop_id;
  if not found then
    raise exception 'shop_not_found' using errcode = 'P0001';
  end if;
  if v_shop.status <> 'active' then
    raise exception 'shop_unavailable' using errcode = 'P0001';
  end if;

  if p_method = 'delivery' then
    if p_zone_index is not null
       and jsonb_typeof(v_shop.delivery_zones) = 'array'
       and jsonb_array_length(v_shop.delivery_zones) > p_zone_index
    then
      v_zone := v_shop.delivery_zones -> p_zone_index;
      v_fee  := coalesce((v_zone ->> 'fee_fcfa')::int, 0);
    else
      v_fee := coalesce(v_shop.delivery_fee_fcfa, 0);
    end if;
  end if;

  insert into orders (
    buyer_id, shop_id, status, delivery_method, payment_status,
    buyer_name, buyer_phone, address, city, country,
    subtotal_fcfa, delivery_fee_fcfa, total_fcfa
  ) values (
    v_buyer, p_shop_id, 'new', p_method, coalesce(p_payment_status, 'cod'),
    p_buyer_name, p_buyer_phone,
    case when p_method = 'delivery' then p_address end,
    case when p_method = 'delivery' then coalesce(v_zone ->> 'name', p_city) end,
    case when p_method = 'delivery' then p_country end,
    0, v_fee, 0
  )
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, coalesce((v_item ->> 'qty')::int, 1));

    select p.id, p.name, p.price_fcfa, p.stock, p.is_active, p.shop_id, p.price_on_request
      into v_prod
      from products p
     where p.id = (v_item ->> 'product_id')::uuid
     for update;

    if not found then
      raise exception 'product_missing' using errcode = 'P0001';
    end if;
    if not v_prod.is_active then
      raise exception 'product_inactive:%', v_prod.name using errcode = 'P0001';
    end if;
    if v_prod.shop_id <> p_shop_id then
      raise exception 'product_other_shop:%', v_prod.name using errcode = 'P0001';
    end if;
    if coalesce(v_prod.price_on_request, false) then
      raise exception 'product_on_request:%', v_prod.name using errcode = 'P0001';
    end if;
    if coalesce(v_prod.stock, 0) < v_qty then
      raise exception 'insufficient_stock:%', v_prod.name using errcode = 'P0001';
    end if;

    update products p set stock = p.stock - v_qty where p.id = v_prod.id;

    v_name := v_prod.name;
    if coalesce(v_item ->> 'size', '') <> '' or coalesce(v_item ->> 'color', '') <> '' then
      v_name := v_name || ' ('
        || concat_ws(' · ', nullif(v_item ->> 'size', ''), nullif(v_item ->> 'color', ''))
        || ')';
    end if;

    insert into order_items (order_id, product_id, name, price_fcfa, qty)
    values (v_order_id, v_prod.id, v_name, v_prod.price_fcfa, v_qty);

    v_subtotal := v_subtotal + v_prod.price_fcfa * v_qty;
  end loop;

  update orders o
     set subtotal_fcfa = v_subtotal,
         total_fcfa    = v_subtotal + v_fee
   where o.id = v_order_id;

  return query
    select o.id, o.order_no, o.shop_id, o.total_fcfa
      from orders o where o.id = v_order_id;
end;
$function$;

comment on function public.place_order(uuid, text, text, text, text, text, text, text, integer, jsonb) is
  'Crée une commande et décrémente le stock des articles achetés (verrou for update pour éviter la survente en cas de commandes simultanées). Trouvé en audit du 08/09 : le stock ne descendait jamais.';

create or replace function public.restock_on_cancel()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
       set stock = p.stock + oi.qty
      from order_items oi
     where oi.order_id = new.id and p.id = oi.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_restock_on_cancel on public.orders;
create trigger trg_restock_on_cancel
  after update on public.orders
  for each row execute function public.restock_on_cancel();

comment on function public.restock_on_cancel() is
  'Restitue le stock des articles d''une commande annulée — contrepartie obligatoire de la décrémentation dans place_order (migration 0083).';
