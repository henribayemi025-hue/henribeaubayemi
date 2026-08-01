-- `shops.owner_id` et `reports.reporter_id` pointent vers `auth.users`, une
-- table que le client ne peut pas lire. Impossible donc d'afficher « qui
-- possède cette boutique » ou « qui a signalé ça » — les écrans Boutiques et
-- Modération de la console tombaient tous les deux en erreur.
--
-- On ajoute une SECONDE clé étrangère vers `profiles` (qui porte les noms et
-- est lisible côté client), exactement comme `near_you_listings` le fait déjà
-- avec `near_you_listings_profile_fk`. Les deux contraintes coexistent sans
-- risque: `profiles.id` est lui-même une clé étrangère vers `auth.users`,
-- donc rien ne peut satisfaire l'une sans satisfaire l'autre.
--
-- Comme la colonne porte alors DEUX relations, PostgREST refuse la jointure
-- tant qu'on ne nomme pas celle qu'on veut — d'où les `profiles!<contrainte>`
-- côté client (AdminShops, AdminModeration).
--
-- Vérifié avant application: aucune boutique, aucun signalement et aucune
-- commande ne référence un utilisateur sans profil.
alter table public.shops
  drop constraint if exists shops_owner_profile_fk;
alter table public.shops
  add constraint shops_owner_profile_fk
  foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.reports
  drop constraint if exists reports_reporter_profile_fk;
alter table public.reports
  add constraint reports_reporter_profile_fk
  foreign key (reporter_id) references public.profiles(id) on delete cascade;

alter table public.orders
  drop constraint if exists orders_buyer_profile_fk;
alter table public.orders
  add constraint orders_buyer_profile_fk
  foreign key (buyer_id) references public.profiles(id) on delete cascade;
