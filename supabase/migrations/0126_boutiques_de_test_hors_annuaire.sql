-- Les boutiques de test quittent l'annuaire, et leurs vidéos le fil Fin.
--
-- Suite de 0125. Beau (12/09): « oui enlève aussi les boutiques de
-- l'annuaire ». Leurs articles avaient disparu, mais Beauty hairs et
-- Camerounian chanel restaient listées — désormais vides, ce qui était pire
-- que le problème de départ.
--
-- Deux précautions, prises après avoir regardé ce qui est accroché à ces
-- boutiques.
--
-- 1. DEUX VRAIES PERSONNES ont un historique avec elles: sarahwafo@yahoo.fr
--    (deux conversations) et mebounouphilippe@gmail.com (une commande). Tout
--    le reste vient des comptes de test. Masquer sèchement leur aurait
--    affiché une conversation et une commande sans nom de boutique. La règle
--    garde donc la boutique lisible pour qui a DÉJÀ un lien avec elle: son
--    historique reste intact, elle disparaît seulement de la découverte.
--
-- 2. Les VIDÉOS (`reels`) étaient lisibles sans aucune condition: les 8
--    vidéos de test continuaient de passer dans le fil Fin. Les retirer
--    aussi, sinon le ménage s'arrête à mi-chemin.
--
-- Comme en 0125: rien n'est supprimé, la propriétaire voit toujours tout,
-- l'administration aussi, et retirer `is_test` d'un compte fait tout
-- réapparaître.

-- Une boutique tenue par un compte de test. SECURITY DEFINER: un visiteur
-- non connecté n'a pas le droit de lire le profil d'autrui.
create or replace function public.boutique_de_test_par_id(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from shops s join profiles p on p.id = s.owner_id
    where s.id = p_shop_id and coalesce(p.is_test, false) = true
  );
$$;

-- « J'ai déjà affaire à cette boutique »: une conversation ouverte ou une
-- commande passée. Assez pour que son nom continue de s'afficher là où je
-- l'ai déjà rencontrée, jamais assez pour la faire ressortir ailleurs.
create or replace function public.lien_existant_avec_boutique(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (select 1 from conversations c where c.shop_id = p_shop_id and c.buyer_id = auth.uid())
    or exists (select 1 from orders o where o.shop_id = p_shop_id and o.buyer_id = auth.uid())
  );
$$;

alter policy shops_read on public.shops
  using (
    (status = 'active' and not public.boutique_de_test_par_id(id))
    or owner_id = (select auth.uid())
    or public.lien_existant_avec_boutique(id)
  );

alter policy reels_read on public.reels
  using (not public.boutique_de_test_par_id(shop_id));
