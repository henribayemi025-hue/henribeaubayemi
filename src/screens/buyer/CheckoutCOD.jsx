import { useState, useEffect } from 'react';
import { prixLigne } from '../../lib/prixLigne';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconCircleCheck, IconBuildingStore, IconTruckDelivery, IconCreditCard } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price, CashPrice } from '../../components/Price';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';
import { COUNTRIES, countryLabel } from '../../lib/countries';
import { networkMessage } from '../../lib/netError';
import { track } from '../../lib/track';

export default function CheckoutCOD() {
  const { shopId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, clearShop } = useCart();
  // `user` n'est plus nécessaire ici: c'est le serveur qui identifie
  // l'acheteuse (auth.uid() dans `place_order`), il ne la prend plus du client.
  const { profile } = useAuth();
  const { country: geoCountry } = useSettings();
  const toast = useToast();

  const shopItems = items.filter((i) => i.shop_id === shopId);
  // Une commande qui contient au moins un article sans prix est un DEVIS: elle
  // part en attente du prix de la vendeuse, et il n'y a aucun total à
  // afficher tant qu'elle n'a pas répondu.
  const devis = shopItems.some((i) => i.price_on_request);
  const subtotal = shopItems.reduce((n, i) => (i.price_on_request ? n : n + prixLigne(i) * i.qty), 0);

  const [method, setMethod] = useState('pickup');
  // Pré-rempli depuis l'adresse enregistrée du profil — rien n'empêche de la
  // corriger ici, ça ne touche jamais la valeur sauvegardée sur le profil.
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    country: profile?.country || geoCountry || 'CM',
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Ouverture du checkout : signal d'intention avant meme d'envoyer.
  // Une seule fois par montage — pas a chaque re-render.
  useEffect(() => { track('checkout_start', shopId, { count: shopItems.length, subtotal }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [payingCard, setPayingCard] = useState(false);
  const [placed, setPlaced] = useState(null);
  // Retenu AU MOMENT de la commande: l'écran de confirmation s'affiche après
  // `clearShop`, et le panier est alors vide — `devis` y vaudrait toujours
  // faux, et une demande de prix afficherait « commande passée ».
  const [placedDevis, setPlacedDevis] = useState(false);

  // La boutique suivante encore au panier, s'il en reste une. `items` est
  // relu APRÈS le vidage de la boutique commandée, donc ce qui reste ici est
  // exactement ce qu'il reste à commander.
  const remaining = items.filter((i) => i.shop_id !== shopId);
  const nextShop = remaining.length
    ? { id: remaining[0].shop_id, name: remaining[0].shop_name }
    : null;

  // Paiement par carte MASQUÉ (décision Beau 01/08): le flux Stripe n'est pas
  // opérationnel pour de vrai, donc on ne montre pas un bouton qui déçoit.
  // Tout le code (payByCard, create-checkout) reste en place — repasser ce
  // drapeau à true suffira le jour où le paiement en ligne est prêt.
  const CARD_PAYMENTS_ENABLED = false;
  const stripeEnabled =
    CARD_PAYMENTS_ENABLED &&
    // On ne fait pas payer un montant que personne ne connaît encore.
    !devis &&
    !!(
      import.meta.env.VITE_STRIPE_PK ||
      'pk_test_51TwH38PWe7shhIOrU0Yq13F8jLxvWF97JVsRi1u8FbuU1iF0o08h2cnqgg1xp5LhzqysUmouLTdtzcvgZ2FhdKGv00cUxChcFx'
    );

  const [zoneIdx, setZoneIdx] = useState(0); // zone de livraison choisie (si la boutique en a)

  const { data: shop, loading, error, retry } = useAsync(async () => {
    const { data, error: err } = await supabase
      .from('shops')
      .select('id, name, offers_delivery, delivery_fee_fcfa, delivery_zones, country')
      .eq('id', shopId)
      .maybeSingle();
    if (err) throw err;
    return data;
  }, [shopId]);

  // Zones de livraison définies par la boutique (nom + frais + délai). Quand
  // elles existent, le frais vient de la ZONE choisie — sinon repli sur le
  // frais unique historique. Livraison gratuite (0) affichée « Gratuit ».
  const zones = Array.isArray(shop?.delivery_zones) ? shop.delivery_zones.filter((z) => z && z.name) : [];
  const zone = zones.length > 0 ? zones[Math.min(zoneIdx, zones.length - 1)] : null;
  const deliveryFee = method === 'delivery' ? (zone ? Number(zone.fee_fcfa) || 0 : shop?.delivery_fee_fcfa || 0) : 0;
  const total = subtotal + deliveryFee;

  // Quand la boutique définit des zones, la « ville » est la zone choisie —
  // pas de champ en double à retaper.
  const required = method === 'delivery' ? (zone ? ['name', 'phone', 'address', 'country'] : ['name', 'phone', 'address', 'city', 'country']) : [];
  // Le point est une separation de numero aussi courante que l'espace
  // (« 6.99.41.12.08 »). Il etait refuse, et le refus etait MUET: le bouton
  // restait vif et ne faisait rien. Signale par Claudinette le 22/09.
  const phoneOk = /^[+()\d][\d\s().-]{6,}$/.test(form.phone);
  // Un champ qui ne contient qu'une espace n'est pas rempli. Sans ce `trim`,
  // une adresse « » activait le bouton et partait telle quelle au serveur:
  // la vendeuse recevait une commande sans adresse de livraison.
  const rempli = (k) => String(form[k] ?? '').trim().length > 0;

  function fieldError(k) {
    if (!touched[k]) return null;
    if (required.includes(k) && !rempli(k)) return t('common.required');
    if (k === 'phone' && form.phone && !phoneOk) return t('checkout.invalidPhone');
    return null;
  }
  const valid = required.every(rempli) && (method === 'pickup' || phoneOk);

  // Une commande = UN appel atomique (fonction SQL `place_order`, migration
  // 0042). Avant, la commande et ses articles partaient en deux requêtes dont
  // la seconde n'était pas vérifiée: un article supprimé pendant que le panier
  // dormait dans localStorage, ou une coupure réseau entre les deux, laissait
  // une commande SANS articles pendant que l'acheteuse lisait « commande
  // passée ». Le serveur relit aussi les prix lui-même — le panier peut dater
  // de plusieurs jours, et le total ne doit pas venir du navigateur.
  async function placeOrder(paymentStatus) {
    const { data, error: rpcErr } = await supabase.rpc('place_order', {
      p_shop_id: shopId,
      p_method: method,
      p_payment_status: paymentStatus,
      p_buyer_name: form.name || null,
      p_buyer_phone: form.phone || null,
      p_address: method === 'delivery' ? form.address : null,
      p_city: method === 'delivery' ? form.city : null,
      p_country: method === 'delivery' ? form.country : null,
      p_zone_index: method === 'delivery' && zone ? Math.min(zoneIdx, zones.length - 1) : null,
      p_items: shopItems.map((it) => ({
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

  // Les refus de `place_order` arrivent en clair (« insufficient_stock:Robe »).
  // On les traduit en langage d'acheteuse, avec le nom de l'article fautif.
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

  // Le clic refuse ne disait RIEN.
  //
  // Le 22/09, une acheteuse reelle a atteint cet ecran deux fois en deux
  // jours sans jamais commander, puis a clique pour joindre la vendeuse la
  // minute suivante. Ce n'est pas un abandon: c'est quelqu'un qui cherche un
  // humain parce que la machine ne repond pas.
  //
  // Le bouton restait vif, le clic marquait les champs « touches » — et les
  // messages rouges apparaissaient AU-DESSUS, dans le formulaire, alors que
  // la barre de boutons est collee en bas. Sur 390 px elle regarde le bas de
  // l'ecran: l'erreur s'affiche hors de son champ de vision. Rien ne bouge.
  //
  // Desormais: on amene la personne au premier champ fautif, et on le dit.
  function signalerChampsManquants() {
    setTouched({ name: true, phone: true, address: true, city: true, country: true });
    const fautif = required.find((k) => !rempli(k)) || (!phoneOk ? 'phone' : null);
    if (fautif) {
      const el = document.getElementById(`co-${fautif}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    }
    toast.error(t('checkout.fillRequired'));
  }

  async function submit() {
    if (!valid) { signalerChampsManquants(); return; }
    setSubmitting(true);
    try {
      const order = await placeOrder('cod');
      track('order_placed', order.id, { shop_id: shopId, method, payment: 'cod', total: subtotal });
      // La notification vendeuse (push+e-mail) part desormais du SERVEUR
      // (trigger trg_order_created), plus fiable qu'un appel depuis ce
      // navigateur juste apres l'ecriture.
      setPlacedDevis(devis);
      clearShop(shopId);
      setPlaced(order.order_no);
    } catch (e) {
      toast.error(orderErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function payByCard() {
    if (!valid) { signalerChampsManquants(); return; }
    setPayingCard(true);
    try {
      const order = await placeOrder('unpaid');
      track('order_placed', order.id, { shop_id: shopId, method, payment: 'card', total: subtotal });
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { order_id: order.id } });
      if (error || !data?.url) throw new Error(data?.error || t('errors.generic'));
      clearShop(shopId);
      window.location.href = data.url; // Stripe hosted checkout
    } catch (e) {
      toast.error(orderErrorMessage(e));
      setPayingCard(false);
    }
  }

  if (placed) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <IconCircleCheck size={64} className="text-success" stroke={1.5} />
        <h1 className="mt-4 text-title text-ink">{t(placedDevis ? 'checkout.quoteSentTitle' : 'checkout.successTitle')}</h1>
        <p className="mt-2 text-body text-muted">{t(placedDevis ? 'checkout.quoteSentBody' : 'checkout.successBody')}</p>
        <p className="mt-4 rounded-pill bg-teal/5 px-4 py-2 text-body font-semibold text-teal">
          {t('checkout.orderNumber')}: #{placed}
        </p>
        {/* Enchaîner sur la boutique suivante.
            « Je dois les passer une par une ? » — oui, parce que chaque
            boutique livre la sienne. Mais on ne renvoyait qu'à l'accueil, et
            il fallait retrouver son panier tout seul pour finir sa deuxième
            commande. Le raccourci part directement au bon endroit, avec les
            coordonnées déjà remplies. */}
        {nextShop && (
          <div className="mt-8 w-full max-w-xs">
            <p className="text-caption text-muted">{t('checkout.nextShopTitle', { shop: nextShop.name })}</p>
            <Button className="mt-2" onClick={() => navigate(`/checkout/${nextShop.id}`)}>
              {t('checkout.nextShopCta', { shop: nextShop.name })}
            </Button>
            <button onClick={() => navigate('/')} className="mt-3 w-full py-2 text-caption font-semibold text-muted">
              {t('checkout.backHome')}
            </button>
          </div>
        )}
        {!nextShop && (
          <Button className="mt-8 max-w-xs" onClick={() => navigate('/')}>{t('checkout.backHome')}</Button>
        )}
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
        </section>

        {method === 'delivery' && (
          <section className="space-y-3">
            {/* Zones définies par la boutique: on choisit OÙ se faire livrer,
                le frais et le délai s'affichent direct — plus honnête qu'un
                frais unique mystère. */}
            {zones.length > 0 && (
              <Field label={t('checkout.deliveryZone')}>
                {(id) => (
                  <Select id={id} value={String(zoneIdx)} onChange={(e) => setZoneIdx(Number(e.target.value))}>
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
            )}
            <Field label={t('checkout.fullName')} id="co-name" required error={fieldError('name')}>
              {(id) => <TextInput id={id} value={form.name} error={fieldError('name')} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched({ ...touched, name: true })} />}
            </Field>
            <Field label={t('checkout.phone')} id="co-phone" required error={fieldError('phone')}>
              {(id) => <TextInput id={id} type="tel" value={form.phone} error={fieldError('phone')} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={() => setTouched({ ...touched, phone: true })} />}
            </Field>
            <Field label={t('checkout.address')} id="co-address" required error={fieldError('address')}>
              {(id) => <TextInput id={id} value={form.address} error={fieldError('address')} onChange={(e) => setForm({ ...form, address: e.target.value })} onBlur={() => setTouched({ ...touched, address: true })} />}
            </Field>
            {!zone && (
              <Field label={t('checkout.city')} id="co-city" required error={fieldError('city')}>
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
          </section>
        )}

        <section className="card">
          <h2 className="mb-2 text-section text-ink">{t('checkout.orderSummary')}</h2>
          {shopItems.map((it) => (
            <div key={it.key || it.id} className="flex justify-between py-1 text-body">
              <span className="line-clamp-1">
                {it.name}
                {(it.size || it.color) && <span className="text-muted"> ({[it.size, it.color].filter(Boolean).join(' · ')})</span>} × {it.qty}
              </span>
              {it.price_on_request
                ? <span className="shrink-0 font-semibold text-brass">{t('cart.priceToConfirm')}</span>
                : <Price fcfa={it.price_fcfa * it.qty} />}
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-body">
            <span className="text-muted">{t('cart.subtotal')}</span>
            {subtotal === 0 && devis
              ? <span className="font-semibold text-brass">{t('checkout.quoteTotalPending')}</span>
              : <Price fcfa={subtotal} />}
          </div>
          <div className="flex justify-between text-body">
            <span className="text-muted">{t('checkout.deliveryFee')}</span>
            {deliveryFee > 0 ? <Price fcfa={deliveryFee} /> : <span className="text-success">{t('common.free')}</span>}
          </div>
          <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-section font-semibold">
            <span>{t('vendor.orderTotal')}</span>
            {devis
              ? <span className="text-brass">{t('checkout.quoteTotalPending')}</span>
              : <CashPrice fcfa={total} shopCountry={shop?.country} className="text-teal" />}
          </div>
        </section>

        {/* « Paie à la livraison » n'a aucun sens tant que le montant est
            inconnu: on explique le devis à la place. */}
        <section className={`rounded-card p-3 text-caption ${devis ? 'bg-brass/10 text-ink' : 'bg-warning-bg text-warning'}`}>
          <p className="font-semibold">{devis ? t('checkout.quoteTitle') : t('checkout.cod')}</p>
          <p>{devis ? t('checkout.quoteNote') : t('checkout.codNote')}</p>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 space-y-2 border-t border-hairline bg-white p-3">
        {stripeEnabled && (
          <Button onClick={payByCard} loading={payingCard} disabled={submitting || !valid}>
            <IconCreditCard size={20} /> {t('checkout.payByCard')}
          </Button>
        )}
        {/* Un bouton gris qui n'invite pas au clic vaut mieux qu'un bouton vif
            qui ne fait rien. `valid` n'entrait pas dans `disabled`. */}
        <Button
          variant={stripeEnabled ? 'secondary' : 'primary'}
          onClick={submit}
          loading={submitting}
          disabled={payingCard || !valid}
        >
          {devis ? t('checkout.askForPrice') : t('checkout.payOnDelivery')}
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
