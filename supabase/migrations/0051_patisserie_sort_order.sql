-- Pâtisserie et Traiteur portaient tous les deux le rang d'affichage 26.
--
-- À égalité, PostgreSQL ne garantit aucun ordre: les deux métiers pouvaient
-- s'inverser d'un chargement à l'autre, sans que rien ne l'explique côté
-- client. Personne ne l'aurait signalé comme un bug — juste une liste qui
-- « bouge » sans raison.
--
-- On libère la place juste après Traiteur, pour que les deux métiers de
-- bouche restent voisins, puis on y installe Pâtisserie. Rien n'est
-- supprimé: seul le rang d'affichage change, et seulement pour les métiers
-- de services de premier niveau.
--
-- Idempotent: relancée, la migration ne décale rien de plus, puisque
-- Pâtisserie occupe alors déjà le rang 27 et sort du champ du décalage.
update public.categories
   set sort_order = sort_order + 1
 where kind = 'SERVICE'
   and parent_id is null
   and sort_order between 27 and 98
   and id <> 'patisserie_service';

update public.categories
   set sort_order = 27
 where id = 'patisserie_service';
