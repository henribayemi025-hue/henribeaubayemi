import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconMovie, IconEye, IconHeart } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, Select } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';

export default function VendorReels() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const [{ data: reels, error: rErr }, { data: products }] = await Promise.all([
      supabase.from('reels').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('shop_id', shop.id),
    ]);
    if (rErr) throw rErr;
    return { reels: reels || [], products: products || [] };
  }, [shop.id]);

  return (
    <div className="pb-6">
      <AppHeader
        title={t('nav.reels')}
        right={<button onClick={() => setOpen(true)} aria-label={t('vendor.publishReel')} className="rounded-full bg-teal p-1.5 text-white"><IconPlus size={20} /></button>}
      />
      {loading ? (
        <div className="grid grid-cols-3 gap-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[9/16] w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : data.reels.length === 0 ? (
        <EmptyState icon={IconMovie} title={t('vendor.reelsEmpty')} action={<Button onClick={() => setOpen(true)}>{t('vendor.publishReel')}</Button>} />
      ) : (
        <div className="grid grid-cols-3 gap-2 p-4">
          {data.reels.map((r) => (
            <div key={r.id} className="relative overflow-hidden rounded-input bg-black">
              <video src={storageUrl('reels', r.video_url)} muted playsInline preload="metadata" className="aspect-[9/16] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[11px] text-white">
                <span className="flex items-center gap-0.5"><IconEye size={12} />{r.views || 0}</span>
                <span className="flex items-center gap-0.5"><IconHeart size={12} />{r.likes || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <UploadReel open={open} onClose={() => setOpen(false)} shop={shop} products={data?.products || []} onDone={retry} toast={toast} />
    </div>
  );
}

function UploadReel({ open, onClose, shop, products, onDone, toast }) {
  const { t } = useTranslation();
  const [caption, setCaption] = useState('');
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error(t('vendor.reelVideo'));
      return;
    }
    setBusy(true);
    try {
      const path = `${shop.owner_id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('reels').upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from('reels').insert({
        shop_id: shop.id,
        video_url: path,
        caption: caption.trim() || null,
        product_id: productId || null,
      });
      if (error) throw error;
      toast.success(t('vendor.reelPublished'));
      setCaption(''); setProductId('');
      if (fileRef.current) fileRef.current.value = '';
      onClose();
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('vendor.publishReel')}>
      <div className="space-y-3">
        <Field label={t('vendor.reelVideo')}>
          {(id) => <input id={id} ref={fileRef} type="file" accept="video/*" className="input py-2" />}
        </Field>
        <Field label={t('vendor.reelCaption')}>
          {(id) => <TextArea id={id} value={caption} onChange={(e) => setCaption(e.target.value)} />}
        </Field>
        <Field label={`${t('vendor.reelLinkedProduct')} ${t('common.optional')}`}>
          {(id) => (
            <Select id={id} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          )}
        </Field>
        <Button onClick={submit} loading={busy}>{t('vendor.publishReel')}</Button>
      </div>
    </Modal>
  );
}
