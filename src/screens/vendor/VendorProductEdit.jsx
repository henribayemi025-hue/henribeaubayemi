import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrash } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
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

export default function VendorProductEdit() {
  const { id } = useParams();
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = id === 'new';
  // Vendors enter prices in their shop's own currency (France → EUR, Cameroun →
  // FCFA…). We store canonically in FCFA and convert on the way in/out.
  const shopCurrency = currencyForCountry(shop.country);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    const payload = {
      shop_id: shop.id,
      name: form.name.trim(),
      price_fcfa: toFcfa(Number(form.price_fcfa), shopCurrency),
      description: form.description.trim() || null,
      category: form.category,
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      images: form.images,
    };
    const res = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', id);
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(t('vendor.productSaved'));
    navigate('/vendor/products');
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
          <span className="label">{t('vendor.productImages')}</span>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <ImageUpload key={i} bucket="products" value={form.images[i] || null} onChange={(p) => setImage(i, p)} shape="square" />
            ))}
          </div>
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
        <Button onClick={save} loading={busy}>{t('common.save')}</Button>
      </div>
    </div>
  );
}
