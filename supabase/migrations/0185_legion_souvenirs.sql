-- LEGION — la mémoire propre à chaque agent (idée 1 des 200, 24/09).
--
-- Jusqu'ici la mémoire était commune : les règles de la maison, le résumé de
-- chaque salon. Ici, ce qui n'appartient qu'à UN agent : ses livrables
-- passés, les leçons qu'on lui a données en renvoyant un livrable, les
-- encouragements du fondateur. Chaque souvenir a un vecteur (768, comme les
-- documents, 0179) : avant de répondre ou de livrer, l'agent retrouve les
-- trois souvenirs les plus proches de ce qu'on lui demande.
--
-- Additive : une table, une fonction de recherche. Les fonctions écrivent
-- les livrables (avec leur vecteur) ; l'application écrit les leçons et les
-- encouragements (sans vecteur : la fonction le calcule au premier usage).

create table if not exists public.legion_souvenirs (
  id bigserial primary key,
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  agent_id uuid not null references public.legion_agents(id) on delete cascade,
  source text not null check (source in ('livrable', 'lecon', 'encouragement')),
  message_id uuid,
  texte text not null check (length(texte) between 3 and 4000),
  embedding extensions.vector(768),
  cree_par uuid,
  created_at timestamptz not null default now()
);
create index if not exists legion_souvenirs_agent on public.legion_souvenirs (agent_id, created_at desc);

alter table public.legion_souvenirs enable row level security;
drop policy if exists legion_souvenirs_lire on public.legion_souvenirs;
create policy legion_souvenirs_lire on public.legion_souvenirs for select using (public.legion_est_membre(entreprise_id));
-- Un membre écrit une leçon ou un encouragement, jamais un vecteur, jamais
-- pour un agent d'une autre entreprise.
drop policy if exists legion_souvenirs_ajouter on public.legion_souvenirs;
create policy legion_souvenirs_ajouter on public.legion_souvenirs for insert with check (
  public.legion_est_membre(entreprise_id)
  and source in ('lecon', 'encouragement')
  and embedding is null
  and cree_par = auth.uid()
  and exists (select 1 from public.legion_agents a where a.id = agent_id and a.entreprise_id = legion_souvenirs.entreprise_id)
);
-- Oublier un souvenir.
drop policy if exists legion_souvenirs_oublier on public.legion_souvenirs;
create policy legion_souvenirs_oublier on public.legion_souvenirs for delete using (public.legion_est_membre(entreprise_id));

create or replace function public.legion_chercher_souvenirs(p_agent uuid, p_vecteur extensions.vector(768), p_n integer default 3)
returns table (id bigint, source text, texte text, created_at timestamptz, distance double precision)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select s.id, s.source, s.texte, s.created_at, (s.embedding <=> p_vecteur)::double precision
    from public.legion_souvenirs s
   where s.agent_id = p_agent and s.embedding is not null
   order by s.embedding <=> p_vecteur
   limit least(greatest(coalesce(p_n, 3), 1), 10);
$$;
revoke all on function public.legion_chercher_souvenirs(uuid, extensions.vector, integer) from public, anon, authenticated;
