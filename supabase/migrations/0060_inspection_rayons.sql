-- L'inspection du matin regarde aussi le RANGEMENT.
--
-- Beau: « chaque matin le robot doit partir dans chacune des catégories pour
-- voir si des gens ont mis les trucs dans les mauvaises catégories. »
--
-- Ce n'est pas de la modération de contenu: un casque de chantier dans
-- « Mode Femme » n'est ni illégal ni douteux, il est simplement au mauvais
-- endroit. Rien ne doit donc JAMAIS être masqué pour cette raison — on
-- signale, Beau déplace.
--
-- Deux ajouts, tous deux additifs:
--
--   * `rayon_checked_at`: la date du dernier contrôle de rangement de la
--     fiche. L'inspection de contenu ne relit que ce qui est NOUVEAU depuis
--     son dernier passage (un repère de temps), ce qui suffit pour un
--     contenu illégal — il l'est dès sa publication. Le rangement, lui, doit
--     pouvoir être revu: une vendeuse peut changer le rayon d'un article
--     après coup, et les rayons eux-mêmes évoluent (celui de l'équipement
--     professionnel vient d'être créé). Chaque matin le robot reprend donc
--     les fiches jamais contrôlées, puis les plus anciennement contrôlées —
--     tout le catalogue défile, par tranches, sans jamais tout relire d'un
--     coup.
--
--   * `reports.suggested_category`: le rayon que le robot propose. Sans lui
--     le constat se lit « mauvais rayon » et laisse tout le travail à faire;
--     avec lui, la console d'administration offre un bouton « Déplacer
--     vers … » qui règle le cas d'un tap.

alter table public.products
  add column if not exists rayon_checked_at timestamptz;

comment on column public.products.rayon_checked_at is
  'Dernier passage de l''inspection de rangement (moderation-sweep). NULL = jamais contrôlée.';

-- Les jamais-contrôlées d'abord, puis les plus anciennes: c'est exactement
-- l'ordre dans lequel la fonction les demande.
create index if not exists products_rayon_checked_idx
  on public.products (rayon_checked_at nulls first)
  where is_active;

alter table public.reports
  add column if not exists suggested_category text;

comment on column public.reports.suggested_category is
  'Rayon proposé par l''inspection de rangement. Une proposition, jamais appliquée automatiquement.';
