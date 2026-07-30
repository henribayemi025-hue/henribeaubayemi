-- Finjaro — notifications par e-mail (Resend), en complément du push.
--
-- POURQUOI
-- Jusqu'ici la seule notification était le push navigateur (send-push +
-- VAPID). Sur iPhone, le push web ne fonctionne QUE si le site a été ajouté à
-- l'écran d'accueil — autrement dit, pour une bonne partie des utilisatrices,
-- aucune notification n'arrivait jamais. L'e-mail devient le filet de sécurité:
-- il marche partout, sans installation ni permission à accorder.
--
-- 1. PRÉFÉRENCE PAR PERSONNE
-- Recevoir des e-mails doit rester un choix. `email_notifications` est à true
-- par défaut (sinon personne ne serait prévenu de sa première commande) mais
-- chacune peut couper depuis ses réglages.
alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

-- 2. RÉCUPÉRER LES ADRESSES
-- Les e-mails vivent dans `auth.users`, jamais recopiés dans `profiles` — et
-- c'est très bien ainsi: une table publique avec les adresses de tout le monde
-- serait une fuite de données ambulante. Cette fonction est le SEUL pont, et
-- elle est verrouillée:
--   - SECURITY DEFINER pour lire auth.users, que personne d'autre ne peut lire;
--   - droits révoqués pour anon ET authenticated, donc inappelable depuis le
--     navigateur, même par un compte connecté. Seul le service_role (les
--     fonctions edge côté serveur) peut s'en servir;
--   - elle respecte déjà le choix de la personne: une adresse dont le profil a
--     coupé les e-mails n'est jamais renvoyée, ce qui rend l'oubli impossible
--     côté appelant.
create or replace function public.emails_for_users(p_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
set search_path = public, auth, pg_temp
stable
as $$
  select u.id, u.email::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = any(p_ids)
    and u.email is not null
    and p.email_notifications;
$$;

revoke all on function public.emails_for_users(uuid[]) from public, anon, authenticated;

-- 3. CONFIGURATION RESEND — VOLONTAIREMENT ABSENTE DE CE FICHIER
-- La clé API Resend est posée directement dans `app_config` (clé 'resend'),
-- au même endroit que les clés Stripe et VAPID: table protégée par RLS sans
-- AUCUNE politique, donc inaccessible depuis un client, seul le service_role
-- la lit. Elle n'apparaît nulle part dans le dépôt Git — un secret commité
-- reste dans l'historique pour toujours, même après suppression.
--
-- Forme attendue de la valeur:
--   { "api_key": "re_...", "from": "Finjaro <...>", "domain_verified": bool }
--
-- État au 2026-07-30: le domaine finjaro.net est vérifié chez Resend, donc
-- `from` vaut "Finjaro <notifications@finjaro.net>" et domain_verified est à
-- true. Livraison vers une adresse tierce confirmée par les journaux Resend.
--
-- Si un jour l'expéditeur repasse sur onboarding@resend.dev (domaine retiré,
-- nouveau compte...), attention: dans cet état Resend n'accepte d'envoyer
-- QU'À l'adresse du titulaire du compte, et plus aucune cliente ne reçoit
-- rien — sans la moindre erreur visible côté application.
