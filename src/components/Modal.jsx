import { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';

// Bottom-sheet modal on mobile, centered on desktop.
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[90] flex items-end justify-center sm:items-center"
      style={{ height: 'var(--app-height, 100dvh)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-app flex-col overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
        style={{ maxHeight: 'var(--app-height, 100dvh)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-section text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-hairline" aria-label="Close">
            <IconX size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
