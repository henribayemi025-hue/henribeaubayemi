-- Trois idées de la liste du 22/09, faites le 23/09 sur le mot de Beau
-- (« les idées pour plus tard, tu peux les faire maintenant si tu n'as pas
-- besoin d'une action de ma part »). Tout est additif.

-- 1. LA PREUVE DE LIVRAISON. La vendeuse joint une photo au moment de
--    marquer « livrée »; la cliente la voit dans ses commandes et confirme
--    (« J'ai bien reçu » existait déjà).
alter table public.orders add column if not exists delivery_photo_url text;
comment on column public.orders.delivery_photo_url is 'Photo prise par la vendeuse à la livraison (facultative).';

-- 2. LA TRADUCTION DES FICHES. Une fiche écrite en français se lit en
--    anglais chez une acheteuse anglophone, et inversement. Traduite une
--    fois par langue (fonction traduire-fiche), puis gardée ici.
create table if not exists public.product_traductions (
  product_id uuid not null references public.products(id) on delete cascade,
  langue text not null check (langue in ('fr', 'en')),
  langue_source text,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  primary key (product_id, langue)
);
alter table public.product_traductions enable row level security;
drop policy if exists "product_traductions lecture" on public.product_traductions;
create policy "product_traductions lecture" on public.product_traductions for select using (true);
-- Écriture: le serveur seulement (service_role), jamais l'application.

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check
  check (fn = any (array['finou_chat', 'miroir_ia', 'legion_repondre', 'legion_competences', 'legion_portrait',
                         'legion_se_choisir', 'legion_veilleur', 'legion_travail', 'legion_modele', 'traduire_fiche']));

-- 3. LE DÉPÔT OUVERT. Un développeur propose son application à
--    l'environnement Finjaro; l'équipe l'accepte (elle rejoint finjaro_apps)
--    ou la refuse. Beau, dans son post: « Finjaro s'ouvre aux développeurs ».
create table if not exists public.finjaro_apps_propositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  accroche text,
  url text not null,
  description text,
  contact text,
  statut text not null default 'proposee' check (statut in ('proposee', 'acceptee', 'refusee')),
  reponse text,
  created_at timestamptz not null default now()
);
alter table public.finjaro_apps_propositions enable row level security;
drop policy if exists "propositions: proposer" on public.finjaro_apps_propositions;
create policy "propositions: proposer" on public.finjaro_apps_propositions
  for insert with check (user_id = auth.uid());
drop policy if exists "propositions: les miennes" on public.finjaro_apps_propositions;
create policy "propositions: les miennes" on public.finjaro_apps_propositions
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "propositions: equipe" on public.finjaro_apps_propositions;
create policy "propositions: equipe" on public.finjaro_apps_propositions
  for update using (public.is_admin()) with check (public.is_admin());
