import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShare2, IconExternalLink, IconCurrentLocation, IconCircleCheck, IconAlertCircle, IconClock, IconTruckDelivery, IconPlus, IconTrash } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { CATEGORIES, SERVICE_CATEGORIES } from '../../lib/categories';
import { COUNTRIES, countryLabel } from '../../lib/countries';
import { currencyForCountry } from '../../lib/currency';
import { getPositionWithReason } from '../../lib/geo';

export default function VendorShop() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [hasGeo, setHasGeo] = useState(shop.lat != null);
  const [geoBusy, setGeoBusy] = useState(false);
  // Un toast disparaît en 3 secondes — Beau: "j'ai appuyé, ça dit un truc,
  // le bouton est resté normal" (aucune trace après). L'état du dernier essai
  // reste affiché SOUS le bouton, en plus du toast, tant qu'on ne retente pas.
  const [geoResult, setGeoResult] = useState(null); // 'ok' | 'denied' | 'timeout' | 'unavailable' | 'unsupported' | null

  async function useMyLocation() {
    setGeoBusy(true);
    setGeoResult(null);
    const { pos, reason } = await getPositionWithReason();
    if (!pos) {
      setGeoBusy(false);
      setGeoResult(reason);
      toast.error(t(`vendor.geoReason.${reason}`));
      return;
    }
    const { error } = await supabase.from('shops').update({ lat: pos.lat, lng: pos.lng }).eq('id', shop.id);
    setGeoBusy(false);
    if (error) {
      setGeoResult('unavailable');
      toast.error(error.message);
    } else {
      setHasGeo(true);
      setGeoResult('ok');
      toast.success(t('vendor.locationSet'));
    }
  }
  const [form, setForm] = useState({
    name: shop.name || '',
    bio: shop.bio || '',
    whatsapp: shop.whatsapp || '',
    phone: shop.phone || '',
    instagram: shop.instagram || '',
    country: shop.country || 'CM',
    city: shop.city || '',
    neighborhood: shop.neighborhood || '',
    banner_url: shop.banner_url || null,
    avatar_url: shop.avatar_url || null,
    categories: shop.categories || [],
    offers_delivery: shop.offers_delivery || false,
    delivery_fee_fcfa: String(shop.delivery_fee_fcfa || 0),
    rotation_enabled: shop.rotation_enabled || false,
    rotation_days: String(shop.rotation_days || 7),
    // true = l'arrivage passé est supprimé (défaut), false = gardé en brouillon.
    rotation_delete: shop.rotation_delete !== false,
    // Horaires: { open, close, closed_days[] } — badge Ouvert/Fermé en direct
    // sur la fiche publique. Vide = rien d'affiché.
    hours_open: shop.opening_hours?.open || '',
    hours_close: shop.opening_hours?.close || '',
    closed_days: shop.opening_hours?.closed_days || [],
    // Zones de livraison: où, combien, sous combien de jours — affichées sur
    // la fiche ET utilisées au checkout (frais par zone, façon Nevo).
    delivery_zones: Array.isArray(shop.delivery_zones) ? shop.delivery_zones : [],
  });
  const [busy, setBusy] = useState(false);

  // Noms de jours localisés (le 1er janvier 2023 est un dimanche → index 0).
  const DAY_LABELS = Array.from({ length: 7 }, (_, d) =>
    new Date(2023, 0, 1 + d).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' })
  );

  function toggleClosedDay(d) {
    setForm((f) => ({
      ...f,
      closed_days: f.closed_days.includes(d) ? f.closed_days.filter((x) => x !== d) : [...f.closed_days, d],
    }));
  }

  function setZone(i, patch) {
    setForm((f) => {
      const delivery_zones = f.delivery_zones.map((z, j) => (j === i ? { ...z, ...patch } : z));
      return { ...f, delivery_zones };
    });
  }
  function addZone() {
    setForm((f) => ({ ...f, delivery_zones: [...f.delivery_zones, { name: '', fee_fcfa: '', days: '' }] }));
  }
  function removeZone(i) {
    setForm((f) => ({ ...f, delivery_zones: f.delivery_zones.filter((_, j) => j !== i) }));
  }

  // Photos save the instant they're picked (not gated behind the bottom
  // "Enregistrer" button) — otherwise an upload-then-navigate-away silently
  // reverts to the old photo, which is exactly what happened to Beau.
  async function saveImage(field, path) {
    setForm((f) => ({ ...f, [field]: path }));
    const { error } = await supabase.from('shops').update({ [field]: path }).eq('id', shop.id);
    if (error) toast.error(error.message);
    else toast.success(t('vendor.shopSaved'));
  }

  // Les catégories s'enregistrent À CHAQUE TAP, comme les photos — Beau avait
  // coché ses rayons sans presser « Enregistrer » tout en bas, et rien n'était
  // sauvé. Un choix de rayon ne doit pas dépendre d'un bouton hors écran.
  function toggleCat(id) {
    const next = form.categories.includes(id) ? form.categories.filter((c) => c !== id) : [...form.categories, id];
    setForm((f) => ({ ...f, categories: next }));
    supabase
      .from('shops')
      .update({ categories: next })
      .eq('id', shop.id)
      .then(({ error }) => {
        if (error) toast.error(error.message);
      });
  }

  // Ids hérités de l'ancienne arborescence (« beaute », « mode »…) encore
  // stockés sur la boutique: ils n'apparaissaient NULLE PART dans les chips,
  // d'où le « j'ai déjà choisi mes catégories et il y en a encore » de Beau.
  // On les montre à part, actifs, avec un tap pour les retirer.
  const knownIds = new Set([...CATEGORIES, ...SERVICE_CATEGORIES].map((c) => c.id));
  const legacyCats = form.categories.filter((id) => !knownIds.has(id));

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from('shops')
      .update({
        name: form.name.trim(),
        bio: form.bio.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim().replace(/^@/, '') || null,
        country: form.country,
        city: form.city.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        banner_url: form.banner_url,
        avatar_url: form.avatar_url,
        categories: form.categories,
        offers_delivery: form.offers_delivery,
        delivery_fee_fcfa: Math.max(0, Math.round(Number(form.delivery_fee_fcfa) || 0)),
        rotation_enabled: form.rotation_enabled,
        // Borné comme la contrainte SQL (1-90) pour que la saisie ne parte
        // jamais en erreur base.
        rotation_days: Math.min(90, Math.max(1, Math.round(Number(form.rotation_days) || 7))),
        rotation_delete: form.rotation_delete,
        opening_hours:
          form.hours_open && form.hours_close
            ? { open: form.hours_open, close: form.hours_close, closed_days: form.closed_days }
            : null,
        delivery_zones: form.delivery_zones
          .filter((z) => z.name && String(z.name).trim())
          .map((z) => ({
            name: String(z.name).trim(),
            fee_fcfa: Math.max(0, Math.round(Number(z.fee_fcfa) || 0)),
            days: Math.max(0, Math.round(Number(z.days) || 0)) || null,
          })),
      })
      .eq('id', shop.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('vendor.shopSaved'));
  }

  async function share() {
    const url = `${window.location.origin}/boutique/${shop.slug}`;
    if (navigator.share) { try { await navigator.share({ title: shop.name, url }); return; } catch { /* fall through */ } }
    try { await navigator.clipboard.writeText(url); toast.success(t('common.shareCopied')); } catch { toast.error(t('errors.generic')); }
  }

  return (
    <div>
      <AppHeader title={t('vendor.shopEdit')} right={<button onClick={share} aria-label={t('common.shareShop')} className="p-1 text-teal"><IconShare2 size={20} /></button>} />
      <div className="space-y-4 p-4">
        <ImageUpload bucket="shops" value={form.banner_url} onChange={(p) => saveImage('banner_url', p)} label={t('vendor.shopBanner')} shape="wide" />
        <ImageUpload bucket="shops" value={form.avatar_url} onChange={(p) => saveImage('avatar_url', p)} label={t('vendor.shopAvatar')} shape="round" />
        <Field label={t('vendor.shopName')}>
          {(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label={t('vendor.shopBio')}>
          {(id) => <TextArea id={id} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />}
        </Field>
        <Field label={t('vendor.shopWhatsapp')}>
          {(id) => <TextInput id={id} type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />}
        </Field>
        {/* Canaux de contact rapides de la fiche publique — chacun n'apparaît
            côté acheteuse que s'il est rempli ici. */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('vendor.shopPhone')}>
            {(id) => <TextInput id={id} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
          </Field>
          <Field label={t('vendor.shopInstagram')}>
            {(id) => <TextInput id={id} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@maboutique" />}
          </Field>
        </div>
        <div>
          <span className="label">{t('vendor.shopCategories')}</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>
                {t(`categories.${c.id}`)}
              </button>
            ))}
          </div>
          <span className="label mt-3 block">{t('vendor.shopServiceCategories')}</span>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>
                {t(`categories.${c.id}`)}
              </button>
            ))}
          </div>
          {legacyCats.length > 0 && (
            <div className="mt-3 rounded-card border border-warning/40 bg-warning-bg p-3">
              <span className="label">{t('vendor.legacyCatsTitle')}</span>
              <div className="flex flex-wrap gap-2">
                {legacyCats.map((id) => (
                  <button key={id} onClick={() => toggleCat(id)} className="chip chip-active">
                    {t(`categories.${id}`, { defaultValue: id })} ×
                  </button>
                ))}
              </div>
              <p className="mt-2 text-caption text-warning">{t('vendor.legacyCatsHint')}</p>
            </div>
          )}
        </div>

        {/* Horaires d'ouverture — badge Ouvert/Fermé en direct sur la fiche. */}
        <div className="space-y-2 rounded-card border border-hairline p-3">
          <span className="flex items-center gap-2 text-body font-semibold text-ink">
            <IconClock size={18} className="text-teal" /> {t('vendor.hoursTitle')}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('vendor.hoursOpen')}>
              {(id) => <TextInput id={id} type="time" value={form.hours_open} onChange={(e) => setForm({ ...form, hours_open: e.target.value })} />}
            </Field>
            <Field label={t('vendor.hoursClose')}>
              {(id) => <TextInput id={id} type="time" value={form.hours_close} onChange={(e) => setForm({ ...form, hours_close: e.target.value })} />}
            </Field>
          </div>
          <span className="label">{t('vendor.hoursClosedDays')}</span>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, d) => (
              <button key={d} type="button" onClick={() => toggleClosedDay(d)} className={`chip ${form.closed_days.includes(d) ? 'chip-active' : 'text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-caption text-muted">{t('vendor.hoursHint')}</p>
        </div>

        {/* Zones de livraison — affichées sur la fiche, utilisées au checkout. */}
        <div className="space-y-2 rounded-card border border-hairline p-3">
          <span className="flex items-center gap-2 text-body font-semibold text-ink">
            <IconTruckDelivery size={18} className="text-teal" /> {t('vendor.zonesTitle')}
          </span>
          {form.delivery_zones.map((z, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Field label={i === 0 ? t('vendor.zoneName') : undefined}>
                  {(id) => <TextInput id={id} value={z.name || ''} onChange={(e) => setZone(i, { name: e.target.value })} />}
                </Field>
              </div>
              <div className="w-24">
                <Field label={i === 0 ? t('vendor.zoneFee') : undefined}>
                  {(id) => <TextInput id={id} type="number" inputMode="numeric" value={z.fee_fcfa ?? ''} onChange={(e) => setZone(i, { fee_fcfa: e.target.value })} />}
                </Field>
              </div>
              <div className="w-20">
                <Field label={i === 0 ? t('vendor.zoneDaysLabel') : undefined}>
                  {(id) => <TextInput id={id} type="number" inputMode="numeric" value={z.days ?? ''} onChange={(e) => setZone(i, { days: e.target.value })} />}
                </Field>
              </div>
              <button type="button" onClick={() => removeZone(i)} aria-label={t('common.delete')} className="mb-2.5 p-1.5 text-danger">
                <IconTrash size={18} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addZone} className="btn-ghost text-caption">
            <IconPlus size={16} /> {t('vendor.addZone')}
          </button>
          <p className="text-caption text-muted">{t('vendor.zonesHint')}</p>
        </div>
        <label className="flex items-center gap-3 rounded-card border border-hairline p-3">
          <input type="checkbox" checked={form.offers_delivery} onChange={(e) => setForm({ ...form, offers_delivery: e.target.checked })} className="h-5 w-5 accent-[#C25E38]" />
          <span className="flex-1 text-body text-ink">{t('checkout.delivery')}</span>
        </label>
        {form.offers_delivery && (
          <Field label={t('checkout.deliveryFee')}>
            {(id) => <TextInput id={id} type="number" inputMode="numeric" value={form.delivery_fee_fcfa} onChange={(e) => setForm({ ...form, delivery_fee_fcfa: e.target.value })} />}
          </Field>
        )}
        <label className="flex items-start gap-3 rounded-card border border-hairline p-3">
          <input
            type="checkbox"
            checked={form.rotation_enabled}
            onChange={(e) => setForm({ ...form, rotation_enabled: e.target.checked })}
            className="mt-0.5 h-5 w-5 accent-[#C25E38]"
          />
          <span className="flex-1">
            <span className="block text-body text-ink">{t('vendor.rotationTitle')}</span>
            <span className="mt-0.5 block text-caption text-muted">{t('vendor.rotationHelp')}</span>
          </span>
        </label>
        {form.rotation_enabled && (
          <>
            <Field label={t('vendor.rotationDays')} hint={t('vendor.rotationDaysHint')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="90"
                  value={form.rotation_days}
                  onChange={(e) => setForm({ ...form, rotation_days: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('vendor.rotationEnd')}>
              {(id) => (
                <Select
                  id={id}
                  value={form.rotation_delete ? 'delete' : 'draft'}
                  onChange={(e) => setForm({ ...form, rotation_delete: e.target.value === 'delete' })}
                >
                  <option value="delete">{t('vendor.rotationEndDelete')}</option>
                  <option value="draft">{t('vendor.rotationEndDraft')}</option>
                </Select>
              )}
            </Field>
            {form.rotation_delete && (
              <p className="-mt-2 text-caption text-danger">{t('vendor.rotationDeleteWarn')}</p>
            )}
          </>
        )}
        <div className="space-y-2 rounded-card border border-hairline p-3">
          <span className="label">{t('vendor.locationTitle')}</span>
          <button type="button" onClick={useMyLocation} disabled={geoBusy} className="btn-secondary w-full">
            <IconCurrentLocation size={18} className={geoBusy ? 'animate-spin' : ''} />
            {hasGeo ? t('vendor.locationUpdate') : t('vendor.locationSetBtn')}
          </button>
          {/* Reste affiché après le clic, contrairement au toast qui
              s'efface — c'est ça qui manquait pour que "appuyer sur le
              bouton" se sente comme si ça avait fait quelque chose. */}
          {geoResult === 'ok' && (
            <p className="flex items-center gap-1.5 text-caption font-semibold text-success">
              <IconCircleCheck size={15} /> {t('vendor.geoReason.ok')}
            </p>
          )}
          {geoResult && geoResult !== 'ok' && (
            <p className="flex items-center gap-1.5 text-caption font-semibold text-danger">
              <IconAlertCircle size={15} /> {t(`vendor.geoReason.${geoResult}`)}
            </p>
          )}
          <p className="text-caption text-muted">{t('vendor.locationGpsHint')}</p>
          {/* Le pays fixe la DEVISE dans laquelle la boutique saisit ses
              prix. Il n'était pas modifiable: un vendeur de la diaspora
              resté sur le pays par défaut tapait ses prix en FCFA sans
              pouvoir en sortir. */}
          <Field label={t('becomeVendor.country')} hint={t('vendor.countryCurrencyHint', { currency: currencyForCountry(form.country) })}>
            {(id) => (
              <Select id={id} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Field label={t('becomeVendor.city')}>
              {(id) => <TextInput id={id} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}
            </Field>
            <Field label={t('vendor.neighborhood')}>
              {(id) => <TextInput id={id} value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />}
            </Field>
          </div>
          <p className="text-caption text-muted">{t('vendor.locationManualHint')}</p>
        </div>
        <Link to={`/boutique/${shop.slug}`} className="btn-ghost inline-flex"><IconExternalLink size={18} /> {t('vendor.previewShop')}</Link>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        <Button onClick={save} loading={busy}>{t('common.save')}</Button>
      </div>
    </div>
  );
}
