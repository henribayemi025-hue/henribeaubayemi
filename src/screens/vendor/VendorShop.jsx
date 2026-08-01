import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShare2, IconExternalLink, IconCurrentLocation, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { CATEGORIES, SERVICE_CATEGORIES } from '../../lib/categories';
import { getPositionWithReason } from '../../lib/geo';

export default function VendorShop() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
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
  });
  const [busy, setBusy] = useState(false);

  // Photos save the instant they're picked (not gated behind the bottom
  // "Enregistrer" button) — otherwise an upload-then-navigate-away silently
  // reverts to the old photo, which is exactly what happened to Beau.
  async function saveImage(field, path) {
    setForm((f) => ({ ...f, [field]: path }));
    const { error } = await supabase.from('shops').update({ [field]: path }).eq('id', shop.id);
    if (error) toast.error(error.message);
    else toast.success(t('vendor.shopSaved'));
  }

  function toggleCat(id) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id) ? f.categories.filter((c) => c !== id) : [...f.categories, id],
    }));
  }

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
