-- L'IA gratuite de Cloudflare (Workers AI), Beau 05/10 : « oui branche
-- cloudflare gratuit » — Gemini, DeepSeek, Kimi et OpenAI sont tous à sec ou
-- hors quota, et il n'y a pas d'argent pour les recharger.
--
-- Cloudflare donne 10 000 « neurones » par jour (remis à zéro à 00:00 UTC).
-- Le compte Finjaro est sur l'offre payante Workers (l'atelier en a besoin) :
-- au-delà de cette part, Cloudflare FACTURERAIT. Ce compteur l'empêche :
-- chaque appel réserve d'abord le pire cas (entrée estimée + sortie maximale)
-- et ne part que si le total du jour reste sous le plafond (8 000, marge de
-- 2 000 pour les erreurs d'estimation). Après l'appel, la part non consommée
-- est rendue.
--
-- Additif : une table et trois fonctions, rien d'existant n'est touché.

create table if not exists public.ia_gratuite_jour (
  jour      date primary key,
  neurones  integer not null default 0,
  appels    integer not null default 0
);
alter table public.ia_gratuite_jour enable row level security;
revoke all on public.ia_gratuite_jour from anon, authenticated;

-- Réserve p_neurones pour aujourd'hui (UTC). Rend false si le plafond serait
-- dépassé : l'appel ne part pas.
create or replace function public.ia_gratuite_reserver(p_neurones integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  plafond constant integer := 8000;
  v_jour date := (now() at time zone 'utc')::date;
  ok boolean;
begin
  if p_neurones is null or p_neurones <= 0 or p_neurones > plafond then
    return false;
  end if;
  insert into public.ia_gratuite_jour as j (jour, neurones, appels)
  values (v_jour, p_neurones, 1)
  on conflict (jour) do update
    set neurones = j.neurones + excluded.neurones, appels = j.appels + 1
    where j.neurones + excluded.neurones <= plafond
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

-- Rend la part réservée et non consommée (jamais sous zéro).
create or replace function public.ia_gratuite_rendre(p_neurones integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ia_gratuite_jour
     set neurones = greatest(0, neurones - greatest(0, coalesce(p_neurones, 0)))
   where jour = (now() at time zone 'utc')::date;
$$;

revoke all on function public.ia_gratuite_reserver(integer) from public, anon, authenticated;
revoke all on function public.ia_gratuite_rendre(integer) from public, anon, authenticated;
grant execute on function public.ia_gratuite_reserver(integer) to service_role;
grant execute on function public.ia_gratuite_rendre(integer) to service_role;

-- Le jeton que les fonctions edge présentent au Worker de finjaro.net. Tiré
-- au hasard ici, jamais écrit ailleurs ; le Worker ne connaît que son
-- empreinte SHA-256 (wrangler.toml, IA_JETON_SHA256), qui ne permet pas de
-- le retrouver. Le déclencheur de 0228 en fait la copie dans le coffre.
insert into public.app_secrets (name, value)
select 'ia_gratuite', encode(extensions.gen_random_bytes(32), 'hex')
where not exists (select 1 from public.app_secrets where name = 'ia_gratuite');
