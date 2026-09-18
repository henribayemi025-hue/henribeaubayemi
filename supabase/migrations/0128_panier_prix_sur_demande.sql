-- Les articles « prix sur demande » entrent dans le panier.
--
-- ⚠️ PAS ENCORE POSÉE EN PRODUCTION. Essayée sur le projet de test
-- `qiyvoaljqmbfldephobp`. Beau doit dire oui avant.
--
-- Pourquoi: 211 des 438 articles actifs (48 %), dans 20 boutiques, sont en
-- `price_on_request`, et `place_order()` refusait purement et simplement ces
-- lignes (`product_on_request:%`). La moitié du catalogue ne pouvait donc pas
-- être commandée — aucune commande n'en a JAMAIS contenu une seule.
--
-- Le parcours ajouté:
--
--   1. la cliente met l'article au panier, prix « à confirmer »
--   2. la commande part en `awaiting_price` — la vendeuse doit chiffrer
--   3. la vendeuse saisit les prix → `priced`
--   4. la cliente accepte → `new`, et c'est SEULEMENT LÀ que le stock bouge
--   5. ensuite: confirmée → envoyée → livrée, exactement comme aujourd'hui
--
-- Le stock ne bouge pas tant que le prix est inconnu. C'est la règle dure de
-- ce fichier: une demande de prix laissée sans suite ne doit pas immobiliser
-- l'article, et une cliente qui se désiste ne doit pas créer de faux stock ni
-- de fausse écriture comptable (l'écriture ne part qu'à la LIVRAISON, voir
-- 0127).
--
-- Additive: deux colonnes ajoutées, une contrainte élargie, des fonctions
-- remplacées. Aucune suppression, aucun renommage.

-- ---------------------------------------------------------------------------
-- 1. Les deux colonnes de ligne
-- ---------------------------------------------------------------------------

-- Le prix de cette ligne n'est pas encore connu. `price_fcfa` vaut 0 en
-- attendant — la colonne est NOT NULL et on ne la touche pas.
alter table public.order_items
  add column if not exists price_pending boolean not null default false;

-- Le stock de cette ligne a-t-il été retiré des produits ?
--
-- `default true` et pas `false`: toutes les lignes déjà en base ont bien vu
-- leur stock décrémenté par `place_order()`. Avec un défaut à `false`,
-- `restock_on_cancel()` cesserait de recréditer les commandes normales — on
-- perdrait du stock réel sur toutes les annulations à venir.
alter table public.order_items
  add column if not exists stock_taken boolean not null default true;

-- Quand la vendeuse a chiffré. Sert à retrouver les devis qui traînent.
alter table public.orders
  add column if not exists priced_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Les deux nouveaux statuts
