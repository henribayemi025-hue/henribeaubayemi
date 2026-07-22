import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBox } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { Price } from '../../components/Price';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';

export default function VendorProducts() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: products, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return products || [];
  }, [shop.id]);

  return (
    <div className="pb-6">
      <AppHeader
        title={t('nav.products')}
        right={<Link to="/vendor/products/new" aria-label={t('vendor.addProduct')} className="rounded-full bg-teal p-1.5 text-white"><IconPlus size={20} /></Link>}
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : data.length === 0 ? (
        <EmptyState icon={IconBox} title={t('vendor.emptyProducts')} action={<Link to="/vendor/products/new"><Button>{t('vendor.addProduct')}</Button></Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {data.map((p) => (
            <Link key={p.id} to={`/vendor/products/${p.id}`} className="overflow-hidden rounded-card border border-hairline">
              <SmartImage src={p.images?.[0] ? storageUrl('products', p.images[0]) : null} alt={p.name} className="aspect-square w-full" />
              <div className="p-2">
                <p className="line-clamp-1 text-body text-ink">{p.name}</p>
                <Price fcfa={p.price_fcfa} className="text-caption font-semibold text-teal" />
                <p className={`text-caption ${p.stock > 0 ? 'text-muted' : 'text-danger'}`}>
                  {p.stock > 0 ? `${t('product.inStock')}: ${p.stock}` : t('product.outOfStock')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
