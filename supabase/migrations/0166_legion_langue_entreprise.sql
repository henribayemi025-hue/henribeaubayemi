-- La langue dans laquelle les agents écrivent les plans et les livrables du
-- matin (plan complet, C: « choisir sa langue dans Legion »).
--
-- Portée par l'entreprise et pas par le profil: le téléphone de Beau est
-- réglé en anglais (profiles.locale = 'en') alors qu'il lit ses agents en
-- français. Suivre le profil aurait fait basculer ses plans en anglais sans
-- qu'il l'ait demandé. Ici, rien ne change tant que le propriétaire ne touche
-- pas le bouton FR / EN de Legion. Vide = français, comme avant.
--
-- Additive: une colonne. La règle d'écriture existante (propriétaire) s'applique.

alter table public.legion_entreprises add column if not exists langue text
  check (langue is null or langue in ('fr', 'en'));
comment on column public.legion_entreprises.langue is
  'Langue des plans et livrables écrits par legion-travail. NULL = français.';
