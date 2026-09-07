-- Deux corrections d'index ciblées, trouvées en audit performance du 07/09.
--
-- 1. products avait DEUX index identiques sur shop_id (products_shop_idx
--    et idx_products_shop_id, tous deux `btree(shop_id)` sans condition) —
--    doublon pur, probablement issu de deux migrations qui l'ont ajouté
--    chacune de son côté sans le savoir. Coût réel: chaque INSERT/UPDATE
--    d'article paie la maintenance des deux, pour un bénéfice de lecture
--    nul (le second n'apporte rien que le premier n'apporte déjà).
drop index if exists public.idx_products_shop_id;

-- 2. shop_follows n'avait qu'un index composite (follower_id, shop_id) —
--    qui n'accélère PAS un filtre sur shop_id seul (un index composite ne
--    sert que le préfixe gauche). Or send-push filtre exactement ainsi
--    pour l'audience "shop_followers" (abonnés d'une boutique précise) —
--    chaque diffusion de ce type forçait un balayage complet de la table.
--    Sans effet mesurable aujourd'hui (24 lignes), mais le chemin de code
--    est réel et le coût de l'index est négligeable à l'écriture.
create index if not exists shop_follows_shop_idx on public.shop_follows (shop_id);
