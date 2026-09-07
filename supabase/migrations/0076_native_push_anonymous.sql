-- Notification native AVANT tout compte.
--
-- Beau: « installe l'app et ouvre, dès que tu ouvres il te demande
-- d'autoriser » — puis, quand on lui a objecté qu'une notification est
-- toujours "pour untel": « ça sera une notif qu'on aura décidé... c'est moi
-- qui décide à qui j'envoie, donc je comprends pas quand tu dis que c'est
-- pas possible ». Il a raison sur son cas d'usage: une annonce large (« Hello,
-- faites vos ventes aujourd'hui ») n'a besoin de connaître ni le compte ni
-- l'historique de la personne — juste un téléphone qui a dit oui.
--
-- Jusqu'ici native_push_tokens exigeait un compte (user_id not null, RLS
-- réservée à `authenticated`): demander l'autorisation avant la connexion
-- n'aurait donc jamais pu s'enregistrer nulle part. On ouvre la table aux
-- jetons ANONYMES, identifiés par un device_id généré côté client
-- (localStorage, voir src/lib/push.js) plutôt que par un compte.
alter table public.native_push_tokens alter column user_id drop not null;

alter table public.native_push_tokens add column if not exists device_id text;

-- Une ligne appartient soit à un compte, soit à un appareil anonyme —
-- jamais ni l'un ni l'autre (un jeton orphelin ne servirait à rien).
alter table public.native_push_tokens drop constraint if exists native_push_tokens_owner_check;
alter table public.native_push_tokens add constraint native_push_tokens_owner_check
  check (user_id is not null or device_id is not null);

create index if not exists native_push_tokens_device_idx
  on public.native_push_tokens (device_id) where device_id is not null;

-- ENREGISTREMENT ET RATTACHEMENT PAR FONCTION, PAS PAR POLICY OUVERTE.
--
-- Piège RLS classique rencontré en construisant ceci: un UPDATE (le
-- rattachement au compte, ou le simple ré-upsert d'un jeton déjà connu au
-- prochain lancement) exige que la ligne soit d'abord VISIBLE par la
-- politique de SELECT, en plus de satisfaire la politique d'UPDATE — sinon
-- Postgres ne considère même pas la ligne comme candidate, et l'update
-- « réussit » silencieusement sur zéro ligne. Ouvrir le SELECT à
-- `authenticated` sur les lignes anonymes (device_id renseigné) aurait
-- réglé le problème, mais aurait aussi exposé le jeton brut de n'importe
-- quel visiteur anonyme à n'importe quel compte connecté — inutile, alors
-- qu'une fonction SECURITY DEFINER fait exactement ce qu'il faut sans
-- élargir aucune lecture.
--
-- Une seule fonction couvre les trois cas (première inscription anonyme,
-- première inscription déjà connectée, rattachement d'un jeton anonyme à
-- un compte qui vient de se connecter): le token est la clé de conflit
-- dans tous les cas, connu du client puisque c'est SON appareil.
create or replace function public.register_native_push_token(
  p_token text, p_platform text, p_device_id text default null
) returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if p_platform not in ('android', 'ios') then
    raise exception 'plateforme invalide: %', p_platform;
  end if;
  if uid is null and coalesce(p_device_id, '') = '' then
    raise exception 'device_id requis sans compte connecté';
  end if;

  insert into public.native_push_tokens (user_id, device_id, platform, token)
  values (uid, case when uid is null then p_device_id else null end, p_platform, p_token)
  on conflict (token) do update set
    -- Un compte déjà connu ne se fait jamais reprendre par un appel
    -- anonyme ultérieur (uid alors null) — coalesce ne descend jamais
    -- d'un compte réel vers l'anonymat, seulement l'inverse.
    user_id = coalesce(excluded.user_id, native_push_tokens.user_id),
    -- Sur le résultat FINAL, pas seulement ce que CET appel apportait: un
    -- appel anonyme rejoué après un rattachement (uid déjà connu en base)
    -- ne doit pas réintroduire un device_id sur une ligne déjà personnelle
    -- — sinon un simple ré-upsert anonyme effacerait le lien vers le
    -- compte d'un point de vue lecture, même si user_id reste correct.
    device_id = case
      when coalesce(excluded.user_id, native_push_tokens.user_id) is not null then null
      else excluded.device_id
    end,
    platform = excluded.platform;
end;
$$;

grant execute on function public.register_native_push_token(text, text, text) to anon, authenticated;

comment on column public.native_push_tokens.device_id is
  'Identifiant anonyme (localStorage côté client) pour un jeton enregistré avant tout compte. Nul une fois le jeton rattaché à un utilisateur.';
