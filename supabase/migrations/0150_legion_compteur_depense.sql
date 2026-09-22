-- LEGION — le compteur de dépense et le plafond du mois (plan B9).
--
-- Beau, 22/09, devant une facture Gemini de 42 € qu'il n'attendait pas:
-- « je savais pas que ça pouvait être aussi cher ». Chaque appel de Legion
-- à Gemini est désormais noté dans public.ai_usage (la table de Finia) avec
-- l'entreprise pour qui il a été fait (fonctions legion-*, _shared/cout.ts),
-- et une entreprise peut fixer un plafond mensuel: au-delà, ses agents ne
-- rappellent plus Gemini jusqu'au mois suivant.
--
-- Additive: deux colonnes, une fonction. Rien de retiré.

alter table public.ai_usage add column if not exists entreprise_id uuid references public.legion_entreprises(id) on delete set null;
create index if not exists ai_usage_entreprise on public.ai_usage (entreprise_id, created_at);

alter table public.legion_entreprises add column if not exists plafond_mois_eur numeric
  check (plafond_mois_eur is null or plafond_mois_eur >= 0);
comment on column public.legion_entreprises.plafond_mois_eur is
  'LEGION: dépense Gemini maximale par mois, en euros (estimée). Vide = pas de plafond.';

-- Ce que l'entreprise a dépensé ce mois-ci, par fonction, pour ses membres.
create or replace function public.legion_depense_mois(p_entreprise uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.legion_est_membre(p_entreprise) then null else jsonb_build_object(
    'total_eur', coalesce((select round(sum(cost_eur)::numeric, 4) from ai_usage
                            where entreprise_id = p_entreprise and created_at >= date_trunc('month', now())), 0),
    'appels', (select count(*) from ai_usage where entreprise_id = p_entreprise and created_at >= date_trunc('month', now())),
    'par_fonction', (select coalesce(jsonb_object_agg(fn, eur), '{}'::jsonb) from (
                      select fn, round(sum(cost_eur)::numeric, 4) eur from ai_usage
                       where entreprise_id = p_entreprise and created_at >= date_trunc('month', now()) group by fn) x),
    'plafond_eur', (select plafond_mois_eur from legion_entreprises where id = p_entreprise)
  ) end;
$$;
revoke all on function public.legion_depense_mois(uuid) from public, anon;
grant execute on function public.legion_depense_mois(uuid) to authenticated;
