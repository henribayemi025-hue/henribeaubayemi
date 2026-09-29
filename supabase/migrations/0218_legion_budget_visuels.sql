-- LE BUDGET DES VISUELS — l'outil « créer un visuel » des agents (Beau,
-- 29/09 : « budget 10 euros par mois »).
--
-- Fabriquer une image se paie chez Google, et c'est Finjaro qui paie la clé
-- pour toutes les entreprises de Léo. Donc un budget par entreprise, en
-- euros par mois civil, compté sur ai_usage (fn = 'legion_visuel') :
--   - vide (le défaut) = les visuels ne sont pas activés pour elle ;
--   - Finjaro : 10 € par mois, décidé par Beau.
-- Une entreprise d'un autre utilisateur n'est donc jamais facturée à
-- Finjaro sans que Beau l'ait décidé.
--
-- Additif : une colonne nouvelle, rien de modifié. Propre à Léo.

alter table public.legion_entreprises
  add column if not exists budget_visuels_eur numeric;

comment on column public.legion_entreprises.budget_visuels_eur is
  'Budget mensuel (euros) de l''outil « créer un visuel ». Vide = désactivé. Décidé par Beau (Finjaro paie la clé).';

update public.legion_entreprises set budget_visuels_eur = 10
where id = '44bb201b-6787-4de0-8f7f-f9145d5c03e7' and budget_visuels_eur is null;
