-- Beau: « quand tu supprimes, tu supprimes pour toi ou pour plusieurs ? Il
-- doit y avoir supprimer pour moi et supprimer pour tous, je ne sais pas
-- [ce que ça fait] ». La migration 0107 avait ajouté un DELETE en dur
-- (chat_delete_own / direct_messages_delete_own): ça efface la ligne pour
-- tout le monde d'un coup, sans le dire, et sans repère "message supprimé"
-- pour l'autre partie — pas ce que WhatsApp fait, et pas ce que Beau
-- demande. On remplace par les deux vraies options, séparées.

alter table public.chat_messages
  add column if not exists buyer_deleted boolean not null default false,
  add column if not exists vendor_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.direct_messages
  add column if not exists a_deleted boolean not null default false,
  add column if not exists b_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

-- Le DELETE en dur de la 0107 disparaît: tout passe désormais par les deux
-- fonctions ci-dessous, qui savent laquelle des deux choses on demande.
drop policy if exists chat_delete_own on public.chat_messages;
drop policy if exists direct_messages_delete_own on public.direct_messages;

-- "Supprimer pour moi": masque le message de MON côté uniquement, quel que
-- soit qui l'a envoyé. L'autre partie ne voit rien changer.
create or replace function public.delete_chat_message_for_me(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  me uuid := auth.uid();
  conv record;
begin
  select c.buyer_id, c.shop_id into conv
  from public.chat_messages m join public.conversations c on c.id = m.conversation_id
  where m.id = p_message_id;
  if not found then return; end if;

  if conv.buyer_id = me then
    update public.chat_messages set buyer_deleted = true where id = p_message_id;
  elsif exists (select 1 from public.shops where id = conv.shop_id and owner_id = me) then
    update public.chat_messages set vendor_deleted = true where id = p_message_id;
  end if;
end;
$function$;

-- "Supprimer pour tout le monde": UNIQUEMENT ses propres messages. Le
-- contenu est effacé (pas la ligne): l'autre partie voit "message
-- supprimé" à la place, comme WhatsApp — jamais un trou silencieux dans
-- la conversation.
create or replace function public.delete_chat_message_for_everyone(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.chat_messages
    set body = null, image_url = null, audio_url = null, audio_seconds = null, deleted_at = now()
    where id = p_message_id and sender_id = auth.uid();
end;
$function$;

create or replace function public.delete_direct_message_for_me(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  me uuid := auth.uid();
  conv record;
begin
  select dc.user_a_id, dc.user_b_id into conv
  from public.direct_messages m join public.direct_conversations dc on dc.id = m.conversation_id
  where m.id = p_message_id;
  if not found or me not in (conv.user_a_id, conv.user_b_id) then return; end if;

  update public.direct_messages
    set a_deleted = case when conv.user_a_id = me then true else a_deleted end,
        b_deleted = case when conv.user_b_id = me then true else b_deleted end
    where id = p_message_id;
end;
$function$;

create or replace function public.delete_direct_message_for_everyone(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.direct_messages
    set body = null, image_url = null, audio_url = null, audio_seconds = null, deleted_at = now()
    where id = p_message_id and sender_id = auth.uid();
end;
$function$;

grant execute on function public.delete_chat_message_for_me(uuid) to authenticated;
grant execute on function public.delete_chat_message_for_everyone(uuid) to authenticated;
grant execute on function public.delete_direct_message_for_me(uuid) to authenticated;
grant execute on function public.delete_direct_message_for_everyone(uuid) to authenticated;
