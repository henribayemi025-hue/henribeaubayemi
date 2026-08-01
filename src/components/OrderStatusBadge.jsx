import { useTranslation } from 'react-i18next';

const STYLES = {
  new: 'bg-warning-bg text-warning',
  confirmed: 'bg-teal/10 text-teal',
  shipped: 'bg-teal/10 text-teal',
  delivered: 'bg-success-bg text-success',
  cancelled: 'bg-danger-bg text-danger',
};

// `method` (pickup/delivery) affine le libellé: une commande « shipped » en
// retrait boutique est « Prête — à retirer », pas « En livraison ».
export function OrderStatusBadge({ status, method }) {
  const { t } = useTranslation();
  const key = status === 'shipped' && method === 'pickup' ? 'readyPickup' : status;
  return (
    <span className={`rounded-pill px-2 py-0.5 text-caption font-semibold ${STYLES[status] || 'bg-hairline text-muted'}`}>
      {t(`orderStatus.${key}`)}
    </span>
  );
}
