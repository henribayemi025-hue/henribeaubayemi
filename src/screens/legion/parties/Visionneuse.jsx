import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconDownload, IconX } from '@tabler/icons-react';

// Une image en grand (Beau, 25/09 : « l'image générée est trop petite »).
// Plein écran, sur fond noir, avec le téléchargement ; Échap ou un clic à
// côté referme. Rendue sur <body> pour passer au-dessus de tout.
export function Visionneuse({ url, nom, onFermer }) {
  useEffect(() => {
    if (!url) return undefined;
    const touche = (e) => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('keydown', touche);
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', touche); document.body.style.overflow = avant; };
  }, [url, onFermer]);
  if (!url) return null;
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-3 sm:p-8" role="dialog" aria-modal="true" onClick={onFermer}>
      <img src={url} alt={nom || ''} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <div className="absolute right-3 top-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <a href={url} download={nom || 'image'} target="_blank" rel="noreferrer" aria-label="download"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"><IconDownload size={20} /></a>
        <button type="button" onClick={onFermer} aria-label="close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30"><IconX size={20} /></button>
      </div>
    </div>,
    document.body,
  );
}
