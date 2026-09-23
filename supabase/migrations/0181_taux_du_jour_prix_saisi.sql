-- 0181 — Les taux du jour, et le prix tel que la vendeuse l'a tapé (23/09).
--
-- Beau, 23/09 : « chacun doit voir les prix dans SA monnaie, et pouvoir la
-- changer » ; puis, sur l'avis écrit le soir même : « fais tout ce que tu dis
-- là » — un taux par jour, le Canada en dollars canadiens, et le prix saisi par
-- une vendeuse gardé dans SA monnaie.
--
-- 1. taux_du_jour : les unités de chaque monnaie pour 1 euro, reprises chaque
--    nuit chez ExchangeRate-API (open.er-api.com, gratuit, 166 monnaies, une
--    mise à jour par jour, attribution affichée dans les Réglages). Le franc
--    CFA et l'euro gardent leur parité fixe (655,957) : la source ne les
--    touche jamais. Tout le monde peut lire les taux ; seul le serveur écrit.
--
-- 2. Le prix saisi. Les prix restent stockés en FCFA (price_fcfa). Pour une
--    boutique en livres, en dollars, en nairas…, le montant en FCFA d'un prix
--    tapé « 10 £ » bouge avec le taux : relu le lendemain, il serait devenu
--    « 10,03 £ ». On garde donc le montant tapé et sa monnaie (prix_saisi,
--    devise_saisie…), et c'est lui qui fait foi : chaque nuit, après les
--    taux, price_fcfa est recalculé à partir de lui. L'acheteur voit le prix
--    du jour dans sa monnaie ; la vendeuse relit exactement ce qu'elle a tapé.
--
--    Le recalage nocturne ne déclenche PAS les alertes « le prix a baissé » :
--    le déclencheur des alertes ne se réveille que si price_fcfa figure dans
--    la commande UPDATE, et le recalage ne l'y met pas (il passe par le
--    déclencheur BEFORE ci-dessous). Seule une vraie baisse décidée par la
--    vendeuse prévient les acheteurs.
--
-- Tout est AJOUTÉ : une table, quatre colonnes, trois fonctions, un
-- déclencheur, une tâche planifiée.

create table if not exists public.taux_du_jour (
  code text primary key check (code ~ '^[A-Z]{3,4}$'),
  par_euro numeric not null check (par_euro > 0),
  maj timestamptz not null default now(),
  source text
);
alter table public.taux_du_jour enable row level security;
drop policy if exists taux_du_jour_lire on public.taux_du_jour;
create policy taux_du_jour_lire on public.taux_du_jour for select using (true);
grant select on public.taux_du_jour to anon, authenticated;

insert into public.taux_du_jour (code, par_euro, source) values
  ('EUR', 1, 'parité'), ('FCFA', 655.957, 'parité fixe'), ('XAF', 655.957, 'parité fixe'), ('XOF', 655.957, 'parité fixe')
on conflict (code) do nothing;

alter table public.products add column if not exists prix_saisi numeric;
alter table public.products add column if not exists prix_barre_saisi numeric;
alter table public.products add column if not exists prix_lot_saisi numeric;
alter table public.products add column if not exists devise_saisie text;

-- Un montant tapé dans une monnaie, en FCFA entiers, au taux du jour.
create or replace function public.fcfa_de(p_montant numeric, p_devise text)
returns integer language sql stable set search_path = public as $$
  select round(p_montant * 655.957 / t.par_euro)::integer
  from public.taux_du_jour t where t.code = p_devise and p_montant is not null;
$$;

