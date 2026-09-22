-- « Se connecter avec Finjaro » — chantier 4 (Beau, 22/09).
--
-- Une entreprise qui a une boutique sur la place de marché relie SA
-- boutique à SON entreprise Legion: ses agents lisent SES ventes, SON
-- stock, SES avis, SES messages en attente — jamais ceux des autres, et
-- jamais un numéro ni une adresse de cliente. C'est le même mécanisme que
-- le connecteur « Mesures Finjaro » (0142), mais pour une boutique et pour
-- n'importe quelle entreprise, pas seulement l'équipe Finjaro.
--
-- Côté Accounting (les livres), on le conçoit avec Claudinette: rien ici.
-- Additive: un type de connecteur, une colonne, deux fonctions.

alter table public.legion_connecteurs drop constraint if exists legion_connecteurs_type_check;
alter table public.legion_connecteurs add constraint legion_connecteurs_type_check
  check (type in ('finjaro-mesures', 'finjaro-boutique'));
alter table public.legion_connecteurs add column if not exists config jsonb not null default '{}'::jsonb;

-- Brancher (ou débrancher) SA boutique: membre de l'entreprise ET
-- propriétaire de la boutique. Le nom est recopié pour l'affichage.
create or replace function public.legion_brancher_boutique(p_entreprise uuid, p_shop uuid, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  if not public.legion_est_membre(p_entreprise) then
    raise exception 'Pas membre de cette entreprise.';
  end if;
  select s.name into v_nom from public.shops s where s.id = p_shop and s.owner_id = auth.uid();
  if v_nom is null then
    raise exception 'Cette boutique n''est pas la tienne.';
  end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, 'finjaro-boutique', p_actif, auth.uid(), jsonb_build_object('shop_id', p_shop, 'nom', v_nom))
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par, config = excluded.config;
end $$;
revoke all on function public.legion_brancher_boutique(uuid, uuid, boolean) from public, anon;
grant execute on function public.legion_brancher_boutique(uuid, uuid, boolean) to authenticated;

-- Les outils de lecture d'UNE boutique (service_role seulement: appelés
-- par les fonctions edge, avec l'identifiant de la boutique branchée).
-- Prénom de la cliente au plus; jamais de téléphone, d'e-mail, d'adresse.
create or replace function public.legion_outil_boutique(p_nom text, p_params jsonb, p_shop uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_jours int := least(90, greatest(1, coalesce((p_params ->> 'jours')::int, 30)));
  v_n int := least(20, greatest(1, coalesce((p_params ->> 'n')::int, 10)));
  v_depuis timestamptz := now() - make_interval(days => least(90, greatest(1, coalesce((p_params ->> 'jours')::int, 30))));
  v_shop record;
begin
  select s.id, s.name, s.country, s.city, s.followers_count, s.rating, s.reviews_count, s.avg_response_minutes, s.status
    into v_shop from public.shops s where s.id = p_shop;
  if v_shop.id is null then return jsonb_build_object('erreur', 'boutique introuvable'); end if;

  case p_nom
    when 'resume' then
      return jsonb_build_object(
        'boutique', v_shop.name, 'pays', v_shop.country, 'ville', v_shop.city, 'statut', v_shop.status,
        'abonnes', v_shop.followers_count, 'note_moyenne', v_shop.rating, 'nb_avis', v_shop.reviews_count,
        'temps_de_reponse_minutes', v_shop.avg_response_minutes,
        'articles_en_ligne', (select count(*) from public.products p where p.shop_id = p_shop and p.is_active and p.moderation_hidden_at is null),
        'articles_stock_faible', (select coalesce(jsonb_agg(jsonb_build_object('article', p.name, 'stock', p.stock)), '[]'::jsonb)
                                  from (select name, stock from public.products where shop_id = p_shop and is_active and coalesce(stock, 0) <= 2 order by stock limit 10) p),
        'commandes_' || v_jours || '_jours', (select jsonb_build_object(
            'total', count(*),
            'par_statut', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.orders o where o.shop_id = p_shop and o.created_at > v_depuis group by status) x), '{}'::jsonb),
            'montant_livre_fcfa', coalesce(sum(o.total_fcfa) filter (where o.status = 'delivered'), 0))
          from public.orders o where o.shop_id = p_shop and o.created_at > v_depuis),
        'commandes_en_attente_de_ma_reponse', (select jsonb_build_object('nombre', count(*), 'la_plus_ancienne_depuis_heures', round(extract(epoch from now() - min(created_at)) / 3600))
                                               from public.orders o where o.shop_id = p_shop and o.status = 'new'),
        'vues_boutique_7_jours', (select count(*) from public.events e where e.type = 'shop_view' and e.target_id = p_shop::text and e.created_at > now() - interval '7 days'),
        'vues_articles_7_jours', (select count(*) from public.events e join public.products p on p.id::text = e.target_id where p.shop_id = p_shop and e.type = 'product_view' and e.created_at > now() - interval '7 days'),
        'ajouts_panier_7_jours', (select count(*) from public.events e join public.products p on p.id::text = e.target_id where p.shop_id = p_shop and e.type = 'cart_add' and e.created_at > now() - interval '7 days'),
        'messages_non_repondus', (select count(*) from public.conversations c where c.shop_id = p_shop and c.vendor_unread > 0)
      );
    when 'commandes' then
      return coalesce((select jsonb_agg(jsonb_build_object(
          'numero', o.order_no, 'statut', o.status, 'montant_fcfa', o.total_fcfa, 'date', to_char(o.created_at, 'YYYY-MM-DD'),
          'cliente', split_part(coalesce(o.buyer_name, ''), ' ', 1), 'sans_compte', o.buyer_id is null,
          'articles', (select string_agg(oi.name || ' ×' || oi.qty, ', ') from public.order_items oi where oi.order_id = o.id)) order by o.created_at desc)
        from (select * from public.orders o where o.shop_id = p_shop and o.created_at > v_depuis
                and (p_params ->> 'statut' is null or o.status = p_params ->> 'statut') order by o.created_at desc limit v_n) o), '[]'::jsonb);
    when 'articles' then
      return coalesce((select jsonb_agg(jsonb_build_object(
          'article', p.name, 'prix_fcfa', p.price_fcfa, 'stock', p.stock, 'en_ligne', p.is_active, 'categorie', p.category,
          'vues_30_jours', (select count(*) from public.events e where e.type = 'product_view' and e.target_id = p.id::text and e.created_at > now() - interval '30 days'),
          'ajouts_panier_30_jours', (select count(*) from public.events e where e.type = 'cart_add' and e.target_id = p.id::text and e.created_at > now() - interval '30 days')) order by p.created_at desc)
        from (select * from public.products p where p.shop_id = p_shop and p.moderation_hidden_at is null order by p.created_at desc limit v_n) p), '[]'::jsonb);
    when 'avis' then
      return coalesce((select jsonb_agg(jsonb_build_object('note', r.rating, 'texte', left(r.body, 200), 'date', to_char(r.created_at, 'YYYY-MM-DD'),
          'article', (select name from public.products where id = r.product_id)) order by r.created_at desc)
        from (select * from public.reviews r where r.shop_id = p_shop order by r.created_at desc limit v_n) r), '[]'::jsonb);
    else
      return jsonb_build_object('erreur', 'outil inconnu: ' || p_nom);
  end case;
end $$;
revoke all on function public.legion_outil_boutique(text, jsonb, uuid) from public, anon, authenticated;
