-- L'inspection quotidienne ne regarde pas que les articles.
--
-- Beau: « les trucs mauvais dans les parties de vendeurs etc ». Un article
-- retiré du catalogue ne sert à rien si la même chose reste visible en vidéo
-- dans le fil, ou écrite dans la description de la boutique.
--
-- Les boutiques avaient déjà leurs deux colonnes (migration 0053). Il manque
-- les vidéos: `reels` n'a aucun moyen de masquer sans SUPPRIMER, et supprimer
-- rend l'erreur de la machine irréparable.
alter table public.reels
  add column if not exists moderation_hidden_at timestamptz,
  add column if not exists moderation_reason text;

comment on column public.reels.moderation_hidden_at is
  'Retirée du fil par la modération. La vidéo existe toujours: on peut la remettre.';

create index if not exists reels_moderation_idx
  on public.reels (moderation_hidden_at) where moderation_hidden_at is not null;

-- Une vidéo signalée peut l'être plusieurs fois par des personnes
-- différentes, mais l'inspection automatique ne doit pas empiler dix fois le
-- même constat sur le même contenu. La contrainte d'unicité existante porte
-- sur (reporter_id, target_type, target_id) et `reporter_id` est NULL pour
-- l'inspection — or en SQL deux NULL ne sont jamais « égaux », donc cette
-- contrainte ne protège de rien côté machine.
create unique index if not exists reports_auto_unique_idx
  on public.reports (target_type, target_id)
  where reporter_id is null and status = 'pending';
