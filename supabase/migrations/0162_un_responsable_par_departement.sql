-- Un responsable, et un seul, dans chaque département de chaque modèle.
--
-- Trouvé le 23/09 en relisant le plan: dans les sept premiers modèles
-- (écrits à la main), 49 départements n'avaient pas de responsable et cinq
-- « Direction » en avaient plusieurs. Or c'est le responsable qui écrit le
-- plan de son département chaque matin (legion-travail): sans lui, pas de
-- plan; avec cinq, cinq plans concurrents.
--
-- 1. Plusieurs responsables dans un département: on en garde un — le
--    dirigeant naturel (associé directeur, directeur général, producteur),
--    sinon le premier dans l'ordre.
-- 2. Aucun responsable: on prend le poste qui dirige déjà par son intitulé
--    (directeur, responsable, chef, associé, chercheur principal); s'il n'y
--    en a pas, on AJOUTE « Responsable <département> », présent dès la plus
--    petite taille où le département existe.
-- Ne touche que le catalogue (studio_modele_postes), jamais les entreprises
-- déjà fondées.

with tailles(t, rang) as (values ('cocon', 1), ('startup', 2), ('scaleup', 3), ('megacorp', 4)),
plusieurs as (
  select modele, departement from public.studio_modele_postes
  group by 1, 2 having count(*) filter (where est_directeur) > 1
),
garde as (
  select distinct on (p.modele, p.departement) p.id
  from public.studio_modele_postes p join plusieurs x using (modele, departement)
  where p.est_directeur
  order by p.modele, p.departement,
    (p.poste ~* '^(associé directeur|directeur général|directrice générale|producteur)') desc, p.ordre
)
update public.studio_modele_postes p set est_directeur = false
from plusieurs x
where p.modele = x.modele and p.departement = x.departement and p.est_directeur
  and p.id not in (select id from garde);

with sans as (
  select modele, departement from public.studio_modele_postes
  group by 1, 2 having count(*) filter (where est_directeur) = 0
),
tailles(t, rang) as (values ('cocon', 1), ('startup', 2), ('scaleup', 3), ('megacorp', 4)),
candidat as (
  select distinct on (p.modele, p.departement) p.id
  from public.studio_modele_postes p join sans s using (modele, departement)
  join tailles tt on tt.t = p.des_la_taille
  where p.poste ~* '^(directeur|directrice|responsable|chef |chef$|cheffe|associé|chercheur principal|head of)'
  order by p.modele, p.departement, tt.rang, p.ordre
)
update public.studio_modele_postes p set est_directeur = true where p.id in (select id from candidat);

with sans as (
  select modele, departement, min(ordre) premier from public.studio_modele_postes
  group by 1, 2 having count(*) filter (where est_directeur) = 0
),
tailles(t, rang) as (values ('cocon', 1), ('startup', 2), ('scaleup', 3), ('megacorp', 4)),
plus_petite as (
  select p.modele, p.departement, (array_agg(p.des_la_taille order by tt.rang))[1] as taille
  from public.studio_modele_postes p join sans s using (modele, departement)
  join tailles tt on tt.t = p.des_la_taille
  group by 1, 2
)
insert into public.studio_modele_postes (modele, departement, poste, mandat, des_la_taille, est_directeur, poids, ordre, a_ecrire, agent_cle)
select s.modele, s.departement,
       'Responsable ' || lower(s.departement),
       'Dirige le département ' || s.departement || ' : répartit le travail, écrit le plan de la semaine et répond de ses résultats.',
       pp.taille, true, 1, s.premier, false, null
from sans s join plus_petite pp using (modele, departement);
