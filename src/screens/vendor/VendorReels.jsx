import { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconMovie, IconEye, IconHeart, IconTrash } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, Select } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { CATEGORIES, SELECTABLE_SUBCATEGORIES } from '../../lib/categories';

// Limite RÉELLE d'un fichier chez Supabase (offre gratuite). Une vidéo de
// téléphone la dépasse très vite: 40 secondes en 1080p suffisent. Sans
// contrôle, l'envoi partait quand même, échouait au bout de plusieurs minutes
// de téléversement, et n'affichait qu'un message technique — « une personne se
// plaint que quand le fichier est gros ça ne part pas » (Beau). On le dit donc
// AVANT, avec le poids réel du fichier et quoi faire.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export default function VendorReels() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function removeReel(reel, retry) {
    setDeleting(reel.id);
    // Le fichier part AVEC la fiche: une vidéo orpheline dans le stockage,
    // c'est du quota consommé pour rien, et on est à 171 Mo sur 1 Go.
    if (reel.video_url && !reel.video_url.startsWith('/')) {
      await supabase.storage.from('reels').remove([reel.video_url]);
    }
    const { error } = await supabase.from('reels').delete().eq('id', reel.id);
    setDeleting(null);
    if (error) toast.error(error.message);
    else { toast.success(t('vendor.reelDeleted')); retry(); }
  }

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
              {/* La vignette était un simple <div>: cliquer dessus ne faisait
                  RIEN (« je clique sur ça, rien » — Beau). Elle ouvre
                  maintenant le fil public filtré sur la boutique, pour voir
                  sa vidéo exactement comme une cliente la voit.
                  `#t=0.1` force le navigateur à afficher l'image d'une
                  vraie seconde du film: sans ça la vignette reste NOIRE
                  jusqu'à lecture, et on croit que ses réels ont disparu. */}
              <button
                onClick={() => navigate(`/fin?shop=${shop.id}`)}
                className="block w-full"
                aria-label={t('vendor.reelOpen')}
              >
                <video
                  src={`${storageUrl('reels', r.video_url)}#t=0.1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-[9/16] w-full object-cover"
                />
              </button>
              <button
                onClick={() => removeReel(r, retry)}
                disabled={deleting === r.id}
                aria-label={t('common.delete')}
                className="absolute right-1 top-1 rounded-full bg-black/55 p-1.5 text-white disabled:opacity-50"
              >
                <IconTrash size={14} />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[11px] text-white">
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
  // Vide au départ, VOLONTAIREMENT: une catégorie pré-remplie serait acceptée
  // sans y penser, et le réel finirait au mauvais rayon. Beau: « si quelqu'un
  // ne choisit pas la catégorie, ça ne dit pas non, ça publie juste ».
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const subcats = SELECTABLE_SUBCATEGORIES[category];

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error(t('vendor.reelVideo'));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t('vendor.reelTooBig', { size: Math.round(file.size / 1024 / 1024) }));
      return;
    }
    // Sans rayon, la vidéo n'apparaît dans aucun filtre du fil Fin: elle est
    // publiée pour personne. On refuse plutôt que de publier en silence.
    if (!category) {
      toast.error(t('vendor.reelCategoryRequired'));
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
        category: subcats ? (subcats.includes(category) ? category : subcats[0]) : category,
        product_id: productId || null,
      });
      if (error) throw error;
      toast.success(t('vendor.reelPublished'));
      setCaption(''); setProductId(''); setCategory('');
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
        <p className="text-caption text-muted">{t('vendor.reelSizeHint')}</p>
        {/* Le RAYON, pas « produit associé ». Le menu ne listait que les
            articles de la boutique — sur une boutique beauté, on n'y voyait
            que de la beauté, et on croyait que Finjaro n'avait qu'une
            catégorie. Ici c'est l'arborescence entière du site. */}
        <Field label={t('vendor.reelCategory')} required>
          {(id) => (
            <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('vendor.reelCategoryPlaceholder')}</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
            </Select>
          )}
        </Field>
        {subcats && (
          <Field label={t('vendor.productSubcategory')}>
            {(id) => (
              <Select id={id} value={subcats.includes(category) ? category : subcats[0]} onChange={(e) => setCategory(e.target.value)}>
                {subcats.map((cid) => <option key={cid} value={cid}>{t(`categories.${cid}`)}</option>)}
              </Select>
            )}
          </Field>
        )}
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
