import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPackage, IconBrandWhatsapp, IconBuildingStore, IconSearch } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { CashPrice } from '../../components/Price';
import { ShopAvatar } from '../../components/ShopAvatar';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { OrderTimeline } from '../../components/OrderTimeline';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';
import { mesDemandes } from '../../lib/mesDemandes';

// « Ma commande » — le suivi d'une demande passée SANS compte (idée 3 du
// 01/10, 0223).
//
// Avant, une fois « Envoyer ma demande » touché, l'acheteuse ne voyait plus
// rien: ni si la boutique l'avait vue, ni si elle était acceptée. Elle
// n'avait aucune raison de revenir. Ici, à partir du lien que la vendeuse
// lui envoie sur WhatsApp (ou de celui gardé dans son téléphone), elle voit
// où en est sa demande, avec les mêmes étapes que « Mes commandes ».
//
// Rien de personnel n'est affiché: ni téléphone ni adresse, le prénom seul.
// Le montant suit la règle des espèces à la livraison (CashPrice): ce qu'elle
// tendra est dans la monnaie de la boutique, sa monnaie à elle à côté.

export default function MaCommande() {
  const { id } = useParams();
  return id ? <UneDemande id={id} /> : <ToutesMesDemandes />;
}

function UneDemande({ id }) {
  const { t, i18n } = useTranslation();
  const { data: o, loading, error, retry } = useAsync(async () => {
    const { data, error: err } = await supabase.rpc('suivi_commande', { p_id: id });
    if (err) throw err;
    return data;
  }, [id]);

  if (loading) {
    return (
      <div>
        <AppHeader title={t('suivi.title', 'Ma commande')} back />
        <div className="space-y-3 p-4"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <AppHeader title={t('suivi.title', 'Ma commande')} back />
        <ErrorState onRetry={retry} />
      </div>
    );
  }
  if (!o) {
    return (
      <div>
        <AppHeader title={t('suivi.title', 'Ma commande')} back />
        <EmptyState icon={IconSearch} title={t('suivi.notFound', 'Commande introuvable')}
          hint={t('suivi.notFoundHint', 'Le lien est peut-être incomplet. Demande à la boutique de te le renvoyer sur WhatsApp.')} />
      </div>
    );
  }

  const shop = o.shop || {};
  const items = o.items || [];
  const devis = o.status === 'awaiting_price' || o.status === 'priced';

  return (
    <div>
      <AppHeader title={t('suivi.title', 'Ma commande')} back />
      <div className="space-y-3 p-4">
        <div className="card">
          {o.prenom && (
            <p className="text-caption text-muted">{t('suivi.hello', { name: o.prenom, defaultValue: 'Bonjour {{name}},' })}</p>
          )}
          <div className="mt-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-section font-semibold text-ink">#{o.order_no}</p>
              <p className="text-caption text-muted">{timeAgo(o.created_at, i18n.language)}</p>
            </div>
            <OrderStatusBadge status={o.status} method={o.delivery_method} />
          </div>

          {o.status === 'cancelled' ? (
            <p className="mt-3 rounded-card bg-danger-bg p-3 text-caption text-danger">
              {o.cancel_reason
                ? t(o.confirmed_at ? 'orderStatus.cancelReasonShown' : 'orderStatus.declineReasonShown', { reason: o.cancel_reason })
                : t('orderStatus.cancelledNoReason')}
            </p>
          ) : devis ? (
            // Sans compte, pas de bouton « Accepter » ici: la boutique donne
            // son prix sur WhatsApp, et c'est là qu'on se met d'accord.
            <p className="mt-3 rounded-card bg-brass/10 p-3 text-caption text-ink">
              {t('suivi.devis', 'La boutique prépare son prix et te l’envoie sur WhatsApp. Rien n’est réservé et tu ne dois rien tant que vous n’êtes pas d’accord.')}
            </p>
          ) : (
            <>
              <OrderTimeline order={o} />
              {o.status === 'new' && (
                <p className="mt-2 text-caption text-muted">
                  {t('suivi.waiting', 'La boutique a reçu ta demande. Elle te répond sur WhatsApp pour confirmer, puis cette page avance avec elle.')}
                </p>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="space-y-1.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-body text-ink">
                <span className="flex min-w-0 items-center gap-1.5">
                  <IconPackage size={15} className="shrink-0 text-muted" />
                  <span className="truncate">{it.name}</span>
                  <span className="shrink-0 text-muted">× {it.qty}</span>
                </span>
                {it.price_pending
                  ? <span className="shrink-0 text-caption font-semibold text-brass">{t('cart.priceToConfirm')}</span>
                  : <CashPrice fcfa={it.price_fcfa * it.qty} shopCountry={shop.country} className="shrink-0 text-caption font-semibold" />}
              </div>
            ))}
          </div>
          {!devis && o.total_fcfa > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-caption text-muted">{t('suivi.total', 'Total à régler à la boutique')}</span>
              <CashPrice fcfa={o.total_fcfa} shopCountry={shop.country} className="text-section font-semibold text-teal" />
            </div>
          )}
        </div>

        <Link to={`/boutique/${shop.slug}`} className="card flex items-center gap-3">
          <ShopAvatar
            src={shop.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null}
            fallbackSrc={shop.avatar_url ? storageUrl('shops', shop.avatar_url) : null}
            name={shop.name}
            seed={shop.slug}
            className="h-11 w-11 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-ink">{shop.name}</p>
            <p className="flex items-center gap-1 text-caption text-muted">
              <IconBuildingStore size={13} /> {t('suivi.seeShop', 'Voir la boutique')}
            </p>
          </div>
        </Link>

        <p className="flex items-start gap-1.5 px-1 text-caption text-muted">
          <IconBrandWhatsapp size={15} className="mt-0.5 shrink-0 text-success" />
          {t('suivi.keep', 'Garde ce lien : il montre toujours où en est ta commande. Pour la livraison et le paiement, la boutique t’écrit sur WhatsApp.')}
        </p>
      </div>
    </div>
  );
}

// Sans identifiant: les demandes envoyées depuis CE téléphone (gardées au
// moment de l'envoi). Rien en base pour les retrouver: un autre téléphone
// ne les verra pas, et c'est voulu.
function ToutesMesDemandes() {
  const { t, i18n } = useTranslation();
  const liste = mesDemandes();
  return (
    <div>
      <AppHeader title={t('suivi.mine', 'Mes demandes')} back />
      {liste.length === 0 ? (
        <EmptyState icon={IconPackage} title={t('suivi.none', 'Aucune demande depuis ce téléphone')} />
      ) : (
        <ul className="space-y-2 p-4">
          {liste.map((d) => (
            <li key={d.id}>
              <Link to={`/ma-commande/${d.id}`} className="card flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold text-ink">{d.shop || '—'}</span>
                  <span className="block text-caption text-muted">#{d.no} · {timeAgo(d.at, i18n.language)}</span>
                </span>
                <span className="shrink-0 text-caption font-semibold text-teal">{t('suivi.follow', 'Suivre')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
