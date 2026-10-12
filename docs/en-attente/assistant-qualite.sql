-- PROPOSITION — NON APPLIQUÉE, NON TESTÉE. Écrite le 12/10/2026.
-- Réunion du 10/10 : « créer une table de suivi de la performance de l'assistante pour mesurer le
-- taux de résolution sans personne et la satisfaction, et corriger les baisses de qualité ».
-- Reprend les commentaires n° 12 et 13 du document de cadrage.
--
-- Migration ADDITIVE : une nouvelle table. Elle est lue par la base commune (Finjaro, Accounting,
-- Léo) : mot de Beau avant application, Claudinette prévenue.
--
-- MINIMISATION : on ne garde JAMAIS le texte de la question ni de la réponse (il peut contenir des
-- données personnelles ou comptables). Seulement : qui (facultatif), où, résultat, avis, sujet grossier.
-- Les pouces « utile / pas utile » existent déjà dans le chat (fonction ia_apprendre) : cette table
-- les rassemble avec le résultat de l'échange.

create table if not exists public.assistant_qualite (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  produit     text not null check (produit in ('finjaro', 'accounting', 'leo')),
  assistant   text not null default 'finou_chou',        -- « finou » dans un an
  user_id     uuid references auth.users (id) on delete set null,   -- jamais de suppression de compte
  ecran       text,                                       -- chemin de l'écran (/vendor/products…)
  langue      text check (langue in ('fr', 'en')),
  sujet       text,                                       -- catégorie grossière : prix, commande, comptabilité…
  resultat    text not null check (resultat in ('resolu', 'transfere', 'abandonne', 'sans_reponse')),
  avis        smallint check (avis in (-1, 0, 1)),        -- pouce bas, sans avis, pouce haut
  moteur      text,                                       -- quel moteur d'IA a répondu (pour repérer les baisses)
  duree_ms    integer check (duree_ms is null or duree_ms >= 0)
);
comment on table public.assistant_qualite is
  'Une ligne par échange avec l''assistante : résultat et avis, jamais le texte (réunion du 10/10).';

create index if not exists assistant_qualite_date_idx on public.assistant_qualite (created_at desc);
create index if not exists assistant_qualite_resultat_idx on public.assistant_qualite (produit, resultat, created_at desc);

alter table public.assistant_qualite enable row level security;
-- Lecture : l'équipe seulement. Écriture : par les fonctions serveur de l'assistante (clé de service) ;
-- aucune politique d'insertion pour les visiteurs, donc rien n'est écrivable depuis un navigateur.
create policy assistant_qualite_equipe_lecture on public.assistant_qualite for select using (public.is_admin());

-- Le rapport hebdomadaire : taux de résolution sans personne et satisfaction, par produit et par semaine.
create or replace view public.assistant_qualite_semaine as
select date_trunc('week', created_at)::date as semaine,
       produit,
       count(*) as echanges,
       round(100.0 * count(*) filter (where resultat = 'resolu') / nullif(count(*), 0), 1) as pct_resolus_sans_personne,
       round(100.0 * count(*) filter (where resultat = 'transfere') / nullif(count(*), 0), 1) as pct_transferes,
       round(100.0 * count(*) filter (where avis = 1) / nullif(count(*) filter (where avis is not null and avis <> 0), 0), 1) as pct_avis_positifs
from public.assistant_qualite
group by 1, 2;
alter view public.assistant_qualite_semaine set (security_invoker = true);

-- Alerte « baisse de qualité » (à brancher sur le contrôle de 2 h) : pct_resolus_sans_personne de la
-- semaine en cours inférieur de plus de N points à la moyenne des 4 semaines précédentes. N : à fixer par Beau.

-- ESSAYÉ le 12/10/2026 : appliquée telle quelle sur le projet de TEST (qiyvoaljqmbfldephobp) sans erreur
-- (table, index, politique, vue). Pas encore appliquée en production.
-- Reste à faire côté code : que les fonctions de l'assistante (finou-chat, finia-gratuit) écrivent une
-- ligne par échange — c'est une fonction serveur commune : mot de Beau.
