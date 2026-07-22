import { useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';

// Lazy, decoding-async image with a graceful placeholder for flaky connections.
export function SmartImage({ src, alt, className = '', rounded = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-[#F3F3F3] ${className} ${rounded}`} aria-label={alt} role="img">
        <IconPhoto size={28} className="text-hairline" stroke={1.5} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} ${rounded} object-cover`}
    />
  );
}
