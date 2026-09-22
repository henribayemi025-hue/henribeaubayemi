-- Commander sans compte: « le panier, c'est une commande ».
--
-- Beau, 22/09 au soir: « quand on ajoute dans le panier, le vendeur doit
-- ouvrir Finjaro et accepter, parce que c'est une commande. Et quand il
-- accepte, il peut écrire à la personne. On doit trouver un moyen pour
-- contacter les gens qui sont entrés là. »
--
-- Ce qui se passait: on remplit son panier sans compte, puis « Passer
-- commande » exige de créer un compte — et la personne s'en va. Six paniers
-- depuis le 1er septembre, zéro commande, et personne à rappeler: aucun
-- nom, aucun numéro.
--
-- Désormais, une personne sans compte laisse un prénom et un numéro
-- WhatsApp, et sa demande arrive dans « Commandes » de la vendeuse comme
-- n'importe quelle commande (statut « new »): elle l'accepte, elle a le
-- numéro, elle écrit. Le compte reste possible, il n'est plus obligatoire.
--
-- Côté base:
--   - orders.buyer_id devient facultatif (une commande sans compte n'a pas
--     d'acheteuse en base). Toutes les règles existantes tiennent: l'accès
--     acheteuse (buyer_id = auth.uid()) est simplement faux pour null, la
--     vendeuse garde le sien par owns_shop.
--   - orders.guest_id: l'identifiant du navigateur (le même que dans les
--     événements), pour retrouver ses demandes plus tard.
--   - place_guest_order: la même mécanique que place_order (prix relus en
--     base, stock retiré, une seule transaction), ouverte aux visiteurs,
--     avec des garde-fous: un vrai numéro, un prénom, dix demandes par
--     navigateur et par jour, cinq par numéro.
--   - on_order_status ne prévient l'acheteuse que si elle a un compte
--     (sinon notify() échouait et bloquait la vendeuse).
-- Additive: rien n'est retiré, une colonne et une fonction s'ajoutent, une
-- contrainte se relâche.

alter table public.orders alter column buyer_id drop not null;
alter table public.orders add column if not exists guest_id text;
create index if not exists orders_guest_idx on public.orders (guest_id, created_at desc) where guest_id is not null;
create index if not exists orders_buyer_phone_recent_idx on public.orders (buyer_phone, created_at desc) where buyer_id is null;

create or replace function public.place_guest_order(
  p_shop_id uuid, p_buyer_name text, p_buyer_phone text, p_guest_id text,
  p_items jsonb default '[]'::jsonb, p_country text default null
)
returns table(id uuid, order_no text, shop_id uuid, total_fcfa integer)
language plpgsql security definer set search_path = public as $$
declare
  v_buyer    uuid := auth.uid();
  v_nom      text := nullif(trim(p_buyer_name), '');
  v_tel      text := nullif(trim(p_buyer_phone), '');
  v_chiffres text;
  v_shop     record;
  v_subtotal int := 0;
  v_order_id uuid;
  v_item     jsonb;
  v_prod     record;
  v_qty      int;
  v_name     text;
  v_devis    boolean := false;
  v_statut   text;
