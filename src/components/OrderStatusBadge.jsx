import { useTranslation } from 'react-i18next';

const STYLES = {
  new: 'bg-warning-bg text-warning',
  confirmed: 'bg-teal/10 text-teal',
  shipped: 'bg-teal/10 text-teal',
  delivered: 'bg-success-bg text-success',
  cancelled: 'bg-danger-bg text-danger',
};

export function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-pill px-2 py-0.5 text-caption font-semibold ${STYLES[status] || 'bg-hairline text-muted'}`}>
      {t(`orderStatus.${status}`)}
    </span>
  );
}
