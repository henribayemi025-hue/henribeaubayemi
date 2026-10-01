-- Jetons internes : copie chiffrée dans le coffre de Supabase (Vault) — audit
-- du 01/10, m-16, accord de Beau (« oui, Vault »).
--
-- Étape 1, purement additive : rien ne change pour les lecteurs actuels.
-- - Les 16 jetons de public.app_secrets sont copiés dans vault.secrets sous
--   le nom « app_secret:<nom> » (chiffrés au repos par Supabase).
-- - public.app_secret(nom) les lit dans le coffre (repli sur app_secrets tant
--   que la copie n'existe pas) ; réservée au serveur (service_role et
--   fonctions SQL), jamais à anon ni aux comptes connectés.
-- - Un déclencheur garde le coffre à jour si une ligne d'app_secrets est
--   ajoutée ou modifiée, pour que les deux ne divergent jamais pendant la
--   transition.
-- Étape 2 (plus tard, une par une) : les fonctions SQL et edge passent de
-- « select value from app_secrets » à app_secret(nom). Celles d'Accounting
-- (accounting-rappels) avec Claudinette. La table app_secrets n'est ni vidée
-- ni supprimée (migrations additives).

create or replace function public.app_secret_vers_coffre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'app_secret:' || new.name;
  if v_id is null then
    perform vault.create_secret(new.value, 'app_secret:' || new.name, 'Copie de public.app_secrets (audit m-16)');
  else
    perform vault.update_secret(v_id, new.value);
  end if;
  return new;
end;
$$;

revoke all on function public.app_secret_vers_coffre() from public, anon, authenticated;

drop trigger if exists app_secrets_vers_coffre on public.app_secrets;
create trigger app_secrets_vers_coffre
  after insert or update of value on public.app_secrets
  for each row execute function public.app_secret_vers_coffre();

-- Copie initiale (le déclencheur ne voit pas les lignes déjà là).
do $$
declare
  r record;
begin
  for r in select name, value from public.app_secrets loop
    if not exists (select 1 from vault.secrets where name = 'app_secret:' || r.name) then
      perform vault.create_secret(r.value, 'app_secret:' || r.name, 'Copie de public.app_secrets (audit m-16)');
    end if;
  end loop;
end $$;

create or replace function public.app_secret(p_nom text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select decrypted_secret from vault.decrypted_secrets where name = 'app_secret:' || p_nom limit 1),
    (select value from public.app_secrets where name = p_nom)
  );
$$;

revoke all on function public.app_secret(text) from public, anon, authenticated;
grant execute on function public.app_secret(text) to service_role;
