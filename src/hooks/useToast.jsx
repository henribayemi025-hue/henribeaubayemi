import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = {
    toast: show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  const styles = {
    success: 'bg-success-bg text-success',
    error: 'bg-danger-bg text-danger',
    info: 'bg-white text-ink border border-hairline',
  };
  const Icon = { success: IconCheck, error: IconX, info: IconInfoCircle };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const I = Icon[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex max-w-app items-center gap-2 rounded-card px-4 py-3 text-caption shadow-md ${styles[t.type]}`}
            >
              <I size={18} stroke={2} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
