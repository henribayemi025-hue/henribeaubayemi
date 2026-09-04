import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconCircleCheck, IconBuildingStore, IconTruckDelivery, IconAlertTriangle } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';
import { COUNTRIES, countryLabel } from '../../lib/countries';
import { track } from '../../lib/track';
import { networkMessage } from '../../lib/netError';

// Commander chez PLUSIEURS boutiques en un seul passage.
//
// Un testeur, capture à l'appui: « je ne vois pas de bouton pour passer les
// deux commandes, je dois les passer une par une ? » Il fallait effectivement
// refaire tout le parcours pour chaque boutique.
//
// Une commande reste une commande PAR boutique — chacune prépare, livre et
// encaisse la sienne, et les vendeuses les traitent séparément. Ce qui change
// ici, c'est le parcours: on saisit ses coordonnées UNE fois, on choisit
// retrait ou livraison boutique par boutique (elles n'offrent pas les mêmes
// options), et un seul bouton crée toutes les commandes.
//
// Le point délicat est l'échec partiel: la première commande passe, la
// seconde échoue pour rupture de stock. On ne fait donc PAS semblant que tout
// est passé — voir `submit`.
export default function CheckoutAll() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, clearShop } = useCart();
  const { profile } = useAuth();
  const { country: geoCountry } = useSettings();

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || geoCountry || 'CM',
  });
  // Le profil arrive APRÈS le premier affichage.
  //
  // `useState` ne lit sa valeur de départ qu'une seule fois: si le profil
  // n'est pas encore chargé à cet instant, les champs restent vides pour
  // toujours et le bouton de commande demeure grisé sans rien expliquer. On
  // remplit donc à l'arrivée du profil — mais UNIQUEMENT les champs encore
  // vides, pour ne jamais écraser ce que la personne vient de taper.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      name: f.name || profile.name || '',
      phone: f.phone || profile.phone || '',
      address: f.address || profile.address || '',
      city: f.city || profile.city || '',
      country: f.country || profile.country || geoCountry || 'CM',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const [touched, setTouched] = useState({});
  const [choices, setChoices] = useState({}); // { [shopId]: { method, zoneIdx } }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { placed: [...], failed: [...] }

  const byShop = items.reduce((acc, it) => {
    (acc[it.shop_id] = acc[it.shop_id] || { id: it.shop_id, name: it.shop_name, items: [] }).items.push(it);
    return acc;
  }, {});
  const shopIds = Object.keys(byShop);

  const { data: shops, loading, error, retry } = useAsync(async () => {
    if (!shopIds.length) return [];
    const { data, error: err } = await supabase
      .from('shops')
      .select('id, name, offers_delivery, delivery_fee_fcfa, delivery_zones, country')
      .in('id', shopIds);
    if (err) throw err;
    return data || [];
  }, [shopIds.join(',')]);

  const shopById = Object.fromEntries((shops || []).map((s) => [s.id, s]));

  function zonesOf(shopId) {
    const z = shopById[shopId]?.delivery_zones;
    return Array.isArray(z) ? z.filter((x) => x && x.name) : [];
  }
  function choiceOf(shopId) {
    return choices[shopId] || { method: 'pickup', zoneIdx: 0 };
  }
  function setChoice(shopId, patch) {
    setChoices((c) => ({ ...c, [shopId]: { ...choiceOf(shopId), ...patch } }));
  }
  function feeOf(shopId) {
    const c = choiceOf(shopId);
    if (c.method !== 'delivery') return 0;
    const zones = zonesOf(shopId);
    if (zones.length) return Number(zones[Math.min(c.zoneIdx, zones.length - 1)]?.fee_fcfa) || 0;
    return shopById[shopId]?.delivery_fee_fcfa || 0;
  }
  const subtotalOf = (shopId) => byShop[shopId].items.reduce((n, i) => n + i.price_fcfa * i.qty, 0);

  const articles = shopIds.reduce((n, id) => n + subtotalOf(id), 0);
  const fees = shopIds.reduce((n, id) => n + feeOf(id), 0);
  const total = articles + fees;

  // Les coordonnées ne sont demandées que si AU MOINS une boutique livre.
  // Tout en retrait: on ne réclame rien de plus qu'un nom et un téléphone.
  const delivering = shopIds.filter((id) => choiceOf(id).method === 'delivery');
  const anyDelivery = delivering.length > 0;
  // La ville n'est utile que pour une boutique SANS zones: quand la boutique
  // définit ses zones, la zone choisie tient lieu de ville.
  const needCity = delivering.some((id) => zonesOf(id).length === 0);

  const required = anyDelivery
    ? ['name', 'phone', 'address', 'country', ...(needCity ? ['city'] : [])]
    : ['name', 'phone'];
  const phoneOk = /^[+()\d][\d\s()-]{6,}$/.test(form.phone);
  function fieldError(k) {
    if (!touched[k]) return null;
    if (required.includes(k) && !form[k]) return t('common.required');
    if (k === 'phone' && form.phone && !phoneOk) return t('checkout.invalidPhone');
    return null;
  }
  const valid = required.every((k) => form[k]) && phoneOk;

  // Mêmes traductions d'erreur que la commande à une boutique: les refus de
  // `place_order` arrivent en clair (« insufficient_stock:Robe »).
  function orderErrorMessage(e) {
    const raw = e?.message || '';
    const [code, name] = raw.split(':');
    const known = {
      product_missing: 'checkout.errProductMissing',
      product_inactive: 'checkout.errProductInactive',
      product_other_shop: 'checkout.errProductMissing',
      product_on_request: 'checkout.errProductOnRequest',
      insufficient_stock: 'checkout.errOutOfStock',
      shop_unavailable: 'checkout.errShopUnavailable',
      shop_not_found: 'checkout.errShopUnavailable',
      empty_cart: 'cart.empty',
    }[code?.trim()];
    if (known) return t(known, { name: (name || '').trim() });
    return networkMessage(e, t);
  }

  async function placeFor(shopId) {
    const c = choiceOf(shopId);
    const zones = zonesOf(shopId);
    const { data, error: rpcErr } = await supabase.rpc('place_order', {
      p_shop_id: shopId,
      p_method: c.method,
      p_payment_status: 'cod',
      p_buyer_name: form.name || null,
      p_buyer_phone: form.phone || null,
      p_address: c.method === 'delivery' ? form.address : null,
      p_city: c.method === 'delivery' ? form.city : null,
      p_country: c.method === 'delivery' ? form.country : null,
      p_zone_index: c.method === 'delivery' && zones.length ? Math.min(c.zoneIdx, zones.length - 1) : null,
      p_items: byShop[shopId].items.map((it) => ({
        product_id: it.id,
        qty: it.qty,
        size: it.size || null,
        color: it.color || null,
      })),
    });
    if (rpcErr) throw rpcErr;
    const order = Array.isArray(data) ? data[0] : data;
    if (!order?.id) throw new Error(t('errors.generic'));
    return order;
  }

  // Chaque boutique est traitée SÉPARÉMENT, l'une après l'autre.
  //
  // Il n'y a volontairement pas de « tout ou rien »: annuler une commande déjà
  // acceptée par une vendeuse serait pire que de la garder. On note donc ce
  // qui est passé et ce qui a échoué, on vide du panier UNIQUEMENT les
  // boutiques réussies, et on le dit noir sur blanc à l'écran suivant. Une
  // acheteuse doit savoir exactement ce qu'elle a commandé.
  async function submit() {
    setTouched({ name: true, phone: true, address: true, city: true, country: true });
    if (!valid) return;
    setSubmitting(true);
    const placed = [];
    const failed = [];
    for (const shopId of shopIds) {
      try {
        const order = await placeFor(shopId);
        // La notification vendeuse (push+e-mail) part du SERVEUR (trigger
        // trg_order_created) — fiable, independante de ce navigateur.
        const shopTotal = byShop[shopId].items.reduce((n, it) => n + it.price_fcfa * it.qty, 0);
        track('order_placed', order.id, { shop_id: shopId, total: shopTotal });
        clearShop(shopId);
        placed.push({ shop: byShop[shopId].name, no: order.order_no });
      } catch (e) {
        failed.push({ shop: byShop[shopId].name, reason: orderErrorMessage(e) });
      }
    }
    setSubmitting(false);
    setResult({ placed, failed });
  }

  if (result) {
    const { placed, failed } = result;
    return (
      <div className="px-6 py-10 text-center">
        {placed.length > 0 ? (
          <IconCircleCheck size={64} className="mx-auto text-success" stroke={1.5} />
        ) : (
          <IconAlertTriangle size={64} className="mx-auto text-danger" stroke={1.5} />
        )}
        <h1 className="mt-4 text-title text-ink">
          {placed.length > 0 ? t('checkout.allSuccessTitle', { count: placed.length }) : t('checkout.allNoneTitle')}
        </h1>

        {placed.length > 0 && (
          <ul className="mx-auto mt-4 max-w-xs space-y-2 text-left">
            {placed.map((p) => (
              <li key={p.no} className="flex items-center justify-between rounded-card border border-hairline p-3">
                <span className="text-body text-ink">{p.shop}</span>
                <span className="text-body font-semibold text-teal">#{p.no}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Ce qui n'est PAS passé, dit clairement, avec la raison et le fait
            que ces articles sont restés au panier. */}
        {failed.length > 0 && (
          <div className="mx-auto mt-6 max-w-xs rounded-card border border-danger/30 bg-danger-bg p-3 text-left">
            <p className="text-body font-semibold text-ink">{t('checkout.allFailedTitle', { count: failed.length })}</p>
            <ul className="mt-2 space-y-1">
              {failed.map((f) => (
                <li key={f.shop} className="text-caption text-ink">
                  <span className="font-semibold">{f.shop}</span> — {f.reason}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-caption text-muted">{t('checkout.allFailedHelp')}</p>
          </div>
        )}

        <div className="mx-auto mt-8 max-w-xs space-y-2">
          {failed.length > 0 && <Button onClick={() => navigate('/cart')}>{t('checkout.allBackToCart')}</Button>}
          <button onClick={() => navigate('/')} className="w-full py-2 text-caption font-semibold text-muted">
            {t('checkout.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="space-y-3 p-4"><AppHeader title={t('checkout.allTitle')} back /><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!shopIds.length) {
    return (
      <div>
        <AppHeader title={t('checkout.allTitle')} back />
        <EmptyState title={t('checkout.empty')} action={<Button onClick={() => navigate('/')}>{t('cart.continueShopping')}</Button>} />
      </div>
    );
  }

  return (
    <div className="pb-32">
      <AppHeader title={t('checkout.allTitle')} back />
      <div className="space-y-4 p-4">
        <p className="text-caption text-muted">{t('checkout.allIntro', { count: shopIds.length })}</p>

        {/* Un bloc par boutique: elles n'offrent pas les mêmes options. */}
        {shopIds.map((id) => {
          const c = choiceOf(id);
          const zones = zonesOf(id);
          const shop = shopById[id];
          return (
            <section key={id} className="card">
              <h2 className="text-section text-ink">{byShop[id].name}</h2>
              <p className="mt-0.5 text-caption text-muted">
                {t('checkout.allItemCount', { count: byShop[id].items.length })}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <MethodCard active={c.method === 'pickup'} onClick={() => setChoice(id, { method: 'pickup' })} icon={IconBuildingStore} label={t('checkout.pickup')} />
                {shop?.offers_delivery && (
                  <MethodCard active={c.method === 'delivery'} onClick={() => setChoice(id, { method: 'delivery' })} icon={IconTruckDelivery} label={t('checkout.delivery')} />
                )}
              </div>

              {c.method === 'delivery' && zones.length > 0 && (
                <div className="mt-3">
                  <Field label={t('checkout.deliveryZone')}>
                    {(fid) => (
                      <Select id={fid} value={String(c.zoneIdx)} onChange={(e) => setChoice(id, { zoneIdx: Number(e.target.value) })}>
                        {zones.map((z, i) => (
                          <option key={i} value={String(i)}>
                            {z.name}
                            {Number(z.fee_fcfa) > 0 ? ` — ${Number(z.fee_fcfa)} FCFA` : ` — ${t('common.free')}`}
                            {z.days ? ` (${t('checkout.zoneDays', { count: Number(z.days) })})` : ''}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-body">
                <span className="text-muted">{t('cart.subtotal')}</span>
                <Price fcfa={subtotalOf(id)} className="text-ink" />
              </div>
              {feeOf(id) > 0 && (
                <div className="flex items-center justify-between text-body">
                  <span className="text-muted">{t('checkout.deliveryFee')}</span>
                  <Price fcfa={feeOf(id)} className="text-ink" />
                </div>
              )}
            </section>
          );
        })}

        {/* Les coordonnées, UNE seule fois pour toutes les boutiques. */}
        <section className="card space-y-3">
          <h2 className="text-section text-ink">{t('checkout.allContactTitle')}</h2>
          <Field label={t('checkout.fullName')} required error={fieldError('name')}>
            {(id) => <TextInput id={id} value={form.name} error={fieldError('name')} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched({ ...touched, name: true })} />}
          </Field>
          <Field label={t('checkout.phone')} required error={fieldError('phone')}>
            {(id) => <TextInput id={id} type="tel" value={form.phone} error={fieldError('phone')} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={() => setTouched({ ...touched, phone: true })} />}
          </Field>
          {anyDelivery && (
            <>
              <Field label={t('checkout.address')} required error={fieldError('address')}>
                {(id) => <TextInput id={id} value={form.address} error={fieldError('address')} onChange={(e) => setForm({ ...form, address: e.target.value })} onBlur={() => setTouched({ ...touched, address: true })} />}
              </Field>
              {needCity && (
                <Field label={t('checkout.city')} required error={fieldError('city')}>
                  {(id) => <TextInput id={id} value={form.city} error={fieldError('city')} onChange={(e) => setForm({ ...form, city: e.target.value })} onBlur={() => setTouched({ ...touched, city: true })} />}
                </Field>
              )}
              <Field label={t('checkout.country')} required>
                {(id) => (
                  <Select id={id} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}
                  </Select>
                )}
              </Field>
            </>
          )}
        </section>
      </div>

      {/* Même réserve que le panier: la barre de navigation flotte au bas de
          l'écran et masquerait le bouton de commande. */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-hairline bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        <div className="flex items-center justify-between text-body">
          <span className="text-muted">{t('checkout.total')}</span>
          <Price fcfa={total} className="text-section font-semibold text-ink" />
        </div>
        <Button className="mt-3" onClick={submit} loading={submitting} disabled={!valid}>
          {t('checkout.allCta', { count: shopIds.length })}
        </Button>
      </div>
    </div>
  );
}

function MethodCard({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-card border p-3 ${active ? 'border-teal bg-teal/5 text-teal' : 'border-hairline text-muted'}`}
    >
      <Icon size={24} />
      <span className="text-caption font-semibold">{label}</span>
    </button>
  );
}