-- Le prix tapé fait foi : price_fcfa (et le prix barré, et le prix par lot)
-- en découlent. Un ancien écran qui ne connaît que price_fcfa, et qui le
-- change franchement (plus de 2 % d'écart avec le prix tapé), a raison : le
-- prix tapé, périmé, est oublié.
create or replace function public.produits_prix_saisi()
returns trigger language plpgsql set search_path = public as $$
declare v_calcule integer;
begin
  if new.devise_saisie is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.price_fcfa is distinct from old.price_fcfa and new.prix_saisi is not distinct from old.prix_saisi and new.prix_saisi is not null then
      v_calcule := public.fcfa_de(new.prix_saisi, new.devise_saisie);
      if v_calcule is not null and abs(coalesce(new.price_fcfa, 0) - v_calcule) > greatest(1, v_calcule * 0.02) then new.prix_saisi := null; end if;
    end if;
    if new.compare_at_price_fcfa is distinct from old.compare_at_price_fcfa and new.prix_barre_saisi is not distinct from old.prix_barre_saisi and new.prix_barre_saisi is not null then
      v_calcule := public.fcfa_de(new.prix_barre_saisi, new.devise_saisie);
      if new.compare_at_price_fcfa is null or (v_calcule is not null and abs(new.compare_at_price_fcfa - v_calcule) > greatest(1, v_calcule * 0.02)) then new.prix_barre_saisi := null; end if;
    end if;
    if new.lot_price_fcfa is distinct from old.lot_price_fcfa and new.prix_lot_saisi is not distinct from old.prix_lot_saisi and new.prix_lot_saisi is not null then
      v_calcule := public.fcfa_de(new.prix_lot_saisi, new.devise_saisie);
      if new.lot_price_fcfa is null or (v_calcule is not null and abs(new.lot_price_fcfa - v_calcule) > greatest(1, v_calcule * 0.02)) then new.prix_lot_saisi := null; end if;
    end if;
  end if;
  if new.prix_saisi is not null and not coalesce(new.price_on_request, false) then
    new.price_fcfa := coalesce(public.fcfa_de(new.prix_saisi, new.devise_saisie), new.price_fcfa);
  end if;
  if new.prix_barre_saisi is not null then
    new.compare_at_price_fcfa := coalesce(public.fcfa_de(new.prix_barre_saisi, new.devise_saisie), new.compare_at_price_fcfa);
  end if;
  if new.prix_lot_saisi is not null then
    new.lot_price_fcfa := coalesce(public.fcfa_de(new.prix_lot_saisi, new.devise_saisie), new.lot_price_fcfa);
  end if;
  return new;
end $$;
drop trigger if exists products_prix_saisi on public.products;
create trigger products_prix_saisi before insert or update on public.products
  for each row execute function public.produits_prix_saisi();

-- Chaque nuit, après les taux : les prix tapés dans une monnaie qui flotte
-- sont recalculés en FCFA. La commande ne touche PAS price_fcfa elle-même
-- (voir plus haut : pas de fausse alerte de baisse).
create or replace function public.recaler_prix_saisis()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.products set devise_saisie = devise_saisie
   where devise_saisie is not null and devise_saisie <> all (array['FCFA', 'EUR', 'XAF', 'XOF'])
     and (prix_saisi is not null or prix_barre_saisi is not null or prix_lot_saisi is not null);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.recaler_prix_saisis() from public, anon, authenticated;

-- Reprendre les taux du jour.
create or replace function public.rafraichir_taux()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  j jsonb;
  n integer;
  recales integer;
begin
  perform set_config('http.timeout_msec', '20000', true);
  select * into r from extensions.http_get('https://open.er-api.com/v6/latest/EUR');
  if r.status <> 200 then return jsonb_build_object('erreur', 'HTTP ' || r.status); end if;
  j := r.content::jsonb;
  if j ->> 'result' <> 'success' or jsonb_typeof(j -> 'rates') <> 'object' then
    return jsonb_build_object('erreur', coalesce(j ->> 'error-type', 'réponse inattendue'));
  end if;
  insert into public.taux_du_jour (code, par_euro, maj, source)
  select e.key, e.value::numeric, to_timestamp((j ->> 'time_last_update_unix')::bigint), 'ExchangeRate-API'
    from jsonb_each_text(j -> 'rates') e
   where e.key ~ '^[A-Z]{3}$' and e.value ~ '^[0-9.eE+-]+$' and e.value::numeric > 0
     and e.key <> all (array['EUR', 'XAF', 'XOF'])
  on conflict (code) do update set par_euro = excluded.par_euro, maj = excluded.maj, source = excluded.source;
  get diagnostics n = row_count;
  -- La parité fixe du franc CFA, datée du jour pour que la date affichée suive.
  update public.taux_du_jour set maj = to_timestamp((j ->> 'time_last_update_unix')::bigint) where code = any (array['EUR', 'FCFA', 'XAF', 'XOF']);
  recales := public.recaler_prix_saisis();
  return jsonb_build_object('taux', n, 'du', j ->> 'time_last_update_utc', 'prix_recales', recales);
end $$;
revoke all on function public.rafraichir_taux() from public, anon, authenticated;

select cron.unschedule('taux-du-jour') where exists (select 1 from cron.job where jobname = 'taux-du-jour');
-- La source publie vers minuit (UTC) ; on passe à 1 h 10.
select cron.schedule('taux-du-jour', '10 1 * * *', 'select public.rafraichir_taux()');
