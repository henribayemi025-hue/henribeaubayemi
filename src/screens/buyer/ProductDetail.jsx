import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessage, IconChevronLeft, IconArrowBackUp } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { ProductCard } from '../../components/ProductCard';
import { SmartImage } from '../../components/SmartImage';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Skeleton, ErrorState } from '../../components/states';
import { isQuoteOnly } from '../../lib/categories';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';
import { track } from '../../lib/track';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [starting, setStarting] = useState(false);
  const [added, setAdded] = useState(false);

  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    track('product_view', id);
  }, [id]);

  // "Vous aimerez aussi" — best-effort; never blocks the page.
  useEffect(() => {
    let active = true;
    setSimilar([]);
    supabase
      .rpc('similar_products', { p_product_id: id, p_limit: 6 })
      .then(({ data }) => {
        if (active && Array.isArray(data)) setSimilar(data);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: product, error: err } = await supabase
      .from('products')
      .select('*, shops(id, name, slug, is_verified, rating)')
      .eq('id', id)
      .maybeSingle();
    if (err) throw err;
    if (!product) return null;
    // Increment view count (best-effort; ignore failures on flaky connections).
    await supabase.from('products').update({ views: (product.views || 0) + 1 }).eq('id', id);
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, body, created_at')
      .eq('product_id', id)
      .order('created_at', { ascending: false });
    return { product, reviews: reviews || [] };
  }, [id]);

  async function startChat() {
    if (!user) return requireLogin();
    setStarting(true);
    try {
      const convId = await getOrCreateConversation(user.id, data.product.shops.id, data.product.id);
      navigate(`/chat/${convId}`);
    } catch (e) {
      if (e.code === 'own_shop') toast.info(t('chat.ownShop'));
      else toast.error(e.message);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex h-14 items-center px-4"><button onClick={() => navigate(-1)}><IconChevronLeft /></button></div>
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;
  if (!data?.product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-section text-ink">{t('product.notFound')}</p>
        <Button variant="secondary" className="max-w-xs" onClick={() => navigate('/')}>
          <IconArrowBackUp size={18} /> {t('common.back')}
        </Button>
      </div>
    );
  }

  const p = data.product;
  const shop = p.shops;
  const quote = isQuoteOnly(p.category);
  const outOfStock = !quote && (p.stock ?? 0) <= 0;
  const images = (p.images || []).map((im) => storageUrl('products', im));

  return (
    <div className="relative">
      <button
        onClick={() => navigate(-1)}
        aria-label={t('common.back')}
        className="absolute left-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-ink shadow"
      >
        <IconChevronLeft size={22} />
      </button>

      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {images.length ? (
          images.map((src, i) => (
            <SmartImage key={i} src={src} alt={`${p.name} ${i + 1}`} className="aspect-square w-full shrink-0 snap-center" />
          ))
        ) : (
          <SmartImage src={null} alt={p.name} className="aspect-square w-full" />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1">
          {images.map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-hairline" />
          ))}
        </div>
      )}

      <div className="p-4">
        <h1 className="text-title text-ink">{p.name}</h1>
        {quote ? (
          <p className="mt-1 text-section font-semibold text-brass">{t('product.requestQuote')}</p>
        ) : (
          <Price fcfa={p.price_fcfa} className="mt-1 block text-title font-semibold text-teal" />
        )}

        <Link to={`/boutique/${shop.slug}`} className="mt-3 flex items-center gap-2 text-body text-muted">
          <span>{t('product.soldBy')} <span className="font-semibold text-ink">{shop.name}</span></span>
          {shop.is_verified && <VerifiedBadge size={15} />}
        </Link>

        {outOfStock && (
          <span className="mt-3 inline-block rounded-pill bg-danger-bg px-3 py-1 text-caption font-semibold text-danger">
            {t('product.outOfStock')}
          </span>
        )}

        {p.description && (
          <div className="mt-4">
            <h2 className="text-section text-ink">{t('product.description')}</h2>
            <p className="mt-1 whitespace-pre-wrap text-body text-muted">{p.description}</p>
          </div>
        )}

        {p.sizes?.length > 0 && (
          <Variant label={t('product.size')} options={p.sizes} value={size} onChange={setSize} />
        )}
        {p.colors?.length > 0 && (
          <Variant label={t('product.color')} options={p.colors} value={color} onChange={setColor} />
        )}

        <section className="mt-6">
          <h2 className="text-section text-ink">{t('product.reviews')}</h2>
          {data.reviews.length === 0 ? (
            <p className="mt-2 text-caption text-muted">{t('product.noReviews')}</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="border-b border-hairline pb-3">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} />
                    <span className="text-caption text-muted">{timeAgo(r.created_at, i18n.language)}</span>
                  </div>
                  {r.body && <p className="mt-1 text-body text-ink">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {similar.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-section text-ink">{t('product.similarTitle')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {similar.map((sp) => (
                <ProductCard key={sp.id} product={sp} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 z-30 flex gap-2 border-t border-hairline bg-white p-3">
        <button
          onClick={startChat}
          disabled={starting}
          className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-teal px-4 text-teal"
          aria-label={t('product.contactSeller')}
        >
          <IconMessage size={20} />
        </button>
        {quote ? (
          <Button onClick={startChat} loading={starting}>{t('product.requestQuote')}</Button>
        ) : (
          <Button
            disabled={outOfStock}
            onClick={() => {
              add({ ...p, shop_name: shop.name });
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
          >
            {outOfStock ? t('product.outOfStock') : added ? `✓ ${t('product.added')}` : t('product.addToCart')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Variant({ label, options, value, onChange }) {
  return (
    <div className="mt-4">
      <h2 className="text-section text-ink">{label}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(value === o ? '' : o)}
            className={`chip ${value === o ? 'chip-active' : 'text-ink'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
