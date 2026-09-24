-- L'ATELIER DE CODE de Léo — V0 (Beau, 24/09 au soir : « oui atelier »).
-- Plan : docs/plans/2026-09-24-atelier-de-code-et-jarvis.md, partie 1 et
-- annexe A.
--
-- La trace DURABLE de l'atelier : projets, sessions, journal de chaque
-- action, demandes d'autorisation, règles « Toujours », coûts mesurés.
-- Le Worker `finjaro-atelier` écrit ici AVEC LE JETON de la personne (il n'a
-- pas la clé de service), donc sous les règles d'accès ci-dessous. Il garde
-- aussi tout dans son Durable Object : tant que cette migration n'est pas
-- appliquée, l'atelier marche, sans cette trace-ci.
--
-- ADDITIVE : six tables nouvelles, préfixe atelier_*, une fonction. Aucune
-- table existante n'est touchée, rien n'est supprimé ni renommé.
-- Numéro 0200 : 0197 est la plus haute sur staging, 0198 et 0199 sont
-- laissés à une autre session qui les prépare peut-être.
-- NE PAS APPLIQUER sans le feu vert de Beau.

-- ——— Les projets ———
create table if not exists public.atelier_projets (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.legion_entreprises(id) on delete set null,
  proprietaire uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nom text not null check (btrim(nom) <> '' and char_length(nom) <= 80),
  depot_github text,
  modele_depart text,
  niveau text not null default 'je_construis' check (niveau in ('je_decouvre', 'j_apprends', 'je_construis')),
  cree_le timestamptz not null default now()
);
create index if not exists atelier_projets_proprietaire on public.atelier_projets (proprietaire, cree_le desc);

-- Le projet est-il à moi ? (appelée par les règles d'accès des autres tables)
create or replace function public.atelier_mon_projet(p_projet uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.atelier_projets p where p.id = p_projet and p.proprietaire = auth.uid());
$$;
revoke all on function public.atelier_mon_projet(uuid) from public, anon;
grant execute on function public.atelier_mon_projet(uuid) to authenticated;

-- ——— Les sessions (et leur coût mesuré, en dollars US comme les prix publiés) ———
create table if not exists public.atelier_sessions (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.atelier_projets(id) on delete cascade,
  -- V0 : « demander » (par défaut) et « reflechir » (lecture seule). Les
  -- autres modes du plan (accepter, automatique) viendront en V1 par une
  -- migration additive qui élargira cette liste.
  mode text not null default 'demander' check (mode in ('demander', 'reflechir', 'visite')),
  modele text,
  sandbox_id text,
  statut text not null default 'pret' check (statut in ('pret', 'en_cours', 'attente', 'arrete', 'plafond', 'erreur', 'fermee')),
  debut timestamptz not null default now(),
  fin timestamptz,
  plafond_usd numeric(10, 4) not null default 1 check (plafond_usd > 0),
  cout_modele_usd numeric(12, 6) not null default 0 check (cout_modele_usd >= 0),
  cout_machine_usd numeric(12, 6) not null default 0 check (cout_machine_usd >= 0),
  jetons_entree bigint not null default 0,
  jetons_cache bigint not null default 0,
  jetons_sortie bigint not null default 0,
  secondes_machine integer not null default 0
);
create index if not exists atelier_sessions_projet on public.atelier_sessions (projet_id, debut desc);

-- ——— Le journal : chaque action, qui, quel mode, quelle décision, quel coût ———
-- Ajout seulement : une ligne ne se modifie ni ne s'efface (déclencheur).
-- Volontairement SANS clé étrangère (comme legion_journal) : une clé « on
-- delete cascade » ou « set null » ferait modifier le journal, donc échouer
-- — et bloquerait jusqu'à la suppression d'un compte de auth.users, table
-- commune à toutes les applications Finjaro (CLAUDE.md §8). Si un projet
-- disparaît, ses lignes restent, invisibles (règle d'accès par projet).
create table if not exists public.atelier_journal (
  id bigserial primary key,
  projet_id uuid not null,
  session_id uuid,
  quand timestamptz not null default now(),
  acteur text not null check (acteur in ('agent', 'humain', 'outil')),
  outil text not null,
  entree_resumee text check (char_length(entree_resumee) <= 1000),
  resultat_resume text check (char_length(resultat_resume) <= 1000),
  decision text check (decision in ('auto_lecture', 'regle_existante', 'autorise_une_fois', 'autorise_toujours', 'refuse', 'refuse_par_liste', 'refuse_par_outil', 'humain', 'arrete', 'erreur', 'en_attente')),
  mode text,
  cout_usd numeric(12, 6) not null default 0 check (cout_usd >= 0)
);
create index if not exists atelier_journal_projet on public.atelier_journal (projet_id, id desc);

create or replace function public.atelier_journal_intouchable()
returns trigger language plpgsql as $$
begin
  raise exception 'Le journal de l''atelier ne se modifie pas et ne s''efface pas.';
end $$;
drop trigger if exists atelier_journal_intouchable on public.atelier_journal;
create trigger atelier_journal_intouchable before update or delete on public.atelier_journal
  for each row execute function public.atelier_journal_intouchable();

-- ——— Les demandes d'autorisation (les cartes) ———
create table if not exists public.atelier_demandes (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.atelier_projets(id) on delete cascade,
  session_id uuid references public.atelier_sessions(id) on delete set null,
  outil text not null,
  details jsonb not null default '{}'::jsonb,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'autorisee', 'refusee', 'expiree')),
  creee_le timestamptz not null default now(),
  decidee_le timestamptz,
  decidee_par uuid references auth.users(id) on delete set null
);
create index if not exists atelier_demandes_projet on public.atelier_demandes (projet_id, creee_le desc);

