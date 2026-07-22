import { useTranslation } from 'react-i18next';
import { IconMoodSad, IconWifiOff } from '@tabler/icons-react';
import { Button } from './Button';

// Reusable skeleton block.
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-input ${className}`} aria-hidden="true" />;
}

// Grid of skeleton product cards (Home / listings loading state).
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-card border border-hairline">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Encouraging empty state.
export function EmptyState({ icon: Icon = IconMoodSad, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <Icon size={44} stroke={1.5} className="text-muted" />
      <p className="mt-4 text-section text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-caption text-muted">{hint}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

// Network / load error with retry.
export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <IconWifiOff size={44} stroke={1.5} className="text-danger" />
      <p className="mt-4 max-w-xs text-body text-ink">{message || t('errors.generic')}</p>
      {onRetry && (
        <div className="mt-6 w-full max-w-xs">
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      )}
    </div>
  );
}
