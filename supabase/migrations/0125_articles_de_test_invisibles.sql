-- Les articles des comptes de test disparaissent du catalogue public.
--
-- Beau (12/09), après avoir vu que 71 articles sur 413 venaient de ses
-- propres comptes: « fais que mes articles n'apparaissent plus ». Camerounian
-- chanel (55 articles) était la 2e plus grosse boutique de Finjaro, et
-- Beauty hairs sortait dans les recherches de coiffure comme une vraie
-- boutique. Une personne qui découvre Finjaro voyait donc un article sur six
-- écrit pour tester.
--
-- Ce n'est pas une nouvelle notion: `profiles.is_test` existe depuis la
-- migration 0120, où il sert déjà à distinguer une VRAIE cliente d'un test
-- pour les alertes. On s'appuie dessus plutôt que d'inventer une seconde
-- définition qui finirait par diverger.
--
-- Le filtre est posé sur la RÈGLE D'ACCÈS, pas dans chaque écran: l'accueil,
-- les rayons, la recherche, la page d'une boutique et l'onglet Services
-- lisent tous la table `products` en respectant cette règle (ni
-- home_feed_page ni services_page ne sont en SECURITY DEFINER — vérifié).
-- Un seul endroit à changer, aucun écran ne peut être oublié.
--
-- Ce qui NE change pas:
--   - la vendeuse voit toujours ses propres articles (owns_shop), donc Beau
--     garde ses comptes de test pleinement utilisables;
--   - l'administration voit tout (products_admin_read);
--   - rien n'est supprimé ni désactivé: retirer is_test d'un compte fait
--     réapparaître ses articles immédiatement.
--
-- Volontairement NON couverts: « Finjaro Demo Shop » (compte App Review) et
-- « Finjaro — boutique de démonstration ». Leurs comptes ne sont pas marqués
-- is_test, et c'est voulu: les relecteurs d'Apple et de Google doivent voir
-- du contenu. Les masquer ferait échouer une validation de version.

create or replace function public.boutique_de_test(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- SECURITY DEFINER: un visiteur non connecté n'a pas le droit de lire le
  -- profil d'autrui, mais doit quand même se voir filtrer correctement.
  select exists (
    select 1
    from shops s
    join profiles p on p.id = s.owner_id
    where s.id = p_shop_id
      and coalesce(p.is_test, false) = true
  );
$$;

alter policy products_read on public.products
  using (
    (is_active = true and not public.boutique_de_test(shop_id))
    or owns_shop(shop_id)
  );
