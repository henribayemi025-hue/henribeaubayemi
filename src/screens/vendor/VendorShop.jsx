import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShare2, IconExternalLink } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { CATEGORIES } from '../../lib/categories';

export default function VendorShop() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({
    name: shop.name || '',
    bio: shop.bio || '',
    whatsapp: shop.whatsapp || '',
    banner_url: shop.banner_url || null,
    avatar_url: shop.avatar_url || null,
    categories: shop.categories || [],
    offers_delivery: shop.offers_delivery || false,
    delivery_fee_fcfa: String(shop.delivery_fee_fcfa || 0),
  });
  const [busy, setBusy] = useState(false);

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
        banner_url: form.banner_url,
        avatar_url: form.avatar_url,
        categories: form.categories,
        offers_delivery: form.offers_delivery,
        delivery_fee_fcfa: Math.max(0, Math.round(Number(form.delivery_fee_fcfa) || 0)),
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
        <ImageUpload bucket="shops" value={form.banner_url} onChange={(p) => setForm({ ...form, banner_url: p })} label={t('vendor.shopBanner')} shape="wide" />
        <ImageUpload bucket="shops" value={form.avatar_url} onChange={(p) => setForm({ ...form, avatar_url: p })} label={t('vendor.shopAvatar')} shape="round" />
        <Field label={t('vendor.shopName')}>
          {(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label={t('vendor.shopBio')}>
          {(id) => <TextArea id={id} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />}
        </Field>
        <Field label={t('vendor.shopWhatsapp')}>
          {(id) => <TextInput id={id} type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />}
        </Field>
        <div>
          <span className="label">{t('vendor.shopCategories')}</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>
                {t(`categories.${c.id}`)}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-card border border-hairline p-3">
          <input type="checkbox" checked={form.offers_delivery} onChange={(e) => setForm({ ...form, offers_delivery: e.target.checked })} className="h-5 w-5 accent-[#0F4C4C]" />
          <span className="flex-1 text-body text-ink">{t('checkout.delivery')}</span>
        </label>
        {form.offers_delivery && (
          <Field label={t('checkout.deliveryFee')}>
            {(id) => <TextInput id={id} type="number" inputMode="numeric" value={form.delivery_fee_fcfa} onChange={(e) => setForm({ ...form, delivery_fee_fcfa: e.target.value })} />}
          </Field>
        )}
        <Link to={`/boutique/${shop.slug}`} className="btn-ghost inline-flex"><IconExternalLink size={18} /> {t('vendor.previewShop')}</Link>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        <Button onClick={save} loading={busy}>{t('common.save')}</Button>
      </div>
    </div>
  );
}
