-- Outil « articles » des agents de Léo : dire CE QUE l'on compte.
--
-- Constaté le 07/10 : un agent a présenté « Boho braids — 25 vues » comme
-- une mesure de la semaine. C'était le compteur `products.views`, cumulé
-- depuis la création de la fiche (11 vues sur les 7 derniers jours). Le même
-- outil rendait aussi « prix_fcfa: 0 » pour un article « sur demande », que
-- l'agent a pris pour un prix à vérifier.
--
-- Changement, sur la seule branche 'articles' de legion_outil :
--   - `vues` devient `vues_depuis_creation` (même valeur, nom honnête) ;
--   - `vues_7_jours` s'ajoute, comptée dans `events` (comptes de test exclus) ;
--   - un article sur demande rend `prix_fcfa: null` et `sur_demande: true` ;
--   - « les plus vus » se classent sur les 7 derniers jours.
-- Rien d'autre ne bouge : la fonction est relue telle qu'elle est en base et
-- seuls ces trois morceaux sont remplacés ; si l'un manque, on s'arrête.
do $$
declare
  d text := pg_get_functiondef('public.legion_outil(text,jsonb)'::regprocedure);
  a1 text := $a$    with a as (
      select pr.name, pr.category, pr.price_fcfa, coalesce(pr.views, 0) views, s.name boutique
        from products pr join shops s on s.id = pr.shop_id
       where pr.is_active$a$;
  b1 text := $b$    with v7 as (
      select e.target_id, count(*) n from events e
       where e.type = 'product_view' and e.created_at > now() - interval '7 days'
         and (e.user_id is null or compte_reel(e.user_id))
       group by 1
    ), a as (
      select pr.name, pr.category, pr.price_fcfa, coalesce(pr.views, 0) views, s.name boutique,
             (pr.price_on_request or coalesce(pr.price_fcfa, 0) = 0) sur_demande, coalesce(v7.n, 0) vues7
        from products pr join shops s on s.id = pr.shop_id
        left join v7 on v7.target_id = pr.id::text
       where pr.is_active$b$;
  a2 text := $a$jsonb_build_object('article', name, 'boutique', boutique, 'prix_fcfa', price_fcfa, 'vues', views)$a$;
  b2 text := $b$jsonb_build_object('article', name, 'boutique', boutique, 'prix_fcfa', case when sur_demande then null else price_fcfa end, 'sur_demande', sur_demande, 'vues_7_jours', vues7, 'vues_depuis_creation', views)$b$;
  a3 text := $a$from (select * from a order by views desc limit v_n) t)$a$;
  b3 text := $b$from (select * from a order by vues7 desc, views desc limit v_n) t),
      'note', 'vues_7_jours : fiches ouvertes ces 7 derniers jours (comptes de test retirés). vues_depuis_creation : compteur cumulé de la fiche, ce n''est PAS une mesure de la semaine.'$b$;
begin
  if position(a1 in d) = 0 or position(a2 in d) = 0 or position(a3 in d) = 0 then
    raise exception 'legion_outil a changé : morceau attendu introuvable, rien n''est modifié';
  end if;
  d := replace(replace(replace(d, a1, b1), a2, b2), a3, b3);
  execute d;
end $$;
