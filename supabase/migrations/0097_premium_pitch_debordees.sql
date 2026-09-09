-- Cibler les boutiques débordées avec Finia Premium.
--
-- Beau, en testant sa propre boutique à 69 messages non lus: « imagine une
-- boutique à 11 000 [...] on va cibler les boutiques qui ont ce problème, dès
-- que ça dépasse 100 on leur dit ou propose [Finia Premium] ». Seuil et
-- déclencheur donnés par lui explicitement — pas une estimation de ma part.
--
-- Un rappel, jamais un harcèlement (même principe que empty_catalog, mig.
-- 0048): au plus un pitch tous les 7 jours par boutique, et rien pour une
-- boutique déjà Premium.
alter table public.shops add column premium_pitch_last_at timestamptz;

comment on column public.shops.premium_pitch_last_at is
  'Dernier pitch Finia Premium envoyé pour messages non lus en surnombre (>100). Au plus un tous les 7 jours.';

create or replace function public.relancer_boutiques_debordees()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in
    select s.id, s.name, s.owner_id, coalesce(sum(c.vendor_unread), 0) as total_non_lus
    from public.shops s
    join public.conversations c on c.shop_id = s.id
    where s.status = 'active'
      and (s.premium_until is null or s.premium_until <= now())
      and (s.premium_pitch_last_at is null or s.premium_pitch_last_at < now() - interval '7 days')
    group by s.id, s.name, s.owner_id
    having coalesce(sum(c.vendor_unread), 0) > 100
  loop
    perform public.notify(
      r.owner_id,
      'premium_pitch',
      'Finia — trop de messages en attente',
      r.total_non_lus || ' messages non lus dans "' || r.name || '". Avec Finia Premium (5 000 FCFA/mois), Finia répond à ta place quand tu ne peux pas.',
      jsonb_build_object('shop_id', r.id, 'total_non_lus', r.total_non_lus)
    );
    perform public.push_notify(
      r.owner_id,
      'Finia — trop de messages en attente',
      r.total_non_lus || ' messages non lus. Finia Premium peut répondre à ta place — découvre-le.',
      '/vendor',
      'premium-pitch-' || r.id
    );
    update public.shops set premium_pitch_last_at = now() where id = r.id;
  end loop;
end;
$$;

revoke execute on function public.relancer_boutiques_debordees() from anon, authenticated;

-- Même cadence que les autres relances vendeuses (order-reminders,
-- empty-shop): toutes les 6h, sans coût tant qu'aucune boutique ne dépasse
-- le seuil.
select cron.schedule(
  'finjaro-premium-pitch-debordees',
  '0 */6 * * *',
  $$select public.relancer_boutiques_debordees()$$
);
