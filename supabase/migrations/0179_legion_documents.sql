-- 0179 — Les documents de l'entreprise (J2, 23/09).
--
-- La vidéo « service client automatisé » envoyée par Beau le 23/09 : les
-- documents de l'entreprise deviennent une base de connaissances ; un agent
-- répond à partir d'eux. L'étude de l'intérim (docs/LEGION-INTERIM-ETUDE.md)
-- ajoute la leçon d'Air Canada : l'entreprise répond de ce que dit son agent
-- — il ne répond donc qu'à partir des documents, cite sa source, et dit « je
-- ne trouve pas ça dans nos documents » plutôt que d'inventer.
--
-- Un document est découpé en morceaux ; chaque morceau reçoit un vecteur
-- (Gemini, 768 dimensions) pour la recherche par le sens. Les morceaux ne se
-- lisent que par les fonctions (service) ; les membres voient la liste des
-- documents de leur entreprise, en ajoutent et en retirent.
--
-- Tout est AJOUTÉ. L'extension vector est posée dans le schéma extensions ;
-- elle ne change rien pour les autres applications du projet.

create extension if not exists vector with schema extensions;

create table if not exists public.legion_documents (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  titre text not null check (btrim(titre) <> ''),
  url text,
  mime text,
  taille integer,
  morceaux integer not null default 0,
  statut text not null default 'a_lire' check (statut in ('a_lire', 'lu', 'echec')),
  erreur text,
  ajoute_par uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists legion_documents_entreprise on public.legion_documents(entreprise_id);

alter table public.legion_documents enable row level security;
drop policy if exists legion_documents_lire on public.legion_documents;
create policy legion_documents_lire on public.legion_documents for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_documents_ajouter on public.legion_documents;
create policy legion_documents_ajouter on public.legion_documents for insert with check (public.legion_est_membre(entreprise_id) and ajoute_par = auth.uid());
drop policy if exists legion_documents_retirer on public.legion_documents;
create policy legion_documents_retirer on public.legion_documents for delete using (public.legion_est_membre(entreprise_id));

create table if not exists public.legion_morceaux (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.legion_documents(id) on delete cascade,
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  ordre integer not null,
  texte text not null,
  embedding extensions.vector(768)
);
create index if not exists legion_morceaux_entreprise on public.legion_morceaux(entreprise_id);
create index if not exists legion_morceaux_embedding on public.legion_morceaux using hnsw (embedding extensions.vector_cosine_ops);

-- Aucune règle d'accès : seules les fonctions (service) lisent et écrivent.
alter table public.legion_morceaux enable row level security;
revoke all on public.legion_morceaux from anon, authenticated;

-- La recherche par le sens, pour les fonctions seulement.
create or replace function public.legion_chercher_morceaux(p_entreprise uuid, p_vecteur extensions.vector(768), p_n integer default 6)
returns table (document_id uuid, titre text, url text, texte text, distance double precision)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select m.document_id, d.titre, d.url, m.texte, (m.embedding <=> p_vecteur)::double precision
  from public.legion_morceaux m
  join public.legion_documents d on d.id = m.document_id
  where m.entreprise_id = p_entreprise and m.embedding is not null
  order by m.embedding <=> p_vecteur
  limit least(greatest(coalesce(p_n, 6), 1), 20);
$$;
revoke all on function public.legion_chercher_morceaux(uuid, extensions.vector, integer) from public, anon, authenticated;

-- La fonction des documents compte son coût.
alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array[
  'finou_chat', 'miroir_ia',
  'legion_repondre', 'legion_competences', 'legion_portrait', 'legion_se_choisir', 'legion_veilleur',
  'legion_travail', 'legion_modele', 'traduire_fiche',
  'legion_reunion', 'legion_renfort', 'legion_documents',
  'vendor_copilot', 'chat-autoreply', 'troc_eval', 'chat_moderation_sweep', 'finou_vision', 'kyc_ocr'
]));
