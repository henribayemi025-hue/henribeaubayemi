-- Le parrainage récompense en VISIBILITÉ, pas en argent.
--
-- Beau: « le parrainage c'est pas genre argent, c'est genre bonus
-- visibilité etc ».
--
-- Le programme existait déjà entièrement — code personnel sur chacun des 55
-- comptes, `referred_by` renseigné à l'inscription, liste des filleuls. Il
-- n'a jamais servi une seule fois, pour deux raisons que ce fichier corrige:
--
--   1) il n'existait AUCUNE récompense. Les paliers en euros avaient été
--      retirés le 07/08 (promesse d'argent affichée sans versement en place,
--      et Google Play exige de déclarer une « récompense en espèces »). Il
--      restait donc un lien à partager sans rien au bout.
--
--   2) une inscription par Google ou Apple PERDAIT le code. Le code voyage
--      dans les métadonnées de `signUp`, et OAuth n'en a pas: la personne
--      arrivait par le lien de sa marraine et son parrainage disparaissait
--      en route, sans que personne ne s'en aperçoive.

-- ---------------------------------------------------------------------------
-- 1) La récompense: une place devant, pour un temps.
--
-- Le bandeau d'accueil et l'annuaire classent les boutiques par nombre
-- d'abonnés. Une boutique mise en avant passe devant, pendant une durée
-- datée — jamais « pour toujours », sinon les premières arrivées bloquent la
-- porte aux suivantes.
alter table public.shops
  add column if not exists featured_until timestamptz;

comment on column public.shops.featured_until is
  'Mise en avant gagnée par parrainage: la boutique passe en tête jusqu''à cette date. Jamais permanent.';

create index if not exists shops_featured_idx
  on public.shops (featured_until desc) where featured_until is not null;

-- ---------------------------------------------------------------------------
-- 2) Ce qui la déclenche: une filleule qui ouvre VRAIMENT sa boutique.
--
-- Récompenser la simple inscription se paierait en faux comptes. Ce qui
-- compte pour Finjaro, c'est une boutique de plus — donc la marraine gagne
-- ses jours au moment où sa filleule ouvre la sienne, pas avant.
create or replace function public.recompenser_parrain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parrain uuid;
  jusqua timestamptz;
begin
  select referred_by into parrain from public.profiles where id = new.owner_id;
  -- Se parrainer soi-même ne donne rien.
  if parrain is null or parrain = new.owner_id then
    return new;
  end if;

  -- Les jours s'ajoutent à ce qui RESTE, et non à aujourd'hui: deux filleules
  -- en une semaine doivent donner quatorze jours, pas sept.
  --
  -- Le drapeau est indispensable: cette écriture passe par `garde_visibilite`
  -- (ci-dessous), qui refuse toute main sur `featured_until` venant d'un
  -- compte ordinaire. Or c'est la filleule — un compte ordinaire — qui
  -- déclenche ce déclencheur en créant sa boutique. Sans le drapeau, la
  -- récompense était annulée par son propre garde-fou et n'a JAMAIS été
  -- attribuée. Vérifié: 0 jour au lieu de 7.
  perform set_config('finjaro.recompense', '1', true);
  update public.shops s
     set featured_until = least(
           greatest(coalesce(s.featured_until, now()), now()) + interval '7 days',
           -- Plafond: personne ne s'installe en tête pour toujours.
           now() + interval '60 days')
   where s.owner_id = parrain
   returning s.featured_until into jusqua;
  perform set_config('finjaro.recompense', '0', true);

  if jusqua is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      parrain,
      'referral_reward',
      'Ta boutique passe en avant',
      'Une personne que tu as invitée vient d''ouvrir sa boutique. La tienne est mise en avant sur l''accueil pendant 7 jours de plus.',
      jsonb_build_object('featured_until', jusqua)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists shops_recompenser_parrain on public.shops;
create trigger shops_recompenser_parrain
  after insert on public.shops
  for each row execute function public.recompenser_parrain();

-- ---------------------------------------------------------------------------
-- 3) La mise en avant ne s'attribue pas soi-même.
--
-- `shops_update` laisse la propriétaire modifier n'importe quelle colonne de
-- sa boutique. Sans garde-fou, se mettre en tête de l'accueil pour un an
-- serait une requête depuis le navigateur — et la récompense ne vaudrait
-- plus rien pour celles qui l'ont gagnée.
create or replace function public.garde_visibilite()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.featured_until is not distinct from old.featured_until then
    return new;
  end if;
  if coalesce(current_setting('finjaro.recompense', true), '') = '1'
     or coalesce(auth.role(), current_user::text) = 'service_role'
     or public.is_admin() then
    return new;
  end if;
  new.featured_until := old.featured_until;
  return new;
end;
$$;

drop trigger if exists shops_garde_visibilite on public.shops;
create trigger shops_garde_visibilite
  before update on public.shops
  for each row execute function public.garde_visibilite();

-- ---------------------------------------------------------------------------
-- 4) Rattraper le code perdu par Google et Apple.
--
-- Le navigateur retient le code vu dans l'adresse, puis appelle `claim_referral`
-- une fois la session ouverte.
--
-- `profiles.referred_by` est restauré de force par le garde-fou de la
-- migration 0010 pour tout ce qui n'est pas la clé de service — c'est
-- exactement ce qu'on veut d'habitude (on ne change pas de marraine après
-- coup). Le commentaire de 0010 prévoyait déjà une dérogation par GUC dédié:
-- la voici, limitée à cette seule colonne. Un navigateur ne peut pas poser ce
-- réglage: seule une fonction en `security definer` y arrive.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' then
    return new;
  end if;

  new.is_admin      := old.is_admin;
  new.is_suspended  := old.is_suspended;
  new.report_count  := old.report_count;
  new.referral_code := old.referral_code;   -- immuable : sert au parrainage
  new.id            := old.id;

  -- `referred_by` reste fixé à l'inscription, SAUF pendant un rattrapage de
  -- parrainage — qui n'écrit lui-même que si la case est encore vide.
  if coalesce(current_setting('finjaro.claim_referral', true), '') <> '1' then
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;

create or replace function public.claim_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  moi uuid := auth.uid();
  deja uuid;
  ne_le timestamptz;
  parrain uuid;
begin
  if moi is null or coalesce(trim(p_code), '') = '' then
    return false;
  end if;

  select referred_by, created_at into deja, ne_le
    from public.profiles where id = moi;

  -- Trois verrous, parce que c'est le client qui demande cette écriture:
  --   * jamais de changement de marraine après coup;
  --   * seulement dans les dix minutes suivant la création du compte, pour
  --     que ce soit bien une inscription et non un ajout tardif;
  --   * jamais son propre code.
  if deja is not null then return false; end if;
  if ne_le is null or ne_le < now() - interval '10 minutes' then return false; end if;

  select id into parrain from public.profiles
   where upper(referral_code) = upper(trim(p_code)) and id <> moi
   limit 1;

  if parrain is null then return false; end if;

  perform set_config('finjaro.claim_referral', '1', true);
  update public.profiles set referred_by = parrain where id = moi and referred_by is null;
  perform set_config('finjaro.claim_referral', '0', true);
  return true;
end;
$$;

revoke execute on function public.claim_referral(text) from anon;
grant execute on function public.claim_referral(text) to authenticated;
