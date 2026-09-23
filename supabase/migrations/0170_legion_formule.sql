-- Une formule par entreprise Legion: gratuite ou complète.
--
-- Beau, 23/09: « une version standard ou gratuite ? ». La formule gratuite
-- tourne sur le modèle Flash seulement (rapide, peu cher) et sans
-- recherche sur Internet; la formule complète garde le Pro pour ce qui est
-- complexe, et la recherche. Le PRIX de chaque formule reste à décider par
-- Beau: ici, seulement le réglage qui les distingue. Vide = complète
-- (comportement d'avant, rien ne change pour les entreprises existantes).
--
-- Additive: une colonne.
alter table public.legion_entreprises add column if not exists formule text
  check (formule is null or formule in ('gratuite', 'complete'));
comment on column public.legion_entreprises.formule is
  'gratuite = Flash seulement, sans recherche sur Internet; complete ou vide = Pro pour le complexe, recherche comprise.';
