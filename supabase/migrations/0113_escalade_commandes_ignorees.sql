-- Escalade automatique d'une commande ignorée.
--
-- Aujourd'hui, une commande « new » déclenche deux relances (vendeuse à
-- 24 h, cliente informée à 48 h) puis… plus rien. Constaté en Veille:
-- FJ-X8HKH5, six jours en attente, la cliente sans nouvelles. Ici, à 72 h,
-- si la vendeuse n'a répondu à aucune relance, Finia:
--   1. propose à la cliente deux ou trois autres boutiques qui vendent le
--      même genre d'articles (mêmes catégories que les articles commandés,
--      priorité au même pays et aux boutiques qui répondent vite);
--   2. prévient la vendeuse que sa cliente a été orientée ailleurs (dernier
--      rappel, le plus efficace);
--   3. alerte l'admin dans la cloche et en push, avec le lien Veille.
-- Une seule fois par commande (buyer_escalated_at). Additif: une colonne,
-- une fonction, un cron.
alter table public.orders add column if not exists buyer_escalated_at timestamptz;

create or replace function public.escalader_commandes_ignorees()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  alt record;
  noms text[];
  premier_slug text;
  cats text[];
  nb int;
  cible text;
begin
  for r in
    select o.id, o.order_no, o.buyer_id, o.shop_id,
           s.name as boutique, s.categories as shop_cats, s.country as pays, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '72 hours'
      and o.vendor_reminded_at is not null
      and o.buyer_informed_at is not null
      and o.buyer_escalated_at is null
      and o.buyer_id is not null
  loop
    -- Catégories des articles commandés; à défaut, celles de la boutique.
    select array_agg(distinct p.category) into cats
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = r.id and p.category is not null;
    if cats is null or cardinality(cats) = 0 then
      cats := coalesce(r.shop_cats, '{}'::text[]);
    end if;

    noms := '{}'::text[];
    premier_slug := null;
    nb := 0;
    for alt in
      select s2.name, s2.slug
      from public.shops s2
      where s2.status = 'active'
        and s2.id <> r.shop_id
        and s2.owner_id is distinct from r.owner_id
        and (
          s2.categories && cats
          or exists (
            select 1 from public.products p2
            where p2.shop_id = s2.id and p2.is_active and p2.category = any(cats)
          )
        )
      order by (s2.country = r.pays) desc,
               s2.responds_fast desc nulls last,
               s2.followers_count desc nulls last
      limit 3
    loop
      noms := noms || alt.name;
      if premier_slug is null then premier_slug := alt.slug; end if;
      nb := nb + 1;
    end loop;

    cible := case when premier_slug is not null then '/boutique/' || premier_slug else '/profile/orders' end;

    perform public.notify(
      r.buyer_id,
      'order_escalated',
      'Commande n°' || r.order_no || ' : ' || r.boutique || ' ne répond pas',
      case when nb > 0
        then 'Trois jours sans réponse et rien ne t''a été débité. D''autres boutiques proposent le même genre d''articles : '
             || array_to_string(noms, ', ') || '. Tu peux annuler et commander chez elles.'
        else 'Trois jours sans réponse et rien ne t''a été débité. Tu peux annuler la commande depuis ton profil et demander à Finia de te trouver une autre boutique.'
      end,
      jsonb_build_object(
        'order_id', r.id, 'order_no', r.order_no, 'shop_id', r.shop_id,
        'boutiques', to_jsonb(noms), 'path', cible
      )
    );
    perform public.push_notify(
      r.buyer_id,
      r.boutique || ' ne répond pas — commande n°' || r.order_no,
      case when nb > 0
        then 'D''autres boutiques ont le même genre d''articles : ' || array_to_string(noms, ', ') || '. Rien ne t''a été débité.'
        else 'Rien ne t''a été débité. Tu peux annuler depuis ton profil.'
      end,
      cible,
      'order-escalated-' || r.id
    );

    perform public.push_notify(
      r.owner_id,
      'Commande n°' || r.order_no || ' : ta cliente a été orientée ailleurs',
      'Trois jours sans réponse. Finia lui a proposé d''autres boutiques. Réponds maintenant si tu veux encore la servir.',
      '/vendor/orders',
      'order-escalated-vendor-' || r.id
    );

    perform public.alert_admins(
      'order_escalated',
      'Commande n°' || r.order_no || ' escaladée (' || r.boutique || ')',
      'Vendeuse silencieuse depuis 3 jours. Cliente orientée vers : '
        || coalesce(nullif(array_to_string(noms, ', '), ''), 'aucune alternative trouvée') || '.',
      '/?s=veille',
      'order-escalated-admin-' || r.id,
      jsonb_build_object('order_id', r.id, 'shop_id', r.shop_id)
    );

    update public.orders set buyer_escalated_at = now() where id = r.id;
  end loop;
end;
$$;

revoke execute on function public.escalader_commandes_ignorees() from anon, authenticated;

-- Décalé d'une demi-heure par rapport à finjaro-stale-orders (0 */6): les
-- relances 24 h / 48 h sont posées avant que l'escalade ne les lise.
select cron.schedule(
  'finjaro-escalade-commandes',
  '30 */6 * * *',
  $$select public.escalader_commandes_ignorees()$$
);
