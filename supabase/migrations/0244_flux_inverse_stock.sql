-- APPLIQUÉE EN PRODUCTION le 14/10/2026 (ordre de Beau : « il faut le faire »). Essayée d'abord sur la base de test
-- (transaction annulée) : publication, commande, synchro sans survente, livraison -> productId, annulation,
-- vente en caisse, stock épuisé, utilisateur étranger refusé. Aucun article publié en production à ce jour.
-- Flux inverse, deuxième moitié : le stock d'Accounting et le catalogue Finjaro se suivent.
-- Écrite le 14/10/2026. Décidée par Beau le 14/10 : « la piste inverse, il faut le faire ».
-- Suite de 0242 (publier un article depuis le stock comptable) et de 0127 (commande livrée -> vente).
--
-- ⚠️ Touche la base COMMUNE aux deux applications (déclencheur de livraison, fonctions lues par
-- Accounting). Migration ADDITIVE : on remplace des fonctions, on en ajoute une, rien n'est supprimé.
-- Claudinette (Accounting) est prévenue : elle appelle `finia_synchroniser_stock` et traite le coût.
--
-- CE QUI MANQUAIT
--  1. Une vente de la place de marché arrivait dans Accounting avec `productId = ''` : Accounting ne
--     savait pas QUEL article avait été vendu, donc son stock ne baissait jamais. Une vendeuse qui
--     publie un article puis le vend sur Finjaro voyait un stock faux dans sa comptabilité.
--     Désormais la ligne porte `products.accounting_ref` (l'identifiant de l'article dans Accounting)
--     quand l'article a été publié depuis Accounting. Les autres lignes restent comme avant.
--  2. Rien ne remettait le stock d'Accounting dans le catalogue après une vente en caisse ou un achat :
--     le catalogue affichait le stock du jour de la publication.
--
-- LE PIÈGE QU'ON ÉVITE : LA SURVENTE
-- La place de marché RÉSERVE le stock dès la commande (`place_order`, 0083 : stock - qty), alors
-- qu'Accounting ne baisse son stock qu'à la LIVRAISON (événement `sale.record`). Si Accounting renvoyait
-- simplement son stock tel quel, il écraserait la réserve des commandes en cours : l'article
-- réapparaîtrait en stock alors que des acheteuses l'ont déjà commandé.
-- Le catalogue reçoit donc  stock d'Accounting  -  quantités commandées pas encore livrées.
-- Une commande livrée sort de la réserve au moment même où Accounting baisse son stock (même événement) ;
-- une commande annulée sort de la réserve et `restock_on_cancel` (0083) remet la quantité.

-- Quantité réservée d'un article : commandée (stock pris), ni livrée ni annulée.
create or replace function public.finia_stock_reserve(p_product uuid)
returns integer
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(sum(oi.qty), 0)::integer
    from order_items oi
    join orders o on o.id = oi.order_id
   where oi.product_id = p_product
     and oi.stock_taken
     and o.status not in ('cancelled', 'delivered');
$$;
-- Interne : appelée par les fonctions ci-dessous (security definer), jamais par un client.
revoke all on function public.finia_stock_reserve(uuid) from public, anon, authenticated;

-- 1. La ligne de vente porte la référence Accounting de l'article.
create or replace function public.finia_order_to_sale()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner    uuid;
  v_shopname text;
  v_ws       uuid;
  v_devise   text;
  v_fx       record;
  v_lignes   jsonb := '[]'::jsonb;
  v_mouv     jsonb := '[]'::jsonb;
  v_total    bigint := 0;
  v_montant  bigint;
  v_item     record;
  v_frais    bigint;
