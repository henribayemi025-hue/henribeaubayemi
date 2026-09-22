-- LEGION — deux outils de lecture pour la Direction: qui a fait quoi, et la
-- fiche d'une personne.
--
-- Beau, 22/09: « qui sont ces personnes ? Ils doivent pouvoir aller dans la
-- base. Ils ne peuvent pas modifier, mais ils peuvent regarder, faire des
-- requêtes: les clients ont fait quoi… sur les gens de la direction ».
-- Toujours pas de SQL libre (porte trop large sur une base partagée): deux
-- requêtes fixes de plus dans legion_outil, en lecture seule.
--
-- Ce qui sort: le NOM affiché, la date d'inscription, le pays et la ville,
-- si c'est une vendeuse et sa boutique, ses commandes, ses dernières
-- actions sur la place de marché. PAS d'e-mail, PAS de téléphone, PAS
-- d'adresse: pour recontacter quelqu'un, Beau a son rappel du soir et
-- Claude. Comptes de test exclus. legion-repondre ne propose ces deux
-- outils qu'en Direction (et en privé avec un agent de la Direction).
--
-- Additive: la fonction legion_outil est remplacée par une version qui
-- garde tous les outils existants et en ajoute deux.

create or replace function public.legion_outil_personnes(p_nom text, p_params jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  p jsonb := coalesce(p_params, '{}'::jsonb);
  v_jours int := least(greatest(coalesce((p->>'jours')::int, 7), 1), 90);
  v_type text := p->>'type';
  v_nom text := btrim(coalesce(p->>'nom', ''));
  r jsonb;
begin
  if p_nom = 'qui_a_fait' then
    if v_type not in ('product_view','shop_view','search','whatsapp_click','phone_click','contact_intent',
                      'cart_add','checkout_start','follow','comment','share_reel','share_shop') then
      return jsonb_build_object('erreur', 'type inconnu');
    end if;
    select jsonb_build_object(
      'type', v_type, 'jours', v_jours,
      'personnes_connectees', coalesce((select jsonb_agg(x order by x.derniere desc) from (
          select pf.name as nom, count(*) as fois, max(e.created_at) as derniere,
                 (select string_agg(distinct coalesce(pr.name, sh.name), ', ') from events e2
                    left join products pr on pr.id::text = e2.target_id
                    left join shops sh on sh.id::text = e2.target_id
                   where e2.user_id = pf.id and e2.type = v_type and e2.created_at > now() - make_interval(days => v_jours)) as quoi,
                 exists (select 1 from shops s where s.owner_id = pf.id) as est_vendeuse
            from events e join profiles pf on pf.id = e.user_id
           where e.type = v_type and e.created_at > now() - make_interval(days => v_jours) and compte_reel(pf.id)
           group by pf.id, pf.name limit 30) x), '[]'::jsonb),
      'visiteurs_non_connectes', (select count(distinct e.meta->>'anon_id') from events e
                                   where e.type = v_type and e.user_id is null and e.created_at > now() - make_interval(days => v_jours))
    ) into r;
    return r;

  elsif p_nom = 'fiche_personne' then
    if length(v_nom) < 3 then return jsonb_build_object('erreur', 'donne au moins 3 lettres du nom'); end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'nom', pf.name, 'inscrite_le', to_char(pf.created_at, 'DD/MM/YYYY'), 'pays', pf.country, 'ville', pf.city,
      'boutiques', (select coalesce(jsonb_agg(jsonb_build_object('nom', s.name, 'ouverte_le', to_char(s.created_at, 'DD/MM/YYYY'),
                      'articles_en_ligne', (select count(*) from products x where x.shop_id = s.id and x.is_active))), '[]'::jsonb)
                    from shops s where s.owner_id = pf.id),
      'commandes_passees', (select count(*) from orders o where o.buyer_id = pf.id),
      'dernieres_actions', (select coalesce(jsonb_agg(a order by a.le desc), '[]'::jsonb) from (
          select e.type, to_char(e.created_at, 'DD/MM HH24:MI') as le_texte, e.created_at as le,
                 coalesce(pr.name, sh.name) as sur
            from events e left join products pr on pr.id::text = e.target_id left join shops sh on sh.id::text = e.target_id
           where e.user_id = pf.id and e.type not in ('visit', 'intro_shown', 'intro_closed', 'perf_page_load', 'cookie_answer')
           order by e.created_at desc limit 15) a)
    )), '[]'::jsonb) into r
    from (select * from profiles where name ilike '%' || v_nom || '%' and compte_reel(id) limit 3) pf;
    return jsonb_build_object('trouvees', r);
  end if;
  return jsonb_build_object('erreur', 'outil inconnu');
end $$;

revoke all on function public.legion_outil_personnes(text, jsonb) from public, anon, authenticated;
grant execute on function public.legion_outil_personnes(text, jsonb) to service_role;
