-- `profiles.currency` avait 'FCFA' pour valeur par défaut: TOUT compte créé
-- naissait donc estampillé FCFA, quel que soit l'endroit d'où il s'inscrivait.
-- Le client adoptait ensuite cette valeur à chaque connexion, ce qui écrasait
-- la détection du pays — une personne en Europe voyait ses prix repasser en
-- FCFA dès qu'elle se connectait, définitivement.
--
-- On rend la colonne « non renseignée par défaut ». NULL veut alors dire
-- « cette personne n'a jamais choisi », et le client peut détecter librement.
alter table public.profiles alter column currency drop default;

-- Les comptes existants qui portent ENCORE les deux valeurs par défaut
-- intactes (aucun pays connu ET la devise par défaut) n'ont jamais exprimé de
-- choix: on les libère pour que la détection s'applique enfin. Un compte qui a
-- réellement choisi FCFA a, lui, un pays renseigné — il n'est pas touché.
-- Et de toute façon une détection au Cameroun redonne FCFA: personne ne perd
-- l'affichage qu'il voulait.
update public.profiles
   set currency = null
 where country is null
   and currency = 'FCFA';
