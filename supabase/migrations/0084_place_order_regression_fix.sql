-- CORRECTIF URGENT — régression introduite PAR LE CORRECTIF DE SÉCURITÉ DU
-- 07/09 (0077_orders_financial_lock.sql), trouvée en testant en conditions
-- réelles la migration 0083 du jour : place_order() est SECURITY DEFINER,
-- mais `auth.role()`/`auth.uid()` restent ceux de la session de l'appelante
-- (SECURITY DEFINER change les droits SQL, pas l'identité JWT). Le trigger
-- lock_order_financials ne voit donc AUCUNE différence entre « une acheteuse
-- modifie sa commande depuis la console » (à bloquer) et « place_order pose
-- le total qu'il vient de calculer, juste après avoir créé la commande » (à
-- laisser passer) — il bloquait les deux. Résultat : TOUTE commande passée
-- depuis le 07/09 échouait à la toute dernière étape, avec l'erreur "Les
-- montants et le statut de paiement d'une commande ne se modifient pas
-- depuis l'app." Passé inaperçu jusqu'ici faute de nouvelle commande réelle
-- depuis cette date (trafic très faible) — trouvé en testant ce jour-même
-- le correctif de stock (0083), pas signalé par un utilisateur.
--
-- Correctif : un drapeau de session, posé UNIQUEMENT par place_order juste
-- avant sa propre écriture légitime, local à la transaction (redescend tout
-- seul, aucun risque de fuite vers une requête suivante). Le trigger
-- l'accepte comme preuve, en plus de service_role.
create or replace function public.lock_order_financials()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' or current_setting('finjaro.internal_order_write', true) = 'on' then
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
    or new.payment_ref is distinct from old.payment_ref
    or new.paid_at is distinct from old.paid_at
    or new.subtotal_fcfa is distinct from old.subtotal_fcfa
    or new.total_fcfa is distinct from old.total_fcfa
    or new.delivery_fee_fcfa is distinct from old.delivery_fee_fcfa
    or new.platform_fee_fcfa is distinct from old.platform_fee_fcfa
  then
    raise exception 'Les montants et le statut de paiement d''une commande ne se modifient pas depuis l''app.';
  end if;

  return new;
end;
$$;

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

  perform set_config('finjaro.internal_order_write', 'on', true);
  update orders o
     set subtotal_fcfa = v_subtotal,
         total_fcfa    = v_subtotal + v_fee
   where o.id = v_order_id;

  return query
    select o.id, o.order_no, o.shop_id, o.total_fcfa
      from orders o where o.id = v_order_id;
end;
$function$;
