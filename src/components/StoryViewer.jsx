import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';
import { storageUrl } from '../lib/supabase';
import { ShopAvatar } from './ShopAvatar';
import { timeAgo } from '../lib/format';

const STORY_MS = 5000;

// Lecteur plein écran façon WhatsApp/Instagram: une barre de progression par
// story, avance automatique, tap gauche/droite pour naviguer manuellement.
export function StoryViewer({ stories, shopName, shopAvatarSrc, shopSeed, onClose }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / STORY_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (index < stories.length - 1) setIndex((i) => i + 1);
        else onClose();
      }
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!stories.length) return null;
  const current = stories[index];

  function tap(e) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const half = e.currentTarget.clientWidth / 2;
    if (x < half) {
      if (index > 0) setIndex((i) => i - 1);
    } else if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black" onClick={tap}>
      <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-pill bg-white/30">
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-3 top-6 z-10 flex items-center gap-2">
        <ShopAvatar src={shopAvatarSrc} name={shopName} seed={shopSeed} className="h-8 w-8 border border-white/60" />
        <span className="text-body font-semibold text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }}>
          {shopName}
        </span>
        <span className="text-caption text-white/80">{timeAgo(current.created_at, i18n.language)}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label={t('common.close')}
          className="ml-auto rounded-full bg-black/30 p-1.5 text-white"
        >
          <IconX size={20} />
        </button>
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <img src={storageUrl('shops', current.media_url)} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      {current.caption && (
        <p
          className="absolute inset-x-4 bottom-6 z-10 text-center text-body text-white"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }}
        >
          {current.caption}
        </p>
      )}
    </div>
  );
}
