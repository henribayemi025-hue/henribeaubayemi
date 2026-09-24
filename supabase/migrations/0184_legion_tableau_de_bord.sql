-- LEGION — le tableau de bord (idées 2, 8, 14, 21, 42, 54, 60, 66, 71, 73,
-- 115 des 200, 24/09).
--
-- Tout est COMPTÉ dans la base, rien n'est estimé par un modèle : réponses,
-- livrables, tâches faites / ouvertes / bloquées / immobiles / renvoyées,
-- relectures et corrections, activité par jour et par département, ce que
-- chaque agent a coûté (meta.cout_eur, noté sur chaque message depuis le
-- 24/09), et les étapes de la feuille de route franchies.
--
-- Additive : une colonne (le budget du mois d'un agent, vide = pas de
-- budget), deux fonctions.

alter table public.legion_agents add column if not exists plafond_mois_eur numeric;

-- Ce qu'un agent a coûté ce mois-ci. Pour les fonctions (service), qui
-- s'arrêtent quand son budget est atteint.
create or replace function public.legion_depense_agent(p_agent uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(sum((meta->>'cout_eur')::numeric), 0)
    from public.legion_messages
   where auteur_id = p_agent
     and created_at >= date_trunc('month', now())
     and meta ? 'cout_eur';
$$;
revoke all on function public.legion_depense_agent(uuid) from public, anon, authenticated;

create or replace function public.legion_tableau_de_bord(p_entreprise uuid, p_jours integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_debut timestamptz := now() - make_interval(days => least(greatest(coalesce(p_jours, 30), 1), 120));
  v_mois timestamptz := date_trunc('month', now());
  v jsonb;
begin
  if not public.legion_est_membre(p_entreprise) then return null; end if;

  with ag as (
    select a.id, a.nom, a.departement, a.actif, a.plafond_mois_eur, a.fin_mission, a.created_at
      from public.legion_agents a
     where a.entreprise_id = p_entreprise and a.user_id is null and a.moteur <> 'claude-code'
  ),
  m as (
    select id, auteur_id, genre, meta, created_at
      from public.legion_messages
     where entreprise_id = p_entreprise and user_id is null and genre <> 'tache' and created_at >= v_debut
  ),
  t as (
    select id, assigne_a, meta, created_at, termine_le,
           coalesce(meta->>'statut', 'a_faire') as statut
      from public.legion_messages
     where entreprise_id = p_entreprise and genre = 'tache'
  ),
  par_agent as (
    select ag.id, jsonb_build_object(
      'id', ag.id, 'nom', ag.nom, 'departement', ag.departement, 'actif', ag.actif,
      'plafond_mois_eur', ag.plafond_mois_eur, 'fin_mission', ag.fin_mission,
      'reponses', (select count(*) from m where m.auteur_id = ag.id and m.meta->>'par_ia' = 'true' and not (m.meta ? 'livrable') and not (m.meta ? 'reunion') and not (m.meta ? 'plan') and not (m.meta ? 'rapport')),
      'livrables', (select count(*) from m where m.auteur_id = ag.id and m.meta ? 'livrable'),
      'plans', (select count(*) from m where m.auteur_id = ag.id and m.meta ? 'plan'),
      'reunions', (select count(*) from m where m.auteur_id = ag.id and m.meta->'reunion' ? 'tour'),
      'relues', (select count(*) from m where m.auteur_id = ag.id and m.meta ? 'relu'),
      'corrigees', (select count(*) from m where m.auteur_id = ag.id and m.meta->'relu'->>'corrige' = 'true'),
      'debloques', (select count(*) from m where m.auteur_id = ag.id and m.meta->'livrable'->>'debloque' = 'true'),
      'cout_eur', (select round(coalesce(sum((m.meta->>'cout_eur')::numeric), 0), 4) from m where m.auteur_id = ag.id and m.meta ? 'cout_eur'),
      'cout_mois_eur', round(public.legion_depense_agent(ag.id), 4),
      'taches_faites', (select count(*) from t where t.assigne_a = ag.id and t.termine_le >= v_debut),
      'validees', (select count(*) from t where t.assigne_a = ag.id and t.termine_le >= v_debut and t.meta ? 'livre_le'),
      'renvoyees', (select count(*) from t where t.assigne_a = ag.id and t.meta ? 'renvoye_le' and (t.meta->>'renvoye_le')::timestamptz >= v_debut),
      'ouvertes', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is null and t.statut <> 'fait'),
      'en_revue', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is null and t.statut = 'revue'),
      'bloquees', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is null and t.statut <> 'fait' and t.meta ? 'bloque' and not (t.meta ? 'debloque_le')),
      'immobiles', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is null and t.statut = 'a_faire' and t.created_at < now() - interval '7 days'),
      'revue_longue', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is null and t.statut = 'revue' and coalesce((t.meta->>'livre_le')::timestamptz, t.created_at) < now() - interval '2 days'),
      'livrables_total', (select count(*) from public.legion_messages x where x.auteur_id = ag.id and x.meta ? 'livrable'),
      'validees_total', (select count(*) from t where t.assigne_a = ag.id and t.termine_le is not null and t.meta ? 'livre_le'),
      'relais_total', (select count(*) from t where t.meta->'suite_de'->>'par' = ag.nom),
      'derniere', (select max(x.created_at) from public.legion_messages x where x.auteur_id = ag.id),
      'jours_actifs', (select count(distinct date_trunc('day', m.created_at)) from m where m.auteur_id = ag.id)
    ) as j
    from ag
  )
  select jsonb_build_object(
    'jours', extract(day from now() - v_debut)::int,
    'depuis', v_debut,
    'agents', coalesce((select jsonb_agg(j order by j->>'departement', j->>'nom') from par_agent), '[]'::jsonb),
    'activite', coalesce((
      select jsonb_agg(jsonb_build_object('jour', jour, 'departement', departement, 'n', n) order by jour)
        from (select date_trunc('day', m.created_at)::date as jour, coalesce(ag.departement, '?') as departement, count(*) as n
                from m join ag on ag.id = m.auteur_id group by 1, 2) x), '[]'::jsonb),
    'mois_eur', coalesce((select round(sum(cost_eur)::numeric, 4) from public.ai_usage where entreprise_id = p_entreprise and created_at >= v_mois), 0),
    'plafond_eur', (select plafond_mois_eur from public.legion_entreprises where id = p_entreprise),
    'etapes', coalesce((
      select jsonb_agg(jsonb_build_object('titre', f.titre, 'horizon', f.horizon, 'fait_le', f.fait_le, 'responsable', f.responsable) order by f.fait_le desc)
        from public.legion_feuille f where f.entreprise_id = p_entreprise and f.fait), '[]'::jsonb),
    'etapes_total', (select count(*) from public.legion_feuille f where f.entreprise_id = p_entreprise)
  ) into v;
  return v;
end $$;
revoke all on function public.legion_tableau_de_bord(uuid, integer) from public, anon;
grant execute on function public.legion_tableau_de_bord(uuid, integer) to authenticated;
