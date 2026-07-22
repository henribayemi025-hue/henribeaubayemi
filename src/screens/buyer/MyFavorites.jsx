import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { IconHeart, IconStarFilled } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';

// Favorites = shops the user follows (single follow/favorite concept in Phase 1).
export default function MyFavorites() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('shop_follows')
      .select('shop_id, shops(id, slug, name, avatar_url, rating, is_verified, status)')
      .eq('follower_id', user.id);
    if (err) throw err;
    return (rows || []).map((r) => r.shops).filter((s) => s && s.status === 'active');
  }, [user]);

  if (loading) return <div className="space-y-3 p-4"><AppHeader title={t('profile.myFavorites')} back />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div>
      <AppHeader title={t('profile.myFavorites')} back />
      {data.length === 0 ? (
        <EmptyState icon={IconHeart} title={t('profile.noFavorites')} />
      ) : (
        <ul className="divide-y divide-hairline">
          {data.map((s) => (
            <li key={s.id}>
              <Link to={`/boutique/${s.slug}`} className="flex items-center gap-3 px-4 py-3">
                <SmartImage src={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} alt={s.name} className="h-12 w-12" rounded="rounded-full" />
                <div className="flex-1">
                  <p className="flex items-center gap-1 text-body font-semibold text-ink">{s.name} {s.is_verified && <VerifiedBadge size={14} />}</p>
                  <p className="flex items-center gap-1 text-caption text-muted"><IconStarFilled size={12} className="text-brass" />{Number(s.rating || 0).toFixed(1)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
