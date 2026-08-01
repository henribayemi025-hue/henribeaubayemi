-- Inscription par téléphone (SMS OTP), sans adresse e-mail.
--
-- `handle_new_user()` dérivait le nom par défaut de `new.email` via
-- `split_part(new.email, '@', 1)` — inoffensif tant que l'e-mail existe
-- (NULL en Postgres donne NULL, pas d'erreur), mais un compte créé par
-- téléphone n'a jamais d'e-mail. On complète la chaîne de repli avec le
-- numéro de téléphone, puis un libellé neutre en tout dernier recours —
-- en pratique le nom saisi au formulaire d'inscription est toujours fourni,
-- ceci n'est qu'un filet de sécurité.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_code text := new.raw_user_meta_data->>'ref';
  ref_id uuid;
begin
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code) and id <> new.id;
  end if;
  insert into public.profiles (id, name, referral_code, referred_by)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(new.email, '@', 1), ''),
      new.phone,
      'Utilisateur'
    ),
    upper(left(replace(new.id::text, '-', ''), 8)),
    ref_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
