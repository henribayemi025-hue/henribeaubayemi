-- Bug réel trouvé en testant à deux (Beau: « j'ai testé avec quelqu'un et
-- Vu ne s'affiche pas »): la migration 0094 a ajouté la policy RLS et le
-- garde-fou permettant de faire passer un message à status='read', mais
-- PERSONNE n'avait élargi la contrainte CHECK posée bien avant, qui
-- n'autorisait que 'sent'/'delivered'. Chaque tentative de marquer un
-- message lu était donc rejetée par Postgres, en silence côté client
-- (aucune vérification d'erreur sur cet appel précis) — 'read' n'a
-- littéralement jamais pu être écrit depuis la mise en ligne de la
-- fonctionnalité.
alter table public.chat_messages drop constraint chat_messages_status_check;
alter table public.chat_messages add constraint chat_messages_status_check
  check (status = any (array['sent', 'delivered', 'read']));
