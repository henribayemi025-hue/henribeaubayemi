import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Brass verified checkmark. Rendered only when shop.is_verified is true.
export function VerifiedBadge({ size = 18, showLabel = false }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 text-brass" title={t('common.verifiedTooltip')}>
      <IconRosetteDiscountCheckFilled size={size} aria-label={t('common.verified')} />
      {showLabel && <span className="text-caption font-semibold">{t('common.verified')}</span>}
    </span>
  );
}
