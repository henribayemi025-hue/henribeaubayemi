-- 0180 — « Se connecter avec Finjaro Accounting » (23/09).
--
-- Une entreprise Legion branche SON espace de Finjaro Accounting ; ses agents
-- lisent les chiffres de ses livres : le résumé d'un mois, les ventes d'une
-- période, les dépenses par catégorie, les impayés. Des TOTAUX, jamais une
-- ligne de client ni un nom de fournisseur.
--
-- La lecture passe par les quatre fonctions que Claudinette (Accounting) a
-- écrites pour cela : finia_resume_mois, finia_ventes_periode,
-- finia_depenses_categorie, finia_impayes. Legion ne lit pas les tables
-- d'Accounting ; il appelle ses fonctions, et vérifie l'appartenance avec
-- finia_is_member — la règle d'Accounting, pas une copie.
--
-- L'appartenance est revérifiée à CHAQUE lecture, pour la personne qui a
-- branché : si elle quitte l'espace Accounting, les agents ne lisent plus rien.
--
-- Tout est AJOUTÉ : un type de connecteur, deux fonctions.

alter table public.legion_connecteurs drop constraint if exists legion_connecteurs_type_check;
alter table public.legion_connecteurs add constraint legion_connecteurs_type_check
  check (type = any (array['finjaro-mesures', 'finjaro-boutique', 'github', 'google', 'finjaro-accounting']));

-- Brancher (ou débrancher) SON espace : membre de l'entreprise Legion ET
-- membre de l'espace Accounting. Le nom est recopié pour l'affichage.
create or replace function public.legion_brancher_comptabilite(p_entreprise uuid, p_espace uuid, p_nom text default null, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.legion_est_membre(p_entreprise) then
    raise exception 'Pas membre de cette entreprise.';
  end if;
  if p_actif and not public.finia_is_member(p_espace) then
    raise exception 'Cet espace Accounting n''est pas le tien.';
  end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, 'finjaro-accounting', p_actif, auth.uid(),
          jsonb_build_object('espace_id', p_espace, 'nom', left(coalesce(nullif(btrim(p_nom), ''), 'Finjaro Accounting'), 80)))
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par,
        config = case when excluded.actif then excluded.config else public.legion_connecteurs.config end;
end $$;
revoke all on function public.legion_brancher_comptabilite(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.legion_brancher_comptabilite(uuid, uuid, text, boolean) to authenticated;

-- Les outils de lecture, pour les fonctions du serveur SEULEMENT. On part de
-- l'entreprise Legion (pas d'un identifiant d'espace fourni par l'appelant) :
-- seul l'espace branché par un membre se lit.
create or replace function public.legion_outil_comptabilite(p_nom text, p_params jsonb, p_entreprise uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_c record;
  v_email text;
  v_membre boolean;
  v_avant text := current_setting('request.jwt.claims', true);
  v_jours int;
  v_mois date;
begin
  v_jours := least(366, greatest(1, coalesce(round((p_params ->> 'jours')::numeric)::int, 30)));
  select c.config, c.branche_par into v_c from public.legion_connecteurs c
   where c.entreprise_id = p_entreprise and c.type = 'finjaro-accounting' and c.actif;
  if v_c.config is null or v_c.config ->> 'espace_id' is null then
    return jsonb_build_object('erreur', 'aucune comptabilité branchée');
  end if;

  -- La personne qui a branché est-elle toujours membre de l'espace ? On pose
  -- son identité le temps de la question, pour que finia_is_member réponde
  -- avec la règle d'Accounting, puis on remet ce qui était là.
  select u.email into v_email from auth.users u where u.id = v_c.branche_par;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_c.branche_par, 'email', coalesce(v_email, ''), 'role', 'authenticated')::text, true);
  v_membre := public.finia_is_member((v_c.config ->> 'espace_id')::uuid);
  perform set_config('request.jwt.claims', coalesce(v_avant, ''), true);
  if not coalesce(v_membre, false) then
    return jsonb_build_object('erreur', 'la personne qui a branché cette comptabilité n''en est plus membre');
  end if;

  case p_nom
    when 'resume_mois' then
      v_mois := coalesce(to_date(nullif(p_params ->> 'mois', '') || '-01', 'YYYY-MM-DD'), date_trunc('month', current_date)::date);
      return public.finia_resume_mois((v_c.config ->> 'espace_id')::uuid, v_mois);
    when 'ventes' then
      return public.finia_ventes_periode((v_c.config ->> 'espace_id')::uuid, current_date - v_jours, current_date)
        || jsonb_build_object('du', to_char(current_date - v_jours, 'YYYY-MM-DD'), 'au', to_char(current_date, 'YYYY-MM-DD'));
    when 'depenses' then
      return jsonb_build_object(
        'devise', public.finia_devise_espace((v_c.config ->> 'espace_id')::uuid),
        'du', to_char(current_date - v_jours, 'YYYY-MM-DD'), 'au', to_char(current_date, 'YYYY-MM-DD'),
        'par_categorie', coalesce((select jsonb_agg(jsonb_build_object('categorie', d.categorie, 'total', d.total))
          from public.finia_depenses_categorie((v_c.config ->> 'espace_id')::uuid, current_date - v_jours, current_date) d), '[]'::jsonb));
    when 'impayes' then
      return public.finia_impayes((v_c.config ->> 'espace_id')::uuid);
    else
      return jsonb_build_object('erreur', 'outil inconnu: ' || p_nom);
  end case;
exception when others then
  perform set_config('request.jwt.claims', coalesce(v_avant, ''), true);
  return jsonb_build_object('erreur', left(sqlerrm, 200));
end $$;
revoke all on function public.legion_outil_comptabilite(text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.legion_outil_comptabilite(text, jsonb, uuid) to service_role;
