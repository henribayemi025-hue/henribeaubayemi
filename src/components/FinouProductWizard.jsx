import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconX, IconPhotoPlus, IconTrash, IconSparkles, IconLoader2, IconCheck, IconArrowLeft,
} from '@tabler/icons-react';
import { supabase, storageUrl } from '../lib/supabase';
import { compressImage, compressForUpload, THUMB_OPTS } from '../lib/image';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { CATEGORIES } from '../lib/categories';
import { currencyForCountry, toFcfa } from '../lib/currency';
import { SmartImage } from './SmartImage';

const STEPS = ['photos', 'category', 'details', 'description', 'confirm', 'done'];
const MAX_IMAGES = 5;

// Post a product without ever leaving Finou: photos -> category -> name/price
// -> description (typed, or "write it for me" via the same vendor-copilot
// Gemini call used on the full form) -> confirm -> publish. A single inline
// card that advances in place (not one bubble per step) — simpler and more
// reliable than free-text parsing for fields that must be valid (price is a
// number, category must be a real id), while still feeling conversational.
export function FinouProductWizard({ onClose, onPublished }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useVendorStatus();
  const fileRef = useRef(null);
  const currency = currencyForCountry(shop?.country);

  const [step, setStep] = useState('photos');
  const [images, setImages] = useState([]); // [{ blob, previewUrl }]
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  async function onPickPhotos(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      const next = compressed.map((blob) => ({ blob, previewUrl: URL.createObjectURL(blob) }));
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function generateDescription() {
    if (!name.trim()) return;
    setGenLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('vendor-copilot', {
        body: { name: name.trim(), category, price, currency, lang: i18n.language },
      });
      if (fnErr || !data?.description) throw fnErr || new Error('empty');
      setDescription(data.description);
    } catch {
      setError(t('vendor.copilotError'));
    } finally {
      setGenLoading(false);
    }
  }

  async function publish() {
    if (!shop) return;
    setPosting(true);
    setError(null);
    try {
      const paths = await Promise.all(
        images.map(async (img) => {
          // Le blob peut être du WebP ou du JPEG selon le navigateur: on suit
          // son type réel plutôt que de coder .jpg en dur.
          const contentType = img.blob.type || 'image/jpeg';
          const ext = contentType === 'image/webp' ? 'webp' : 'jpg';
          const uuid = crypto.randomUUID();
          const path = `${user.id}/${uuid}.${ext}`;
          const { error: upErr } = await supabase.storage.from('products').upload(path, img.blob, { upsert: false, contentType });
          if (upErr) throw upErr;
          // Vignette légère dérivée du blob déjà compressé (pas besoin du
          // fichier original) — même convention de nom que les autres points
          // d'envoi, best-effort.
          compressForUpload(img.blob, THUMB_OPTS)
            .then((t) => supabase.storage.from('products').upload(`${user.id}/${uuid}_thumb.${ext}`, t.blob, { upsert: false, contentType: t.contentType }))
            .catch(() => {});
          return path;
        })
      );
      const payload = {
        shop_id: shop.id,
        name: name.trim(),
        price_fcfa: toFcfa(Number(price), currency),
        description: description.trim() || null,
        category,
        stock: 1,
        images: paths,
      };
      const { data: product, error: insErr } = await supabase.from('products').insert(payload).select('id').single();
      if (insErr) throw insErr;
      setStep('done');
      onPublished?.(product.id);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setPosting(false);
    }
  }

  const stepIdx = STEPS.indexOf(step);
  function back() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  }

  return (
    <div className="mt-2 overflow-hidden rounded-card border border-teal/30 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-hairline bg-teal/5 px-3 py-2">
        {stepIdx > 0 && step !== 'done' && (
          <button onClick={back} aria-label={t('common.back')} className="text-teal">
            <IconArrowLeft size={18} />
          </button>
        )}
        <span className="flex-1 text-caption font-semibold text-teal">{t('finouWizard.title')}</span>
        <button onClick={onClose} aria-label={t('common.close')} className="text-muted">
          <IconX size={18} />
        </button>
      </div>

      <div className="p-3">
        {step === 'photos' && (
          <div>
            <p className="mb-2 text-body text-ink">{t('finouWizard.askPhotos')}</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-input">
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    aria-label={t('common.delete')}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-input border border-dashed border-hairline text-caption text-muted"
                >
                  {uploading ? <IconLoader2 size={20} className="animate-spin" /> : <IconPhotoPlus size={20} />}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickPhotos} />
            <button
              onClick={() => setStep('category')}
              disabled={images.length === 0}
              className="mt-3 w-full rounded-input bg-teal py-2 text-caption font-semibold text-white disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 'category' && (
          <div>
            <p className="mb-2 text-body text-ink">{t('finouWizard.askCategory')}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.id); setStep('details'); }}
                  className={`chip ${category === c.id ? 'chip-active' : 'text-ink'}`}
                >
                  {t(`categories.${c.id}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-2">
            <p className="mb-1 text-body text-ink">{t('finouWizard.askDetails')}</p>
            <input
              className="input text-[16px]"
              placeholder={t('vendor.productName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input text-[16px]"
              type="number"
              inputMode="decimal"
              placeholder={`${t('vendor.productPrice')} (${currency})`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <button
              onClick={() => setStep('description')}
              disabled={!name.trim() || price === '' || Number(price) < 0}
              className="w-full rounded-input bg-teal py-2 text-caption font-semibold text-white disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-2">
            <p className="mb-1 text-body text-ink">{t('finouWizard.askDescription')}</p>
            <textarea
              className="input min-h-[80px] text-[16px]"
              placeholder={t('vendor.productDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              onClick={generateDescription}
              disabled={genLoading || !name.trim()}
              className="btn-ghost w-full text-caption text-teal disabled:opacity-40"
            >
              {genLoading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSparkles size={16} />}
              {t('finouWizard.writeForMe')}
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="w-full rounded-input bg-teal py-2 text-caption font-semibold text-white"
            >
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <p className="text-body text-ink">{t('finouWizard.confirm')}</p>
            <div className="flex gap-3 rounded-input border border-hairline p-2">
              {images[0] && <SmartImage src={images[0].previewUrl} alt="" className="h-16 w-16 shrink-0" rounded="rounded-input" />}
              <div className="min-w-0">
                <p className="line-clamp-1 text-body font-semibold text-ink">{name}</p>
                <p className="text-caption text-teal">{price} {currency}</p>
                <p className="text-caption text-muted">{t(`categories.${category}`)}</p>
              </div>
            </div>
            {error && <p className="text-caption text-danger">{error}</p>}
            <button
              onClick={publish}
              disabled={posting}
              className="flex w-full items-center justify-center gap-1.5 rounded-input bg-teal py-2.5 text-caption font-semibold text-white disabled:opacity-60"
            >
              {posting ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
              {t('finouWizard.publish')}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <IconCheck size={28} className="text-success" />
            <p className="text-body text-ink">{t('finouWizard.published')}</p>
            <button
              onClick={() => { onClose(); navigate('/vendor'); }}
              className="mt-1 rounded-input bg-teal px-4 py-2 text-caption font-semibold text-white"
            >
              {t('finouWizard.viewDashboard')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
