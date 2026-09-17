-- Liaison place de marché → Finjaro Accounting: une commande LIVRÉE devient
-- une vente dans la comptabilité de la vendeuse.
--
-- ⚠️ PAS ENCORE POSÉE EN PRODUCTION. Essayée et vérifiée sur le projet de test
-- `qiyvoaljqmbfldephobp` le 17/09. Elle touche les DEUX applications: elle
-- écrit dans `finia_events`, qui appartient à Accounting, depuis un
-- déclencheur sur `orders`, qui appartient à la place de marché. Beau doit
-- dire oui avant qu'elle parte en production.
--
-- Contrat écrit à deux sessions dans docs/A-FAIRE-PARTAGE.md du dépôt
-- Accounting (« Liaison Finjaro ↔ Finjaro Accounting »).
--
-- Pourquoi un déclencheur en base et pas une fonction edge: les fonctions edge
-- sont communes à la préproduction et à la production, et le patron
-- déclencheur → pg_net → fonction edge nous a déjà fait sauter des passages EN
-- SILENCE (chat-autoreply, 12/09: lecture de app_secrets qui échoue au
-- démarrage à froid, réponse « non autorisé », passage ignoré). Une
-- notification perdue est ennuyeuse; une vente perdue dans une comptabilité,
-- c'est de l'argent. Ici tout se passe dans la même transaction que la
-- livraison, sans réseau et sans secret.
--
-- Pourquoi `delivered` et pas le paiement: aucun paiement en ligne n'a jamais
-- abouti sur Finjaro (payment_status réellement présent: 'cod' et 'failed').
-- Et pas `new`: une commande sur deux n'est jamais confirmée par la vendeuse.
-- La livraison est le seul moment où la marchandise est transférée ET où
-- l'argent rentre, puisque tout est payé à la livraison.
--
-- Additive: uniquement des créations.

-- Taux depuis le FCFA, unité de STOCKAGE de la place de marché (jamais un
-- affichage). `minor` = unités mineures par unité: 1 pour le franc CFA qui n'a
-- pas de décimales, 100 pour l'euro. Repris de src/lib/currency.js.
create table if not exists public.finia_fx_rates (
  currency text primary key,
  rate     numeric not null,
  minor    integer not null default 1
);

insert into public.finia_fx_rates (currency, rate, minor) values
  ('XAF', 1, 1),
  ('XOF', 1, 1),
  ('EUR', 0.001524, 100),
  ('USD', 0.00165, 100),
  ('GBP', 0.0013, 100)
on conflict (currency) do nothing;

-- Ce qui n'est pas passé, et pourquoi. Sans cette table, une liaison qui ne
-- marche pas ne se voit nulle part.
create table if not exists public.finia_liaison_log (
  id       uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  reason   text not null,
  at       timestamptz not null default now()
);

create index if not exists finia_liaison_log_order on public.finia_liaison_log(order_id);

-- La devise de l'espace comptable.
--
-- Le contrat disait de la lire dans `finia_workspaces.data`. Vérifié sur le
-- projet de test: ça ne marche pas. `data` est l'instantané compacté, écrit
-- tous les 300 événements; sur l'espace de la gérante il valait `{}` et
-- `snapshot_seq` valait 0 alors que le journal comptait 1004 événements. Lire
-- seulement `data` aurait refusé toutes les ventes d'un espace jamais
-- compacté — c'est-à-dire un espace neuf, exactement celui d'une vendeuse qui
-- vient d'ouvrir sa comptabilité. On retombe donc sur le dernier événement
-- `company.update`, où la devise vit réellement.
create or replace function public.finia_devise_espace(ws uuid)
returns text
language sql stable security definer
set search_path to 'public'
as $$
  select upper(coalesce(
    (select w.data -> 'company' ->> 'currency' from finia_workspaces w where w.id = ws),
    (select e.payload -> 'patch' ->> 'currency'
       from finia_events e
      where e.workspace_id = ws and e.type = 'company.update'
        and e.payload -> 'patch' ? 'currency'
      order by e.seq desc limit 1),
    ''
  ));
$$;

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
  for v_item in
    select oi.name, oi.qty, oi.price_fcfa from order_items oi where oi.order_id = new.id order by oi.name
  loop
    v_montant := round(v_item.price_fcfa * v_fx.rate * v_fx.minor);
    v_lignes := v_lignes || jsonb_build_object(
      'productId', '', 'name', v_item.name, 'qty', v_item.qty,
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

drop trigger if exists trg_finia_order_to_sale on public.orders;
create trigger trg_finia_order_to_sale
  after update on public.orders
  for each row execute function public.finia_order_to_sale();

-- La commission `platform_fee_fcfa` n'est PAS écrite: vérifié en production,
-- elle vaut 0 sur les 22 commandes et n'est réclamée nulle part dans le code.
-- Le jour où elle le sera, ce sera une dette envers Finjaro à créer au même
-- moment, pas une déduction du chiffre d'affaires.
