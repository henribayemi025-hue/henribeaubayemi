-- Les vidéos affichaient « 0 vue » à leurs autrices. Pour toujours.
--
-- Deux causes, la même famille que le compteur de vues des articles corrigé
-- ce matin (0116):
--   1. AUCUN code n'incrémentait `reels.views`. L'app enregistrait bien un
--      événement « reel_view » dans `events`, mais rien ne remontait dans la
--      colonne que lisent l'écran « Mes vidéos » et les statistiques
--      vendeuse.
--   2. Le partage tentait un UPDATE direct sur `reels`. La politique
--      d'écriture ne laisse passer que la propriétaire de la boutique: pour
--      toute visiteuse, l'écriture ne touchait aucune ligne, sans erreur.
--      Vérifié en base: sur 16 vidéos, `views` valait 0 partout et `shares`
--      n'était non nul que pour UNE — celle que sa propre autrice avait
--      partagée.
--
-- Ces deux fonctions comptent pour tout le monde, connectée ou non, sans
-- ouvrir d'autre écriture sur `reels`. Une vidéo retirée par la modération
-- ne compte plus rien.
create or replace function public.increment_reel_view(p_reel_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reels
  set views = coalesce(views, 0) + 1
  where id = p_reel_id and moderation_hidden_at is null;
$$;

create or replace function public.increment_reel_share(p_reel_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reels
  set shares = coalesce(shares, 0) + 1
  where id = p_reel_id and moderation_hidden_at is null;
$$;

grant execute on function public.increment_reel_view(uuid) to anon, authenticated;
grant execute on function public.increment_reel_share(uuid) to anon, authenticated;
