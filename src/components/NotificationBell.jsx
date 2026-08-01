import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconBell, IconMessage, IconShoppingBag, IconTruckDelivery, IconCheck,
  IconStar, IconBuildingStore, IconMovie, IconMapPin, IconBellOff,
} from '@tabler/icons-react';
import { useNotifications, notificationHref } from '../hooks/useNotifications';
import { Modal } from './Modal';
import { EmptyState } from './states';
import { timeAgo } from '../lib/format';

const TYPE_ICON = {
  new_message: IconMessage,
  order_received: IconShoppingBag,
  order_confirmed: IconCheck,
  order_shipped: IconTruckDelivery,
  order_delivered: IconCheck,
  review_unlocked: IconStar,
  shop_approved: IconBuildingStore,
  shop_rejected: IconBuildingStore,
  new_reel: IconMovie,
  new_listing: IconMapPin,
};

// Icône clochette + panneau, posée là où l'app est ouverte le plus souvent
// (accueil acheteuse, tableau de bord vendeur). C'est le seul canal qui
// atteint TOUT compte, y compris ceux créés par téléphone sans e-mail et
// sans permission de notification accordée.
export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function openItem(n) {
    if (!n.read) markRead(n.id);
    const href = notificationHref(n);
    setOpen(false);
    if (href) navigate(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('notifications.title')}
        className="relative text-ink"
      >
        <IconBell size={23} />
        {unreadCount > 0 && (
          <span key={unreadCount} className="animate-like-pop absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('notifications.title')}>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="mb-2 block text-caption font-semibold text-teal">
            {t('notifications.markAllRead')}
          </button>
        )}
        {loading ? null : items.length === 0 ? (
          <EmptyState icon={IconBellOff} title={t('notifications.empty')} />
        ) : (
          <ul className="-mx-4 max-h-[70vh] divide-y divide-hairline overflow-y-auto">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type] || IconBell;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition active:bg-base ${!n.read ? 'bg-teal-light/40' : ''}`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`truncate text-body ${!n.read ? 'font-semibold text-ink' : 'text-ink'}`}>{n.title}</span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />}
                      </span>
                      {n.body && <span className="mt-0.5 block line-clamp-2 text-caption text-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted">{timeAgo(n.created_at, i18n.language)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
}
