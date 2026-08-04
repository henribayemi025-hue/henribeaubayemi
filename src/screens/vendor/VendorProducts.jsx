import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBox, IconEye, IconEyeOff, IconPhotoPlus } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { Price } from '../../components/Price';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';

// Trois piles bien distinctes. Avant, tout arrivait dans une seule grille:
// impossible de voir ce qui était en ligne, et les arrivages passés se
// seraient empilés au milieu des brouillons en cours.
const TABS = ['online', 'drafts', 'archive'];

export default function VendorProducts() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState('online');
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    const { data: products, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return products || [];
  }, [shop.id]);

  // Publier / retirer. `published_at` repart à maintenant à chaque publication:
  // sinon la rotation, qui compte à partir de cette date, ré-archiverait
  // l'article dès la nuit suivante. `rotated_at` est effacé pour qu'il quitte
  // la pile « arrivages passés ».
  async function togglePublish(product) {
    const next = !product.is_active;
    setBusyId(product.id);
    const patch = next
      ? { is_active: true, rotated_at: null, published_at: new Date().toISOString() }
      : { is_active: false };
    const { error: err } = await supabase.from('products').update(patch).eq('id', product.id);
    setBusyId(null);
    if (err) {
      toast.error(err.message);
      return;
    }
    setData((rows) => rows.map((r) => (r.id === product.id ? { ...r, ...patch } : r)));
    toast.success(next ? t('vendor.published') : t('vendor.unpublished'));
  }

  const rows = data || [];
  const buckets = {
    online: rows.filter((p) => p.is_active),
    drafts: rows.filter((p) => !p.is_active && !p.rotated_at),
    archive: rows.filter((p) => !p.is_active && p.rotated_at),
  };
  const shown = buckets[tab];

  return (
    <div className="pb-6">
      <AppHeader
        title={t('nav.products')}
        right={
          <div className="flex items-center gap-2">
            {/* Remplir une boutique se fait par lots, pas article par
                article — le raccourci doit être aussi visible que le « + ». */}
            {/* Chip pleine, pas un lien discret: collé au « + » rond, un
                libellé fin se fait attraper par le pouce à la place du +. */}
            <Link
              to="/vendor/products/bulk"
              className="flex items-center gap-1 rounded-pill border border-teal/30 bg-teal/8 px-3 py-1.5 text-caption font-semibold text-teal"
            >
              <IconPhotoPlus size={16} /> {t('vendor.bulkShort')}
            </Link>
            <Link to="/vendor/products/new" aria-label={t('vendor.addProduct')} className="rounded-full bg-teal p-1.5 text-white"><IconPlus size={20} /></Link>
          </div>
        }
      />
      {!loading && !error && rows.length > 0 && (
        <div className="flex border-b border-hairline">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex-1 border-b-2 py-2 text-caption ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}
            >
              {t(`vendor.tab_${tb}`)} ({buckets[tb].length})
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : rows.length === 0 ? (
        <EmptyState icon={IconBox} title={t('vendor.emptyProducts')} action={<Link to="/vendor/products/new"><Button>{t('vendor.addProduct')}</Button></Link>} />
      ) : shown.length === 0 ? (
        <EmptyState icon={IconBox} title={t(`vendor.empty_${tab}`)} />
      ) : (
        <>
          {tab === 'archive' && (
            <p className="px-4 pt-3 text-caption text-muted">{t('vendor.archiveHelp')}</p>
          )}
          <div className="grid grid-cols-2 gap-3 p-4">
            {shown.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-card border border-hairline">
                <Link to={`/vendor/products/${p.id}`} className="block">
                  <SmartImage src={p.images?.[0] ? storageThumbUrl('products', p.images[0]) : null} fallbackSrc={p.images?.[0] ? storageUrl('products', p.images[0]) : null} alt={p.name} className="aspect-square w-full" />
                  <div className="p-2">
                    <p className="line-clamp-1 text-body text-ink">{p.name}</p>
                    <Price fcfa={p.price_fcfa} className="text-caption font-semibold text-teal" />
                    <p className={`text-caption ${p.stock > 0 ? 'text-muted' : 'text-danger'}`}>
                      {p.stock > 0 ? `${t('product.inStock')}: ${p.stock}` : t('product.outOfStock')}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => togglePublish(p)}
                  disabled={busyId === p.id}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-hairline py-2 text-caption font-semibold text-teal disabled:opacity-50"
                >
                  {p.is_active ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  {p.is_active ? t('vendor.unpublish') : t('vendor.publish')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
