-- L'admin peut ecrire une notification pour N'IMPORTE QUEL compte.
--
-- Bug reel du 01/09: l'ecran Relances (migration 0065) ecrit d'abord dans
-- `relances` (deja autorise pour l'admin) PUIS insere une notification pour
-- PREVENIR la personne relancee — mais la seule regle d'ecriture sur
-- `notifications` etait `user_id = auth.uid()`, donc un admin ne pouvait
-- ecrire QUE ses propres notifications. Beau, capture a l'appui: « new row
-- violates row-level security policy for table "notifications" » des le
-- premier clic reel sur "Envoyer la relance".
--
-- Additif, comme 0034_admin_full_rights.sql: cette regle s'AJOUTE a
-- `notifications_insert` existante (RLS = OU logique), rien n'est retire.
create policy notifications_admin_insert on public.notifications
  for insert
  with check (is_admin());
