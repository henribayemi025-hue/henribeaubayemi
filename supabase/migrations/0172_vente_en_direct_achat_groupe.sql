-- Deux idées du 22/09 (liste 65), faites le 23/09. Tout est additif.

-- 1. LA VENTE EN DIRECT. Les vendeuses vendent déjà en direct sur Instagram,
--    TikTok ou Facebook. Finjaro ne diffuse pas la vidéo (ça demanderait un
--    serveur de flux, payant): la boutique annonce son direct, avec le lien,
--    et Finjaro le montre — sur sa page, et sur l'accueil pendant qu'il dure.
--    live_since vide = pas en direct. Un direct de plus de 4 h n'est plus
--    affiché (une vendeuse qui oublie d'arrêter n'induit personne en erreur).
alter table public.shops add column if not exists live_url text;
alter table public.shops add column if not exists live_title text;
alter table public.shops add column if not exists live_since timestamptz;
comment on column public.shops.live_since is 'Début du direct annoncé par la boutique; vide = pas en direct.';
create index if not exists shops_live_since_idx on public.shops (live_since) where live_since is not null;

-- 2. L'ACHAT GROUPÉ. Un prix par pièce dès N pièces dans la même commande
--    (une famille, des amies, un revendeur qui achètent ensemble). La
--    vendeuse fixe les deux chiffres; place_order applique le prix, pas le
--    client.
alter table public.products add column if not exists lot_qty integer check (lot_qty is null or lot_qty >= 2);
alter table public.products add column if not exists lot_price_fcfa integer check (lot_price_fcfa is null or lot_price_fcfa > 0);
comment on column public.products.lot_qty is 'Achat groupé: nombre de pièces à partir duquel lot_price_fcfa s''applique (par pièce).';

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
  v_prix     int;
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

    select p.id, p.name, p.price_fcfa, p.stock, p.is_active, p.shop_id, p.price_on_request,
           p.lot_qty, p.lot_price_fcfa
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

    -- ACHAT GROUPÉ (0172): dès lot_qty pièces dans la même commande, chaque
    -- pièce passe au prix de lot. Décidé ici, côté serveur, jamais par le
    -- client — le panier ne fait que l'afficher.
    v_prix := case
      when coalesce(v_prod.price_on_request, false) then 0
      when v_prod.lot_qty is not null and v_prod.lot_price_fcfa is not null and v_qty >= v_prod.lot_qty then v_prod.lot_price_fcfa
      else v_prod.price_fcfa end;

    v_name := v_prod.name;
    if coalesce(v_item ->> 'size', '') <> '' or coalesce(v_item ->> 'color', '') <> '' then
      v_name := v_name || ' ('
        || concat_ws(' · ', nullif(v_item ->> 'size', ''), nullif(v_item ->> 'color', ''))
        || ')';
    end if;

    insert into order_items (order_id, product_id, name, price_fcfa, qty, price_pending, stock_taken)
    values (
      v_order_id, v_prod.id, v_name,
      v_prix,
      v_qty,
      coalesce(v_prod.price_on_request, false),
      not v_devis
    );

    if not coalesce(v_prod.price_on_request, false) then
      v_subtotal := v_subtotal + v_prix * v_qty;
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
