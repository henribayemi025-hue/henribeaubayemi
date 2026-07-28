import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMoodSmile } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { ProductCard } from '../../components/ProductCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../../components/states';
import { CATEGORIES } from '../../lib/categories';
import { track } from '../../lib/track';

export default function CategoryListing() {
  const { categoryId } = useParams();
  const { t } = useTranslation();
  const cat = CATEGORIES.find((c) => c.id === categoryId);

  useEffect(() => {
    track('category_view', categoryId);
  }, [categoryId]);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: products, error: err } = await supabase
      .from('products')
      .select('id, name, price_fcfa, images, category, stock, shop_id, shops(name)')
      .eq('category', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return (products || []).map((p) => ({ ...p, shop_name: p.shops?.name }));
  }, [categoryId]);

  return (
    <div>
      <AppHeader title={t(`categories.${categoryId}`)} back />
      <div className="lg:mx-auto lg:max-w-4xl">
        {cat && (
          <div className="relative h-36 w-full overflow-hidden bg-ink">
            {/* Blurred backdrop fills the width; the real banner stays fully
                visible and never upscaled past its own resolution, so it's
                never cropped and never blurry. */}
            <img src={cat.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover object-top blur-lg" />
            <img src={cat.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
          </div>
        )}
        <div className="p-4">
          {loading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <ErrorState message={t('home.loadError')} onRetry={retry} />
          ) : data.length === 0 ? (
            <EmptyState icon={IconMoodSmile} title={t('home.noProducts')} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
