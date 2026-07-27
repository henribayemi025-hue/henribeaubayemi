-- Referral program (parrainage) — free, points-based, no payment involved.
-- Every profile gets a short, stable referral_code (derived from its own id,
-- so no collision/generation logic needed). referred_by is set once, at
-- signup, from a `ref` code passed in auth signUp's user metadata.

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

update public.profiles set referral_code = upper(left(replace(id::text, '-', ''), 8))
where referral_code is null;

alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code_idx on public.profiles(referral_code);

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
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(replace(new.id::text, '-', ''), 8)),
    ref_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
