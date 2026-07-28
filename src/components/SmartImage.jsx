import { useState, useEffect } from 'react';
import { IconPhoto } from '@tabler/icons-react';

// Lazy, decoding-async image with a graceful placeholder for flaky connections.
//
// `fallbackSrc`: optional full-size URL tried automatically if `src` (meant to
// be the lightweight thumbnail — see storageThumbUrl in lib/supabase.js) fails
// to load. A photo uploaded before thumbnails existed has no `_thumb` file, so
// its thumbnail URL 404s — this fallback means it still shows (at full size)
// instead of vanishing behind the placeholder icon.
export function SmartImage({ src, fallbackSrc, alt, className = '', rounded = '', fit = 'cover' }) {
  const [stage, setStage] = useState('primary'); // 'primary' | 'fallback' | 'failed'

  useEffect(() => {
    setStage('primary');
  }, [src, fallbackSrc]);

  const current = stage === 'fallback' ? fallbackSrc : src;

  if (!current || stage === 'failed') {
    return (
      <div className={`flex items-center justify-center bg-[#F3F3F3] ${className} ${rounded}`} aria-label={alt} role="img">
        <IconPhoto size={28} className="text-hairline" stroke={1.5} />
      </div>
    );
  }

  function handleError() {
    if (stage === 'primary' && fallbackSrc && fallbackSrc !== src) setStage('fallback');
    else setStage('failed');
  }

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={`${className} ${rounded} ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
    />
  );
}