-- ——— Les règles « Toujours pour cette commande (ou ce fichier) dans ce projet » ———
-- On ne supprime pas une règle : on la révoque (revoquee_le).
create table if not exists public.atelier_autorisations (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.atelier_projets(id) on delete cascade,
  portee text not null check (portee in ('commande', 'fichier')),
  regle text not null check (btrim(regle) <> '' and char_length(regle) <= 2000),
  accordee_par uuid not null default auth.uid() references auth.users(id) on delete cascade,
  accordee_le timestamptz not null default now(),
  revoquee_le timestamptz
);
create index if not exists atelier_autorisations_projet on public.atelier_autorisations (projet_id) where revoquee_le is null;

-- ——— Les coûts, appel par appel (la mesure réelle demandée pour la V0) ———
create table if not exists public.atelier_couts (
  id bigserial primary key,
  projet_id uuid not null references public.atelier_projets(id) on delete cascade,
  session_id uuid references public.atelier_sessions(id) on delete set null,
  quand timestamptz not null default now(),
  poste text not null check (poste in ('modele', 'machine')),
  modele text,
  jetons_entree integer not null default 0,
  jetons_cache integer not null default 0,
  jetons_sortie integer not null default 0,
  secondes numeric(10, 2) not null default 0,
  cout_usd numeric(12, 6) not null default 0 check (cout_usd >= 0)
);
create index if not exists atelier_couts_session on public.atelier_couts (session_id, quand);

-- ——— Les règles d'accès : chacun ne voit et n'écrit que SES projets ———
alter table public.atelier_projets enable row level security;
alter table public.atelier_sessions enable row level security;
alter table public.atelier_journal enable row level security;
alter table public.atelier_demandes enable row level security;
alter table public.atelier_autorisations enable row level security;
alter table public.atelier_couts enable row level security;

drop policy if exists atelier_projets_lire on public.atelier_projets;
create policy atelier_projets_lire on public.atelier_projets for select using (proprietaire = auth.uid());
drop policy if exists atelier_projets_creer on public.atelier_projets;
create policy atelier_projets_creer on public.atelier_projets for insert with check (
  proprietaire = auth.uid() and (entreprise_id is null or public.legion_est_membre(entreprise_id))
);
drop policy if exists atelier_projets_modifier on public.atelier_projets;
create policy atelier_projets_modifier on public.atelier_projets for update
  using (proprietaire = auth.uid()) with check (proprietaire = auth.uid() and (entreprise_id is null or public.legion_est_membre(entreprise_id)));

drop policy if exists atelier_sessions_lire on public.atelier_sessions;
create policy atelier_sessions_lire on public.atelier_sessions for select using (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_sessions_creer on public.atelier_sessions;
create policy atelier_sessions_creer on public.atelier_sessions for insert with check (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_sessions_modifier on public.atelier_sessions;
create policy atelier_sessions_modifier on public.atelier_sessions for update
  using (public.atelier_mon_projet(projet_id)) with check (public.atelier_mon_projet(projet_id));

drop policy if exists atelier_journal_lire on public.atelier_journal;
create policy atelier_journal_lire on public.atelier_journal for select using (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_journal_ajouter on public.atelier_journal;
create policy atelier_journal_ajouter on public.atelier_journal for insert with check (public.atelier_mon_projet(projet_id));

drop policy if exists atelier_demandes_lire on public.atelier_demandes;
create policy atelier_demandes_lire on public.atelier_demandes for select using (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_demandes_creer on public.atelier_demandes;
create policy atelier_demandes_creer on public.atelier_demandes for insert with check (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_demandes_modifier on public.atelier_demandes;
create policy atelier_demandes_modifier on public.atelier_demandes for update
  using (public.atelier_mon_projet(projet_id)) with check (public.atelier_mon_projet(projet_id));

drop policy if exists atelier_autorisations_lire on public.atelier_autorisations;
create policy atelier_autorisations_lire on public.atelier_autorisations for select using (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_autorisations_creer on public.atelier_autorisations;
create policy atelier_autorisations_creer on public.atelier_autorisations for insert with check (public.atelier_mon_projet(projet_id) and accordee_par = auth.uid());
drop policy if exists atelier_autorisations_modifier on public.atelier_autorisations;
create policy atelier_autorisations_modifier on public.atelier_autorisations for update
  using (public.atelier_mon_projet(projet_id)) with check (public.atelier_mon_projet(projet_id));

drop policy if exists atelier_couts_lire on public.atelier_couts;
create policy atelier_couts_lire on public.atelier_couts for select using (public.atelier_mon_projet(projet_id));
drop policy if exists atelier_couts_ajouter on public.atelier_couts;
create policy atelier_couts_ajouter on public.atelier_couts for insert with check (public.atelier_mon_projet(projet_id));

-- Rien pour « anon ». Les droits de table suivent les réglages par défaut de
-- Supabase (authenticated), bornés par les règles ci-dessus.
revoke all on public.atelier_projets, public.atelier_sessions, public.atelier_journal, public.atelier_demandes, public.atelier_autorisations, public.atelier_couts from anon;
