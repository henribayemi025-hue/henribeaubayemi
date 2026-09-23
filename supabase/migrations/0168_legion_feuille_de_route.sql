-- La feuille de route d'une entreprise Legion: l'année, le mois, la
-- semaine, le jour — et chaque ligne se coche.
--
-- Beau, 23/09: « je t'ai parlé des projets, du plan sur l'année, la
-- semaine… »; « un plan clair pour chaque jour, chaque semaine, avant
-- samedi pour la semaine suivante »; « en forme de clic: quand une chose est
-- faite je clique fait, puis je commente ». Le tableau des tâches dit QUI
-- fait QUOI; la feuille de route dit QUAND, à chaque horizon.
--
-- Les lignes « recurrent » sont des règles (« publier chaque jour sur
-- Instagram, Facebook, TikTok », « LinkedIn tous les deux jours »): chaque
-- vendredi, legion_preparer_semaine() les déplie en lignes du jour pour la
-- semaine suivante, et demande à l'agent du calendrier de préparer ses
-- textes.
--
-- Additive: une table, deux fonctions, un cron.

create table if not exists public.legion_feuille (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  horizon text not null check (horizon in ('annee', 'trimestre', 'mois', 'semaine', 'jour', 'recurrent')),
  debut date not null,                 -- le jour, le lundi de la semaine, le 1er du mois…
  titre text not null,
  detail text,
  responsable uuid references public.legion_agents(id) on delete set null,
  recurrence text check (recurrence is null or recurrence in ('quotidien', 'tous_les_2_jours', 'hebdomadaire')),
  fin date,                            -- pour une règle: jusqu'à quand
  fait boolean not null default false,
  fait_le timestamptz,
  commentaire text,
  source uuid references public.legion_feuille(id) on delete set null, -- la règle d'où vient une ligne du jour
  ordre int not null default 100,
  created_at timestamptz not null default now()
);
create index if not exists legion_feuille_entreprise on public.legion_feuille (entreprise_id, horizon, debut);
create unique index if not exists legion_feuille_une_par_jour on public.legion_feuille (source, debut) where source is not null;

alter table public.legion_feuille enable row level security;
drop policy if exists "legion_feuille membres" on public.legion_feuille;
create policy "legion_feuille membres" on public.legion_feuille
  for all using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'legion_feuille') then
    alter publication supabase_realtime add table public.legion_feuille;
  end if;
end $$;

-- Déplie les règles en lignes du jour, du lundi au dimanche de la semaine
-- qui commence à p_lundi. Sans doublon (index unique source+jour).
create or replace function public.legion_deplier_semaine(p_entreprise uuid, p_lundi date)
returns int language plpgsql security definer set search_path = public as $$
declare r record; j date; n int := 0; k int;
begin
  for r in select * from public.legion_feuille
            where entreprise_id = p_entreprise and horizon = 'recurrent'
              and debut <= p_lundi + 6 and (fin is null or fin >= p_lundi) loop
    for k in 0..6 loop
      j := p_lundi + k;
      continue when j < r.debut or (r.fin is not null and j > r.fin);
      continue when r.recurrence = 'tous_les_2_jours' and ((j - r.debut) % 2) <> 0;
      continue when r.recurrence = 'hebdomadaire' and extract(isodow from j) <> extract(isodow from r.debut);
      insert into public.legion_feuille (entreprise_id, horizon, debut, titre, detail, responsable, source, ordre)
      values (p_entreprise, 'jour', j, r.titre, r.detail, r.responsable, r.id, r.ordre)
      on conflict do nothing;
      if found then n := n + 1; end if;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.legion_deplier_semaine(uuid, date) from public, anon;
grant execute on function public.legion_deplier_semaine(uuid, date) to authenticated;

-- Chaque vendredi: la semaine suivante se prépare toute seule. Les règles
-- sont dépliées, et si l'entreprise a un agent du calendrier (poste ou
-- mandat qui parle de publications / contenu), il reçoit la tâche de
-- préparer les textes de la semaine — il la livre à sa journée de travail.
create or replace function public.legion_preparer_semaine()
returns void language plpgsql security definer set search_path = public as $$
declare e record; lundi date := (date_trunc('week', now()) + interval '7 days')::date; qui record; salon uuid;
begin
  for e in select distinct entreprise_id from public.legion_feuille where horizon = 'recurrent' loop
    perform public.legion_deplier_semaine(e.entreprise_id, lundi);
    select a.id, a.departement into qui from public.legion_agents a
     where a.entreprise_id = e.entreprise_id and a.actif and a.user_id is null
       and (a.poste ilike '%contenu%' or a.poste ilike '%réseaux%' or a.poste ilike '%reseaux%' or a.mandat ilike '%publication%')
     order by a.ordre limit 1;
    if qui.id is null then continue; end if;
    select c.id into salon from public.legion_canaux c
     where c.entreprise_id = e.entreprise_id and c.prive_entre is null and lower(c.nom) = lower(coalesce(qui.departement, ''))
     limit 1;
    if salon is null then
      select c.id into salon from public.legion_canaux c where c.entreprise_id = e.entreprise_id and c.cle = 'direction' limit 1;
    end if;
    if salon is null then continue; end if;
    insert into public.legion_messages (entreprise_id, canal_id, auteur_id, texte, genre, assigne_a, meta)
    select e.entreprise_id, salon, qui.id,
           'Préparer les publications de la semaine du ' || to_char(lundi, 'DD/MM') || ' : un texte prêt pour chaque ligne du jour de la feuille de route',
           'tache', qui.id, jsonb_build_object('statut', 'a_faire', 'priorite', 'haute', 'feuille_de_route', to_char(lundi, 'YYYY-MM-DD'))
     where not exists (select 1 from public.legion_messages m where m.entreprise_id = e.entreprise_id and m.genre = 'tache'
                        and m.meta->>'feuille_de_route' = to_char(lundi, 'YYYY-MM-DD'));
  end loop;
end $$;
revoke all on function public.legion_preparer_semaine() from public, anon, authenticated;

select cron.unschedule('legion-preparer-semaine') where exists (select 1 from cron.job where jobname = 'legion-preparer-semaine');
select cron.schedule('legion-preparer-semaine', '0 5 * * 5', $$select public.legion_preparer_semaine()$$);
