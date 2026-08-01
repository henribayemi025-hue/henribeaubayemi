-- Bandeau d'annonce en haut de l'app (la bande orange du prototype de Beau:
-- « SUPER-APP · Vente Privée Chic & Vintage… »).
--
-- Le texte est une DONNÉE, pas du code en dur: Beau (ou tout admin) l'écrit
-- depuis l'espace admin, et il apparaît en haut de tous les écrans acheteur.
-- Sans annonce active, aucun bandeau ne s'affiche — on ne laisse jamais un
-- slogan figé dans le build promettre une opération qui n'existe plus.
--
-- Table DÉDIÉE, surtout pas `app_config`: cette dernière contient les clés
-- Stripe et VAPID, et il n'est pas question d'y ouvrir la moindre lecture
-- publique pour afficher une phrase marketing.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default false,
  -- Étiquette courte à gauche (ex: « SUPER-APP »). Optionnelle.
  label text,
  text_fr text not null,
  text_en text,
  -- Lien optionnel: le bandeau devient cliquable s'il est renseigné.
  href text,
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Lecture publique des SEULES annonces actives (y compris déconnecté: le
-- bandeau doit s'afficher dès l'arrivée sur le site).
drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements
  for select using (active);

-- Écriture réservée aux admins, vérifié côté serveur.
drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_admin_all on public.announcements
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
