import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconShoppingCart, IconMoodSmile, IconSparkles } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import { CategoryStrip } from '../../components/CategoryStrip';
import { ProductCard } from '../../components/ProductCard';
import { ShopCard } from '../../components/ShopCard';
import { ProductGridSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/states';
import { homeCache, loadHome } from '../../lib/homeCache';

export default function Home() {
  const { t } = useTranslation();
  const { count } = useCart();
  const [data, setData] = useState(homeCache);
  const [loading, setLoading] = useState(!homeCache);
  const [error, setError] = useState(false);

  async function load() {
    if (!homeCache) setLoading(true);
    setError(false);
    try {
      const result = await loadHome();
      setData(result);
    } catch {
      if (!homeCache) setError(true); // no stale data to fall back to
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-white px-4">
        <Link to="/" className="flex items-center gap-1">
          <span className="text-title font-semibold text-teal">Finjaro</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/search" aria-label={t('common.search')} className="text-ink">
            <IconSearch size={24} />
          </Link>
          <Link to="/cart" aria-label={t('cart.title')} className="relative text-ink">
            <IconShoppingCart size={24} />
            {count > 0 && (
              <span key={count} className="animate-like-pop absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="p-4 pb-0">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1 text-caption font-semibold text-brass">
            <IconSparkles size={14} /> {t('home.heroTag')}
          </span>
          <h1 className="mt-3 text-title font-semibold leading-tight">{t('home.heroTitle')}</h1>
          <p className="mt-1.5 text-caption text-white/70">{t('home.heroSubtitle')}</p>
        </div>
      </div>

      <div className="pt-3">
        <CategoryStrip />
      </div>

      {loading ? (
        <div className="space-y-4 p-4">
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-full" />
            ))}
          </div>
          <ProductGridSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={t('home.loadError')} onRetry={load} />
      ) : (
        <>
          {data.shops.length > 0 && (
            <section className="mt-4">
              <h2 className="px-4 text-section text-ink">{t('home.shopsNearYou')}</h2>
              <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-4">
                {data.shops.map((s) => (
                  <ShopCard key={s.id} shop={s} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 px-4">
            <h2 className="text-section text-ink">{t('home.trending')}</h2>
            {data.products.length === 0 ? (
              <EmptyState icon={IconMoodSmile} title={t('home.noProducts')} />
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {data.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
