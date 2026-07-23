import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconPhotoPlus } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { Spinner } from '../../components/Spinner';
import { CATEGORIES } from '../../lib/categories';
import { currencyForCountry } from '../../lib/currency';
import { convertFromFcfa, toFcfa } from '../../lib/currency';

const blank = { name: '', price_fcfa: '', description: '', category: 'mode', stock: '1', images: [] };
const MAX_IMAGES = 10;

export default function VendorProductEdit() {
  const { id } = useParams();
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const multiRef = useRef(null);
  const isNew = id === 'new';
  // Vendors enter prices in their shop's own currency (France → EUR, Cameroun →
  // FCFA…). We store canonically in FCFA and convert on the way in/out.
  const shopCurrency = currencyForCountry(shop.country);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0); // images still uploading
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isNew) return;
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) {
        const shown = convertFromFcfa(data.price_fcfa, shopCurrency);
        setForm({
          ...data,
          price_fcfa: String(shopCurrency === 'FCFA' ? Math.round(shown) : Number(shown.toFixed(2))),
          stock: String(data.stock ?? 0),
          images: data.images || [],
        });
      }
      setLoading(false);
    });
  }, [id, isNew, shopCurrency]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t('common.required');
    if (form.price_fcfa === '' || Number(form.price_fcfa) < 0) e.price = t('common.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    if (uploads > 0) {
      toast.info(t('vendor.imageStillUploading'));
      return;
    }
    setBusy(true);
    // Guard against a stalled network request leaving the button spinning
    // forever: abort after 25s and surface a retryable error instead.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const payload = {
        shop_id: shop.id,
        name: form.name.trim(),
        price_fcfa: toFcfa(Number(form.price_fcfa), shopCurrency),
        description: form.description.trim() || null,
        category: form.category,
        stock: Math.max(0, Math.round(Number(form.stock) || 0)),
        images: form.images.filter(Boolean),
      };
      const res = isNew
        ? await supabase.from('products').insert(payload).abortSignal(controller.signal)
        : await supabase.from('products').update(payload).eq('id', id).abortSignal(controller.signal);
      if (res.error) throw res.error;
      toast.success(t('vendor.productSaved'));
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err?.name === 'AbortError' ? t('errors.network') : err?.message || t('errors.generic'));
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  async function del() {
    if (!window.confirm(t('vendor.deleteProductConfirm'))) return;
    setBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('vendor.productDeleted'));
    navigate('/vendor/products');
  }

  function setImage(idx, path) {
    setForm((f) => {
      const images = [...f.images];
      if (path === null) images.splice(idx, 1);
      else images[idx] = path;
      return { ...f, images };
    });
  }

  // Pick many photos at once from the gallery and upload them in parallel.
  // Uses allSettled so one bad file never blocks the others, and unique UUID
  // names so two uploads can't collide.
  async function onMultiFiles(e) {
    const files = Array.from(e.target.files || []);
    if (multiRef.current) multiRef.current.value = '';
    if (!files.length) return;
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) {
      toast.info(t('vendor.productImagesHint', { count: MAX_IMAGES }));
      return;
    }
    const batch = files.slice(0, room);
    setUploads((n) => n + batch.length);
    try {
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          const ext = file.name.split('.').pop();
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage.from('products').upload(path, file, { upsert: false });
          if (error) throw error;
          return path;
        })
      );
      const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const failed = results.length - ok.length;
      if (ok.length) setForm((f) => ({ ...f, images: [...f.images, ...ok].slice(0, MAX_IMAGES) }));
      if (failed) toast.error(t('errors.generic'));
    } finally {
      setUploads((n) => Math.max(0, n - batch.length));
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div>
      <AppHeader
        title={isNew ? t('vendor.newProduct') : t('vendor.editProduct')}
        back
        right={!isNew && <button onClick={del} aria-label={t('common.delete')} className="p-1 text-danger"><IconTrash size={20} /></button>}
      />
      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">{t('vendor.productImages')}</span>
            {form.images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => multiRef.current?.click()}
                className="btn-ghost text-caption"
              >
                <IconPhotoPlus size={18} /> {t('vendor.addPhotos')}
              </button>
            )}
          </div>
          <input ref={multiRef} type="file" accept="image/*" multiple className="hidden" onChange={onMultiFiles} />
          {/* Existing photos + one empty slot to add another, up to MAX_IMAGES. */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(form.images.length + 1, MAX_IMAGES) }).map((_, i) => (
              <ImageUpload
                key={i}
                bucket="products"
                value={form.images[i] || null}
                onChange={(p) => setImage(i, p)}
                onBusyChange={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}
                shape="square"
              />
            ))}
          </div>
          <p className="mt-1 text-caption text-muted">{t('vendor.productImagesHint', { count: MAX_IMAGES })}</p>
        </div>
        <Field label={t('vendor.productName')} required error={errors.name}>
          {(fid) => <TextInput id={fid} value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label={`${t('vendor.productPrice')} (${shopCurrency})`} required error={errors.price}>
          {(fid) => <TextInput id={fid} type="number" inputMode="decimal" value={form.price_fcfa} error={errors.price} onChange={(e) => setForm({ ...form, price_fcfa: e.target.value })} />}
        </Field>
        <Field label={t('vendor.productCategory')}>
          {(fid) => (
            <Select id={fid} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t('vendor.productStock')}>
          {(fid) => <TextInput id={fid} type="number" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />}
        </Field>
        <Field label={t('vendor.productDescription')}>
          {(fid) => <TextArea id={fid} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
        </Field>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        <Button onClick={save} loading={busy} disabled={uploads > 0}>
          {uploads > 0 ? t('vendor.imageStillUploading') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
