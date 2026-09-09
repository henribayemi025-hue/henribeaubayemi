-- Bug réel trouvé en testant à deux: les mises à jour (accusé de lecture,
-- compteur non lu) n'arrivaient JAMAIS en direct — il fallait recharger la
-- page pour les voir. Cause: Postgres n'écrit par défaut que la clé primaire
-- dans le flux de réplication logique pour un UPDATE (REPLICA IDENTITY
-- DEFAULT). Le Realtime de Supabase a besoin de la ligne COMPLÈTE (avant ET
-- après) pour vérifier les policies RLS et construire l'événement diffusé
-- aux abonnés — sans ça, l'UPDATE peut être invisible pour Realtime alors
-- même que l'écriture en base a parfaitement réussi.
alter table public.chat_messages replica identity full;
alter table public.direct_messages replica identity full;
alter table public.conversations replica identity full;
