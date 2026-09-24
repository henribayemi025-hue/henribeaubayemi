-- LEGION — la bibliothèque de missions (idées 38, 43, 77, 80, 81, 82, 84,
-- 85, 89, 91, 92, 96, 97, 99, 174 et 185 des 200, 24/09).
--
-- Une mission est une tâche prête à l'emploi (qui la fait, ce qu'elle
-- produit). Lancée une fois, c'est une tâche au tableau. Lancée « chaque
-- semaine / mois / an », elle est gardée ici et revient seule : chaque matin
-- à 5 h UTC, avant la journée de travail, la tâche du jour est posée au
-- tableau de l'agent choisi — pas deux fois si la précédente est encore
-- ouverte.
--
-- Additive : une table, une fonction, une tâche planifiée.

create table if not exists public.legion_missions (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  cle text not null,
  titre text not null check (length(titre) between 3 and 200),
  texte text not null check (length(texte) between 10 and 3000),
  agent_id uuid references public.legion_agents(id) on delete set null,
  recurrence text not null check (recurrence in ('semaine', 'mois', 'an')),
  prochaine date not null,
  actif boolean not null default true,
  cree_par uuid,
  created_at timestamptz not null default now(),
  unique (entreprise_id, cle)
);

alter table public.legion_missions enable row level security;
drop policy if exists legion_missions_membres on public.legion_missions;
create policy legion_missions_membres on public.legion_missions for all
  using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

create or replace function public.legion_missions_du_jour()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  m record; qui record; salon uuid; n integer := 0; pas interval;
begin
  for m in select * from public.legion_missions where actif and prochaine <= current_date loop
    pas := case m.recurrence when 'semaine' then interval '7 days' when 'mois' then interval '1 month' else interval '1 year' end;
    -- L'agent choisi s'il est allumé, sinon un responsable allumé.
    select a.id, a.departement into qui from public.legion_agents a
     where a.entreprise_id = m.entreprise_id and a.actif and a.user_id is null and a.moteur <> 'claude-code'
       and (a.id = m.agent_id or m.agent_id is null or not exists (select 1 from public.legion_agents b where b.id = m.agent_id and b.actif))
     order by (a.id = m.agent_id) desc, a.est_directeur desc, a.ordre
     limit 1;
    if qui.id is not null and not exists (
      select 1 from public.legion_messages t
       where t.entreprise_id = m.entreprise_id and t.genre = 'tache' and t.termine_le is null
         and t.meta->'mission'->>'id' = m.id::text
    ) then
      select c.id into salon from public.legion_canaux c
       where c.entreprise_id = m.entreprise_id and (c.prive_entre is null or cardinality(c.prive_entre) = 0)
       order by (lower(c.nom) = lower(coalesce(qui.departement, ''))) desc, (c.cle = 'direction') desc, c.ordre
       limit 1;
      if salon is not null then
        insert into public.legion_messages (entreprise_id, canal_id, auteur_id, texte, genre, assigne_a, meta)
        values (m.entreprise_id, salon, qui.id, left(m.texte, 3000), 'tache', qui.id,
                jsonb_build_object('statut', 'a_faire', 'priorite', 'moyenne', 'mission', jsonb_build_object('id', m.id, 'cle', m.cle, 'titre', m.titre, 'recurrence', m.recurrence)));
        n := n + 1;
      end if;
    end if;
    -- La suivante, même si celle-ci n'a pas pu être posée (pas d'agent allumé).
    update public.legion_missions
       set prochaine = (select min(d)::date from generate_series(m.prochaine::timestamp, (current_date + interval '400 days')::timestamp, pas) d where d::date > current_date)
     where id = m.id;
  end loop;
  return n;
end $$;
revoke all on function public.legion_missions_du_jour() from public, anon, authenticated;

select cron.unschedule('legion-missions') where exists (select 1 from cron.job where jobname = 'legion-missions');
select cron.schedule('legion-missions', '0 5 * * *', $$select public.legion_missions_du_jour()$$);
