import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons-react';

// Timeline horizontale à 4 étapes: Commandée → Validée → En livraison (ou
// Prête en boutique) → Livrée. Chaque étape franchie est pleine + horodatée;
// l'étape en cours pulse doucement pour dire « c'est ici que ça se passe ».
export function OrderTimeline({ order }) {
  const { t, i18n } = useTranslation();
  const pickup = order.delivery_method === 'pickup';
  const steps = [
    { key: 'placed', label: t('orderTrack.placed'), at: order.created_at },
    { key: 'validated', label: t('orderTrack.validated'), at: order.confirmed_at },
    { key: 'shipping', label: pickup ? t('orderTrack.ready') : t('orderTrack.shipping'), at: order.shipped_at },
    { key: 'delivered', label: t('orderTrack.delivered'), at: order.delivered_at },
  ];
  // L'étape courante = la première non atteinte.
  const currentIdx = steps.findIndex((s) => !s.at);
  const fmt = (iso) =>
    new Date(iso).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="mt-3 rounded-card bg-base p-3">
      <div className="flex items-start">
        {steps.map((s, i) => {
          const done = !!s.at;
          const active = i === currentIdx;
          // L'étape "en livraison/prête" EN COURS se distingue en VERT (même
          // langage que le petit point vif du badge de statut) — les autres
          // étapes en cours restent en teal (une validation qui avance, pas
          // encore un colis qui bouge).
          const liveGreen = active && s.key === 'shipping';
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : done || active ? (liveGreen ? 'bg-success' : 'bg-teal') : 'bg-hairline'}`} />
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ${
                    done
                      ? 'bg-teal text-white'
                      : liveGreen
                        ? 'animate-pulse border-2 border-success bg-success/10'
                        : active
                          ? 'animate-pulse border-2 border-teal bg-white'
                          : 'border-2 border-hairline bg-white'
                  }`}
                >
                  {done ? <IconCheck size={13} /> : liveGreen ? <span className="h-2 w-2 rounded-full bg-success" /> : null}
                </div>
                <div className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'bg-transparent' : done ? (s.key === 'shipping' ? 'bg-success' : 'bg-teal') : 'bg-hairline'}`} />
              </div>
              <span className={`mt-1.5 text-center text-[11px] leading-tight ${liveGreen ? 'font-semibold text-success' : done || active ? 'font-semibold text-ink' : 'text-muted'}`}>
                {s.label}
              </span>
              {s.at && <span className="text-[10px] text-muted">{fmt(s.at)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
