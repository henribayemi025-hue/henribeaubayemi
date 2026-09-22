-- LEGION — les mesures distinguent les vrais visiteurs des robots.
--
-- Beau, 22/09, à Alpha: « toi-même tu peux vérifier ». Les pics du 18/09
-- (335) et du 20/09 (484) étaient restés « à vérifier ». Vérifié: le
-- 20/09, 392 fiches vues pour 382 articles DIFFÉRENTS, une par
-- « navigateur » neuf, en 98 minutes, sans un clic ni une recherche —
-- un robot qui parcourt le catalogue. Le 18/09, même motif sur la journée.
--
-- D'où une mesure qui ne se trompe pas de sens: un visiteur ENGAGÉ a fait
-- plus qu'ouvrir une page (connecté, ou au moins deux pages vues, ou une
-- action: recherche, contact, panier, abonnement…). C'est un plancher: une
-- vraie personne qui ne regarde qu'une page n'y est pas. Mais un robot qui
-- traverse le catalogue n'y entre jamais.
--
-- Additive: la fonction est remplacée, sa forme reste la même avec des
-- clés en plus.

create or replace function public.legion_mesures_finjaro()
returns jsonb language sql stable security definer set search_path = public as $$
  with ev as (
    select type, created_at, created_at::date as j, coalesce(user_id::text, meta->>'anon_id') as qui, user_id
      from public.events
     where created_at > now() - interval '30 days'
       and (user_id is null or public.compte_reel(user_id))
  ),
  par_jour as (
    select j, qui,
           bool_or(type = 'visit') as visite,
           bool_or(user_id is not null) as connecte,
           count(*) filter (where type in ('product_view', 'shop_view', 'category_view', 'reel_view')) as pages,
           count(*) filter (where type not in ('visit', 'intro_shown', 'intro_closed', 'product_view', 'shop_view',
                                               'category_view', 'reel_view', 'perf_page_load', 'cookie_answer',
                                               'install_banner_closed')) as actions
      from ev group by j, qui
  ),
  jours as (
    select d::date as j, to_char(d::date, 'DD/MM') as jour
      from generate_series((now() - interval '6 days')::date, now()::date, interval '1 day') d
  )
  select jsonb_build_object(
    'mesure_le', to_char(now() at time zone 'UTC', 'DD/MM/YYYY HH24:MI "UTC"'),
    'definitions', jsonb_build_object(
      'navigateurs', 'tout ce qui ouvre le site, robots compris',
      'visiteurs_engages', 'ont fait plus qu''ouvrir une page (connectés, 2 pages ou plus, ou une action) — un plancher: les robots n''y entrent pas',
      'pics_verifies', 'les pics du 18/09 et du 20/09 sont des robots qui parcourent le catalogue (vérifié le 22/09: 382 articles différents ouverts une fois chacun en 98 minutes, sans clic ni recherche)'
    ),
    'visiteurs_engages', jsonb_build_object(
      'aujourdhui', (select count(*) from par_jour where j = now()::date and visite and (connecte or pages >= 2 or actions > 0)),
      '7_jours', (select count(distinct qui) from par_jour where j > now()::date - 7 and visite and (connecte or pages >= 2 or actions > 0)),
      '30_jours', (select count(distinct qui) from par_jour where visite and (connecte or pages >= 2 or actions > 0))
    ),
    'navigateurs', jsonb_build_object(
      'aujourdhui', (select count(*) from par_jour where j = now()::date and visite),
      '7_jours', (select count(distinct qui) from par_jour where j > now()::date - 7 and visite),
      '30_jours', (select count(distinct qui) from par_jour where visite)
    ),
    'par_jour_7_derniers', (
      select jsonb_agg(jsonb_build_object(
               'jour', jr.jour,
               'navigateurs', (select count(*) from par_jour p where p.j = jr.j and p.visite),
               'visiteurs_engages', (select count(*) from par_jour p where p.j = jr.j and p.visite and (p.connecte or p.pages >= 2 or p.actions > 0))
             ) order by jr.j)
        from jours jr
    ),
    'fiches_article_vues_7_jours', (select count(*) from ev where type = 'product_view' and created_at > now() - interval '7 days'),
    'recherches_7_jours', (select count(*) from ev where type = 'search' and created_at > now() - interval '7 days'),
    'contacts_vendeuse_7_jours', (select count(*) from ev where type in ('whatsapp_click', 'phone_click', 'contact_intent') and created_at > now() - interval '7 days'),
    'ajouts_panier_7_jours', (select count(*) from ev where type = 'cart_add' and created_at > now() - interval '7 days'),
    'comptes', jsonb_build_object(
      'total', (select count(*) from public.profiles p where public.compte_reel(p.id)),
      'crees_7_jours', (select count(*) from public.profiles p where public.compte_reel(p.id) and p.created_at > now() - interval '7 days')
    ),
    'boutiques', jsonb_build_object(
      'total', (select count(*) from public.shops s where public.compte_reel(s.owner_id) and s.moderation_hidden_at is null),
      'avec_au_moins_un_article', (select count(distinct s.id) from public.shops s join public.products p on p.shop_id = s.id
                                    where p.is_active and s.moderation_hidden_at is null and public.compte_reel(s.owner_id)),
      'creees_7_jours', (select count(*) from public.shops s where public.compte_reel(s.owner_id) and s.created_at > now() - interval '7 days')
    ),
    'articles_en_ligne', (select count(*) from public.products p join public.shops s on s.id = p.shop_id
                           where p.is_active and p.moderation_hidden_at is null and public.compte_reel(s.owner_id)),
    'commandes', jsonb_build_object(
      'total', (select count(*) from public.orders o where o.buyer_id is null or public.compte_reel(o.buyer_id)),
      '7_jours', (select count(*) from public.orders o where (o.buyer_id is null or public.compte_reel(o.buyer_id)) and o.created_at > now() - interval '7 days'),
      'en_attente_de_la_vendeuse', (select count(*) from public.orders o where o.status = 'new' and (o.buyer_id is null or public.compte_reel(o.buyer_id)))
    )
  );
$$;

revoke all on function public.legion_mesures_finjaro() from public, anon, authenticated;
grant execute on function public.legion_mesures_finjaro() to service_role;
