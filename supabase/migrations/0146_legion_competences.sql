-- LEGION — les compétences des agents (chantier 2, étape A).
--
-- Beau, 22/09: « des agents qui s'améliorent… qui prennent des skills sur
-- GitHub ». Une compétence est une fiche de savoir-faire (SKILL.md) du
-- catalogue (studio_catalogue, 571 fiches sous licence MIT). Attachée à un
-- agent, son texte est lu à la source, gardé ici, et l'agent le relit avant
-- chaque réponse (legion-repondre). Voir docs/LEGION-COMPETENCES.md.
--
-- Additive: une table. Rien de retiré.

create table if not exists public.legion_competences (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  agent_id uuid not null references public.legion_agents(id) on delete cascade,
  catalogue_cle text not null,
  nom text not null,
  description text,
  contenu text,                       -- le texte de la fiche, lu à la source
  source_repo text,
  source_chemin text,
  licence text,
  ajoutee_par text not null default 'fondateur' check (ajoutee_par in ('fondateur', 'agent', 'veilleur')),
  pourquoi text,                      -- ce que l'agent en attend, quand c'est lui qui la choisit
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (agent_id, catalogue_cle)
);
create index if not exists legion_competences_agent on public.legion_competences (agent_id, actif);

alter table public.legion_competences enable row level security;

drop policy if exists "legion_competences lecture" on public.legion_competences;
create policy "legion_competences lecture" on public.legion_competences
  for select using (public.legion_est_membre(entreprise_id));
-- On équipe et on retire par la fonction legion-competences (elle lit la
-- fiche à la source); un membre peut aussi éteindre une compétence.
drop policy if exists "legion_competences eteindre" on public.legion_competences;
create policy "legion_competences eteindre" on public.legion_competences
  for update using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

grant select, update on public.legion_competences to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.legion_competences;
exception when duplicate_object then null; when undefined_object then null; end $$;