begin
  if v_nom is null or length(v_nom) < 2 then raise exception 'bad_name' using errcode = 'P0001'; end if;
  v_chiffres := regexp_replace(coalesce(v_tel, ''), '\D', '', 'g');
  if length(v_chiffres) < 7 or length(v_chiffres) > 15 then raise exception 'bad_phone' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty_cart' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'too_many_items' using errcode = 'P0001'; end if;

  -- Garde-fous contre l'abus: la fonction est ouverte aux visiteurs.
  if v_buyer is null then
    if coalesce(p_guest_id, '') = '' then raise exception 'bad_guest' using errcode = 'P0001'; end if;
    if (select count(*) from orders o where o.guest_id = p_guest_id and o.created_at > now() - interval '1 day') >= 10
       or (select count(*) from orders o where o.buyer_id is null and o.buyer_phone = v_tel and o.created_at > now() - interval '1 day') >= 5 then
      raise exception 'too_many' using errcode = 'P0001';
    end if;
  end if;

  select s.id, s.status into v_shop from shops s where s.id = p_shop_id;
  if not found then raise exception 'shop_not_found' using errcode = 'P0001'; end if;
  if v_shop.status <> 'active' then raise exception 'shop_unavailable' using errcode = 'P0001'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if exists (select 1 from products p where p.id = (v_item ->> 'product_id')::uuid and coalesce(p.price_on_request, false)) then
      v_devis := true;
    end if;
  end loop;
  v_statut := case when v_devis then 'awaiting_price' else 'new' end;

  insert into orders (buyer_id, guest_id, shop_id, status, delivery_method, payment_status, buyer_name, buyer_phone, country, subtotal_fcfa, delivery_fee_fcfa, total_fcfa)
  values (v_buyer, case when v_buyer is null then p_guest_id end, p_shop_id, v_statut, 'pickup', 'cod', v_nom, v_tel, p_country, 0, 0, 0)
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := least(50, greatest(1, coalesce((v_item ->> 'qty')::int, 1)));
    select p.id, p.name, p.price_fcfa, p.stock, p.is_active, p.shop_id, p.price_on_request
      into v_prod from products p where p.id = (v_item ->> 'product_id')::uuid for update;
    if not found then raise exception 'product_missing' using errcode = 'P0001'; end if;
    if not v_prod.is_active then raise exception 'product_inactive:%', v_prod.name using errcode = 'P0001'; end if;
    if v_prod.shop_id <> p_shop_id then raise exception 'product_other_shop:%', v_prod.name using errcode = 'P0001'; end if;

    if not v_devis then
      if coalesce(v_prod.stock, 0) < v_qty then raise exception 'insufficient_stock:%', v_prod.name using errcode = 'P0001'; end if;
      update products p set stock = p.stock - v_qty where p.id = v_prod.id;
    end if;

    v_name := v_prod.name;
    if coalesce(v_item ->> 'size', '') <> '' or coalesce(v_item ->> 'color', '') <> '' then
      v_name := v_name || ' (' || concat_ws(' · ', nullif(v_item ->> 'size', ''), nullif(v_item ->> 'color', '')) || ')';
    end if;

    insert into order_items (order_id, product_id, name, price_fcfa, qty, price_pending, stock_taken)
    values (v_order_id, v_prod.id, v_name,
      case when coalesce(v_prod.price_on_request, false) then 0 else v_prod.price_fcfa end,
      v_qty, coalesce(v_prod.price_on_request, false), not v_devis);

    if not coalesce(v_prod.price_on_request, false) then
      v_subtotal := v_subtotal + v_prod.price_fcfa * v_qty;
    end if;
  end loop;

  perform set_config('finjaro.internal_order_write', 'on', true);
  update orders o
     set subtotal_fcfa = case when v_devis then 0 else v_subtotal end,
         total_fcfa    = case when v_devis then 0 else v_subtotal end
   where o.id = v_order_id;

  return query select o.id, o.order_no, o.shop_id, o.total_fcfa from orders o where o.id = v_order_id;
end $$;

grant execute on function public.place_guest_order(uuid, text, text, text, jsonb, text) to anon, authenticated;

-- Sans compte, personne à prévenir côté acheteuse: la vendeuse la joint
-- par WhatsApp. Sans ce garde, notify(null, …) échouait et l'acceptation
-- de la commande échouait avec lui.
create or replace function public.on_order_status()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare push_title text; push_body text;
begin
  if new.buyer_id is null then return new; end if;
  if new.status is distinct from old.status then
    if new.status = 'priced' then
      perform public.notify(new.buyer_id, 'order_priced', 'Prix proposé',
        'La vendeuse a chiffré ta commande.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Prix proposé'; push_body := 'La vendeuse a chiffré ta commande #' || new.order_no || '.';
    elsif new.status = 'confirmed' then
      perform public.notify(new.buyer_id, 'order_confirmed', 'Commande confirmée',
        'Ta commande a été confirmée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande confirmée'; push_body := 'Ta commande #' || new.order_no || ' a été confirmée.';
    elsif new.status = 'shipped' then
      perform public.notify(new.buyer_id, 'order_shipped', 'Commande envoyée',
        'Ta commande a été envoyée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande envoyée'; push_body := 'Ta commande #' || new.order_no || ' est en route.';
    elsif new.status = 'delivered' then
      perform public.notify(new.buyer_id, 'order_delivered', 'Commande livrée',
        'Ta commande a été livrée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande livrée'; push_body := 'Ta commande #' || new.order_no || ' est arrivée.';
    elsif new.status = 'cancelled' then
      perform public.notify(new.buyer_id, 'order_cancelled', 'Commande annulée',
        coalesce('Motif : ' || new.cancel_reason, 'Ta commande a été annulée par la vendeuse.'),
        jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande annulée';
      push_body := coalesce('Commande #' || new.order_no || ' annulée : ' || new.cancel_reason,
                             'Ta commande #' || new.order_no || ' a été annulée par la vendeuse.');
    end if;
    if push_title is not null then
      perform public.push_notify(new.buyer_id, push_title, push_body, '/profile/orders', 'order-status-' || new.id);
    end if;
  end if;
  if new.buyer_received = true and old.buyer_received = false then
    update public.orders set status = 'delivered' where id = new.id and status <> 'delivered';
    perform public.notify(new.buyer_id, 'review_unlocked', 'Avis débloqué',
      'Tu peux maintenant laisser un avis.', jsonb_build_object('order_id', new.id, 'shop_id', new.shop_id));
  end if;
  return new;
end;
$function$;
