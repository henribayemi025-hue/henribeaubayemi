import { useTranslation } from 'react-i18next';
import { IconClock, IconRosetteDiscountCheck, IconTruckDelivery, IconBuildingStore, IconCircleCheck, IconCircleX } from '@tabler/icons-react';

// Une couleur ET une icône par étape — pas que du texte dans une pastille.
// C'est ce qui manquait pour que le statut se lise d'un coup d'œil au lieu
// de devoir lire le mot.
const CONFIG = {
  new: { style: 'bg-warning-bg text-warning', icon: IconClock },
  confirmed: { style: 'bg-teal/10 text-teal', icon: IconRosetteDiscountCheck },
  shipped: { style: 'bg-teal/10 text-teal', icon: IconTruckDelivery },
  readyPickup: { style: 'bg-teal/10 text-teal', icon: IconBuildingStore },
  delivered: { style: 'bg-success-bg text-success', icon: IconCircleCheck },
  cancelled: { style: 'bg-danger-bg text-danger', icon: IconCircleX },
};

// Couleur de l'accent latéral des cartes commande — même mapping, exposé à
// part pour que VendorOrders/MyOrders l'utilisent sans dupliquer la logique.
export function orderAccentColor(status, method) {
  const key = status === 'shipped' && method === 'pickup' ? 'readyPickup' : status;
  return { new: 'border-l-warning', confirmed: 'border-l-teal', shipped: 'border-l-teal', readyPickup: 'border-l-teal', delivered: 'border-l-success', cancelled: 'border-l-danger' }[key] || 'border-l-hairline';
}

// `method` (pickup/delivery) affine le libellé: une commande « shipped » en
// retrait boutique est « Prête — à retirer », pas « En livraison ».
export function OrderStatusBadge({ status, method }) {
  const { t } = useTranslation();
  const key = status === 'shipped' && method === 'pickup' ? 'readyPickup' : status;
  const cfg = CONFIG[key] || { style: 'bg-hairline text-muted', icon: IconClock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-caption font-semibold ${cfg.style}`}>
      <Icon size={13} /> {t(`orderStatus.${key}`)}
    </span>
  );
}