begin
  if new.status <> 'delivered' or old.status is not distinct from 'delivered' then
    return new;
  end if;

  select s.owner_id, s.name into v_owner, v_shopname from shops s where s.id = new.shop_id;
  if v_owner is null then
    insert into finia_liaison_log(order_id, reason) values (new.id, 'boutique_sans_proprietaire');
    return new;
  end if;

  select w.id into v_ws from finia_workspaces w where w.owner_id = v_owner limit 1;
  if v_ws is null then
    -- La vendeuse n'a pas ouvert de comptabilité. Ce n'est pas une erreur, et
    -- ça ne doit surtout pas empêcher sa livraison.
    insert into finia_liaison_log(order_id, reason) values (new.id, 'espace_absent');
    return new;
  end if;

  v_devise := finia_devise_espace(v_ws);
  if v_devise = 'FCFA' then v_devise := 'XAF'; end if;
  if v_devise = '' then
    insert into finia_liaison_log(order_id, reason) values (new.id, 'devise_de_l_espace_inconnue');
    return new;
  end if;

  select * into v_fx from finia_fx_rates where currency = v_devise;
  if v_fx.currency is null then
    insert into finia_liaison_log(order_id, reason) values (new.id, 'taux_inconnu:' || v_devise);
    return new;
  end if;

  -- Une ligne par article. Le total est la SOMME des lignes converties, jamais
  -- le total converti à part: sinon les arrondis ligne à ligne ne tombent plus
  -- juste et le moteur Accounting refuse l'écriture pour déséquilibre — donc
  -- la livraison échouerait.
  --
  -- `accounting_ref` : l'identifiant de l'article dans Accounting, présent seulement pour un article
  -- publié depuis Accounting (0242). Le produit doit être celui de CETTE boutique : la référence n'a
  -- de sens que dans l'espace de la propriétaire de la boutique.
  for v_item in
    select oi.name, oi.qty, oi.price_fcfa, coalesce(p.accounting_ref, '') as ref
      from order_items oi
      left join products p on p.id = oi.product_id and p.shop_id = new.shop_id
     where oi.order_id = new.id
     order by oi.name
  loop
    v_montant := round(v_item.price_fcfa * v_fx.rate * v_fx.minor);
    v_lignes := v_lignes || jsonb_build_object(
      'productId', v_item.ref, 'name', v_item.name, 'qty', v_item.qty,
      'unitPrice', v_montant, 'unitCost', 0
    );
    v_mouv := v_mouv || to_jsonb(gen_random_uuid());
    v_total := v_total + v_montant * v_item.qty;
  end loop;

  if jsonb_array_length(v_lignes) = 0 then
    insert into finia_liaison_log(order_id, reason) values (new.id, 'commande_sans_ligne');
    return new;
  end if;

  -- La livraison est un produit: la vendeuse l'encaisse. Ligne à part, jamais
  -- fondue dans le prix des articles.
  v_frais := round(coalesce(new.delivery_fee_fcfa, 0) * v_fx.rate * v_fx.minor);
  if v_frais > 0 then
    v_lignes := v_lignes || jsonb_build_object(
      'productId', '', 'name', 'Livraison', 'qty', 1, 'unitPrice', v_frais, 'unitCost', 0
    );
    v_mouv := v_mouv || to_jsonb(gen_random_uuid());
    v_total := v_total + v_frais;
  end if;

  -- `unitCost` vaut 0: la place de marché ne connaît AUCUN coût d'achat,
  -- `order_items` ne porte que le prix de vente. Accounting marque ces ventes
  -- « coût inconnu » et les sort du calcul de marge, sinon la vendeuse lirait
  -- une marge de 100 % et paierait des impôts sur un bénéfice qui n'existe pas.
  -- Pour un article publié depuis Accounting, le coût EST connu d'Accounting (fiche article) :
  -- c'est à Accounting de le reprendre à la réception (voir A-FAIRE-PARTAGE, 14/10).
  insert into finia_events (id, workspace_id, actor_id, actor_name, at, type, payload)
  values (
    new.id, v_ws, v_owner, 'Finjaro', coalesce(new.delivered_at, now()), 'sale.record',
    jsonb_build_object(
      'sale', jsonb_build_object(
        'id', new.id,
        'number', new.order_no,
        'date', to_char(coalesce(new.delivered_at, now()), 'YYYY-MM-DD'),
        'customerId', null,
        'customerName', coalesce(new.buyer_name, 'Cliente') || ' (Finjaro)',
        'lines', v_lignes,
        'discount', 0,
        'vat', 0,
        'total', v_total,
        'paid', v_total,
        'method', case when new.payment_status = 'paid' and new.payment_provider = 'stripe' then 'CARD' else 'CASH' end,
        'status', 'CONFIRMED',
        'cashier', 'Finjaro',
        'createdAt', coalesce(new.delivered_at, now()),
        'source', 'finjaro',
        'externalId', new.id,
        'shopId', new.shop_id,
        'shopName', v_shopname,
        'fx', jsonb_build_object(
          'fromCurrency', 'XAF',
          'fromTotal', new.total_fcfa,
          'rate', v_fx.rate * v_fx.minor,
          'currency', v_devise
        )
      ),
      'ids', jsonb_build_object(
        'movements', v_mouv,
        'saleEntry', gen_random_uuid(),
        'cogsEntry', gen_random_uuid(),
        'debt', gen_random_uuid()
      )
    )
  )
  -- Rejeu: l'identifiant de l'événement EST celui de la commande, donc un
  -- deuxième passage ne peut pas créer une deuxième vente, et surtout il ne
  -- casse pas la livraison.
  on conflict (id) do nothing;

  return new;
end;
$function$;
-- `create or replace` garde les droits, mais on le redit : cette fonction est un déclencheur, personne
-- ne l'appelle (0243).
revoke execute on function public.finia_order_to_sale() from public, anon, authenticated;

