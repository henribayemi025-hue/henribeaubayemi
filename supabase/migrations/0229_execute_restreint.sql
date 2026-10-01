-- C-5 (audit du 01/10) : les fonctions SECURITY DEFINER de public étaient
-- exécutables par tout le monde, visiteurs sans compte compris (51 au
-- 01/10). Chacune avait sa propre garde (auth.uid(), is_admin()), ce qui
-- est juste mais fragile : un oubli dans une seule suffisait.
--
-- Ici, pour chaque fonction SECURITY DEFINER de public (hors déclencheurs,
-- hors extensions, hors finia_* qui sont à Accounting / Claudinette) :
-- - les comptes connectés et le serveur gardent EXACTEMENT ce qu'ils avaient
--   (droit redonné explicitement avant de retirer PUBLIC) ;
-- - les visiteurs sans compte perdent le droit, SAUF pour la liste
--   ci-dessous, qui est ce que l'application appelle réellement sans compte
--   ou ce dont les règles d'accès des tables ont besoin.
-- - legion_jeton_user n'est appelée que par le serveur (legion-mcp, clé de
--   service) : retirée aussi aux comptes connectés.
--
-- Additif au sens de CLAUDE.md : aucune colonne, table ni compte touché. Si
-- une page casse, rendre le droit à la fonction concernée suffit :
--   grant execute on function public.<nom>(<args>) to anon;
--
-- Le contrôle automatique public.audit_fonctions_ouvertes() (en bas) signale
-- toute nouvelle fonction SECURITY DEFINER ouverte aux visiteurs qui n'est
-- pas dans cette liste.

create table if not exists public.fonctions_ouvertes_visiteurs (
  nom    text primary key,
  raison text not null
);
alter table public.fonctions_ouvertes_visiteurs enable row level security;
revoke all on public.fonctions_ouvertes_visiteurs from anon, authenticated;

insert into public.fonctions_ouvertes_visiteurs (nom, raison) values
  -- Règles d'accès (RLS) des tables lisibles sans compte : la fonction est
  -- évaluée avec les droits de la personne qui lit.
  ('is_admin',                    'règles RLS (produits, boutiques…) ; Accounting l''appelle avant connexion'),
  ('owns_shop',                   'règles RLS products, orders, reels, conversations'),
  ('boutique_de_test',            'règle RLS products'),
  ('boutique_de_test_par_id',     'règles RLS shops, reels'),
  ('lien_existant_avec_boutique', 'règle RLS shops'),
  ('in_conversation',             'règle RLS chat_messages'),
  ('is_member',                   'règles RLS projets'),
  ('is_njangi_member',            'règles RLS njangis'),
  ('is_space_member',             'règles RLS espaces partagés'),
  ('legion_est_membre',           'règles RLS Léo et storage'),
  ('legion_peut_agir',            'règles RLS Léo'),
  -- Appelées par l'application sans compte.
  ('increment_product_views',     'fiche article vue par un visiteur'),
  ('increment_reel_view',         'vidéo vue par un visiteur'),
  ('increment_reel_share',        'vidéo partagée par un visiteur'),
  ('place_guest_order',           'commande sans compte'),
  ('suivi_commande',              '« Ma commande » sans compte'),
  ('register_native_push_token',  'notifications avant connexion (ligne anonyme par appareil)'),
  ('get_public_profile',          'profil public'),
  ('get_public_profiles',         'profils publics'),
  ('legion_jeton_travail_valide', 'Worker de l''atelier (clé publique) ; à fermer avec m-6')
on conflict (nom) do update set raison = excluded.raison;

do $$
declare
  f record;
  n_visiteurs int := 0;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosecdef
      and p.prorettype <> 'pg_catalog.trigger'::regtype
      and p.proname not like 'finia\_%'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    -- 1. Ce que les comptes connectés et le serveur avaient, ils le gardent.
    if has_function_privilege('authenticated', f.sig, 'EXECUTE') and f.proname <> 'legion_jeton_user' then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
    execute format('grant execute on function %s to service_role', f.sig);

    -- 2. Plus de droit implicite pour tout le monde.
    execute format('revoke execute on function %s from public', f.sig);

    -- 3. Visiteurs : seulement la liste.
    if exists (select 1 from public.fonctions_ouvertes_visiteurs v where v.nom = f.proname) then
      execute format('grant execute on function %s to anon', f.sig);
    else
      if has_function_privilege('anon', f.sig, 'EXECUTE') then n_visiteurs := n_visiteurs + 1; end if;
      execute format('revoke execute on function %s from anon', f.sig);
    end if;

    if f.proname = 'legion_jeton_user' then
      execute format('revoke execute on function %s from authenticated', f.sig);
    end if;
  end loop;
  raise notice 'C-5 : % fonction(s) fermée(s) aux visiteurs', n_visiteurs;
end $$;

-- Contrôle automatique (audit n° 3) : la liste des fonctions SECURITY DEFINER
-- de public ouvertes aux visiteurs et absentes de la liste. Vide = tout va
-- bien. Réservée au serveur.
create or replace function public.audit_fonctions_ouvertes()
returns table (fonction text, ouverte_a text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.oid::regprocedure::text,
         case when has_function_privilege('anon', p.oid, 'EXECUTE') then 'visiteurs' end
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and p.prosecdef
    and p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
    and p.proname not like 'finia\_%'
    and not exists (select 1 from pg_catalog.pg_depend d where d.objid = p.oid and d.deptype = 'e')
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and not exists (select 1 from public.fonctions_ouvertes_visiteurs v where v.nom = p.proname)
  order by 1;
$$;

revoke all on function public.audit_fonctions_ouvertes() from public, anon, authenticated;
grant execute on function public.audit_fonctions_ouvertes() to service_role;
