-- Un message de Finjaro sur la page « Ma commande ». Beau, 06/10 : « si on
-- envoie un message à un acheteur, c'est via Finjaro, moi je n'envoie plus
-- via WhatsApp » — puis « oui, ajoute le message Finjaro sur la page Ma
-- commande ».
--
-- Une personne sans compte n'a ni boîte de réception ni notification : son
-- seul lien avec Finjaro est la page « Ma commande » (0223), qu'elle ouvre
-- depuis le lien gardé sur son téléphone. L'équipe (les administrateurs, et
-- eux seuls) peut désormais y laisser un message ; il s'affiche en haut de
-- la page la prochaine fois que l'acheteur l'ouvre.
--
-- Additif : une table, une fonction, et suivi_commande rend un champ de plus
-- (« messages ») ; tout ce qu'elle rendait avant est inchangé. Propre à la
-- place de marché : Finjaro Accounting ne lit ni n'écrit `orders`.

create table if not exists public.commande_messages_finjaro (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  texte      text not null check (char_length(btrim(texte)) between 1 and 1000),
  auteur_id  uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists commande_messages_finjaro_order_idx
  on public.commande_messages_finjaro (order_id, created_at);

alter table public.commande_messages_finjaro enable row level security;
revoke all on public.commande_messages_finjaro from anon;
-- Lecture : l'équipe seulement (la console). L'acheteur les reçoit par
-- suivi_commande, qui ne sort que ceux de SA commande.
drop policy if exists "equipe lit les messages finjaro" on public.commande_messages_finjaro;
create policy "equipe lit les messages finjaro" on public.commande_messages_finjaro
  for select to authenticated using (public.is_admin());

-- Écrire : un administrateur, sur une commande SANS compte (une acheteuse
-- avec compte a sa messagerie, et ne verrait jamais ce message).
create or replace function public.finjaro_ecrire_acheteur(p_order uuid, p_texte text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'réservé à l''équipe Finjaro';
  end if;
  if not exists (select 1 from public.orders where id = p_order and buyer_id is null) then
    raise exception 'commande introuvable ou passée avec un compte';
  end if;
  insert into public.commande_messages_finjaro (order_id, texte, auteur_id)
  values (p_order, btrim(p_texte), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.finjaro_ecrire_acheteur(uuid, text) from public, anon;
grant execute on function public.finjaro_ecrire_acheteur(uuid, text) to authenticated;

-- suivi_commande (0223), à l'identique, plus les messages de Finjaro (le
-- texte et la date ; jamais qui l'a écrit).
create or replace function public.suivi_commande(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_no', o.order_no,
    'status', o.status,
    'delivery_method', o.delivery_method,
    'created_at', o.created_at,
    'priced_at', o.priced_at,
    'confirmed_at', o.confirmed_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
    'cancelled_at', o.cancelled_at,
    'cancel_reason', o.cancel_reason,
    'total_fcfa', o.total_fcfa,
    'prenom', split_part(trim(coalesce(o.buyer_name, '')), ' ', 1),
    'shop', jsonb_build_object(
      'name', s.name,
      'slug', s.slug,
      'country', s.country,
      'city', s.city,
      'avatar_url', s.avatar_url
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name,
        'qty', i.qty,
        'price_fcfa', i.price_fcfa,
        'price_pending', i.price_pending,
        'product_id', i.product_id
      ) order by i.id)
      from order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object('texte', m.texte, 'created_at', m.created_at) order by m.created_at)
      from commande_messages_finjaro m where m.order_id = o.id
    ), '[]'::jsonb)
  )
  from orders o
  join shops s on s.id = o.shop_id
  where o.id = p_id
    and o.buyer_id is null;
$$;

revoke all on function public.suivi_commande(uuid) from public;
grant execute on function public.suivi_commande(uuid) to anon, authenticated;
