import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconShare2, IconStarFilled, IconDots, IconMessage, IconArrowBackUp, IconRefresh,
  IconBrandWhatsapp, IconPhone, IconBrandInstagram, IconSearch, IconMovie,
  IconShieldCheck, IconRosetteDiscountCheck, IconTruckDelivery, IconHeadset,
  IconClock, IconMapPin, IconUsers, IconShoppingBag, IconChevronDown,
} from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { ShopBanner } from '../../components/ShopBanner';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { StarRating } from '../../components/StarRating';
import { ProductCard } from '../../components/ProductCard';
import { ReportModal } from '../../components/ReportModal';
import { Price, discountPercent } from '../../components/Price';
import { Skeleton, EmptyState, ErrorState } from '../../components/states';
import { isServiceShop, isServiceCategory } from '../../lib/categories';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';
import { track } from '../../lib/track';

// « Ouvert / Fermé » en direct depuis les horaires déclarés par la boutique:
// { open: '08:00', close: '18:00', closed_days: [0] } (0 = dimanche).
function isOpenNow(hours) {
  if (!hours?.open || !hours?.close) return null; // pas d'horaires → pas de badge
  const now = new Date();
  if ((hours.closed_days || []).includes(now.getDay())) return false;
  const hm = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = String(hours.open).split(':').map(Number);
  const [ch, cm] = String(hours.close).split(':').map(Number);
  const openM = oh * 60 + (om || 0);
  const closeM = ch * 60 + (cm || 0);
  // Fermeture après minuit (ex: 18:00 → 02:00): ouvert si après l'ouverture
  // OU avant la fermeture.
  if (closeM <= openM) return hm >= openM || hm < closeM;
  return hm >= openM && hm < closeM;
}

