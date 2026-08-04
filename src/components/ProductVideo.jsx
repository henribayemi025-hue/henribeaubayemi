import { useEffect, useRef, useState } from 'react';
import { IconVideo } from '@tabler/icons-react';
import { storageUrl } from '../lib/supabase';
import { posterPathFor } from '../lib/video';

// Vidéo d'article qui se lance TOUTE SEULE — décision de Beau (04/08): le fil
// doit bouger dès l'ouverture, comme TikTok.
//
// « Se lancer toute seule » ne peut pas vouloir dire « toutes en même temps »:
// les navigateurs mobiles refusent de lire plus d'une poignée de vidéos à la
// fois, et télécharger celles qu'on ne regarde pas viderait le forfait des
// clientes en 3G pour rien. On lit donc celles qui sont À L'ÉCRAN, et
// l'image de couverture tient la place pour les autres — visuellement c'est
// « tout bouge », sans le gaspillage.
//
// `muted` + `playsInline` ne sont pas décoratifs: sans eux, iOS et Chrome
// bloquent purement et simplement la lecture automatique.
export function ProductVideo({ videoUrl, poster, alt, className = '', bucket = 'products' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const src = storageUrl(bucket, videoUrl);
  const posterSrc = poster || storageUrl(bucket, posterPathFor(videoUrl));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Sans IntersectionObserver (très vieux navigateur), on garde l'image de
    // couverture: pas d'autoplay, mais rien de cassé.
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) el.play?.().catch(() => {});
        else el.pause?.();
      },
      // 55%: on ne démarre que quand la carte est vraiment regardée, pas
      // quand elle pointe d'un pixel en bas de l'écran.
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={posterSrc || undefined}
        // `none` tant que la carte n'est pas à l'écran: c'est CE réglage qui
        // évite de télécharger tout le fil d'un coup.
        preload={visible ? 'auto' : 'none'}
        muted
        loop
        playsInline
        aria-label={alt}
        className="h-full w-full object-cover"
      />
      <span className="pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white">
        <IconVideo size={13} />
      </span>
    </div>
  );
}
