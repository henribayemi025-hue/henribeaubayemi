import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@tabler/icons-react';

// Full-screen block shown when the signed-in account is suspended.
export function SuspendedNotice() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <IconAlertTriangle size={56} className="text-danger" stroke={1.5} />
      <h1 className="mt-4 text-title text-ink">{t('suspended.title')}</h1>
      <p className="mt-2 max-w-sm text-body text-muted">{t('suspended.body')}</p>
      <a href="mailto:support@finjaro.app" className="btn-secondary mt-6 max-w-xs">
        {t('suspended.contact')}
      </a>
    </div>
  );
}
