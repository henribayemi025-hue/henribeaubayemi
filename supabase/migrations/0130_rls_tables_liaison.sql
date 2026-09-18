-- Les deux tables de la liaison n'avaient pas la sécurité au niveau ligne.
--
-- Signalé le 18/09 sur le projet `qiyvoaljqmbfldephobp` (nommé
-- « finjaro-staging », c'est le projet d'essai): `finia_fx_rates` et
-- `finia_liaison_log` étaient lisibles ET modifiables avec la clé publique.
--
-- La production n'était pas touchée: en posant 0127 le 17/09, la sécurité y a
-- été activée à la main. Mais le FICHIER, lui, ne l'activait pas — donc tout
-- environnement reconstruit à partir des migrations repartait sans. C'est ce
-- trou-là qu'on bouche ici, pas seulement l'état d'un projet.
--
-- Pourquoi AUCUNE règle d'accès: c'est l'état correct, pas un oubli.
-- Personne ne lit ces deux tables depuis un navigateur. Le seul écrivain est
-- le déclencheur `finia_order_to_sale()`, qui est `security definer` et passe
-- donc au-dessus de la sécurité au niveau ligne. « Sécurité activée, zéro
-- règle » veut dire « personne, sauf le code serveur » — exactement ce qu'on
-- veut pour des taux de change et un journal technique.
--
-- Le risque évité n'était pas la lecture, c'était l'écriture: `finia_fx_rates`
-- fixe le taux qui convertit les commandes en montants comptables. Quelqu'un
-- qui change une ligne change ce qui s'inscrit dans la comptabilité des
-- vendeuses.
--
-- Vérifié après coup sur le projet d'essai: une commande sur devis passe
-- toujours de bout en bout, jusqu'à la vente écrite dans `finia_events`.
--
-- Additive et sans effet là où c'est déjà fait.

alter table public.finia_fx_rates    enable row level security;
alter table public.finia_liaison_log enable row level security;
