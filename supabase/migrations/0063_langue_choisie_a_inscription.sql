-- La langue choisie à l'inscription survit à la création du compte.
--
-- Constat en production: un vendeur anglophone arrive sur l'écran
-- d'inscription, ne comprend rien, et s'arrête là — « I have enter there
-- everything is in French ». Le choix FR/EN existe désormais sur cet écran
-- (src/components/LanguageSwitch.jsx), mais il ne servait à rien tant que la
-- base le contredisait deux secondes plus tard:
--
--   `public.profiles.locale` valait « fr » PAR DÉFAUT. Chaque compte naissait
--   donc estampillé français, y compris celui de quelqu'un qui venait de
--   toucher « English », et `useSettings` — qui adopte la langue du profil
--   dès qu'il est chargé — rebasculait toute l'application en français.
--
-- Exactement le piège que la migration 0037 avait retiré à `currency`: une
-- valeur par défaut est indiscernable d'un choix, et plus rien ne peut la
-- corriger. NULL veut dire « jamais choisie », et laisse la main au client.
--
-- Additif: aucune colonne supprimée, aucune ligne réécrite. Les comptes
-- existants gardent le « fr » déjà inscrit.

alter table public.profiles alter column locale drop default;

-- `handle_new_user` recopie la langue transmise à l'inscription. Le reste de
-- la fonction est inchangé (nom, code de parrainage, parrain).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  ref_code text := new.raw_user_meta_data->>'ref';
  ref_id uuid;
  langue text := new.raw_user_meta_data->>'locale';
begin
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code) and id <> new.id;
  end if;
  -- On n'accepte que les deux langues réellement traduites. Une valeur
  -- fantaisiste arrivée dans les métadonnées laisserait le profil sans
  -- langue plutôt que dans une langue qui n'existe pas.
  if langue is not null and langue not in ('fr', 'en') then
    langue := null;
  end if;
  insert into public.profiles (id, name, referral_code, referred_by, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(new.email, '@', 1), ''),
      new.phone,
      'Utilisateur'
    ),
    upper(left(replace(new.id::text, '-', ''), 8)),
    ref_id,
    langue
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
