import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconShoppingCart, IconMoodSmile } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { CategoryStrip } from '../../components/CategoryStrip';
import { ProductCard } from '../../components/ProductCard';
import { ShopCard } from '../../components/ShopCard';
import { ProductGridSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/states';

async function fetchHome() {
  const [{ data: products, error: pErr }, { data: shops, error: sErr }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price_fcfa, images, category, stock, shop_id, shops(name, slug)')
      .eq('is_active', true)
      .order('views', { ascending: false })
      .limit(12),
    supabase
      .from('shops')
      .select('id, slug, name, avatar_url, rating, is_verified')
      .eq('status', 'active')
      .order('followers_count', { ascending: false })
      .limit(12),
  ]);
  if (pErr || sErr) throw pErr || sErr;
  return {
    products: (products || []).map((p) => ({ ...p, shop_name: p.shops?.name })),
    shops: shops || [],
  };
}

export default function Home() {
  const { t } = useTranslation();
  const { count } = useCart();
  const { data, loading, error, retry } = useAsync(fetchHome, []);

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-white px-4">
        <Link to="/" className="flex items-center gap-1">
          <span className="text-title font-semibold text-teal">Finjaro</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
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
        <ErrorState message={t('home.loadError')} onRetry={retry} />
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
              <div className="mt-3 grid grid-cols-2 gap-3">
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
