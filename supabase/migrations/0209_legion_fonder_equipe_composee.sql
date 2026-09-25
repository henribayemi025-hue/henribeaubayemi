-- 0209 — Fonder avec une équipe COMPOSÉE À LA MAIN.
--
-- Beau, 25/09 (audit de Léo), sur la page Fonder : « les 71 rôles doivent
-- être cliquables : voir, ajouter, retirer, en définir par prompt, envoyer
-- un fichier ». Jusqu'ici la fondation prenait les postes du modèle tels
-- quels. Cette signature de legion_creer_entreprise reçoit en plus la liste
-- des postes choisis (p_postes, tableau JSON) : ce que la personne a gardé,
-- retiré, ajouté ou réécrit sur l'écran, dans l'ordre où elle le voit.
-- Sans p_postes (null ou vide), rien ne change : les postes du modèle.
--
-- Additive : une signature de plus ; les deux anciennes restent et
-- l'ancienne à cinq paramètres passe par celle-ci.

create or replace function public.legion_creer_entreprise(
  p_nom text, p_modele text, p_taille text, p_projet text, p_effectif integer, p_postes jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
-- Les variables portent des noms de colonnes (cle, poste): en cas de doute,
-- c'est la variable qui gagne. Sans ça, `a.cle = cle` est « ambigu ».
#variable_conflict use_variable
declare
  eid uuid;
  rang int := 0;
  p record;
  prenoms text[] := array['Amara','Nadia','Kofi','Léa','Yannick','Sarah','Malik','Inès','Tomas','Aïcha',
                          'Jules','Fatou','Elias','Chloé','Rayan','Nora','Idris','Maya','Samuel','Zoé',
                          'Omar','Lina','Noah','Adaeze','Ismaël','Salomé','Kwame','Élise','Bilal','Awa',
                          'Théo','Mariam','Lucas','Yasmine','Adam','Céline','Moussa','Anaïs','Karim','Julie'];
  familles text[] := array['Nkoulou','Diallo','Martin','Tchamba','Benali','Dubois','Okafor','Mensah','Fofana','Leroy',
                           'Abena','Sow','Moreau','Kamga','Haddad','Bernard','Eze','Touré','Girard','Ndiaye',
                           'Petit','Boateng','Roux','Essomba','Koné','Fontaine','Achebe','Camara','Lambert','Owusu'];
  couleurs text[] := array['#C25E38','#2A9D8F','#6366F1','#E09F3E','#8B5CF6','#38BDF8','#FB7185','#34D399'];
  tailles text[] := array['cocon','startup','scaleup','megacorp'];
  niveau int;
  total_poids int;
  postes_count int;
  restant int;
  n_ici int;
  poids_cum int := 0;
  alloue int := 0;
  i int;
  v_cle text;
  v_base_cle text;
  nom_complet text;
  equipe jsonb;
  dirs text[] := '{}';
  vus text[] := '{}';
  k text;
begin
  if auth.uid() is null then raise exception 'Il faut être connecté.'; end if;
  -- L'effectif décide de la taille, pas l'inverse. 10 000 est le plafond
  -- annoncé par Beau; au-delà on refuse plutôt que de créer un monstre.
  p_effectif := greatest(1, least(coalesce(p_effectif, 0), 10000));
  p_taille := case
    when p_effectif <= 5 then 'cocon'
    when p_effectif <= 40 then 'startup'
    when p_effectif <= 300 then 'scaleup'
    else 'megacorp' end;
  niveau := array_position(tailles, p_taille);

  -- L'ÉQUIPE : celle composée à la main quand elle est donnée. Nettoyée
  -- comme le fait legion-modele pour un modèle écrit par le moteur :
  -- libellés bornés, un seul directeur par département, jamais deux fois
  -- le même poste, jamais plus de postes que de personnes.
  if p_postes is not null and jsonb_typeof(p_postes) = 'array' and jsonb_array_length(p_postes) > 0 then
    equipe := '[]'::jsonb;
    for p in
      select left(btrim(coalesce(e.v->>'departement', '')), 60) as departement,
             left(btrim(coalesce(e.v->>'poste', '')), 80) as poste,
             left(btrim(coalesce(e.v->>'mandat', '')), 300) as mandat,
             (coalesce(e.v->>'est_directeur', '') in ('true', 't', '1')) as est_directeur,
             case when coalesce(e.v->>'poids', '') ~ '^[0-9]{1,3}$' then greatest(1, least(8, (e.v->>'poids')::int)) else 1 end as poids,
             nullif(left(btrim(coalesce(e.v->>'agent_cle', '')), 80), '') as agent_cle,
             (coalesce(e.v->>'a_ecrire', '') in ('true', 't', '1')) as a_ecrire,
             e.ord
        from jsonb_array_elements(p_postes) with ordinality as e(v, ord)
       order by e.ord
    loop
      if p.poste = '' or p.departement = '' then continue; end if;
      k := lower(p.poste);
      if k = any(vus) then continue; end if;
      vus := vus || k;
      equipe := equipe || jsonb_build_array(jsonb_build_object(
        'departement', p.departement,
        'poste', p.poste,
        'mandat', case when p.mandat = '' then p.poste || '.' else p.mandat end,
        'est_directeur', p.est_directeur and not (lower(p.departement) = any(dirs)),
        'poids', p.poids,
        'agent_cle', p.agent_cle,
        'a_ecrire', p.a_ecrire,
        'ordre', p.ord));
      if p.est_directeur and not (lower(p.departement) = any(dirs)) then dirs := dirs || lower(p.departement); end if;
      exit when jsonb_array_length(equipe) >= p_effectif;
    end loop;
  end if;

  -- Sinon, les postes du modèle à ce niveau. Jamais plus de postes que de
  -- personnes: une entreprise de 150 n'ouvre pas 238 métiers, elle prend
  -- les 150 premiers (les directeurs d'abord).
  if equipe is null or jsonb_array_length(equipe) = 0 then
    select coalesce(jsonb_agg(jsonb_build_object(
             'departement', mp.departement, 'poste', mp.poste, 'mandat', mp.mandat,
             'est_directeur', mp.est_directeur, 'poids', mp.poids, 'agent_cle', mp.agent_cle,
             'a_ecrire', mp.a_ecrire, 'ordre', mp.ordre) order by mp.ordre), '[]'::jsonb)
      into equipe
      from (select * from public.studio_modele_postes mp
             where mp.modele = p_modele and array_position(tailles, mp.des_la_taille) <= niveau
             order by mp.ordre limit p_effectif) mp;
  end if;

  insert into public.legion_entreprises (nom, modele, taille, projet, owner_id)
  values (btrim(p_nom), p_modele, p_taille, p_projet, auth.uid())
  returning id into eid;

  insert into public.legion_agents (entreprise_id, cle, nom, poste, mandat, emoji, couleur, user_id, ordre)
  values (eid, 'fondateur', coalesce((select name from public.profiles where id = auth.uid()), 'Toi'),
          'Fondateur', 'Tranche. Rien ne se fait contre.', '👑', '#E09F3E', auth.uid(), 1);

  -- Le poids total des non-directeurs, pour répartir le reste de l'effectif.
  select count(*), coalesce(sum(case when (e.v->>'est_directeur')::boolean then 0 else (e.v->>'poids')::int end), 0)
    into postes_count, total_poids
    from jsonb_array_elements(equipe) as e(v);

  -- Ce qui reste à répartir une fois chaque poste tenu par une personne.
  restant := greatest(0, p_effectif - postes_count);

  for p in
    select e.v->>'departement' as departement,
           e.v->>'poste' as poste,
           e.v->>'mandat' as mandat,
           (e.v->>'est_directeur')::boolean as est_directeur,
           (e.v->>'poids')::int as poids,
           e.v->>'agent_cle' as agent_cle,
           coalesce((e.v->>'a_ecrire')::boolean, false) as a_ecrire,
           coalesce((e.v->>'ordre')::int, e.ord::int) as ordre
      from jsonb_array_elements(equipe) with ordinality as e(v, ord)
     order by e.ord
  loop
    -- Un directeur est seul. Les autres reçoivent leur part du reste,
    -- au prorata de leur poids. Toujours au moins une personne par poste.
    -- Le cumul évite de perdre des gens aux arrondis: la somme fait
    -- exactement l'effectif demandé.
    if p.est_directeur or total_poids = 0 then
      n_ici := 1;
    else
      poids_cum := poids_cum + p.poids;
      n_ici := 1 + (restant * poids_cum) / total_poids - alloue;
      alloue := alloue + n_ici - 1;
    end if;
    v_base_cle := left(regexp_replace(lower(translate(p.poste, 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc')), '[^a-z0-9]+', '-', 'g'), 36);
    if v_base_cle = '' then v_base_cle := 'poste'; end if;
    for i in 1..n_ici loop
      rang := rang + 1;
      v_cle := case when i = 1 then v_base_cle else v_base_cle || '-' || i end;
      if exists (select 1 from public.legion_agents a where a.entreprise_id = eid and a.cle = v_cle) then
        v_cle := v_cle || '-' || rang;
      end if;
      -- Prénom et nom: 40 × 30 = 1 200 combinaisons; au-delà, un chiffre.
      nom_complet := prenoms[1 + (rang * 7 + length(p.poste)) % array_length(prenoms, 1)]
                  || ' ' || familles[1 + (rang * 11 + i) % array_length(familles, 1)];
      if rang > 1200 then nom_complet := nom_complet || ' ' || (rang / 1200 + 1); end if;
      insert into public.legion_agents
        (entreprise_id, cle, nom, poste, departement, mandat, avatar_url, couleur,
         catalogue_cle, est_directeur, actif, ordre)
      values
        (eid, v_cle, nom_complet, p.poste, p.departement, p.mandat,
         'https://api.dicebear.com/9.x/notionists/svg?seed=' || eid::text || '-' || v_cle,
         couleurs[1 + rang % array_length(couleurs, 1)],
         p.agent_cle, p.est_directeur and i = 1,
         not p.a_ecrire,
         10 + p.ordre);
    end loop;
  end loop;

  insert into public.legion_canaux (entreprise_id, cle, nom, a_quoi_ca_sert, emoji, ordre)
  values (eid, 'direction', 'Direction', 'Ce qui attend une décision du fondateur.', '🎯', 1);
  insert into public.legion_canaux (entreprise_id, cle, nom, a_quoi_ca_sert, emoji, ordre)
  select eid, left(regexp_replace(lower(translate(d.departement, 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc')), '[^a-z0-9]+', '-', 'g'), 40),
         d.departement, 'Le travail du département ' || d.departement || '.', '💬', 10 + row_number() over ()
    from (select distinct la.departement from public.legion_agents la
           where la.entreprise_id = eid and la.departement is not null and la.departement <> 'Direction') d
  on conflict do nothing;

  insert into public.legion_messages (entreprise_id, canal_id, auteur_id, texte, genre)
  select eid, c.id, a.id,
         'Bonjour. Je suis ' || a.nom || ', ' || lower(a.poste) || '. L''équipe est en place — ' ||
         (select count(*) from public.legion_agents x where x.entreprise_id = eid and x.user_id is null and x.actif) ||
         ' personnes en service, ' ||
         (select count(distinct x.poste) from public.legion_agents x where x.entreprise_id = eid and x.user_id is null) ||
         ' métiers' ||
         case when (select count(*) from public.legion_agents x where x.entreprise_id = eid and not x.actif) > 0
              then ', et ' || (select count(*) from public.legion_agents x where x.entreprise_id = eid and not x.actif) || ' postes encore à pourvoir'
              else '' end ||
         '. Dis-nous en une phrase ce que tu veux obtenir cette semaine, et on se répartit le travail.',
         'question'
    from public.legion_canaux c
    join public.legion_agents a on a.entreprise_id = eid and a.est_directeur and a.user_id is null
   where c.entreprise_id = eid and c.cle = 'direction'
   order by a.ordre limit 1;

  return eid;
end;
$$;

revoke execute on function public.legion_creer_entreprise(text, text, text, text, integer, jsonb) from public;
revoke execute on function public.legion_creer_entreprise(text, text, text, text, integer, jsonb) from anon;
grant execute on function public.legion_creer_entreprise(text, text, text, text, integer, jsonb) to authenticated;

-- L'ancienne signature à cinq paramètres passe par la nouvelle, sans équipe
-- composée : exactement ce qu'elle faisait.
create or replace function public.legion_creer_entreprise(
  p_nom text, p_modele text, p_taille text, p_projet text, p_effectif integer
) returns uuid language sql security definer set search_path = public as $$
  select public.legion_creer_entreprise(p_nom, p_modele, p_taille, p_projet, p_effectif, null::jsonb);
$$;
