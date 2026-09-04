-- « Je cherche quelque chose et Finjaro ne l'a pas. »
--
-- Jusqu'ici, une recherche sans résultat affichait une phrase morte
-- (« aucun résultat pour X ») et la personne repartait. On savait qu'elle
-- était venue — la table `events` enregistre déjà les recherches vides, et
-- report_unmet_demand() en fait un rapport hebdomadaire — mais on n'avait
-- AUCUN moyen de la recontacter. Le signal servait à corriger le catalogue
-- plus tard, jamais à servir la personne qui était là, maintenant.
--
-- Cette table, c'est l'autre moitié: son besoin ET de quoi lui répondre.
-- Finia promet un retour sous 24 h; sans contact, la promesse est vide.
--
-- Écriture ouverte aux visiteurs ANONYMES, délibérément: quelqu'un qui n'a
-- pas encore de compte est exactement la personne qu'on veut capter — lui
-- demander de s'inscrire d'abord, c'est la perdre. Les garde-fous sont donc
-- des contraintes de longueur, pas une obligation de compte.
create table if not exists public.demandes_acheteurs (
  id uuid primary key default gen_random_uuid(),
  -- Nul si la personne n'a pas de compte. On ne l'y force pas.
  user_id uuid references public.profiles(id) on delete set null,
  -- Ce qui a été tapé (ou le rayon vide consulté).
  recherche text not null,
  -- Ce que la personne précise en plus: taille, couleur, budget, ville.
  details text,
  -- WhatsApp ou e-mail. Sans ça, « réponse sous 24 h » ne veut rien dire.
  contact text not null,
  -- 'recherche' = recherche sans résultat, 'categorie' = rayon vide.
  source text not null default 'recherche'
    check (source in ('recherche', 'categorie')),
  statut text not null default 'ouverte'
    check (statut in ('ouverte', 'traitee', 'close')),
  created_at timestamptz not null default now(),
  traite_at timestamptz
);

create index if not exists demandes_acheteurs_ouvertes_idx
  on public.demandes_acheteurs (created_at desc) where statut = 'ouverte';

alter table public.demandes_acheteurs enable row level security;

-- N'importe qui peut déposer SA demande — y compris sans compte. Les bornes
-- de longueur évitent qu'on se serve de la table comme d'un dépotoir, et
-- `user_id` ne peut pas être attribué à quelqu'un d'autre.
drop policy if exists demandes_acheteurs_insert on public.demandes_acheteurs;
create policy demandes_acheteurs_insert on public.demandes_acheteurs
  for insert to anon, authenticated
  with check (
    length(btrim(recherche)) between 1 and 200
    and length(btrim(contact)) between 5 and 120
    and length(coalesce(details, '')) <= 500
    and (user_id is null or user_id = (select auth.uid()))
  );

-- La liste des demandes n'est pas un contenu public: seule l'administration
-- la relit, et la personne peut revoir les siennes si elle a un compte.
drop policy if exists demandes_acheteurs_read on public.demandes_acheteurs;
create policy demandes_acheteurs_read on public.demandes_acheteurs
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_admin()
  );

drop policy if exists demandes_acheteurs_admin_write on public.demandes_acheteurs;
create policy demandes_acheteurs_admin_write on public.demandes_acheteurs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

comment on table public.demandes_acheteurs is
  'Demandes déposées quand une recherche ou un rayon ne donne rien. Finia promet un retour sous 24 h — le contact est donc obligatoire.';
