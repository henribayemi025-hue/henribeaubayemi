import { useRef, useState } from 'react';
import { IconUpload, IconX, IconLoader2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { supabase, storageUrl } from '../lib/supabase';
import { compressForUpload } from '../lib/image';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

// Uploads a single image to a Supabase Storage bucket and returns its path
// via onChange. `shape` = 'wide' | 'square' | 'round'.
export function ImageUpload({ bucket, value, onChange, onBusyChange, label, shape = 'square', accept = 'image/*' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusyState] = useState(false);
  const setBusy = (v) => {
    setBusyState(v);
    onBusyChange?.(v);
  };

  const aspect = shape === 'wide' ? 'aspect-[16/7]' : 'aspect-square';
  const rounded = shape === 'round' ? 'rounded-full' : 'rounded-card';
  const preview = value ? (value.startsWith('http') ? value : storageUrl(bucket, value)) : null;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast.error(t('auth.loginNeeded'));
      return;
    }
    setBusy(true);
    try {
      // Downscale + re-encode before upload — phone photos routinely arrive at
      // several MB, which is what makes images feel slow to load later,
      // independent of how much data is in the app. Les réglages (1200 px,
      // WebP) vivent dans lib/image.js, pas ici.
      const { blob, contentType, ext } = await compressForUpload(file);
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: false, contentType });
      if (error) throw error;
      onChange(path);
    } catch (err) {
      toast.error(err.message || t('errors.generic'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className={`relative ${aspect} w-full overflow-hidden ${rounded} border border-dashed border-hairline bg-[#FAF6F0] ${shape === 'round' ? 'mx-auto max-w-[112px]' : ''}`}>
        {preview && <img src={preview} alt="" className={`h-full w-full object-cover ${rounded}`} />}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-caption text-muted"
          aria-label={t('becomeVendor.uploadImage')}
        >
          {busy ? (
            <IconLoader2 size={22} className="animate-spin text-teal" />
          ) : !preview ? (
            <>
              <IconUpload size={22} className="text-teal" />
              <span>{t('becomeVendor.uploadImage')}</span>
            </>
          ) : null}
        </button>
        {preview && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
            aria-label={t('common.delete')}
          >
            <IconX size={16} />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}
