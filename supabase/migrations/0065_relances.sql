-- Les relances de Beau, et surtout LES RÉPONSES.
--
-- Constat de la semaine du 25/08: quatre vraies nouvelles personnes, trois
-- boutiques ouvertes, et UNE SEULE qui a publié un article. Les autres
-- s'arrêtent juste avant. Beau leur écrit alors un par un — sur WhatsApp,
-- sur Messenger — et il perd le fil: qui a été relancé, quand, qui a lu,
-- qui a répondu quoi. « Il faut que j'aie l'endroit chat dans admin où je
-- peux voir les messages envoyés aux collaborateurs qui n'ont pas mis, et
-- leurs réponses. »
--
-- Une relance est donc un ALLER-RETOUR, pas une notification de plus:
-- le message part, on sait s'il a été ouvert, et la personne répond DANS
-- l'application — y compris depuis un compte téléphone sans e-mail.

create table if not exists public.relances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  shop_id     uuid references public.shops(id) on delete set null,
  -- Pourquoi cette personne a été relancée. Sert au suivi ET à ne pas
  -- réécrire deux fois la même chose à la même personne.
  motif       text not null default 'manuel',
  message     text not null,
  envoye_par  uuid references auth.users(id) on delete set null,
  envoye_le   timestamptz not null default now(),
  lu_le       timestamptz,
  reponse     text,
  repondu_le  timestamptz
);

-- Les deux seules lectures qui comptent: « à qui ai-je écrit récemment »
-- et « qui m'a répondu ».
create index if not exists relances_user_idx on public.relances (user_id, envoye_le desc);
create index if not exists relances_attente_idx on public.relances (envoye_le desc) where reponse is null;

alter table public.relances enable row level security;

-- L'administration écrit et lit tout.
create policy relances_admin_all on public.relances
  for all using (public.is_admin()) with check (public.is_admin());

-- La personne relancée lit ce qui LUI est adressé.
create policy relances_lire_les_siennes on public.relances
  for select using (user_id = auth.uid());

-- Et elle peut y répondre — rien d'autre. Le `with check` garde la ligne
-- sur son propriétaire: sans lui, une mise à jour pourrait la réattribuer
-- à quelqu'un d'autre.
create policy relances_repondre on public.relances
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
