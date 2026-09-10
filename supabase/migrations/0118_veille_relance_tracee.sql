-- « Je clique sur relancer la vendeuse, ça dit relance envoyée, mais le
-- message reste sur "relancer la vendeuse" » (Beau, 10/09).
--
-- Pour une commande, la relance laissait bien une trace (orders.vendor_
-- reminded_at) mais l'écran n'en tenait pas compte sur le bouton. Pour une
-- conversation, elle ne laissait AUCUNE trace: rien à afficher, et rien
-- n'empêchait de relancer la même vendeuse dix fois de suite — ce qui, côté
-- vendeuse, ressemble à du harcèlement.
--
-- Additif: une colonne, deux fonctions remplacées.
alter table public.conversations add column if not exists relance_admin_at timestamptz;

create or replace function public.admin_relancer_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  select c.id, s.owner_id, s.name
    into r
    from public.conversations c join public.shops s on s.id = c.shop_id
   where c.id = p_conversation_id;
  if not found then return; end if;

  perform public.push_notify(
    r.owner_id,
    'Une cliente attend ta réponse',
    'Elle t''a écrit il y a plus d''une journée et n''a pas eu de réponse. Réponds-lui maintenant, même en deux mots.',
    '/vendor/messages/' || r.id,
    'unanswered-admin-' || r.id
  );
  update public.conversations set relance_admin_at = now() where id = p_conversation_id;
end;
$$;

-- `admin_veille` renvoie désormais la date de relance des conversations, pour
-- que l'écran puisse dire « relancée il y a 10 minutes » au lieu de proposer
-- indéfiniment la même action.
create or replace function public.admin_veille()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  commandes jsonb;
  convs jsonb;
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
    'vitesse', perf,
    'stockage', stock,
    'genere_le', now()
  );
end;
$$;
