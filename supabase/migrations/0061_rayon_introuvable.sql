-- « Je ne trouve pas mon rayon ».
--
-- Beau, en demandant où irait un ours en peluche: la question a mis le doigt
-- sur le vrai défaut. Il existe « Autre service » pour les prestataires, mais
-- RIEN d'équivalent côté produits. Une vendeuse dont le métier n'est pas dans
-- la liste n'a aucune sortie — alors elle prend le premier rayon proposé.
--
-- C'est exactement ce qui s'est passé: 49 casques de chantier, gants
-- anti-coupure et cônes de balisage ont fini dans « Mode Femme », faute d'un
-- rayon pour l'équipement professionnel. On l'a découvert en ouvrant
-- l'application, des semaines après.
--
-- Deux choses ici, et la seconde compte autant que la première:
--
--   1) un rayon « Autre » côté produits, VISIBLE, pour que l'article parte en
--      ligne au lieu d'atterrir n'importe où;
--
--   2) ce que la vendeuse cherchait, en clair. Sans ça on saurait seulement
--      que quelqu'un n'a pas trouvé, jamais quoi. C'est cette liste qui dira
--      quel rayon créer ensuite — au lieu de l'apprendre en tombant dessus.

insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order)
values ('autre_produit', null, 'PRODUCT', 'Autre', 'Other', 99)
on conflict (id) do nothing;

-- Ce que les gens ont cherché sans le trouver. Une ligne par article rangé
-- dans « Autre », avec les mots de la vendeuse.
create table if not exists public.rayons_manquants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  cherchait text not null,
  created_at timestamptz not null default now(),
  traite_at timestamptz
);

create index if not exists rayons_manquants_ouverts_idx
  on public.rayons_manquants (created_at desc) where traite_at is null;

alter table public.rayons_manquants enable row level security;

-- La vendeuse écrit ce qu'elle cherchait pour SA boutique, et rien d'autre.
create policy rayons_manquants_insert on public.rayons_manquants
  for insert to authenticated
  with check (
    exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- Seule l'administration relit la liste: ce n'est pas un contenu public.
create policy rayons_manquants_admin_read on public.rayons_manquants
  for select to authenticated using (public.is_admin());

create policy rayons_manquants_admin_write on public.rayons_manquants
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
