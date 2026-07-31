-- Finjaro — comble une dérive de schéma: `ai_usage` existe en production
-- (utilisée par finou-chat/miroir-ia/vendor-copilot pour le plafond mensuel de
-- 20€) mais n'a jamais été créée par une migration versionnée — probablement
-- posée directement via l'éditeur SQL à un moment. Conséquence concrète:
-- rejouer les 21 migrations existantes sur un projet neuf (staging, ou une
-- restauration d'urgence) NE recrée PAS cette table, et le plafond de budget
-- IA se retrouve invisible côté serveur (isOverBudget() plante ou se comporte
-- de façon imprévisible sans la table).
--
-- 🔎 Trouvé en vérifiant, pas supposé: la table en production a en plus les
-- GRANT par défaut de Postgres/Supabase (anon et authenticated ont INSERT/
-- SELECT/UPDATE/DELETE au niveau table), contrairement à ses tables sœurs
-- `app_config` et `rate_limits` (migration 0010) qui ont un `revoke all`
-- explicite. Sans conséquence aujourd'hui — RLS est activée SANS AUCUNE
-- politique, donc l'accès reste refusé par défaut — mais c'est un filet de
-- sécurité en moins si une politique permissive était ajoutée par erreur un
-- jour. Corrigé ici pour aligner sur le même modèle que les deux autres.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  fn text not null,
  cost_eur numeric not null,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
