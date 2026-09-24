-- LEGION — le wiki tenu par les agents, le marché de l'entreprise, le cache
-- (idées 127, 164 et 165 des 200, 24/09).
--
--   * legion_wiki : quelques pages que l'équipe tient à jour — « Ce qu'on a
--     décidé » (écrite par le directeur chaque vendredi, à partir des
--     décisions et comptes rendus), « Qui fait quoi » et « Nos façons de
--     faire » (tirées de la base, sans modèle). Les humains peuvent les
--     corriger.
--   * legion_entreprises.marche : le pays où l'entreprise vend surtout (code
--     ISO, vide = aucun). Les agents adaptent monnaie, exemples, jours
--     fériés, cadre légal. Aucun pays par défaut.
--   * legion_cache : des réponses gardées quelques heures ou jours pour ne
--     pas repayer la même chose (une recherche sur Internet, le tri d'une
--     même demande). Lu et écrit par les fonctions seulement.
--
-- Additive : une colonne, deux tables, une tâche planifiée de ménage.

alter table public.legion_entreprises add column if not exists marche text;
alter table public.legion_entreprises drop constraint if exists legion_entreprises_marche_check;
alter table public.legion_entreprises add constraint legion_entreprises_marche_check check (marche is null or marche ~ '^[A-Z]{2}$');

create table if not exists public.legion_wiki (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  cle text not null check (cle ~ '^[a-z0-9-]{2,40}$'),
  titre text not null check (length(titre) between 2 and 120),
  contenu text not null default '' check (length(contenu) <= 20000),
  par_agent uuid,
  par_user uuid,
  maj_le timestamptz not null default now(),
  unique (entreprise_id, cle)
);
alter table public.legion_wiki enable row level security;
drop policy if exists legion_wiki_lire on public.legion_wiki;
create policy legion_wiki_lire on public.legion_wiki for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_wiki_ecrire on public.legion_wiki;
create policy legion_wiki_ecrire on public.legion_wiki for update using (public.legion_peut_agir(entreprise_id)) with check (public.legion_peut_agir(entreprise_id));
drop policy if exists legion_wiki_ajouter on public.legion_wiki;
create policy legion_wiki_ajouter on public.legion_wiki for insert with check (public.legion_peut_agir(entreprise_id));

create table if not exists public.legion_cache (
  cle text primary key,
  fonction text not null,
  valeur jsonb not null,
  expire_le timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.legion_cache enable row level security;
-- Aucune règle : seules les fonctions (service) y accèdent.

select cron.unschedule('legion-cache-menage') where exists (select 1 from cron.job where jobname = 'legion-cache-menage');
select cron.schedule('legion-cache-menage', '40 3 * * *', $$delete from public.legion_cache where expire_le < now()$$);