-- 2. Republier un article ne doit plus écraser la réserve des commandes en cours.
create or replace function public.finia_publier_article(p_workspace uuid, p_article jsonb, p_shop uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner    uuid;
  v_shop     uuid;
  v_n        integer;
  v_devise   text := upper(coalesce(p_article->>'currency', ''));
  v_fx       record;
  v_minor    numeric := (p_article->>'price_minor')::numeric;
  v_fcfa     integer;
  v_id       uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;

  select w.owner_id into v_owner from finia_workspaces w where w.id = p_workspace;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Seule la propriétaire de l''espace peut publier un article.';
  end if;

  if p_shop is not null then
    select s.id into v_shop from shops s where s.id = p_shop and s.owner_id = v_owner and s.status = 'active';
    if v_shop is null then raise exception 'Cette boutique ne fait pas partie de vos boutiques actives.'; end if;
  else
    select count(*) into v_n from shops s where s.owner_id = v_owner and s.status = 'active';
    if v_n = 0 then raise exception 'Aucune boutique active pour cette personne.'; end if;
    if v_n > 1 then raise exception 'Plusieurs boutiques actives : indiquez laquelle publier.' using hint = 'choisir_boutique'; end if;
    select s.id into v_shop from shops s where s.owner_id = v_owner and s.status = 'active';
  end if;

  if coalesce(trim(p_article->>'ref'), '') = '' or coalesce(trim(p_article->>'name'), '') = '' then
    raise exception 'Référence et nom obligatoires.';
  end if;
  if coalesce(trim(p_article->>'image_path'), '') = '' then
    raise exception 'Une photo est obligatoire pour publier un article.' using hint = 'photo_obligatoire';
  end if;
  if v_devise = 'FCFA' then v_devise := 'XAF'; end if;
  select * into v_fx from finia_fx_rates where currency = v_devise;
  if v_fx.currency is null or v_minor is null or v_minor < 0 then
    raise exception 'Prix ou devise invalide (%).', v_devise;
  end if;

  v_fcfa := round(v_minor / (v_fx.rate * v_fx.minor));

  insert into products (shop_id, name, description, price_fcfa, prix_saisi, devise_saisie, stock, images, is_active, accounting_ref)
  values (
    v_shop, trim(p_article->>'name'), nullif(trim(coalesce(p_article->>'description', '')), ''),
    v_fcfa, v_minor / v_fx.minor, v_devise, greatest(coalesce((p_article->>'stock')::int, 0), 0),
    array[p_article->>'image_path'],
    true, trim(p_article->>'ref')
  )
  on conflict (shop_id, accounting_ref) where accounting_ref is not null do update
    set name = excluded.name, description = excluded.description, price_fcfa = excluded.price_fcfa,
        prix_saisi = excluded.prix_saisi, devise_saisie = excluded.devise_saisie,
        -- stock d'Accounting moins ce que des acheteuses ont déjà commandé sans que ce soit livré
        stock = greatest(excluded.stock - finia_stock_reserve(products.id), 0)
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function public.finia_publier_article(uuid, jsonb, uuid) from public, anon;
grant execute on function public.finia_publier_article(uuid, jsonb, uuid) to authenticated;

-- 3. Accounting remet son stock dans le catalogue.
-- p_stocks : [ { "ref": "<id de l'article dans Accounting>", "stock": 4 }, ... ]  (500 articles au plus)
-- Ne touche QUE les articles déjà publiés (accounting_ref) dans les boutiques de la propriétaire de
-- l'espace. Un article inconnu est ignoré sans erreur (il peut avoir été retiré du catalogue).
-- Retourne le nombre d'articles dont le stock a changé.
create or replace function public.finia_synchroniser_stock(p_workspace uuid, p_stocks jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_n     integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;

  select w.owner_id into v_owner from finia_workspaces w where w.id = p_workspace;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Seule la propriétaire de l''espace peut synchroniser le stock.';
  end if;

  if p_stocks is null or jsonb_typeof(p_stocks) <> 'array' then
    raise exception 'Liste de stocks attendue.';
  end if;
  if jsonb_array_length(p_stocks) > 500 then
    raise exception 'Cinq cents articles au plus par appel.';
  end if;

  with lu as (
    select trim(x.ref) as ref, greatest(x.stock, 0) as stock
      from jsonb_to_recordset(p_stocks) as x(ref text, stock integer)
     where coalesce(trim(x.ref), '') <> '' and x.stock is not null
  )
  update products p
     set stock = greatest(lu.stock - finia_stock_reserve(p.id), 0)
    from lu, shops s
   where p.accounting_ref = lu.ref
     and s.id = p.shop_id and s.owner_id = v_owner
     and p.stock is distinct from greatest(lu.stock - finia_stock_reserve(p.id), 0);

  get diagnostics v_n = row_count;
  return v_n;
end;
$function$;

revoke all on function public.finia_synchroniser_stock(uuid, jsonb) from public, anon;
grant execute on function public.finia_synchroniser_stock(uuid, jsonb) to authenticated;

comment on function public.finia_synchroniser_stock(uuid, jsonb) is
  'Flux inverse (14/10) : Accounting remet le stock des articles publiés dans le catalogue, moins les commandes en cours (pas de survente).';
