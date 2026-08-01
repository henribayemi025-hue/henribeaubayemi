-- Espace d'administration: droits complets pour un compte `profiles.is_admin`.
--
-- Jusqu'ici l'admin ne pouvait lire que les commandes, les candidatures
-- vendeur et la consommation IA. Tout le reste lui était fermé par RLS —
-- au point que le tableau de bord affichait des chiffres FAUX: la politique
-- `events_read` filtre sur `user_id = auth.uid()`, donc "804 visites" se
-- réduisait aux visites de l'admin lui-même. Et les signalements
-- (`reports`) n'étaient lisibles que par celui qui les avait émis: la
-- modération était littéralement impossible.
--
-- Tout est ADDITIF: chaque politique ci-dessous s'ajoute à l'existant
-- (RLS = OU logique entre politiques), aucune règle acheteur/vendeur n'est
-- modifiée ni supprimée. `is_admin()` est déjà SECURITY DEFINER + STABLE.
--
-- Volontairement PAS ouvert à l'admin: `conversations` et `chat_messages`.
-- Lire les messages privés entre une cliente et une boutique n'est pas un
-- pouvoir d'administration ordinaire; si la modération d'une conversation
-- signalée devient nécessaire, ça se décidera explicitement.

-- Boutiques: voir TOUTES les boutiques (y compris suspendues, que la
-- politique publique masque) et pouvoir les modifier (suspendre, certifier).
drop policy if exists shops_admin_read on public.shops;
create policy shops_admin_read on public.shops for select using (is_admin());

drop policy if exists shops_admin_update on public.shops;
create policy shops_admin_update on public.shops for update using (is_admin()) with check (is_admin());

-- Comptes: suspendre un compte, retirer/accorder le rôle admin.
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update using (is_admin()) with check (is_admin());

-- Articles: voir aussi les articles hors ligne des autres boutiques, et
-- pouvoir retirer un article problématique.
drop policy if exists products_admin_read on public.products;
create policy products_admin_read on public.products for select using (is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for update using (is_admin()) with check (is_admin());

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for delete using (is_admin());

-- Détail des commandes côté admin (les commandes elles-mêmes étaient déjà
-- lisibles, mais pas leurs lignes — donc pas de détail d'articles).
drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select using (is_admin());

-- Statistiques réelles: sans ceci le tableau de bord ne comptait que
-- l'activité de l'admin.
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events for select using (is_admin());

-- Annonces de l'onglet Services: retirer une annonce abusive.
drop policy if exists listings_admin_write on public.near_you_listings;
create policy listings_admin_write on public.near_you_listings for update using (is_admin()) with check (is_admin());

drop policy if exists listings_admin_delete on public.near_you_listings;
create policy listings_admin_delete on public.near_you_listings for delete using (is_admin());

-- Avis, reels et commentaires de reels: suppression de contenu abusif.
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews for delete using (is_admin());

drop policy if exists reels_admin_delete on public.reels;
create policy reels_admin_delete on public.reels for delete using (is_admin());

drop policy if exists reel_comments_admin_delete on public.reel_comments;
create policy reel_comments_admin_delete on public.reel_comments for delete using (is_admin());

-- Candidatures vendeur: pouvoir marquer approuvée/refusée (la lecture admin
-- existait déjà en 0028, pas l'écriture).
drop policy if exists vendor_apps_admin_update on public.vendor_applications;
create policy vendor_apps_admin_update on public.vendor_applications for update using (is_admin()) with check (is_admin());

-- Signalements: le cœur de la modération. Jusqu'ici INVISIBLES pour l'admin.
-- On ajoute de quoi suivre leur traitement (colonnes additives, valeurs par
-- défaut sûres pour les lignes existantes).
alter table public.reports add column if not exists status text not null default 'pending';
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists admin_note text;

drop policy if exists reports_admin_read on public.reports;
create policy reports_admin_read on public.reports for select using (is_admin());

drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update on public.reports for update using (is_admin()) with check (is_admin());

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- Vue agrégée par boutique: ventes, chiffre d'affaires encaissé, articles,
-- commandes en attente. Calculer ça côté client demanderait de télécharger
-- toutes les commandes de la plateforme; ici Postgres fait la somme et ne
-- renvoie qu'une ligne par boutique.
--
-- SECURITY DEFINER + garde `is_admin()` explicite: la fonction contourne
-- RLS par construction, donc elle refuse net tout appelant non-admin.
create or replace function public.admin_shop_stats()
returns table (
  shop_id uuid,
  orders_total bigint,
  orders_pending bigint,
  orders_delivered bigint,
  revenue_fcfa bigint,
  products_total bigint,
  last_order_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as shop_id,
    count(distinct o.id) filter (where o.id is not null) as orders_total,
    count(distinct o.id) filter (where o.status in ('new', 'confirmed', 'shipped')) as orders_pending,
    count(distinct o.id) filter (where o.status = 'delivered') as orders_delivered,
    coalesce(sum(o.total_fcfa) filter (where o.status = 'delivered'), 0)::bigint as revenue_fcfa,
    (select count(*) from public.products p where p.shop_id = s.id) as products_total,
    max(o.created_at) as last_order_at
  from public.shops s
  left join public.orders o on o.shop_id = s.id
  where public.is_admin()
  group by s.id;
$$;

revoke all on function public.admin_shop_stats() from public, anon;
grant execute on function public.admin_shop_stats() to authenticated;
