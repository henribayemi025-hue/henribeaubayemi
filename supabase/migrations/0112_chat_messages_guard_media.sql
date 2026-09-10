-- Audit du 10/09: le garde-fou d'UPDATE sur chat_messages ne surveillait que
-- body / image_url / expéditeur / conversation / date. Les colonnes ajoutées
-- depuis (audio_url, audio_seconds, reply_to_id) restaient modifiables par
-- la personne EN FACE — la politique d'update autorise les deux participants
-- (il le faut pour le statut « lu »). Concrètement, l'autre pouvait
-- remplacer un vocal ou changer la citation d'un message reçu. Fermé ici.
-- La transition « supprimé pour tout le monde » (tombstone, ouverte le
-- 09/09) reste autorisée: body, image ET audio passent à null d'un coup,
-- une seule fois.
create or replace function public.chat_messages_guard_status_update()
returns trigger
language plpgsql
as $$
begin
  if new.sender_id is distinct from old.sender_id
     or new.sender_role is distinct from old.sender_role
     or new.conversation_id is distinct from old.conversation_id
     or new.created_at is distinct from old.created_at
     or new.auto_reply is distinct from old.auto_reply
     or new.reply_to_id is distinct from old.reply_to_id then
    raise exception 'only status may be updated on chat_messages';
  end if;

  if new.deleted_at is not null and old.deleted_at is null
     and new.body is null and new.image_url is null and new.audio_url is null then
    return new;
  end if;

  if new.body is distinct from old.body
     or new.image_url is distinct from old.image_url
     or new.audio_url is distinct from old.audio_url
     or new.audio_seconds is distinct from old.audio_seconds
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'only status may be updated on chat_messages';
  end if;
  return new;
end;
$$;