export default function ShopProfile() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [tab, setTab] = useState('home');
  // Recherche LOCALE au catalogue déjà chargé — pas de nouvel aller-retour
  // serveur, la boutique n'a jamais plus de quelques dizaines d'articles.
  const [q, setQ] = useState('');
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [allZones, setAllZones] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    // All four filter directly by slug (products/reviews/reels via an inner
    // join on shops) so they fire in PARALLEL instead of a lookup waterfall.
    const [{ data: shop, error: sErr }, { data: products, error: pErr }, { data: reviews }, { count: reelsCount }] = await Promise.all([
      supabase.from('shops').select('*').eq('slug', slug).maybeSingle(),
      supabase
        .from('products')
        .select('id, name, price_fcfa, compare_at_price_fcfa, images, video_url, category, stock, views, shop_id, shops!inner(slug)')
        .eq('shops.slug', slug)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('id, rating, body, created_at, shops!inner(slug)')
        .eq('shops.slug', slug)
        .order('created_at', { ascending: false }),
      supabase.from('reels').select('id, shops!inner(slug)', { count: 'exact', head: true }).eq('shops.slug', slug),
    ]);
    if (sErr) throw sErr;
    if (!shop) return null;
    if (pErr) throw pErr;
    return { shop, products: products || [], reviews: reviews || [], reelsCount: reelsCount || 0 };
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

  // Un plombier n'est pas une "boutique" qui "prépare sa collection". La page
  // et les données sont les mêmes (profil, contacts, avis, abonnés) — seul le
  // VOCABULAIRE s'adapte quand la fiche affiche au moins un métier de service.
  const provider = isServiceShop(shop);
  const sk = (key, opts) =>
    provider
      ? t(`shop.provider.${key}`, { ...opts, defaultValue: t(`shop.${key}`, opts) })
      : t(`shop.${key}`, opts);
  const mainTrade = (shop.categories ?? []).find(isServiceCategory);

  const term = q.trim().toLowerCase();
  const shownProducts = term ? data.products.filter((p) => p.name.toLowerCase().includes(term)) : data.products;
  // Promos réelles seulement (prix barré strictement au-dessus): l'onglet
  // n'existe pas s'il n'y a rien dedans — pas d'onglet vide qui déçoit.
  const promoProducts = data.products.filter((p) => discountPercent(p.price_fcfa, p.compare_at_price_fcfa));
  const bestProducts = [...data.products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  const openNow = isOpenNow(shop.opening_hours);
  const zones = Array.isArray(shop.delivery_zones) ? shop.delivery_zones.filter((z) => z && z.name) : [];
  // Garanties de confiance: UNIQUEMENT ce qui est vrai pour CETTE boutique
  // (jamais la même liste automatique partout — demande explicite de Beau,
  // et cohérent avec « rien de mensonger »).
  const trust = [
    shop.is_verified && { icon: IconRosetteDiscountCheck, label: t('shop.trustCertified') },
    (shop.offers_delivery || zones.length > 0) && { icon: IconTruckDelivery, label: t('shop.trustDelivery') },
    (shop.whatsapp || shop.phone) && { icon: IconHeadset, label: t('shop.trustContact') },
  ].filter(Boolean);

  const tabs = [
    { key: 'home', label: t('shop.tabHome') },
    { key: 'products', label: sk('products') },
    ...(promoProducts.length > 0 ? [{ key: 'promos', label: t('shop.tabPromos') }] : []),
    { key: 'reviews', label: sk('reviews') },
    { key: 'about', label: sk('about') },
  ];

  const productGrid = (list) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {list.map((p) => (
        <ProductCard key={p.id} product={{ ...p, shop_name: shop.name }} />
      ))}
    </div>
  );

  return (
    <div className="pb-6">
      <div className="relative">
        <ShopBanner src={banner} name={shop.name} seed={shop.id} className="h-44 w-full lg:h-64" />
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

      <div className="relative z-10 px-4 lg:mx-auto lg:max-w-6xl">
        {/* Avatar sur le bandeau + « Nos Reels » à sa droite (comme demandé:
            l'icône vers leurs vidéos, à côté de la photo de l'entreprise).
            Le bouton n'apparaît que si la boutique A des reels. */}
        <div className="-mt-10 flex items-end justify-between">
          <ShopAvatar src={avatar} name={shop.name} seed={shop.id} className="h-20 w-20 border-2 border-white lg:h-24 lg:w-24" />
          {data.reelsCount > 0 && (
            <Link
              to={`/fin?shop=${shop.id}`}
              className="mb-1 flex items-center gap-1.5 rounded-pill bg-ink px-3 py-1.5 text-caption font-semibold text-white shadow"
            >
              <IconMovie size={16} /> {t('shop.reelsButton')}
            </Link>
          )}
        </div>
        <div className="mt-2">
          <h1 className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 break-words text-title text-ink">
            <span className="min-w-0">{shop.name}</span>
            {shop.is_verified && <VerifiedBadge size={18} />}
          </h1>
          {provider && (
            <p className="mt-0.5 text-caption font-semibold text-teal">
              {t('shop.provider.badge')}
              {mainTrade ? ` · ${t(`categories.${mainTrade}`)}` : ''}
            </p>
          )}
          {(shop.city || shop.neighborhood) && (
            <p className="mt-0.5 flex items-center gap-1 text-caption text-muted">
              <IconMapPin size={13} /> {[shop.neighborhood, shop.city].filter(Boolean).join(', ')}
            </p>
          )}
          {shop.rotation_enabled && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-brass/10 px-2 py-0.5 text-caption font-semibold text-brass">
              <IconRefresh size={12} />
              {t('shop.rotationBadge', { count: shop.rotation_days || 7 })}
            </span>
          )}
        </div>

        {/* Bandeau de stats façon Nevo: la crédibilité d'un coup d'œil. */}
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-card border border-hairline bg-white p-3">
          <ShopStat icon={IconStarFilled} iconClass="text-brass" value={shop.rating ? Number(shop.rating).toFixed(1) : '—'} label={t('shop.statNote')} />
          <ShopStat icon={IconUsers} iconClass="text-teal" value={shop.followers_count || 0} label={t('shop.statFollowers')} />
          <ShopStat icon={IconShoppingBag} iconClass="text-success" value={data.products.length} label={t('shop.statProducts')} />
          <ShopStat
            icon={IconShieldCheck}
            iconClass={shop.is_verified ? 'text-success' : 'text-hairline'}
            value={shop.is_verified ? '✓' : '—'}
            label={t('shop.statCertified')}
          />
        </div>

        <div className="mt-3 flex gap-2 sm:max-w-md">
          <Button variant={following ? 'secondary' : 'primary'} loading={busy} onClick={toggleFollow} className="flex-1">
            {following ? t('common.following') : t('common.follow')}
          </Button>
          <button onClick={contact} className="flex h-12 items-center gap-1 rounded-[10px] border-[1.5px] border-teal px-4 text-teal" aria-label={sk('contactPrompt')}>
            <IconMessage size={20} />
          </button>
        </div>

        {/* Contact rapide: chaque canal n'apparaît QUE si renseigné. */}
        {(shop.whatsapp || shop.phone || shop.instagram) && (
          <div className="mt-2 flex gap-2 sm:max-w-md">
            {shop.whatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(sk('waGreeting', { name: shop.name }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-success-bg text-caption font-semibold text-success"
              >
                <IconBrandWhatsapp size={17} /> WhatsApp
              </a>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone.replace(/[^+\d]/g, '')}`}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-hairline text-caption font-semibold text-ink"
              >
                <IconPhone size={17} /> {t('shop.call')}
              </a>
            )}
            {shop.instagram && (
              <a
                href={`https://instagram.com/${shop.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-hairline text-caption font-semibold text-ink"
              >
                <IconBrandInstagram size={17} /> Instagram
              </a>
            )}
          </div>
        )}

        <div className="no-scrollbar mt-4 flex overflow-x-auto border-b border-hairline">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`shrink-0 border-b-2 px-4 py-2 text-body ${tab === tb.key ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* ---------------- Accueil ---------------- */}
          {tab === 'home' && (
            <div className="space-y-4">
              {shop.bio && <p className="whitespace-pre-wrap text-body text-ink">{shop.bio}</p>}

              {/* Horaires + badge Ouvert/Fermé calculé en direct. */}
              {openNow !== null && (
                <div className="rounded-card border border-hairline p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-body font-semibold text-ink">
                      <IconClock size={18} className="text-teal" /> {t('shop.hoursTitle')}
                    </span>
                    <span className={`rounded-pill px-2.5 py-0.5 text-caption font-semibold ${openNow ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                      ● {openNow ? t('shop.openNow') : t('shop.closedNow')}
                    </span>
                  </div>
                  <p className="mt-2 text-body text-ink">
                    <span className="mr-2 rounded-pill bg-teal-light px-2 py-0.5 text-caption font-semibold text-teal">{t('shop.hoursToday')}</span>
                    {new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' })} · {shop.opening_hours.open} – {shop.opening_hours.close}
                  </p>
                </div>
              )}

              {/* Garanties de confiance — réelles pour CETTE boutique. */}
              {trust.length > 0 && (
                <div className="rounded-card border border-success/30 bg-success-bg/50 p-3">
                  <p className="flex items-center gap-2 text-body font-semibold text-success">
                    <IconShieldCheck size={18} /> {t('shop.trustTitle')}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {trust.map((g, i) => (
                      <li key={i} className="flex items-center gap-2 text-body text-ink">
                        <g.icon size={17} className="shrink-0 text-success" /> {g.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zones de livraison (repliées à 3). */}
              {zones.length > 0 && (
                <div className="rounded-card border border-hairline p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-body font-semibold text-ink">
                      <IconTruckDelivery size={18} className="text-teal" /> {t('shop.zonesTitle')}
                    </span>
                    <span className="rounded-pill bg-hairline/60 px-2 py-0.5 text-caption font-semibold text-ink">
                      {t('shop.zonesCount', { count: zones.length })}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {(allZones ? zones : zones.slice(0, 3)).map((z, i) => (
                      <li key={i} className="flex items-center justify-between rounded-input bg-base p-2.5">
                        <span className="flex items-center gap-2 text-body text-ink">
                          <IconMapPin size={15} className="text-muted" /> {z.name}
                          {z.days ? <span className="text-caption text-muted">· {t('checkout.zoneDays', { count: Number(z.days) })}</span> : null}
                        </span>
                        {Number(z.fee_fcfa) > 0 ? (
                          <Price fcfa={Number(z.fee_fcfa)} className="text-caption font-semibold text-brass" />
                        ) : (
                          <span className="text-caption font-semibold text-success">{t('common.free')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {zones.length > 3 && !allZones && (
                    <button onClick={() => setAllZones(true)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-input bg-base py-2 text-caption font-semibold text-ink">
                      <IconChevronDown size={15} /> {t('shop.seeAllZones', { count: zones.length })}
                    </button>
                  )}
                </div>
              )}

              {/* Aperçu produits (les plus vus) + lien vers l'onglet complet. */}
              {bestProducts.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-section text-ink">{t('shop.bestProducts')}</h2>
                    <button onClick={() => setTab('products')} className="text-caption font-semibold text-teal">
                      {t('shop.seeAllProducts')}
                    </button>
                  </div>
                  {productGrid(bestProducts)}
                </div>
              )}
              {data.products.length === 0 && <EmptyState title={sk('emptyProducts')} />}
            </div>
          )}

          {/* ---------------- Produits ---------------- */}
          {tab === 'products' &&
            (data.products.length === 0 ? (
              <EmptyState title={sk('emptyProducts')} />
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 rounded-input border border-hairline px-3">
                  <IconSearch size={16} className="text-muted" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={sk('searchPlaceholder')}
                    aria-label={sk('searchPlaceholder')}
                    className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-muted focus:outline-none"
                  />
                </div>
                {shownProducts.length === 0 ? (
                  <p className="py-10 text-center text-body text-muted">{t('search.noResults', { q: q.trim() })}</p>
                ) : (
                  productGrid(shownProducts)
                )}
              </>
            ))}

          {/* ---------------- Promos ---------------- */}
          {tab === 'promos' &&
            (promoProducts.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted">{t('shop.promoEmpty')}</p>
            ) : (
              productGrid(promoProducts)
            ))}

          {/* ---------------- Avis ---------------- */}
          {tab === 'reviews' &&
            (data.reviews.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted">{sk('noReviews')}</p>
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

          {/* ---------------- À propos ---------------- */}
          {tab === 'about' && (
            <div className="space-y-3">
              {shop.bio ? <p className="whitespace-pre-wrap text-body text-ink">{shop.bio}</p> : <p className="text-caption text-muted">{sk('noAbout')}</p>}
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

function ShopStat({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon size={16} className={iconClass} />
      <span className="text-body font-semibold text-ink">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
