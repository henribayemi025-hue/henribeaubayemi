-- 0247 — Messages d'Accounting : on ne peut plus poster soi-même un « appel » ni une « tâche » (faille trouvée par Claudinette le 20/10).
-- Faille : la règle d'insertion de finia_chat_messages (0245) acceptait kind 'call' avec un meta libre. Un membre d'une discussion pouvait
-- poster un « appel » dont meta.url valait « javascript:… » ; le clic sur « Rejoindre l'appel » exécutait ce code dans accounting.finjaro.net
-- avec la session de la personne qui clique. Production : 0 message au moment de la correction, rien n'a été exploité.
-- Correction : un client n'insère plus que des messages 'text' avec un meta vide. Un appel se crée par finia_chat_appeler()
-- (security definer, lien https://meet.jit.si/… fabriqué côté base). Les messages 'task' reviendront avec leur propre fonction (jalon 2).
-- ADDITIVE au sens du CLAUDE.md : aucune colonne ni donnée touchée, une règle de sécurité resserrée (ALTER POLICY : l'outil de migration
-- se bloque sur DROP). Essayée sur la base de test puis en production : texte OK, faux appel / texte avec meta / tâche refusés,
-- appel par la fonction OK, modification du meta refusée (droits par colonne de 0245).
alter policy finia_chat_messages_insert on public.finia_chat_messages
  with check (user_id = auth.uid() and kind = 'text' and meta = '{}'::jsonb and public.finia_chat_dans(space_id));
