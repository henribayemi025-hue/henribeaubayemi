-- « Les clientes ont écrit quoi ? Je n'ai pas vu ça. »
--
-- Beau, 10/09. Et pour cause: rien ne le prévenait, et l'admin ne montrait
-- nulle part les conversations des vraies clientes. Pire, mes propres
-- chiffres l'avaient trompé — j'avais compté 16 messages de « clientes »
-- cette semaine, dont 14 venaient de SON compte de test et 2 d'un compte
-- nommé « test finjaro ». Zéro vraie cliente.
--
-- Deux choses ici:
--   1. distinguer une fois pour toutes un vrai compte d'un compte de test,
--      pour que plus aucun chiffre ne mente;
--   2. alerter Beau tout de suite (cloche + push + e-mail, tout part par
--      alert_admins) dès qu'une vraie cliente écrit à une boutique.
--
-- Aujourd'hui ça ne sonnera presque jamais. C'est exactement le but: quand
-- ça sonnera, ce sera la première vraie cliente, et il faut qu'une réponse
-- parte dans l'heure.

-- 1. Marquer les comptes de test. Additif, réversible depuis SQL.
alter table public.profiles add column if not exists is_test boolean not null default false;

update public.profiles p
set is_test = true
where p.is_test = false
  and (
    p.id in (
      select u.id from auth.users u
      where u.email in (
        'henribayemi025@gmail.com',
        'dieudonnenoel.bayemipougue@skema.edu',
        'fin.finjaro@gmail.com'
      )
    )
    or p.name ilike '%test%'
  );

-- Un « vrai » compte: ni test, ni membre de l'équipe. C'est LA définition,
-- utilisée par l'alerte comme par l'écran de veille — deux définitions qui
-- divergent, c'est comme ça qu'on se retrouve avec des chiffres faux.
create or replace function public.compte_reel(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and coalesce(p.is_test, false) = false
      and coalesce(p.is_admin, false) = false
  );
$$;

-- 2. L'alerte. Une par conversation et par tranche de six heures: prévenir
-- est utile, sonner à chaque phrase d'une même discussion ne l'est pas.
alter table public.conversations add column if not exists alerte_admin_at timestamptz;

create or replace function public.on_message_cliente_reelle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  extrait text;
begin
  if new.sender_role is distinct from 'buyer' then return new; end if;
  if not public.compte_reel(new.sender_id) then return new; end if;

  select conv.id, conv.alerte_admin_at, s.name as boutique, s.id as shop_id,
         coalesce(p.name, 'Une cliente') as cliente
    into c
    from public.conversations conv
    join public.shops s on s.id = conv.shop_id
    left join public.profiles p on p.id = conv.buyer_id
   where conv.id = new.conversation_id;
  if not found then return new; end if;

  if c.alerte_admin_at is not null and c.alerte_admin_at > now() - interval '6 hours' then
    return new;
  end if;

  extrait := coalesce(
    nullif(left(new.body, 200), ''),
    case when new.image_url is not null then '[photo]'
         when new.audio_url is not null then '[message vocal]'
         else '[message]' end
  );

  perform public.alert_admins(
    'cliente_reelle',
    'Une cliente écrit à ' || c.boutique,
    c.cliente || ' : ' || extrait,
    '/?s=veille',
    'cliente-' || c.id,
    jsonb_build_object('conversation_id', c.id, 'shop_id', c.shop_id)
  );
  update public.conversations set alerte_admin_at = now() where id = c.id;
  return new;
exception when others then
  -- Une alerte ratée ne doit JAMAIS empêcher un message d'arriver.
  return new;
end;
$$;

drop trigger if exists trg_message_cliente_reelle on public.chat_messages;
create trigger trg_message_cliente_reelle
after insert on public.chat_messages
for each row execute function public.on_message_cliente_reelle();
