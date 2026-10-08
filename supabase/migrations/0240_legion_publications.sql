-- LEO — l'équipe réseaux sociaux (Beau, 08/10 : « oui, rajoute ; ce n'est pas
-- pour nous, c'est pour toute personne »). Inspirée de la lettre de
-- ReStructure AI « The AI social media team that runs on one person » :
-- veille, une semaine de publications, relecture, et RIEN ne sort sans
-- l'accord d'un humain.
--
-- La mission « Semaine de publications » (bibliothèque de missions) fait
-- écrire à l'agent, en plus de son livrable, 5 à 7 publications structurées.
-- Elles arrivent ici « proposées » ; un membre de l'entreprise les valide ou
-- les refuse dans Léo. Léo ne publie rien lui-même : il n'a encore aucune
-- application validée par Instagram, Facebook, TikTok ou LinkedIn.
--
-- Une publication vidéo porte un brief (plans, voix, texte à l'écran). Les
-- agents ne savent pas encore fabriquer de vidéo (aucune API) : chez Finjaro,
-- le brief part à Claude, qui produit la vidéo et la soumet à Beau
-- (video_statut « a_produire ») ; ailleurs, c'est un brief à filmer (« brief »).
--
-- Additive : une table et sa règle d'accès. Propre à Léo : Finjaro
-- Accounting n'est pas touchée.

create table if not exists public.legion_publications (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  tache_id uuid,
  livrable_id uuid,
  auteur_id uuid references public.legion_agents(id) on delete set null,
  semaine date not null,
  jour smallint not null check (jour between 1 and 7),
  plateforme text not null check (length(plateforme) between 2 and 40),
  format text not null check (length(format) between 2 and 40),
  accroche text not null check (length(accroche) between 3 and 400),
  legende text not null check (length(legende) between 3 and 3000),
  visuel text check (visuel is null or length(visuel) <= 1500),
  appel_action text check (appel_action is null or length(appel_action) <= 300),
  pourquoi text check (pourquoi is null or length(pourquoi) <= 600),
  video jsonb,
  statut text not null default 'proposee' check (statut in ('proposee', 'validee', 'refusee', 'publiee')),
  video_statut text not null default 'aucune' check (video_statut in ('aucune', 'brief', 'a_produire', 'proposee', 'faite')),
  video_url text check (video_url is null or length(video_url) <= 600),
  decide_par uuid,
  decide_le timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists legion_publications_entreprise_semaine on public.legion_publications (entreprise_id, semaine desc, jour);
create index if not exists legion_publications_video on public.legion_publications (video_statut) where video_statut = 'a_produire';

alter table public.legion_publications enable row level security;
-- Sans « drop » : la règle n'est créée que si elle manque (rejouable).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legion_publications' and policyname = 'legion_publications_membres') then
    create policy legion_publications_membres on public.legion_publications for all
      using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));
  end if;
end $$;
