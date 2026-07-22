import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconCircleCheck, IconBuildingStore, IconTruckDelivery } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';
import { COUNTRIES, countryLabel } from '../../lib/countries';
import { currencyForCountry } from '../../lib/currency';
import { pushNotify } from '../../lib/notify';

export default function CheckoutCOD() {
  const { shopId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, clearShop } = useCart();
  const { user } = useAuth();
  const { country: geoCountry } = useSettings();
  const toast = useToast();

  const shopItems = items.filter((i) => i.shop_id === shopId);
  const subtotal = shopItems.reduce((n, i) => n + i.price_fcfa * i.qty, 0);

  const [method, setMethod] = useState('pickup');
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', country: geoCountry || 'CM' });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);

  const { data: shop, loading, error, retry } = useAsync(async () => {
    const { data, error: err } = await supabase
      .from('shops')
      .select('id, name, offers_delivery, delivery_fee_fcfa, country')
      .eq('id', shopId)
      .maybeSingle();
    if (err) throw err;
    return data;
  }, [shopId]);

  // Pickup-first zones (FCFA countries, e.g. Cameroun): home delivery isn't
  // widespread yet, so we nudge toward shop pickup with a short warning.
  const pickupFirst = shop ? currencyForCountry(shop.country) === 'FCFA' : false;

  const deliveryFee = method === 'delivery' ? shop?.delivery_fee_fcfa || 0 : 0;
  const total = subtotal + deliveryFee;

  const required = method === 'delivery' ? ['name', 'phone', 'address', 'city', 'country'] : [];
  const phoneOk = /^[+()\d][\d\s()-]{6,}$/.test(form.phone);
  function fieldError(k) {
    if (!touched[k]) return null;
    if (required.includes(k) && !form[k]) return t('common.required');
    if (k === 'phone' && form.phone && !phoneOk) return t('checkout.invalidPhone');
    return null;
  }
  const valid = required.every((k) => form[k]) && (method === 'pickup' || phoneOk);

  async function submit() {
    setTouched({ name: true, phone: true, address: true, city: true, country: true });
    if (!valid) return;
    setSubmitting(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          shop_id: shopId,
          status: 'new',
          delivery_method: method,
          subtotal_fcfa: subtotal,
          delivery_fee_fcfa: deliveryFee,
          total_fcfa: total,
          buyer_name: form.name || null,
          buyer_phone: form.phone || null,
          address: method === 'delivery' ? form.address : null,
          city: method === 'delivery' ? form.city : null,
          country: method === 'delivery' ? form.country : null,
        })
        .select('id, order_no, shop_id')
        .single();
      if (oErr) throw oErr;

      await supabase.from('order_items').insert(
        shopItems.map((it) => ({ order_id: order.id, product_id: it.id, name: it.name, price_fcfa: it.price_fcfa, qty: it.qty }))
      );

      const { data: ownerRow } = await supabase.from('shops').select('owner_id').eq('id', shopId).maybeSingle();
      if (ownerRow?.owner_id) {
        pushNotify({ user_id: ownerRow.owner_id, title: t('notifications.orderReceived'), body: `#${order.order_no}`, url: '/vendor/orders' });
      }
      clearShop(shopId);
      setPlaced(order.order_no);
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <IconCircleCheck size={64} className="text-success" stroke={1.5} />
        <h1 className="mt-4 text-title text-ink">{t('checkout.successTitle')}</h1>
        <p className="mt-2 text-body text-muted">{t('checkout.successBody')}</p>
        <p className="mt-4 rounded-pill bg-teal/5 px-4 py-2 text-body font-semibold text-teal">
          {t('checkout.orderNumber')}: #{placed}
        </p>
        <Button className="mt-8 max-w-xs" onClick={() => navigate('/')}>{t('checkout.backHome')}</Button>
      </div>
    );
  }

  if (loading) return <div className="space-y-3 p-4"><AppHeader title={t('checkout.title')} back /><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (shopItems.length === 0) {
    return (
      <div>
        <AppHeader title={t('checkout.title')} back />
        <EmptyState title={t('checkout.empty')} action={<Button onClick={() => navigate('/')}>{t('cart.continueShopping')}</Button>} />
      </div>
    );
  }

  return (
    <div>
      <AppHeader title={t('checkout.title')} back />
      <div className="space-y-4 p-4">
        <section>
          <h2 className="mb-2 text-section text-ink">{t('checkout.deliveryMethod')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <MethodCard active={method === 'pickup'} onClick={() => setMethod('pickup')} icon={IconBuildingStore} label={t('checkout.pickup')} />
            {shop?.offers_delivery && (
              <MethodCard active={method === 'delivery'} onClick={() => setMethod('delivery')} icon={IconTruckDelivery} label={t('checkout.delivery')} />
            )}
          </div>
          <p className="mt-2 text-caption text-muted">{method === 'pickup' ? t('checkout.pickupNote') : ''}</p>
          {pickupFirst && (
            <p className="mt-2 rounded-card bg-warning-bg p-3 text-caption text-warning">{t('checkout.pickupZoneWarning')}</p>
          )}
        </section>

        {method === 'delivery' && (
          <section className="space-y-3">
            <Field label={t('checkout.fullName')} required error={fieldError('name')}>
              {(id) => <TextInput id={id} value={form.name} error={fieldError('name')} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched({ ...touched, name: true })} />}
            </Field>
            <Field label={t('checkout.phone')} required error={fieldError('phone')}>
              {(id) => <TextInput id={id} type="tel" value={form.phone} error={fieldError('phone')} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={() => setTouched({ ...touched, phone: true })} />}
            </Field>
            <Field label={t('checkout.address')} required error={fieldError('address')}>
              {(id) => <TextInput id={id} value={form.address} error={fieldError('address')} onChange={(e) => setForm({ ...form, address: e.target.value })} onBlur={() => setTouched({ ...touched, address: true })} />}
            </Field>
            <Field label={t('checkout.city')} required error={fieldError('city')}>
              {(id) => <TextInput id={id} value={form.city} error={fieldError('city')} onChange={(e) => setForm({ ...form, city: e.target.value })} onBlur={() => setTouched({ ...touched, city: true })} />}
            </Field>
            <Field label={t('checkout.country')} required>
              {(id) => (
                <Select id={id} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}
                </Select>
              )}
            </Field>
          </section>
        )}

        <section className="card">
          <h2 className="mb-2 text-section text-ink">{t('checkout.orderSummary')}</h2>
          {shopItems.map((it) => (
            <div key={it.id} className="flex justify-between py-1 text-body">
              <span className="line-clamp-1">{it.name} × {it.qty}</span>
              <Price fcfa={it.price_fcfa * it.qty} />
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-body">
            <span className="text-muted">{t('cart.subtotal')}</span><Price fcfa={subtotal} />
          </div>
          <div className="flex justify-between text-body">
            <span className="text-muted">{t('checkout.deliveryFee')}</span>
            {deliveryFee > 0 ? <Price fcfa={deliveryFee} /> : <span className="text-success">{t('common.free')}</span>}
          </div>
          <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-section font-semibold">
            <span>{t('vendor.orderTotal')}</span><Price fcfa={total} className="text-teal" />
          </div>
        </section>

        <section className="rounded-card bg-warning-bg p-3 text-caption text-warning">
          <p className="font-semibold">{t('checkout.cod')}</p>
          <p>{t('checkout.codNote')}</p>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        <Button onClick={submit} loading={submitting}>{t('checkout.confirm')}</Button>
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
