-- LEGION — des outils de lecture que les agents appellent eux-mêmes.
--
-- Beau, 22/09: « je veux qu'ils aient tous accès à la base », puis « il dit
-- les chiffres, il ne peut pas vérifier, pourtant il doit le faire ».
--
-- Pas de SQL libre: une requête écrite par un modèle et exécutée sur une
-- base partagée avec d'autres applications, c'est une porte trop large.
-- À la place, des OUTILS précis, chacun une requête écrite ici, avec des
-- paramètres contrôlés (nombres bornés, listes fermées). L'agent choisit
-- l'outil et ses paramètres; la requête, elle, ne change jamais.
--
-- Ce qui sort: des comptes, des sommes, des noms de BOUTIQUES et
-- d'ARTICLES (publics sur le site). Jamais le nom, l'e-mail, le téléphone
-- ou l'adresse d'une personne. Rien de finia_*, d'auth, de legion_*.
-- Comptes de test exclus partout. Appel côté serveur seulement
-- (service_role), depuis legion-repondre, pour une entreprise qui a le
-- connecteur « Mesures Finjaro ».
--
-- Additive: une fonction. Rien de retiré.

create or replace function public.legion_outil(p_nom text, p_params jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  p jsonb := coalesce(p_params, '{}'::jsonb);
  v_jours int := least(greatest(coalesce((p->>'jours')::int, 7), 1), 90);
  v_n int := least(greatest(coalesce((p->>'n')::int, 5), 1), 20);
  v_depuis timestamptz := now() - make_interval(days => v_jours);
  v_jour date;
  v_type text;
  v_critere text;
  v_statut text;
  v_categorie text;
  v_prix_max int;
  r jsonb;
begin
  case p_nom

  -- Vérifier un jour: vraies personnes ou robots ?
  when 'verifier_jour' then
    begin v_jour := (p->>'date')::date; exception when others then v_jour := null; end;
    if v_jour is null then return jsonb_build_object('erreur', 'date attendue au format AAAA-MM-JJ'); end if;
    with ev as (
      select type, target_id, created_at, coalesce(user_id::text, meta->>'anon_id') qui, user_id
        from events
       where created_at >= v_jour and created_at < v_jour + 1
         and (user_id is null or compte_reel(user_id))
    ), par as (
      select qui, bool_or(type = 'visit') visite, bool_or(user_id is not null) connecte,
             count(*) filter (where type in ('product_view','shop_view','category_view','reel_view')) pages,
             count(*) filter (where type in ('search','whatsapp_click','phone_click','contact_intent','cart_add','checkout_start','follow','comment','share_reel','share_shop')) actions
        from ev group by qui
    ), heures as (
      select extract(hour from created_at)::int h, count(*) n from ev where type = 'visit' group by 1 order by 2 desc limit 1
    )
    select jsonb_build_object(
      'jour', to_char(v_jour, 'DD/MM/YYYY'),
      'navigateurs', (select count(*) from par where visite),
      'visiteurs_engages', (select count(*) from par where visite and (connecte or pages >= 2 or actions > 0)),
      'fiches_article_vues', (select count(*) from ev where type = 'product_view'),
      'articles_differents_vus', (select count(distinct target_id) from ev where type = 'product_view'),
      'minutes_avec_une_visite', (select count(distinct date_trunc('minute', created_at)) from ev where type = 'visit'),
      'heure_de_pointe_utc', (select jsonb_build_object('heure', h, 'visites', n) from heures),
      'recherches', (select count(*) from ev where type = 'search'),
      'contacts_vendeuse', (select count(*) from ev where type in ('whatsapp_click','phone_click','contact_intent')),
      'ajouts_panier', (select count(*) from ev where type = 'cart_add'),
      'lecture', 'Beaucoup de navigateurs, presque autant d''articles différents vus une fois chacun, et presque pas de visiteurs engagés ni de recherches: c''est un robot qui parcourt le catalogue.'
    ) into r;
    return r;

  -- Compter un type d'événement sur une période, jour par jour.
  when 'compter_evenement' then
    v_type := p->>'type';
    if v_type not in ('visit','product_view','shop_view','category_view','search','whatsapp_click','phone_click',
                      'contact_intent','cart_add','checkout_start','follow','comment','reel_view','share_reel') then
      return jsonb_build_object('erreur', 'type inconnu');
    end if;
    with ev as (
      select created_at::date j, coalesce(user_id::text, meta->>'anon_id') qui
        from events where type = v_type and created_at > v_depuis and (user_id is null or compte_reel(user_id))
    )
    select jsonb_build_object(
      'type', v_type, 'jours', v_jours,
      'total', (select count(*) from ev),
      'personnes_distinctes', (select count(distinct qui) from ev),
      'par_jour', (select jsonb_agg(jsonb_build_object('jour', to_char(j, 'DD/MM'), 'n', n) order by j)
                     from (select j, count(*) n from ev group by j) x)
    ) into r;
    return r;

  -- Les meilleures boutiques selon un critère.
  when 'classer_boutiques' then
    v_critere := coalesce(p->>'critere', 'articles');
    if v_critere not in ('articles','commandes','abonnes','vues') then
      return jsonb_build_object('erreur', 'critere: articles, commandes, abonnes ou vues');
    end if;
    select coalesce(jsonb_agg(x order by x.valeur desc), '[]'::jsonb) into r from (
      select s.name as boutique, s.city as ville, s.country as pays,
             case v_critere
               when 'articles' then (select count(*) from products pr where pr.shop_id = s.id and pr.is_active and pr.moderation_hidden_at is null)
               when 'commandes' then (select count(*) from orders o where o.shop_id = s.id and o.created_at > v_depuis)
               when 'abonnes' then coalesce(s.followers_count, 0)
               else (select coalesce(sum(pr.views), 0) from products pr where pr.shop_id = s.id)
             end as valeur
        from shops s
       where s.moderation_hidden_at is null and compte_reel(s.owner_id)
       order by valeur desc
       limit v_n
    ) x;
    return jsonb_build_object('critere', v_critere, 'jours_pour_commandes', v_jours, 'boutiques', r);

  -- Chercher dans les articles en ligne: une catégorie, un prix plafond.
  when 'articles' then
    v_categorie := nullif(btrim(p->>'categorie'), '');
    v_prix_max := nullif(p->>'prix_max_fcfa', '')::int;
    with a as (
      select pr.name, pr.category, pr.price_fcfa, coalesce(pr.views, 0) views, s.name boutique
        from products pr join shops s on s.id = pr.shop_id
       where pr.is_active and pr.moderation_hidden_at is null and compte_reel(s.owner_id)
         and (v_categorie is null or pr.category ilike v_categorie)
         and (v_prix_max is null or pr.price_fcfa <= v_prix_max)
    )
    select jsonb_build_object(
      'filtre', jsonb_build_object('categorie', v_categorie, 'prix_max_fcfa', v_prix_max),
      'nombre', (select count(*) from a),
      'prix_median_fcfa', (select percentile_cont(0.5) within group (order by price_fcfa) from a where price_fcfa > 0),
      'les_plus_vus', (select coalesce(jsonb_agg(jsonb_build_object('article', name, 'boutique', boutique, 'prix_fcfa', price_fcfa, 'vues', views)), '[]'::jsonb)
                         from (select * from a order by views desc limit v_n) t)
    ) into r;
    return r;

  -- Les catégories: combien d'articles en ligne dans chacune.
  when 'categories' then
    select coalesce(jsonb_agg(jsonb_build_object('categorie', coalesce(category, '(sans)'), 'articles', n) order by n desc), '[]'::jsonb) into r
      from (select pr.category, count(*) n from products pr join shops s on s.id = pr.shop_id
             where pr.is_active and pr.moderation_hidden_at is null and compte_reel(s.owner_id) group by 1) x;
    return jsonb_build_object('categories', r);

  -- Les commandes sur une période, par statut.
  when 'commandes' then
    v_statut := nullif(p->>'statut', '');
    select jsonb_build_object(
      'jours', v_jours,
      'nombre', count(*) filter (where v_statut is null or status = v_statut),
      'montant_total_fcfa', coalesce(sum(total_fcfa) filter (where v_statut is null or status = v_statut), 0),
      'par_statut', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from
                      (select status, count(*) n from orders o where o.created_at > v_depuis and (o.buyer_id is null or compte_reel(o.buyer_id)) group by 1) y)
    ) into r
      from orders o where o.created_at > v_depuis and (o.buyer_id is null or compte_reel(o.buyer_id));
    return r;

  -- Où sont les gens: comptes et boutiques par pays.
  when 'pays' then
    select jsonb_build_object(
      'comptes_par_pays', (select coalesce(jsonb_object_agg(coalesce(country, '(inconnu)'), n), '{}'::jsonb)
                             from (select country, count(*) n from profiles pf where compte_reel(pf.id) group by 1) x),
      'boutiques_par_pays', (select coalesce(jsonb_object_agg(coalesce(country, '(inconnu)'), n), '{}'::jsonb)
                               from (select country, count(*) n from shops s where s.moderation_hidden_at is null and compte_reel(s.owner_id) group by 1) y)
    ) into r;
    return r;

  else
    return jsonb_build_object('erreur', 'outil inconnu');
  end case;
end $$;

revoke all on function public.legion_outil(text, jsonb) from public, anon, authenticated;
grant execute on function public.legion_outil(text, jsonb) to service_role;
