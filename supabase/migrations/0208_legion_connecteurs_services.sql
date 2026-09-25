-- Connecteurs Supabase, Cloudflare et Vercel, PAR ENTREPRISE (Beau, 25/09 :
-- « connecter son truc avec Cloudflare, Vercel, Supabase… pour tout le
-- monde, pas seulement pour moi »).
--
-- Comme le connecteur GitHub (0169) : le jeton va au coffre de Supabase
-- (vault), jamais dans une table ; l'application ne peut jamais le relire ;
-- seules les fonctions du serveur l'ouvrent au moment de lire. Les agents ne
-- font que LIRE (requêtes GET), jamais écrire chez le service.
--
-- Additive : la liste des types s'élargit (elle garde tous les anciens), et
-- trois fonctions.

alter table public.legion_connecteurs drop constraint if exists legion_connecteurs_type_check;
alter table public.legion_connecteurs add constraint legion_connecteurs_type_check
  check (type = any (array['finjaro-mesures', 'finjaro-boutique', 'github', 'google', 'finjaro-accounting', 'rss', 'linear', 'jira', 'supabase', 'cloudflare', 'vercel']));

-- Brancher, mettre à jour ou débrancher. p_config ne garde que les champs
-- attendus, vérifiés ; le jeton (facultatif si déjà gardé) part au coffre.
create or replace function public.legion_brancher_service(p_entreprise uuid, p_type text, p_config jsonb, p_jeton text default null, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_nom text := 'legion_' || p_type || '_' || p_entreprise::text;
        v_secret uuid;
        v_config jsonb;
        v_id text;
begin
  if p_type not in ('supabase', 'cloudflare', 'vercel') then raise exception 'Connecteur inconnu.'; end if;
  if not public.legion_peut_agir(p_entreprise) then raise exception 'Il faut être membre (pas lecteur) de cette entreprise.'; end if;
  if p_type = 'supabase' then
    v_id := lower(trim(coalesce(p_config->>'projet', '')));
    v_id := regexp_replace(v_id, '^https?://([a-z0-9]+)\.supabase\.co.*$', '\1');
    if p_actif and v_id !~ '^[a-z0-9]{20}$' then raise exception 'L''identifiant du projet Supabase fait 20 lettres et chiffres (Réglages du projet → Général).'; end if;
    v_config := jsonb_build_object('projet', v_id);
  elsif p_type = 'cloudflare' then
    v_id := lower(trim(coalesce(p_config->>'compte', '')));
    if p_actif and v_id !~ '^[0-9a-f]{32}$' then raise exception 'L''identifiant de compte Cloudflare fait 32 caractères (tableau de bord → à droite de la page d''accueil d''un domaine, ou Workers → Vue d''ensemble).'; end if;
    v_config := jsonb_build_object('compte', v_id);
  else
    v_id := trim(coalesce(p_config->>'equipe', ''));
    if v_id <> '' and v_id !~ '^[A-Za-z0-9_-]{2,64}$' then raise exception 'L''identifiant d''équipe Vercel ne contient que des lettres, chiffres, - et _ (Réglages de l''équipe → Général).'; end if;
    v_config := jsonb_build_object('equipe', nullif(v_id, ''));
  end if;
  select id into v_secret from vault.secrets where name = v_nom;
  if coalesce(trim(p_jeton), '') <> '' then
    if length(trim(p_jeton)) > 400 then raise exception 'Ce jeton est trop long.'; end if;
    if v_secret is null then
      v_secret := vault.create_secret(trim(p_jeton), v_nom, 'Jeton ' || p_type || ' d''une entreprise Léo');
    else
      perform vault.update_secret(v_secret, trim(p_jeton));
    end if;
  end if;
  if p_actif and v_secret is null then raise exception 'Il faut un jeton pour brancher ce service.'; end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, p_type, p_actif, auth.uid(), v_config || jsonb_build_object('avec_jeton', v_secret is not null))
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par,
        config = case when excluded.actif then excluded.config else public.legion_connecteurs.config end;
end $$;
revoke all on function public.legion_brancher_service(uuid, text, jsonb, text, boolean) from public, anon;
grant execute on function public.legion_brancher_service(uuid, text, jsonb, text, boolean) to authenticated;

-- Effacer le jeton (débrancher ne suffit pas quand on veut qu'il disparaisse).
create or replace function public.legion_oublier_jeton_service(p_entreprise uuid, p_type text)
returns void language plpgsql security definer set search_path = public, vault as $$
begin
  if p_type not in ('supabase', 'cloudflare', 'vercel') then raise exception 'Connecteur inconnu.'; end if;
  if not public.legion_peut_agir(p_entreprise) then raise exception 'Il faut être membre (pas lecteur) de cette entreprise.'; end if;
  delete from vault.secrets where name = 'legion_' || p_type || '_' || p_entreprise::text;
  update public.legion_connecteurs set actif = false, config = config || '{"avec_jeton": false}'::jsonb
   where entreprise_id = p_entreprise and type = p_type;
end $$;
revoke all on function public.legion_oublier_jeton_service(uuid, text) from public, anon;
grant execute on function public.legion_oublier_jeton_service(uuid, text) to authenticated;

-- Le jeton en clair, pour les fonctions du serveur SEULEMENT.
create or replace function public.legion_jeton_service(p_entreprise uuid, p_type text)
returns text language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets
   where p_type in ('supabase', 'cloudflare', 'vercel') and name = 'legion_' || p_type || '_' || p_entreprise::text limit 1;
$$;
revoke all on function public.legion_jeton_service(uuid, text) from public, anon, authenticated;
grant execute on function public.legion_jeton_service(uuid, text) to service_role;
