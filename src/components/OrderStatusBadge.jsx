import { useTranslation } from 'react-i18next';
import { IconClock, IconRosetteDiscountCheck, IconCircleCheck, IconCircleX } from '@tabler/icons-react';

// Statuts "en mouvement" (en livraison / prête à retirer): un petit point
// vert PULSE au lieu d'une icône statique — le signal "ça bouge, suis ta
// commande" que Beau demandait ("il peut voir en cours avec un petit truc
// vert"), le même langage visuel qu'un indicateur "en direct".
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
    </span>
  );
}

const CONFIG = {
  new: { style: 'bg-warning-bg text-warning', icon: IconClock },
  confirmed: { style: 'bg-teal/10 text-teal', icon: IconRosetteDiscountCheck },
  shipped: { style: 'bg-success-bg text-success', live: true },
  readyPickup: { style: 'bg-success-bg text-success', live: true },
  delivered: { style: 'bg-success-bg text-success', icon: IconCircleCheck },
  cancelled: { style: 'bg-danger-bg text-danger', icon: IconCircleX },
};

// Couleur de l'accent latéral des cartes commande — même mapping, exposé à
// part pour que VendorOrders/MyOrders l'utilisent sans dupliquer la logique.
export function orderAccentColor(status, method) {
  const key = status === 'shipped' && method === 'pickup' ? 'readyPickup' : status;
  return { new: 'border-l-warning', confirmed: 'border-l-teal', shipped: 'border-l-success', readyPickup: 'border-l-success', delivered: 'border-l-success', cancelled: 'border-l-danger' }[key] || 'border-l-hairline';
}

// `method` (pickup/delivery) affine le libellé: une commande « shipped » en
// retrait boutique est « Prête — à retirer », pas « En livraison ».
export function OrderStatusBadge({ status, method }) {
  const { t } = useTranslation();
  const key = status === 'shipped' && method === 'pickup' ? 'readyPickup' : status;
  const cfg = CONFIG[key] || { style: 'bg-hairline text-muted', icon: IconClock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-semibold ${cfg.style}`}>
      {cfg.live ? <LiveDot /> : <Icon size={13} />} {t(`orderStatus.${key}`)}
    </span>
  );
}
