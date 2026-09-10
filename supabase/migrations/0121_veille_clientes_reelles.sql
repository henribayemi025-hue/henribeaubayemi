-- Beau, 10/09: « 16 clientes ont écrit dans les boutiques ? je n'ai pas vu ça,
-- elles ont écrit quoi ? c'est de cette data que je dois voir dans l'admin ».
--
-- Il avait raison sur les deux points. Le chiffre que je lui avais donné
-- comptait ses propres comptes de test (14 messages sur 16 venaient de lui),
-- et l'admin ne montrait NULLE PART les conversations des vraies clientes —
-- seulement celles restées sans réponse plus de 24 h.
--
-- La veille gagne donc un bloc « vraies clientes »: qui a écrit, à quelle
-- boutique, ce qu'elle a demandé, et si une vraie réponse est partie (les
-- réponses automatiques de Finia ne comptent pas comme une réponse de la
-- vendeuse). Les comptes de test et l'équipe sont écartés par
-- `compte_reel()`, la même définition que celle de l'alerte (0120).

create or replace function public.admin_veille()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  commandes jsonb;
  convs jsonb;
  clientes jsonb;
  perf jsonb;
  stock jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(x order by (x->>'created_at')), '[]'::jsonb) into commandes from (
    select jsonb_build_object(
      'id', o.id,
      'order_no', o.order_no,
      'created_at', o.created_at,
      'total_fcfa', o.total_fcfa,
      'heures', floor(extract(epoch from now() - o.created_at) / 3600),
      'acheteur', coalesce(p.name, o.buyer_name),
      'acheteur_tel', o.buyer_phone,
      'acheteur_email', u.email,
      'boutique', s.name,
      'boutique_id', s.id,
      'vendeuse', vp.name,
      'vendeuse_tel', coalesce(nullif(s.whatsapp, ''), nullif(s.phone, ''), vp.phone),
      'vendeuse_email', vu.email,
      'relancee_le', o.vendor_reminded_at,
      'escaladee_le', o.buyer_escalated_at
    ) as x
    from public.orders o
    join public.shops s on s.id = o.shop_id
    left join public.profiles p on p.id = o.buyer_id
    left join auth.users u on u.id = o.buyer_id
    left join public.profiles vp on vp.id = s.owner_id
    left join auth.users vu on vu.id = s.owner_id
    where o.status = 'new' and o.created_at < now() - interval '24 hours'
  ) t;

  select coalesce(jsonb_agg(x order by (x->>'depuis')), '[]'::jsonb) into convs from (
    select jsonb_build_object(
      'conversation_id', c.id,
      'boutique', s.name,
      'boutique_id', s.id,
      'vendeuse', vp.name,
      'vendeuse_tel', coalesce(nullif(s.whatsapp, ''), nullif(s.phone, ''), vp.phone),
      'vendeuse_email', vu.email,
      'acheteur', bp.name,
      'dernier_message', c.last_message,
      'depuis', lm.created_at,
      'heures', floor(extract(epoch from now() - lm.created_at) / 3600),
      'relancee_le', c.relance_admin_at
    ) as x
    from public.conversations c
    join public.shops s on s.id = c.shop_id
    join lateral (
      select m.sender_role, m.created_at
      from public.chat_messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ) lm on true
    left join public.profiles vp on vp.id = s.owner_id
    left join auth.users vu on vu.id = s.owner_id
    left join public.profiles bp on bp.id = c.buyer_id
    where lm.sender_role = 'buyer'
      and lm.created_at < now() - interval '24 hours'
      and lm.created_at > now() - interval '30 days'
  ) t;

  -- Les vraies clientes qui ont écrit à une boutique. Peu importe le délai:
  -- tant qu'il y en a si peu, chacune compte et Beau doit toutes les voir.
  select coalesce(jsonb_agg(x order by (x->>'derniere') desc), '[]'::jsonb) into clientes from (
    select jsonb_build_object(
      'conversation_id', c.id,
      'boutique', s.name,
      'boutique_id', s.id,
      'vendeuse_tel', coalesce(nullif(s.whatsapp, ''), nullif(s.phone, ''), vp.phone),
      'cliente', coalesce(bp.name, 'Sans nom'),
      'cliente_tel', bp.phone,
      'cliente_email', bu.email,
      'premier_message', (
        select left(coalesce(m2.body, case when m2.image_url is not null then '[photo]' else '[message vocal]' end), 160)
        from public.chat_messages m2
        where m2.conversation_id = c.id and m2.sender_role = 'buyer'
        order by m2.created_at limit 1
      ),
      'ecrit_le', (
        select min(m3.created_at) from public.chat_messages m3
        where m3.conversation_id = c.id and m3.sender_role = 'buyer'
      ),
      'derniere', (
        select max(m4.created_at) from public.chat_messages m4
        where m4.conversation_id = c.id and m4.sender_role = 'buyer'
      ),
      'messages', (
        select count(*) from public.chat_messages m5
        where m5.conversation_id = c.id and m5.sender_role = 'buyer'
      ),
      'reponses_humaines', (
        select count(*) from public.chat_messages m6
        where m6.conversation_id = c.id and m6.sender_role = 'vendor'
          and coalesce(m6.auto_reply, false) = false
      )
    ) as x
    from public.conversations c
    join public.shops s on s.id = c.shop_id
    left join public.profiles bp on bp.id = c.buyer_id
    left join auth.users bu on bu.id = c.buyer_id
    left join public.profiles vp on vp.id = s.owner_id
    where public.compte_reel(c.buyer_id)
      and exists (
        select 1 from public.chat_messages m
        where m.conversation_id = c.id and m.sender_role = 'buyer'
      )
    order by 1
    limit 50
  ) t;

  select jsonb_build_object(
    'mesures', count(*),
    'lcp_median_ms', percentile_cont(0.5) within group (order by (meta->>'lcp_ms')::numeric) filter (where meta->>'lcp_ms' is not null),
    'lcp_p90_ms', percentile_cont(0.9) within group (order by (meta->>'lcp_ms')::numeric) filter (where meta->>'lcp_ms' is not null),
    'par_connexion', (
      select coalesce(jsonb_agg(jsonb_build_object('connexion', k, 'n', n, 'lcp_median_ms', med) order by n desc), '[]'::jsonb)
      from (
        select coalesce(e.meta->>'connexion', 'inconnue') as k,
               count(*) as n,
               percentile_cont(0.5) within group (order by (e.meta->>'lcp_ms')::numeric) filter (where e.meta->>'lcp_ms' is not null) as med
        from public.events e
        where e.type = 'perf_page_load' and e.created_at > now() - interval '7 days'
        group by 1
      ) q
    ),
    'pages_lentes', (
      select coalesce(jsonb_agg(jsonb_build_object('chemin', chemin, 'n', n, 'charge_median_ms', med) order by med desc), '[]'::jsonb)
      from (
        select e.meta->>'chemin' as chemin,
               count(*) as n,
               percentile_cont(0.5) within group (order by (e.meta->>'charge_ms')::numeric) as med
        from public.events e
        where e.type = 'perf_page_load' and e.created_at > now() - interval '7 days'
          and e.meta->>'charge_ms' is not null
        group by 1
        order by med desc
        limit 5
      ) q
    )
  ) into perf
  from public.events
  where type = 'perf_page_load' and created_at > now() - interval '7 days';

  select jsonb_build_object(
    'total_octets', coalesce(sum((metadata->>'size')::bigint), 0),
    'videos_octets', coalesce(sum((metadata->>'size')::bigint) filter (where (metadata->>'mimetype') like 'video/%'), 0),
    'nb_videos', count(*) filter (where (metadata->>'mimetype') like 'video/%'),
    'ajoutes_7j_octets', coalesce(sum((metadata->>'size')::bigint) filter (where created_at > now() - interval '7 days'), 0),
    'limite_octets', 1073741824
  ) into stock
  from storage.objects;

  return jsonb_build_object(
    'commandes_bloquees', commandes,
    'conversations_sans_reponse', convs,
    'clientes_reelles', clientes,
    'vitesse', perf,
    'stockage', stock,
    'genere_le', now()
  );
end;
$$;
