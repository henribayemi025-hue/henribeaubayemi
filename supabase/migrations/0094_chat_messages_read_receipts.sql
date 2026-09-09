-- Accusés de lecture façon WhatsApp: le destinataire peut faire passer un
-- message de l'autre partie a status='read'. Le champ status existe deja
-- (valeur par defaut 'delivered'); on ajoute juste la capacite de le
-- mettre a jour, verrouillee au strict necessaire.

-- Un destinataire ne peut modifier que le statut des messages qu'il n'a PAS
-- envoyes lui-meme, dans une conversation ou il est partie prenante.
create policy chat_update_status on public.chat_messages
  for update
  using (in_conversation(conversation_id) and sender_id <> auth.uid())
  with check (in_conversation(conversation_id) and sender_id <> auth.uid());

-- Garde-fou: cette policy ouvre UPDATE sur la ligne entiere, mais seul
-- `status` doit pouvoir changer par ce chemin — sinon un destinataire mal
-- intentionne pourrait reecrire le contenu d'un message recu.
create or replace function public.chat_messages_guard_status_update()
returns trigger
language plpgsql
as $$
begin
  if new.body is distinct from old.body
     or new.image_url is distinct from old.image_url
     or new.sender_id is distinct from old.sender_id
     or new.sender_role is distinct from old.sender_role
     or new.conversation_id is distinct from old.conversation_id
     or new.created_at is distinct from old.created_at
     or new.auto_reply is distinct from old.auto_reply then
    raise exception 'only status may be updated on chat_messages';
  end if;
  return new;
end;
$$;

create trigger trg_chat_messages_guard_status_update
  before update on public.chat_messages
  for each row execute function public.chat_messages_guard_status_update();
