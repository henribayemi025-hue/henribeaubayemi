-- L'EFFECTIF SE CHOISIT, et il y a plus de cent métiers.
--
-- Beau, 22/09: « pourquoi juste 21 agents ? Moi je vise 1 200 ou 10 000,
-- c'est à moi de choisir selon ma taille, mon entreprise. Aussi plus de 100
-- métiers. »
--
-- Deux choses qu'il faut distinguer, parce qu'elles n'ont pas le même coût:
--   - le NOMBRE DE MÉTIERS (postes distincts): il vient du catalogue. Chaque
--     agent réel copié de GitHub est un métier qu'on peut tenir. On les
--     rattache aux modèles par famille;
--   - l'EFFECTIF (combien de personnes): un nombre libre, réparti sur les
--     postes. Une entreprise de 1 200 n'a pas 1 200 métiers, elle a 100
--     métiers et 12 personnes par métier en moyenne. Les directeurs restent
--     seuls; les autres se multiplient.
--
-- Additif: une colonne de poids, une fonction de plus (l'ancienne reste).

alter table public.studio_modele_postes add column if not exists poids integer not null default 1;

-- ---------------------------------------------------------------------------
-- 1. Cent métiers et plus, rattachés aux modèles depuis le catalogue réel
-- ---------------------------------------------------------------------------
-- On ne prend que les AGENTS (pas les compétences: une compétence est un
-- savoir-faire, pas une personne). Un agent du catalogue rejoint le modèle
-- dont sa famille relève, et n'apparaît qu'à partir de « scale-up » pour que
-- les petites entreprises restent petites.
insert into public.studio_modele_postes (modele, departement, poste, mandat, agent_cle, a_ecrire, des_la_taille, est_directeur, ordre, poids)
select
  m.modele, m.departement,
  initcap(replace(replace(c.cle, '-', ' '), '_', ' ')) as poste,
  c.description as mandat,
  c.cle, false, 'scaleup', false, 500 + row_number() over (order by c.cle), 1
from public.studio_catalogue c
join lateral (
  select * from (values
    -- produit & technique
    ('engineering','produit','Ingénierie'), ('language-specialists','produit','Ingénierie'),
    ('backend-development','produit','Ingénierie'), ('core-development','produit','Ingénierie'),
    ('infrastructure','produit','Infrastructure'), ('cloud-infrastructure','produit','Infrastructure'),
    ('kubernetes-operations','produit','Infrastructure'), ('developer-experience','produit','Ingénierie'),
    ('quality-security','produit','Qualité'), ('security-scanning','produit','Qualité'),
    ('data-ai','produit','Données'), ('machine-learning-ops','produit','Données'),
    ('llm-application-dev','produit','IA'), ('agent-orchestration','produit','IA'),
    ('ui-design','produit','Produit'), ('product','produit','Produit'), ('business-product','produit','Produit'),
    ('database-design','produit','Ingénierie'), ('api-scaffolding','produit','Ingénierie'),
    ('full-stack-orchestration','produit','Ingénierie'), ('multi-platform-apps','produit','Ingénierie'),
    ('specialized-domains','produit','Ingénierie'), ('meta-orchestration','produit','Direction'),
    -- croissance
    ('marketing','croissance','Marketing'), ('content-marketing','croissance','Contenu'),
    ('seo-technical-optimization','croissance','Acquisition'), ('seo-analysis-monitoring','croissance','Acquisition'),
    ('social-publishing','croissance','Réseaux'), ('customer-sales-automation','croissance','Ventes'),
    ('brand-landingpage','croissance','Acquisition'),
    -- conseil
    ('c-level','conseil','Direction'), ('business-analytics','conseil','Analyse'),
    ('business-operations','conseil','Opérations'), ('project-management','conseil','Opérations'),
    ('personas','conseil','Direction'), ('startup-business-analyst','conseil','Finance'),
    -- marché
    ('quantitative-trading','marche','Quantitatif'), ('finance','marche','Finance'),
    -- juridique
    ('compliance','juridique','Conformité'), ('hr-legal-compliance','juridique','Contrats'),
    ('accessibility-compliance','juridique','Conformité'),
    -- recherche
    ('research','recherche','Méthode'), ('research-analysis','recherche','Méthode'),
    ('ra-qm','recherche','Qualité')
  ) as t(categorie, modele, departement)
  where t.categorie = c.categorie
) m on true
where c.genre = 'agent'
  and not exists (
    select 1 from public.studio_modele_postes p where p.modele = m.modele and p.agent_cle = c.cle
  );

-- ---------------------------------------------------------------------------
-- 2. Fonder avec un EFFECTIF libre
-- ---------------------------------------------------------------------------
create or replace function public.legion_creer_entreprise(
  p_nom text, p_modele text, p_taille text, p_projet text, p_effectif integer
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

  insert into public.legion_entreprises (nom, modele, taille, projet, owner_id)
  values (btrim(p_nom), p_modele, p_taille, p_projet, auth.uid())
  returning id into eid;

  insert into public.legion_agents (entreprise_id, cle, nom, poste, mandat, emoji, couleur, user_id, ordre)
  values (eid, 'fondateur', coalesce((select name from public.profiles where id = auth.uid()), 'Toi'),
          'Fondateur', 'Tranche. Rien ne se fait contre.', '👑', '#E09F3E', auth.uid(), 1);

  -- Les postes disponibles à ce niveau, et le poids total des non-directeurs.
  -- Jamais plus de postes que de personnes: une entreprise de 150 n'ouvre
  -- pas 238 métiers, elle prend les 150 premiers (les directeurs d'abord).
  select count(*), coalesce(sum(case when mp.est_directeur then 0 else mp.poids end), 0)
    into postes_count, total_poids
    from (select * from public.studio_modele_postes mp
           where mp.modele = p_modele and array_position(tailles, mp.des_la_taille) <= niveau
           order by mp.ordre limit p_effectif) mp;

  -- Ce qui reste à répartir une fois chaque poste tenu par une personne.
  restant := greatest(0, p_effectif - postes_count);

  for p in
    select * from public.studio_modele_postes mp
     where mp.modele = p_modele and array_position(tailles, mp.des_la_taille) <= niveau
     order by mp.ordre limit p_effectif
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

revoke execute on function public.legion_creer_entreprise(text, text, text, text, integer) from public;
revoke execute on function public.legion_creer_entreprise(text, text, text, text, integer) from anon;
grant execute on function public.legion_creer_entreprise(text, text, text, text, integer) to authenticated;

-- L'ancienne signature reste et passe par la nouvelle, avec l'effectif de la taille.
create or replace function public.legion_creer_entreprise(
  p_nom text, p_modele text, p_taille text, p_projet text
) returns uuid language sql security definer set search_path = public as $$
  select public.legion_creer_entreprise(p_nom, p_modele, p_taille, p_projet,
    case p_taille when 'cocon' then 3 when 'startup' then 25 when 'scaleup' then 150 else 1500 end);
$$;
