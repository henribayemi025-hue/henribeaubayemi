-- m-16, étape 2 (audit du 01/10) : les fonctions SQL de la place de marché
-- lisent leurs jetons dans le coffre (public.app_secret, migration 0228) au
-- lieu de la table en clair public.app_secrets.
--
-- 17 fonctions, toutes SECURITY DEFINER (propriétaire postgres : elles
-- peuvent appeler app_secret, réservée au serveur). Les 2 d'Accounting
-- (lancer_accounting_rappels, lancer_finia_apprentissage) sont laissées à
-- Claudinette.
--
-- Méthode : chaque définition actuelle est relue telle quelle et seule la
-- lecture du jeton est remplacée ; CREATE OR REPLACE garde les droits. Si un
-- remplacement ne prend pas, ou si une fonction lit encore app_secrets, la
-- migration s'arrête et RIEN n'est appliqué.
--
-- La table app_secrets n'est ni vidée ni supprimée (migrations additives) ;
-- le déclencheur de 0228 continue de recopier toute modification dans le
-- coffre. Retirer l'accès direct à la table viendra après les fonctions edge.

do $$
declare
  noms text[] := array[
    'lancer_chat_autoreply', 'lancer_chat_moderation', 'lancer_inspection_contenus',
    'lancer_legion_examen', 'lancer_legion_flux', 'lancer_legion_former', 'lancer_legion_rapport',
    'lancer_legion_travail', 'lancer_legion_urgences', 'lancer_legion_veilleur',
    'legion_generer_modele', 'legion_journal_ajouter', 'legion_reveiller_les_agents',
    'legion_verifier_journal', 'push_notify', 'ia_empreinte', 'legion_jeton_travail_valide'
  ];
  f record;
  avant text;
  apres text;
  n int := 0;
begin
  for f in
    select p.oid, p.proname
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.prokind = 'f' and p.proname = any (noms)
  loop
    avant := pg_get_functiondef(f.oid);
    if f.proname = 'ia_empreinte' then
      apres := replace(avant, 's.value || ', 'public.app_secret(''ia_apprentissage_sel'') || ');
      apres := regexp_replace(apres, '\s*from public\.app_secrets s where s\.name = ''ia_apprentissage_sel''', '');
    elsif f.proname = 'legion_jeton_travail_valide' then
      apres := regexp_replace(avant,
        'exists \(\s*select 1 from public\.app_secrets where name = ''legion_travail'' and value = p_jeton\s*\)',
        'public.app_secret(''legion_travail'') = p_jeton');
    else
      apres := regexp_replace(avant,
        'select value into (\w+) from public\.app_secrets where name = ''([a-z_0-9]+)'';',
        '\1 := public.app_secret(''\2'');', 'g');
    end if;

    if apres = avant or apres ~ 'app_secrets' then
      raise exception 'm-16 : remplacement incomplet dans %, rien n''est appliqué', f.proname;
    end if;
    execute apres;
    n := n + 1;
  end loop;

  if n <> array_length(noms, 1) then
    raise exception 'm-16 : % fonctions trouvées sur %, rien n''est appliqué', n, array_length(noms, 1);
  end if;
end $$;
