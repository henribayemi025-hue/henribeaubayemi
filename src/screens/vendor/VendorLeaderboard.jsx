import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrophy, IconStarFilled } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';

const MEDALS = ['#B8935F', '#9AA0A6', '#8C5A2B']; // gold/silver/bronze tint for top 3

export default function VendorLeaderboard() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: top, error: err } = await supabase
      .from('shops')
      .select('id, name, slug, avatar_url, rating, is_verified, seller_points')
      .eq('status', 'active')
      .order('seller_points', { ascending: false })
      .limit(20);
    if (err) throw err;
    const list = top || [];
    const inTop = list.some((s) => s.id === shop.id);
    let yourRank = null;
    if (!inTop) {
      const { count } = await supabase
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('seller_points', shop.seller_points || 0);
      yourRank = (count || 0) + 1;
    }
    return { list, yourRank };
  }, [shop.id]);

  return (
    <div className="pb-6">
      <AppHeader title={t('vendor.leaderboardTitle')} back />
      {loading ? (
        <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : data.list.length === 0 ? (
        <EmptyState icon={IconTrophy} title={t('vendor.leaderboardEmpty')} />
      ) : (
        <>
          <ul className="divide-y divide-hairline">
            {data.list.map((s, i) => {
              const mine = s.id === shop.id;
              return (
                <li key={s.id} className={`flex items-center gap-3 px-4 py-3 ${mine ? 'bg-teal-light' : ''}`}>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-body font-semibold"
                    style={{ color: MEDALS[i] || undefined }}
                  >
                    {i < 3 ? <IconTrophy size={20} /> : i + 1}
                  </span>
                  <ShopAvatar src={s.avatar_url ? storageThumbUrl('shops', s.avatar_url) : null} fallbackSrc={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} name={s.name} seed={s.id} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-body font-semibold text-ink">
                      <span className="line-clamp-1">{s.name}</span>
                      {s.is_verified && <VerifiedBadge size={14} />}
                      {mine && <span className="text-caption font-normal text-teal">({t('vendor.leaderboardYou')})</span>}
                    </p>
                    <span className="flex items-center gap-1 text-caption text-muted">
                      <IconStarFilled size={12} className="text-brass" />
                      {Number(s.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="shrink-0 text-body font-semibold text-teal">{s.seller_points || 0}</span>
                </li>
              );
            })}
          </ul>
          {data.yourRank && (
            <p className="px-4 pt-4 text-center text-caption font-semibold text-muted">
              {t('vendor.leaderboardYourRank', { rank: data.yourRank })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
