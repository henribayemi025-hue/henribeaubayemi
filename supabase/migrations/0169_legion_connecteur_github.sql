-- Le connecteur GitHub de Legion — pour CHAQUE entreprise, avec SON dépôt.
--
-- Beau, 23/09: « le jeton GitHub, n'oublie pas que ce n'est pas juste pour
-- moi: je construis pour tous les utilisateurs et futurs utilisateurs ».
-- Chaque entreprise branche son propre dépôt; ses agents en lisent les
-- derniers changements et les tickets ouverts — jamais ceux d'une autre.
--
-- Le jeton (facultatif pour un dépôt public) est rangé dans le coffre de
-- Supabase (vault), pas dans une table: l'application ne peut jamais le
-- relire. Seules les fonctions du serveur l'ouvrent, au moment de lire.
--
-- Additive: trois fonctions, et la liste des types de connecteurs s'élargit
-- (elle garde les deux anciens et en ajoute deux: github, et google pour le
-- jour où chaque utilisateur branchera son compte Google).

alter table public.legion_connecteurs drop constraint if exists legion_connecteurs_type_check;
alter table public.legion_connecteurs add constraint legion_connecteurs_type_check
  check (type = any (array['finjaro-mesures', 'finjaro-boutique', 'github', 'google']));

create or replace function public.legion_brancher_github(p_entreprise uuid, p_depot text, p_jeton text default null, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public, vault as $$
declare v_depot text := trim(both '/' from regexp_replace(coalesce(p_depot, ''), '^(https?://)?(www\.)?github\.com/', '', 'i'));
        v_nom text := 'legion_github_' || p_entreprise::text;
        v_secret uuid;
begin
  if not public.legion_est_membre(p_entreprise) then raise exception 'Pas membre de cette entreprise.'; end if;
  if p_actif and v_depot !~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' then
    raise exception 'Le dépôt s''écrit « propriétaire/nom », par exemple « finjaro/boutique ».';
  end if;
  select id into v_secret from vault.secrets where name = v_nom;
  if coalesce(trim(p_jeton), '') <> '' then
    if v_secret is null then
      v_secret := vault.create_secret(trim(p_jeton), v_nom, 'Jeton GitHub d''une entreprise Legion');
    else
      perform vault.update_secret(v_secret, trim(p_jeton));
    end if;
  end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par, config)
  values (p_entreprise, 'github', p_actif, auth.uid(), jsonb_build_object('depot', v_depot, 'avec_jeton', v_secret is not null))
  on conflict (entreprise_id, type) do update
    set actif = excluded.actif, branche_par = excluded.branche_par,
        config = case when excluded.actif then excluded.config else public.legion_connecteurs.config end;
end $$;
revoke all on function public.legion_brancher_github(uuid, text, text, boolean) from public, anon;
grant execute on function public.legion_brancher_github(uuid, text, text, boolean) to authenticated;

-- Oublier le jeton (le débrancher ne suffit pas: on peut vouloir l'effacer).
create or replace function public.legion_oublier_jeton_github(p_entreprise uuid)
returns void language plpgsql security definer set search_path = public, vault as $$
begin
  if not public.legion_est_membre(p_entreprise) then raise exception 'Pas membre de cette entreprise.'; end if;
  delete from vault.secrets where name = 'legion_github_' || p_entreprise::text;
  update public.legion_connecteurs set config = config || '{"avec_jeton": false}'::jsonb
   where entreprise_id = p_entreprise and type = 'github';
end $$;
revoke all on function public.legion_oublier_jeton_github(uuid) from public, anon;
grant execute on function public.legion_oublier_jeton_github(uuid) to authenticated;

-- Le jeton en clair, pour les fonctions du serveur SEULEMENT.
create or replace function public.legion_jeton_github(p_entreprise uuid)
returns text language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'legion_github_' || p_entreprise::text limit 1;
$$;
revoke all on function public.legion_jeton_github(uuid) from public, anon, authenticated;
grant execute on function public.legion_jeton_github(uuid) to service_role;
