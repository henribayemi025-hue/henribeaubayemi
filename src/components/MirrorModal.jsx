import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCamera, IconRefresh, IconDownload, IconSparkles } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { fileToBase64 } from '../lib/image';
import { Modal } from './Modal';
import { Button } from './Button';
import { Spinner } from './Spinner';

// Virtual try-on: upload a selfie, see yourself wearing a specific product.
// The photo is never stored (no Supabase Storage write) — it goes straight
// to the miroir-ia edge function, which forwards it to Gemini and discards
// it. Server-side daily quota (see miroir-ia) keeps Gemini's per-image cost
// bounded regardless of what the client does.
export function MirrorModal({ open, onClose, product }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [selfie, setSelfie] = useState(null); // { base64, previewUrl }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { image, mimeType }
  const [error, setError] = useState(null); // 'limit' | 'generic'
  const [errorDetail, setErrorDetail] = useState(null); // raw server/Gemini message, shown for diagnosis

  function reset() {
    setSelfie(null);
    setResult(null);
    setError(null);
    setErrorDetail(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';
    try {
      const base64 = await fileToBase64(file);
      setSelfie({ base64, previewUrl: URL.createObjectURL(file) });
      setResult(null);
      setError(null);
    } catch {
      /* unreadable image — user can just try another photo */
    }
  }

  async function generate() {
    if (!selfie) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const prompt = product.name + (product.description ? ` (${product.description.slice(0, 120)})` : '');
      const { data, error: fnErr } = await supabase.functions.invoke('miroir-ia', {
        body: { selfieBase64: selfie.base64, prompt },
      });
      if (fnErr) {
        // supabase-js only gives us the HTTP status by default on a non-2xx
        // response (fnErr.context is the raw Response) — read the actual JSON
        // body our function sent so we distinguish OUR daily quota from a
        // real error (e.g. Gemini billing/quota) instead of mislabeling any
        // 429 as "you hit today's limit".
        let body = null;
        try {
          body = await fnErr.context?.json();
        } catch {
          /* body unreadable — fall through to generic */
        }
        if (body?.error === 'daily_limit_reached') {
          setError('limit');
        } else if (body?.error === 'budget_paused') {
          setError('paused');
        } else {
          setError('generic');
          setErrorDetail(body?.error || fnErr.message);
        }
        return;
      }
      if (data?.error) {
        if (data.error === 'daily_limit_reached') {
          setError('limit');
        } else if (data.error === 'budget_paused') {
          setError('paused');
        } else {
          setError('generic');
          setErrorDetail(data.error);
        }
        return;
      }
      setResult({ image: data.image, mimeType: data.mimeType || 'image/png' });
    } catch (e) {
      setError('generic');
      setErrorDetail(e?.message);
    } finally {
      setLoading(false);
    }
  }

  const resultSrc = result ? `data:${result.mimeType};base64,${result.image}` : null;

  return (
    <Modal open={open} onClose={handleClose} title={t('mirror.title')}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      {!selfie && !result && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <IconSparkles size={40} className="text-brass" />
          <p className="text-body text-ink">{t('mirror.intro', { name: product.name })}</p>
          <Button onClick={() => fileRef.current?.click()}>
            <IconCamera size={18} /> {t('mirror.pickPhoto')}
          </Button>
          <p className="text-caption text-muted">{t('mirror.privacyNote')}</p>
        </div>
      )}

      {selfie && !result && !loading && (
        <div className="flex flex-col items-center gap-3 py-2">
          <img src={selfie.previewUrl} alt="" className="h-56 w-56 rounded-card object-cover" />
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn-ghost text-caption">
              <IconRefresh size={16} /> {t('mirror.changePhoto')}
            </button>
          </div>
          <Button onClick={generate}>
            <IconSparkles size={18} /> {t('mirror.generate')}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Spinner />
          <p className="text-caption text-muted">{t('mirror.generating')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-body text-danger">
            {error === 'limit' ? t('mirror.limitReached') : error === 'paused' ? t('mirror.paused') : t('mirror.error')}
          </p>
          {/* Raw server/Gemini message — helps diagnose (e.g. billing/quota)
              instead of a dead-end generic error. */}
          {errorDetail && <p className="max-w-xs text-caption text-muted">{errorDetail}</p>}
          {error !== 'limit' && error !== 'paused' && (
            <button onClick={generate} className="btn-ghost text-caption">
              <IconRefresh size={16} /> {t('common.retry')}
            </button>
          )}
        </div>
      )}

      {result && !loading && (
        <div className="flex flex-col items-center gap-3 py-2">
          <img src={resultSrc} alt={t('mirror.title')} className="w-full rounded-card object-cover" />
          <div className="flex gap-2">
            <a
              href={resultSrc}
              download="finjaro-essayage.jpg"
              className="btn-ghost text-caption"
            >
              <IconDownload size={16} /> {t('mirror.save')}
            </a>
            <button onClick={() => { setResult(null); setError(null); }} className="btn-ghost text-caption">
              <IconRefresh size={16} /> {t('mirror.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
