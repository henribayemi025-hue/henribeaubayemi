-- L'environnement Finjaro: plusieurs applications, un seul compte.
--
-- Beau (10/09): « je veux créer un environnement un peu comme l'environnement
-- Google, où on aura les applications Finjaro ». La première voisine de la
-- place de marché est Finia Accounting (dépôt séparé, même projet Supabase,
-- même auth.users).
--
-- La liste vit en base, PAS en dur dans le code: ajouter une application,
-- corriger une adresse ou en masquer une se fait alors sans redéployer quoi
-- que ce soit — et TOUTES les applications Finjaro lisent la même liste,
-- donc le sélecteur reste cohérent partout.
--
-- Table additive, sans lien avec finia_workspaces (qui appartient à
-- l'application comptable et n'est pas touchée ici).
create table if not exists public.finjaro_apps (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  tagline text,
  url text not null,
  emoji text,
  -- Palette maison uniquement (crème, terracotta, laiton): une application
  -- ajoutée plus tard ne peut pas casser le style.
  accent text not null default 'teal' check (accent in ('teal', 'brass', 'ink')),
  -- Qui voit l'application dans le sélecteur.
  audience text not null default 'tous' check (audience in ('tous', 'vendeuse', 'admin')),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.finjaro_apps enable row level security;

drop policy if exists finjaro_apps_read on public.finjaro_apps;
drop policy if exists finjaro_apps_admin on public.finjaro_apps;
-- Lecture publique: le sélecteur doit s'afficher avant même d'avoir un
-- compte. Les applications réservées à l'équipe sont filtrées par `audience`
-- côté client — et de toute façon, leur console exige un compte admin.
create policy finjaro_apps_read on public.finjaro_apps
  for select using (is_active = true or public.is_admin());
create policy finjaro_apps_admin on public.finjaro_apps
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.finjaro_apps (key, name, tagline, url, emoji, accent, audience, sort_order)
values
  ('marketplace', 'Finjaro',
   'La place de marché: acheter, vendre, se faire livrer.',
   'https://finjaro.net', '🛍️', 'teal', 'tous', 10),
  ('accounting', 'Finjaro Accounting',
   'Caisse, stock, factures et comptabilité pour ta boutique.',
   'https://automatisation-des-candidatures.finjaro.workers.dev', '📒', 'brass', 'tous', 20),
  ('admin', 'Console Finjaro',
   'Pilotage de la plateforme, réservé à l''équipe.',
   'https://finjaro-admin.finjaro.workers.dev', '🛠️', 'ink', 'admin', 90)
on conflict (key) do nothing;
