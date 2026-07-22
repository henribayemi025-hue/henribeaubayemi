import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShare2, IconStarFilled, IconDots, IconMessage, IconArrowBackUp } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { SmartImage } from '../../components/SmartImage';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { StarRating } from '../../components/StarRating';
import { ProductCard } from '../../components/ProductCard';
import { ReportModal } from '../../components/ReportModal';
import { Skeleton, EmptyState, ErrorState } from '../../components/states';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';
import { track } from '../../lib/track';

export default function ShopProfile() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [tab, setTab] = useState('products');
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: shop, error: err } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (err) throw err;
    if (!shop) return null;
    const [{ data: products }, { data: reviews }] = await Promise.all([
      supabase.from('products').select('id, name, price_fcfa, images, category, stock, shop_id').eq('shop_id', shop.id).eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('reviews').select('id, rating, body, created_at').eq('shop_id', shop.id).order('created_at', { ascending: false }),
    ]);
    return { shop, products: products || [], reviews: reviews || [] };
  }, [slug]);

  useEffect(() => {
    if (!user || !data?.shop) return;
    supabase
      .from('shop_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('shop_id', data.shop.id)
      .maybeSingle()
      .then(({ data: f }) => setFollowing(!!f));
  }, [user, data]);

  useEffect(() => {
    if (data?.shop?.id) track('shop_view', data.shop.id);
  }, [data?.shop?.id]);

  async function share() {
    const url = `${window.location.origin}/boutique/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.shop.name, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.shareCopied'));
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  async function toggleFollow() {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      if (following) {
        await supabase.from('shop_follows').delete().eq('follower_id', user.id).eq('shop_id', data.shop.id);
        setFollowing(false);
      } else {
        await supabase.from('shop_follows').insert({ follower_id: user.id, shop_id: data.shop.id });
        setFollowing(true);
        track('follow', data.shop.id);
      }
    } finally {
      setBusy(false);
    }
  }

  async function contact() {
    if (!user) return requireLogin();
    try {
      const convId = await getOrCreateConversation(user.id, data.shop.id);
      navigate(`/chat/${convId}`);
    } catch (e) {
      if (e.code === 'own_shop') toast.info(t('chat.ownShop'));
      else toast.error(e.message);
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-32 w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;
  if (!data?.shop) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-section text-ink">{t('shop.notFound')}</p>
        <Button variant="secondary" className="max-w-xs" onClick={() => navigate('/')}>
          <IconArrowBackUp size={18} /> {t('common.back')}
        </Button>
      </div>
    );
  }

  const shop = data.shop;
  const banner = shop.banner_url ? storageUrl('shops', shop.banner_url) : null;
  const avatar = shop.avatar_url ? storageUrl('shops', shop.avatar_url) : null;

  return (
    <div className="pb-6">
      <div className="relative">
        <SmartImage src={banner} alt="" className="h-32 w-full" />
        <button onClick={() => navigate(-1)} className="absolute left-3 top-3 rounded-full bg-white/90 p-1.5 text-ink shadow" aria-label={t('common.back')}>
          <IconArrowBackUp size={20} />
        </button>
        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={share} className="rounded-full bg-white/90 p-1.5 text-ink shadow" aria-label={t('common.shareShop')}>
            <IconShare2 size={20} />
          </button>
          <button onClick={() => setReportOpen(true)} className="rounded-full bg-white/90 p-1.5 text-ink shadow" aria-label={t('report.report')}>
            <IconDots size={20} />
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="-mt-8 flex items-end gap-3">
          <SmartImage src={avatar} alt={shop.name} className="h-16 w-16 border-2 border-white" rounded="rounded-full" />
          <div className="flex-1 pb-1">
            <h1 className="flex items-center gap-1 text-title text-ink">
              {shop.name}
              {shop.is_verified && <VerifiedBadge size={18} />}
            </h1>
            <p className="flex items-center gap-2 text-caption text-muted">
              <span className="flex items-center gap-0.5"><IconStarFilled size={13} className="text-brass" />{Number(shop.rating || 0).toFixed(1)}</span>
              <span>· {shop.followers_count} {t('shop.followers')}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant={following ? 'secondary' : 'primary'} loading={busy} onClick={toggleFollow} className="flex-1">
            {following ? t('common.following') : t('common.follow')}
          </Button>
          <button onClick={contact} className="flex h-12 items-center gap-1 rounded-[10px] border-[1.5px] border-teal px-4 text-teal" aria-label={t('shop.contactPrompt')}>
            <IconMessage size={20} />
          </button>
        </div>

        <div className="mt-4 flex border-b border-hairline">
          {['products', 'reviews', 'about'].map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex-1 border-b-2 py-2 text-body ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}
            >
              {t(`shop.${tb}`)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'products' &&
            (data.products.length === 0 ? (
              <EmptyState title={t('shop.emptyProducts')} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.products.map((p) => (
                  <ProductCard key={p.id} product={{ ...p, shop_name: shop.name }} />
                ))}
              </div>
            ))}

          {tab === 'reviews' &&
            (data.reviews.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted">{t('shop.noReviews')}</p>
            ) : (
              <ul className="space-y-3">
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
            ))}

          {tab === 'about' && (
            <div className="space-y-3">
              {shop.bio ? <p className="whitespace-pre-wrap text-body text-ink">{shop.bio}</p> : <p className="text-caption text-muted">{t('shop.noAbout')}</p>}
              {(shop.city || shop.country) && (
                <p className="text-caption text-muted">{t('shop.location')}: {[shop.city, shop.country].filter(Boolean).join(', ')}</p>
              )}
              {shop.whatsapp && (
                <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-secondary">
                  {t('shop.whatsapp')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="shop" targetId={shop.id} />
    </div>
  );
}
