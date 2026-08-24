import { useEffect, useRef, useState } from 'react';
import { IconUpload, IconX, IconLoader2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { supabase, storageUrl } from '../lib/supabase';
import { compressForUploadWithThumb } from '../lib/image';
import { uid } from '../lib/uid';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

// Le seul bucket privé de l'app (pièces d'identité) — getPublicUrl() y renvoie
// une URL qui répond 403 (elle n'est pas signée), donc son aperçu doit passer
// par une URL signée à durée limitée plutôt que par storageUrl().
const PRIVATE_BUCKETS = new Set(['ids']);

// Fichiers photo au-delà de cette taille (HEIC/ProRAW plein format, Live Photo…)
// donnent un message clair au lieu de laisser l'envoi échouer silencieusement
// contre la limite du serveur.
const MAX_FILE_BYTES = 20 * 1024 * 1024;

// Uploads a single image to a Supabase Storage bucket and returns its path
// via onChange. `shape` = 'wide' | 'square' | 'round'.
//
// `onAddMany`: dans une galerie (fiche article), la case VIDE doit ouvrir le
// sélecteur multiple — c'est la case sur laquelle on tape naturellement, et
// personne ne devrait rouvrir la galerie photo par photo. La case déjà
// remplie garde le remplacement à l'unité.
export function ImageUpload({ bucket, value, onChange, onBusyChange, label, shape = 'square', accept = 'image/*', onAddMany }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusyState] = useState(false);
  const [signedPreview, setSignedPreview] = useState(null);
  const setBusy = (v) => {
    setBusyState(v);
    onBusyChange?.(v);
  };

  const aspect = shape === 'wide' ? 'aspect-[16/7]' : 'aspect-square';
  const rounded = shape === 'round' ? 'rounded-full' : 'rounded-card';
  const isPrivate = PRIVATE_BUCKETS.has(bucket);
  const preview = value ? (value.startsWith('http') ? value : isPrivate ? signedPreview : storageUrl(bucket, value)) : null;

  // Bucket privé: pas d'URL publique valide, il faut la signer côté client.
  useEffect(() => {
    if (!isPrivate || !value || value.startsWith('http')) {
      setSignedPreview(null);
      return;
    }
    let cancelled = false;
    supabase.storage.from(bucket).createSignedUrl(value, 3600).then(({ data }) => {
      if (!cancelled) setSignedPreview(data?.signedUrl || null);
    });
    return () => {
      cancelled = true;
    };
  }, [bucket, isPrivate, value]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast.error(t('auth.loginNeeded'));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(t('becomeVendor.imageTooLarge'));
      return;
    }
    setBusy(true);
    try {
      // Downscale + re-encode before upload — phone photos routinely arrive at
      // several MB, which is what makes images feel slow to load later,
      // independent of how much data is in the app. Les réglages (1200 px,
      // WebP) vivent dans lib/image.js, pas ici.
      //
      // Une vignette légère est envoyée EN PLUS de l'image normale, sous le
      // même nom + `_thumb` (voir storageThumbUrl côté lecture) — c'est elle
      // qui s'affiche dans les avatars/listes, la pleine taille ne sert qu'aux
      // grandes bannières. Si le fichier ne se décode pas en canvas (HEIC…),
      // compressForUploadWithThumb renvoie le fichier original et thumb=null
      // plutôt que d'échouer — voir lib/image.js.
      const { full, thumb } = await compressForUploadWithThumb(file);
      const uuid = uid();
      const path = `${user.id}/${uuid}.${full.ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, full.blob, { upsert: false, contentType: full.contentType });
      if (error) throw error;
      // Meilleur effort: si la vignette échoue (ou n'existe pas), SmartImage
      // retombe sur la pleine taille (404 géré côté lecture) — ça ne doit
      // jamais bloquer l'envoi de la photo elle-même.
      if (thumb) {
        const thumbPath = `${user.id}/${uuid}_thumb.${full.ext}`;
        supabase.storage.from(bucket).upload(thumbPath, thumb.blob, { upsert: false, contentType: thumb.contentType }).catch(() => {});
      }
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
          onClick={() => (!value && onAddMany ? onAddMany() : inputRef.current?.click())}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-caption text-muted"
          aria-label={!value && onAddMany ? t('vendor.addPhotos') : t('becomeVendor.uploadImage')}
        >
          {busy ? (
            <IconLoader2 size={22} className="animate-spin text-teal" />
          ) : !preview ? (
            <>
              <IconUpload size={22} className="text-teal" />
              <span>{onAddMany ? t('vendor.addPhotos') : t('becomeVendor.uploadImage')}</span>
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