-- ---------------------------------------------------------------------------

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('awaiting_price', 'priced', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- ---------------------------------------------------------------------------
-- 3. place_order accepte les lignes sur demande
-- ---------------------------------------------------------------------------

create or replace function public.place_order(
  p_shop_id uuid,
  p_method text,
  p_payment_status text default 'cod',
  p_buyer_name text default null,
  p_buyer_phone text default null,
  p_address text default null,
  p_city text default null,
  p_country text default null,
  p_zone_index integer default null,
  p_items jsonb default '[]'::jsonb
)
-- La signature de retour ne change PAS: `create or replace` refuserait de
-- modifier le type de retour, et il faudrait supprimer puis recréer la
-- fonction en production — avec une fenêtre où commander est impossible. Le
-- client sait déjà, par son panier, si la commande est un devis.
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
  v_devis    boolean := false;
  v_statut   text;
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

  -- Un premier passage sans rien écrire: la commande est-elle un devis ?
  -- Il faut le savoir AVANT d'insérer, parce que ça décide du statut et,
  -- surtout, de ne toucher à aucun stock.
  for v_item in select * from jsonb_array_elements(p_items) loop
    if exists (
      select 1 from products p
       where p.id = (v_item ->> 'product_id')::uuid
         and coalesce(p.price_on_request, false)
    ) then
      v_devis := true;
    end if;
  end loop;

  v_statut := case when v_devis then 'awaiting_price' else 'new' end;

  insert into orders (
    buyer_id, shop_id, status, delivery_method, payment_status,
    buyer_name, buyer_phone, address, city, country,
    subtotal_fcfa, delivery_fee_fcfa, total_fcfa
  ) values (
    v_buyer, p_shop_id, v_statut, p_method, coalesce(p_payment_status, 'cod'),
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

    -- Sur une commande en attente de prix, AUCUN stock ne bouge — pas même
    -- celui des lignes dont le prix est connu. Il sera vérifié puis retiré au
    -- moment où la cliente accepte le devis, sur du stock à jour.
    if not v_devis then
      if coalesce(v_prod.stock, 0) < v_qty then
        raise exception 'insufficient_stock:%', v_prod.name using errcode = 'P0001';
      end if;
      update products p set stock = p.stock - v_qty where p.id = v_prod.id;
    end if;

    v_name := v_prod.name;
    if coalesce(v_item ->> 'size', '') <> '' or coalesce(v_item ->> 'color', '') <> '' then
      v_name := v_name || ' ('
        || concat_ws(' · ', nullif(v_item ->> 'size', ''), nullif(v_item ->> 'color', ''))
        || ')';
    end if;

    insert into order_items (order_id, product_id, name, price_fcfa, qty, price_pending, stock_taken)
    values (
      v_order_id, v_prod.id, v_name,
      case when coalesce(v_prod.price_on_request, false) then 0 else v_prod.price_fcfa end,
      v_qty,
      coalesce(v_prod.price_on_request, false),
      not v_devis
    );

    if not coalesce(v_prod.price_on_request, false) then
      v_subtotal := v_subtotal + v_prod.price_fcfa * v_qty;
    end if;
  end loop;

  perform set_config('finjaro.internal_order_write', 'on', true);
  update orders o
     set subtotal_fcfa = case when v_devis then 0 else v_subtotal end,
         total_fcfa    = case when v_devis then 0 else v_subtotal + v_fee end
   where o.id = v_order_id;

  return query
    select o.id, o.order_no, o.shop_id, o.total_fcfa
      from orders o where o.id = v_order_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. La vendeuse chiffre
-- ---------------------------------------------------------------------------

-- p_prices: [{"item_id": "...", "price_fcfa": 12000}, ...]
-- Toutes les lignes en attente doivent être chiffrées d'un coup: une commande
-- à moitié chiffrée n'a pas de total, donc rien à accepter.
create or replace function public.set_order_prices(p_order_id uuid, p_prices jsonb)
returns table(id uuid, total_fcfa integer, status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order    record;
  v_line     jsonb;
  v_prix     int;
  v_restant  int;
  v_subtotal int;
begin
  select o.* into v_order from orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'order_missing' using errcode = 'P0001';
  end if;
  if not owns_shop(v_order.shop_id) then
    raise exception 'not_your_shop' using errcode = 'P0001';
  end if;
  if v_order.status not in ('awaiting_price', 'priced') then
    raise exception 'order_not_awaiting_price' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_prices) <> 'array' or jsonb_array_length(p_prices) = 0 then
    raise exception 'no_prices' using errcode = 'P0001';
  end if;

  for v_line in select * from jsonb_array_elements(p_prices) loop
    v_prix := coalesce((v_line ->> 'price_fcfa')::int, 0);
    if v_prix <= 0 then
      raise exception 'bad_price' using errcode = 'P0001';
    end if;
    update order_items oi
       set price_fcfa = v_prix, price_pending = false
     where oi.id = (v_line ->> 'item_id')::uuid
       and oi.order_id = p_order_id;
  end loop;

  select count(*) into v_restant from order_items oi
   where oi.order_id = p_order_id and oi.price_pending;
  if v_restant > 0 then
    raise exception 'prices_missing:%', v_restant using errcode = 'P0001';
  end if;

  select coalesce(sum(oi.price_fcfa * oi.qty), 0) into v_subtotal
    from order_items oi where oi.order_id = p_order_id;

  perform set_config('finjaro.internal_order_write', 'on', true);
  update orders o
     set subtotal_fcfa = v_subtotal,
         total_fcfa    = v_subtotal + coalesce(o.delivery_fee_fcfa, 0),
         priced_at     = now(),
         status        = 'priced'
   where o.id = p_order_id;

  return query
    select o.id, o.total_fcfa, o.status from orders o where o.id = p_order_id;
end;
$function$;

grant execute on function public.set_order_prices(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. La cliente accepte — et c'est ici, et nulle part avant, que le stock bouge
-- ---------------------------------------------------------------------------

create or replace function public.accept_order_prices(p_order_id uuid)
returns table(id uuid, total_fcfa integer, status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order record;
  v_item  record;
  v_stock int;
begin
  select o.* into v_order from orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'order_missing' using errcode = 'P0001';
  end if;
  if v_order.buyer_id <> auth.uid() then
    raise exception 'not_your_order' using errcode = 'P0001';
  end if;
  if v_order.status <> 'priced' then
    raise exception 'order_not_priced' using errcode = 'P0001';
  end if;

  -- Le stock est vérifié MAINTENANT, sur les quantités d'aujourd'hui: entre la
  -- demande de prix et l'acceptation, la vendeuse a pu vendre l'article
  -- ailleurs.
  for v_item in
    select oi.id, oi.product_id, oi.qty, oi.name, oi.stock_taken
      from order_items oi where oi.order_id = p_order_id
  loop
    if v_item.stock_taken or v_item.product_id is null then
      continue;
    end if;
    select p.stock into v_stock from products p where p.id = v_item.product_id for update;
    if coalesce(v_stock, 0) < v_item.qty then
      raise exception 'insufficient_stock:%', v_item.name using errcode = 'P0001';
    end if;
    update products p set stock = p.stock - v_item.qty where p.id = v_item.product_id;
    update order_items oi set stock_taken = true where oi.id = v_item.id;
  end loop;

  update orders o set status = 'new' where o.id = p_order_id;

  return query
    select o.id, o.total_fcfa, o.status from orders o where o.id = p_order_id;
end;
$function$;

grant execute on function public.accept_order_prices(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Les transitions autorisées
-- ---------------------------------------------------------------------------

create or replace function public.lock_order_status()
returns trigger
language plpgsql
as $function$
declare
  est_vendeuse boolean;
  est_acheteuse boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  est_acheteuse := (auth.uid() = old.buyer_id);
  est_vendeuse := public.owns_shop(old.shop_id);

  if new.status is distinct from old.status then
    if not (
      -- Devis: la vendeuse chiffre (set_order_prices), la cliente accepte
      -- (accept_order_prices) ou refuse. Chacune des deux peut abandonner
      -- tant que le devis n'est pas accepté — aucun stock n'a bougé.
      (est_vendeuse and old.status = 'awaiting_price' and new.status = 'priced')
      or (est_acheteuse and old.status = 'priced' and new.status = 'new')
      or (est_acheteuse and old.status in ('awaiting_price', 'priced') and new.status = 'cancelled')
      or (est_vendeuse and old.status in ('awaiting_price', 'priced') and new.status = 'cancelled')
      -- Le parcours existant, inchangé.
      or (est_vendeuse and old.status = 'new' and new.status = 'confirmed')
      or (est_vendeuse and old.status = 'confirmed' and new.status = 'shipped')
      or (est_vendeuse and old.status = 'shipped' and new.status = 'delivered')
      or (est_vendeuse and old.status in ('new', 'confirmed', 'shipped') and new.status = 'cancelled')
      or (est_acheteuse and old.status = 'shipped' and new.status = 'delivered')
    ) then
      raise exception 'Transition de statut de commande non autorisée : % -> %', old.status, new.status;
    end if;
  end if;

  if new.buyer_received is distinct from old.buyer_received then
    if not (est_acheteuse and coalesce(old.buyer_received, false) = false and new.buyer_received = true) then
      raise exception 'Modification de buyer_received non autorisée.';
    end if;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. Ne jamais recréditer un stock qui n'a jamais été retiré
-- ---------------------------------------------------------------------------

-- Sans ce garde-fou, annuler une demande de prix CRÉERAIT du stock à partir de
-- rien: la commande n'en avait jamais consommé. C'est exactement le « faux
-- stock » qu'il faut éviter.
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
       set stock = p.stock + oi.qty
      from order_items oi
     where oi.order_id = new.id and p.id = oi.product_id and oi.stock_taken;
    update order_items oi set stock_taken = false
     where oi.order_id = new.id and oi.stock_taken;
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 8. Ce que chacune reçoit
-- ---------------------------------------------------------------------------

-- Une demande de prix n'est pas une commande: dire « Nouvelle commande » à la
-- vendeuse l'enverrait chercher une adresse de livraison alors qu'on attend un
-- chiffre de sa part.
create or replace function public.on_order_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare owner uuid; titre text; corps text;
begin
  select owner_id into owner from public.shops where id = new.shop_id;
  if owner is null then
    return new;
  end if;

  if new.status = 'awaiting_price' then
    titre := 'Demande de prix';
    corps := 'Une cliente attend ton prix pour la commande #' || new.order_no || '.';
    perform public.notify(owner, 'order_quote_requested', titre, corps,
      jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
  else
    titre := 'Nouvelle commande';
    corps := 'Commande #' || new.order_no || ' reçue — réponds vite pour rassurer ta cliente.';
    perform public.notify(owner, 'order_received', titre,
      'Tu as reçu une nouvelle commande.',
      jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
  end if;

  perform public.push_notify(owner, titre, corps, '/vendor/orders', 'order-' || new.id);
  return new;
end;
$function$;

-- Le prix proposé doit atteindre la cliente: sans ça, elle a demandé un prix
-- et n'apprend jamais qu'il est arrivé.
create or replace function public.on_order_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare push_title text; push_body text;
begin
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

-- ---------------------------------------------------------------------------
-- 9. Les relances connaissent maintenant les demandes de prix
-- ---------------------------------------------------------------------------

-- Sans ça, une demande de prix jamais chiffrée resterait là indéfiniment:
-- aucune relance à la vendeuse, aucune annulation automatique, et une cliente
-- qui attend un prix qui ne viendra jamais. `remind_pending_orders()` ne
-- regardait que `new` et `confirmed`.
--
-- La première relance a son propre texte: on ne demande pas à la vendeuse de
-- « valider » une commande, on lui demande son PRIX.
create or replace function public.remind_pending_orders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select s.owner_id, count(*) as pending
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '6 hours'
      and o.created_at > now() - interval '14 days'
    group by s.owner_id
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — commandes en attente',
      r.pending || ' commande(s) attendent ta validation. Une reponse rapide rassure tes clientes !',
      '/vendor/orders',
      'order-reminder'
    );
  end loop;

  for r in
    select s.owner_id, count(*) as pending
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'awaiting_price'
      and o.created_at < now() - interval '6 hours'
      and o.created_at > now() - interval '14 days'
    group by s.owner_id
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — des clientes attendent ton prix',
      r.pending || ' demande(s) de prix sans reponse. Un prix envoye vite, c''est une commande de plus.',
      '/vendor/orders',
      'quote-reminder'
    );
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('awaiting_price', 'priced', 'new', 'confirmed')
      and o.followup_stage = 0
      and o.created_at < now() - interval '7 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — des nouvelles de ta commande ?',
      'La commande #' || r.order_no || ' est en attente depuis une semaine. Ca en est ou ?',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 1 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('awaiting_price', 'priced', 'new', 'confirmed')
      and o.followup_stage = 1
      and o.created_at < now() - interval '10 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — deuxieme relance',
      'La commande #' || r.order_no || ' est toujours en attente. Ta cliente attend une reponse.',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 2 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('awaiting_price', 'priced', 'new', 'confirmed')
      and o.followup_stage = 2
      and o.created_at < now() - interval '21 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — derniere relance',
      'La commande #' || r.order_no || ' sera annulee automatiquement d''ici une dizaine de jours si elle n''avance pas.',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 3 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, o.buyer_id, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('awaiting_price', 'priced', 'new', 'confirmed')
      and o.followup_stage = 3
      and o.created_at < now() - interval '30 days'
  loop
    update public.orders
      set status = 'cancelled',
          cancelled_at = now(),
          cancel_reason = 'Annulee automatiquement - aucune reponse de la vendeuse apres plusieurs relances.'
      where id = r.id;
    perform public.notify(r.buyer_id, 'order_cancelled', 'Commande annulee',
      'Ta commande #' || r.order_no || ' a ete annulee faute de reponse de la boutique.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
    perform public.notify(r.owner_id, 'order_cancelled', 'Commande annulee automatiquement',
      'La commande #' || r.order_no || ' a ete annulee faute de reponse.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
  end loop;
end;
$function$;
