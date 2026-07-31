import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconScale, IconPhotoPlus, IconLoader2 } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { fileToDataUrl } from '../lib/image';
import { Modal } from './Modal';
import { Button } from './Button';
import { formatPrice } from '../lib/currency';
import { useSettings } from '../hooks/useSettings';

// Évaluateur de troc (Finou 2.0, capacité 10): deux photos → état et valeur
// estimée de chaque objet + la soulte qui rééquilibre l'échange. Les photos
// partent en base64 vers l'edge function troc-eval (même flux que le selfie
// du Miroir IA) — rien n'est stocké, aucun échange n'est créé: c'est une AIDE
// à la négociation entre les deux personnes, et l'UI le dit.
export function TrocEvalModal({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const { currency } = useSettings();
  const [photos, setPhotos] = useState({ a: null, b: null }); // { dataUrl }
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const refA = useRef(null);
  const refB = useRef(null);

  async function pick(side, file) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhotos((p) => ({ ...p, [side]: { dataUrl } }));
    setResult(null);
  }

  async function evaluate() {
    if (!photos.a || !photos.b) return;
    setBusy(true);
    setError(false);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('troc-eval', {
        body: {
          image_a: photos.a.dataUrl.split(',')[1],
          mime_a: 'image/jpeg',
          image_b: photos.b.dataUrl.split(',')[1],
          mime_b: 'image/jpeg',
          lang: i18n.language,
        },
      });
      if (fnErr || !data?.item_a) throw fnErr || new Error('empty');
      setResult(data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPhotos({ a: null, b: null });
    setResult(null);
    setError(false);
  }

  const slot = (side, ref) => (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-card border border-dashed border-hairline bg-base"
    >
      {photos[side] ? (
        <img src={photos[side].dataUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <IconPhotoPlus size={22} className="text-muted" />
          <span className="text-caption text-muted">{t(`troc.photo${side.toUpperCase()}`)}</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(side, e.target.files?.[0])}
      />
    </button>
  );

  const itemLine = (label, item) => (
    <p className="text-body text-ink">
      <span className="font-semibold">{label}:</span> {item.objet} — {t(`troc.etat.${item.etat}`, { defaultValue: item.etat })},{' '}
      ≈ {formatPrice(item.valeur_estimee_fcfa, currency, i18n.language)}
    </p>
  );

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t('troc.title')}>
      <div className="space-y-3">
        <p className="text-caption text-muted">{t('troc.intro')}</p>
        <div className="grid grid-cols-2 gap-3">
          {slot('a', refA)}
          {slot('b', refB)}
        </div>

        {result && (
          <div className="space-y-1.5 rounded-card border border-brass/40 bg-brass/5 p-3">
            {itemLine(t('troc.itemA'), result.item_a)}
            {itemLine(t('troc.itemB'), result.item_b)}
            <p className="pt-1 text-body font-semibold text-ink">
              <IconScale size={16} className="mr-1 inline text-brass" />
              {result.en_faveur_de === 'aucun'
                ? t('troc.fair')
                : t('troc.soulte', {
                    amount: formatPrice(result.soulte_fcfa, currency, i18n.language),
                    item: result.en_faveur_de === 'a' ? result.item_b.objet : result.item_a.objet,
                  })}
            </p>
            {result.conseil && <p className="text-caption text-muted">{result.conseil}</p>}
            <p className="text-[11px] text-muted">{t('troc.disclaimer')}</p>
          </div>
        )}
        {error && <p className="text-caption text-danger">{t('troc.error')}</p>}

        <Button onClick={evaluate} loading={busy} disabled={!photos.a || !photos.b}>
          {t('troc.evaluate')}
        </Button>
      </div>
    </Modal>
  );
}
