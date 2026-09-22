-- Les mesures des agents ne comptent plus une commande de test.
--
-- Trouvé le 22/09 au soir en relisant le premier plan d'Alpha: « 1 commande
-- sur les 7 derniers jours ». C'était la commande d'essai de Claude sur la
-- boutique de test de Beau, passée sans compte (0156) puis annulée. Le
-- filtre « compte réel » ne regardait que l'acheteuse; une commande sans
-- compte passait donc toujours, même chez une boutique de test.
--
-- Une commande est réelle quand l'acheteuse (si elle a un compte) ET la
-- propriétaire de la boutique sont des comptes réels. Appliqué aux mesures
-- (legion_mesures_finjaro) et aux outils de lecture (legion_outil) par
-- remplacement de l'expression, sans réécrire les fonctions.

create or replace function public.commande_reelle(p_buyer uuid, p_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (p_buyer is null or public.compte_reel(p_buyer))
     and exists (select 1 from public.shops s where s.id = p_shop and public.compte_reel(s.owner_id));
$$;
revoke all on function public.commande_reelle(uuid, uuid) from public, anon, authenticated;

do $$
declare d text;
begin
  d := pg_get_functiondef('public.legion_mesures_finjaro()'::regprocedure);
  d := replace(d, '(o.buyer_id is null or public.compte_reel(o.buyer_id))', 'public.commande_reelle(o.buyer_id, o.shop_id)');
  d := replace(d, 'o.buyer_id is null or public.compte_reel(o.buyer_id)', 'public.commande_reelle(o.buyer_id, o.shop_id)');
  execute d;

  d := pg_get_functiondef('public.legion_outil(text, jsonb)'::regprocedure);
  d := replace(d, '(o.buyer_id is null or compte_reel(o.buyer_id))', 'commande_reelle(o.buyer_id, o.shop_id)');
  execute d;
end $$;
