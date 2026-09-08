-- Finia Premium (08/09) : Beau a décidé — activation manuelle (elle paie
-- par Mobile Money directement à lui, il active depuis l'admin), 5 000
-- FCFA/mois, deux avantages au lancement : Miroir IA réservé aux boutiques
-- premium, et un agent qui répond à sa place si elle laisse un message
-- client sans réponse trop longtemps.
--
-- `premium_until` suit exactement le patron déjà en place pour
-- `featured_until` (migration 0057, récompense de parrainage) : NULL =
-- jamais activée, une date passée = expirée, une date future = active. Un
-- seul champ plutôt qu'un booléen + une date, pour ne jamais pouvoir les
-- désynchroniser.
alter table public.shops
  add column if not exists premium_until timestamptz;

comment on column public.shops.premium_until is
  'Fin de l''abonnement Finia Premium (5000 FCFA/mois, activation manuelle par Beau). NULL = jamais activée. Comparer à now() pour savoir si elle est active — jamais lire seule.';

create index if not exists shops_premium_until_idx on public.shops (premium_until) where premium_until is not null;

-- Marque une réponse envoyée par l'agent automatique plutôt que par la
-- vendeuse elle-même — nécessaire pour l'afficher clairement à l'acheteuse
-- (transparence décidée par Beau : jamais faire croire que c'est la
-- vendeuse qui répond) et pour que l'agent sache qu'une conversation vient
-- d'être traitée (il ne réagit qu'au DERNIER message ; si c'est déjà une
-- de ses propres réponses, il attend le prochain message de l'acheteuse).
alter table public.chat_messages
  add column if not exists auto_reply boolean not null default false;

comment on column public.chat_messages.auto_reply is
  'true si ce message a été généré par l''agent Finia Premium (vendeuse absente depuis trop longtemps), jamais écrit par la vendeuse elle-même.';

-- Même patron que moderation_sweep (migration 0056) : un jeton tiré au
-- hasard, lisible seulement par la clé de service, présenté par le cron en
-- en-tête x-finjaro-token. Secret DISTINCT de moderation_sweep et de
-- send_push : une fuite de l'un ne compromet pas les autres.
insert into public.app_secrets (name, value)
values ('chat_autoreply', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;
