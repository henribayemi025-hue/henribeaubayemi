import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessage, IconChevronLeft, IconArrowBackUp, IconMinus, IconPlus, IconTrash, IconSparkles, IconShieldCheck } from '@tabler/icons-react';
import { MirrorModal } from '../../components/MirrorModal';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { PriceBlock, PromoBadge, discountPercent } from '../../components/Price';
import { ProductCard } from '../../components/ProductCard';
import { SmartImage } from '../../components/SmartImage';
import { ProductVideo } from '../../components/ProductVideo';
import { StarRating } from '../../components/StarRating';
import { ReportButton } from '../../components/ReportButton';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Skeleton, ErrorState } from '../../components/states';
import { isPriceOnRequest, MIRROR_CATEGORIES } from '../../lib/categories';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';
import { track } from '../../lib/track';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { add, items, setQty, remove } = useCart();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const sizeRef = useRef(null);
  const [starting, setStarting] = useState(false);
  const [mirrorOpen, setMirrorOpen] = useState(false);

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
      })
      // Hors ligne, le `.then` seul partait en rejet non capturé dans la
      // console. La section reste simplement vide — elle n'a jamais bloqué
      // la page.
      .catch(() => {});
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
    // Les avis se laissent par commande, pas par article (voir ReviewModal):
    // une commande peut contenir plusieurs produits d'une même boutique, donc
    // rien ne les rattache à UN article précis. On affiche ici les avis de la
    // boutique du produit, comme le fait déjà l'onglet Avis de sa fiche.
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, body, created_at')
      .eq('shop_id', product.shop_id)
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
  const quote = isPriceOnRequest(p);
  const pct = quote ? null : discountPercent(p.price_fcfa, p.compare_at_price_fcfa);
  const outOfStock = !quote && (p.stock ?? 0) <= 0;
  // La ligne de panier correspond à la VARIANTE sélectionnée: la même robe en
  // M et en XL sont deux lignes distinctes (la boutique doit savoir quelles
  // tailles préparer).
  const cartLine = items.find(
    (i) => i.id === p.id && (i.size || '') === (size || '') && (i.color || '') === (color || '')
  );
  const needsSize = p.sizes?.length > 0 && !size;
  const images = (p.images || []).map((im) => storageUrl('products', im));

  function addToCart() {
    // Taille définie par la boutique = choix obligatoire avant l'ajout,
    // sinon la commande arrive sans taille et tout le monde perd du temps.
    if (needsSize) {
      toast.info(t('product.chooseSizeFirst'));
      // Amener la cliente DEVANT le choix de taille au lieu de la laisser
      // chercher où il se trouve — le toast seul ne dit pas où aller.
      sizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    add({ ...p, shop_name: shop.name }, 1, { size: size || null, color: color || null });
  }

  return (
    <div className="relative lg:mx-auto lg:max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        aria-label={t('common.back')}
        className="absolute left-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-ink shadow"
      >
        <IconChevronLeft size={22} />
      </button>

      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:rounded-card">
        {/* La vidéo passe en PREMIER: c'est elle qui montre le tombé, la vraie
            couleur, le mouvement — les photos viennent en complément. */}
        {p.video_url && (
          <div className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-ink lg:aspect-[16/9]">
            <ProductVideo videoUrl={p.video_url} alt={p.name} className="absolute inset-0 h-full w-full" />
          </div>
        )}
        {images.length ? (
          images.map((src, i) => (
            <div key={i} className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-ink lg:aspect-[16/9]">
              {/* Blurred same-photo backdrop fills the square; the real photo
                  stays fully visible on top so nothing (like a face) is ever
                  cropped off, regardless of how the source photo was framed. */}
              <SmartImage src={src} alt="" className="absolute inset-0 h-full w-full scale-110 blur-lg" />
              <SmartImage src={src} alt={`${p.name} ${i + 1}`} fit="contain" className="absolute inset-0 h-full w-full" />
            </div>
          ))
        ) : p.video_url ? null : (
          <SmartImage src={null} alt={p.name} className="aspect-square w-full lg:aspect-[16/9]" />
        )}
      </div>
      {images.length + (p.video_url ? 1 : 0) > 1 && (
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: images.length + (p.video_url ? 1 : 0) }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-hairline" />
          ))}
        </div>
      )}

      <div className="p-4">
        <h1 className="text-title text-ink">{p.name}</h1>
        {quote ? (
          <p className="mt-1 text-section font-semibold text-brass">{t('product.priceOnRequest')}</p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <PriceBlock fcfa={p.price_fcfa} compareAtFcfa={p.compare_at_price_fcfa} className="block text-title font-semibold text-teal" />
            {pct && <PromoBadge percent={pct} />}
          </div>
        )}

        {/* LE frein d'achat ici n'est pas le prix, c'est la peur de payer un
            inconnu en ligne. Le dire sous le prix, à l'endroit exact où l'on
            hésite — repris des maquettes AI Studio de Beau. Vrai partout:
            aucun paiement n'existe dans l'application. Masqué sur les
            articles sur devis, où « paie à la livraison » n'a pas de sens. */}
        {!quote && (
          <p className="mt-2 flex items-center gap-2 rounded-input bg-teal-light px-3 py-2 text-caption text-ink">
            <IconShieldCheck size={16} className="shrink-0 text-success" />
            {t('product.codReassurance')}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <Link to={`/boutique/${shop.slug}`} className="flex min-w-0 items-center gap-2 text-body text-muted">
            <span>{t('product.soldBy')} <span className="font-semibold text-ink">{shop.name}</span></span>
            {shop.is_verified && <VerifiedBadge size={15} />}
          </Link>
          {/* Signaler CET article, pas la boutique entière: exigé par la règle
              1.2 de l'App Store, et la seule action proportionnée quand c'est
              une photo ou une description qui pose problème. */}
          <ReportButton targetType="product" targetId={p.id} className="shrink-0" />
        </div>

        {outOfStock && (
          <span className="mt-3 inline-block rounded-pill bg-danger-bg px-3 py-1 text-caption font-semibold text-danger">
            {t('product.outOfStock')}
          </span>
        )}

        {!quote && MIRROR_CATEGORIES.includes(p.category) && (
          <button
            onClick={() => (user ? setMirrorOpen(true) : requireLogin())}
            className="mt-3 inline-flex items-center gap-1.5 rounded-pill border border-brass/50 bg-brass/5 px-3 py-1.5 text-caption font-semibold text-brass"
          >
            <IconSparkles size={15} /> {t('mirror.tryOnButton')}
          </button>
        )}

        {/* Taille/couleur AVANT la description: c'est le choix qui conditionne
            l'ajout au panier — enterré sous un long descriptif, la cliente
            tapait le bouton, recevait l'erreur et ne voyait pas où choisir. */}
        {p.sizes?.length > 0 && (
          <div ref={sizeRef}>
            <Variant label={`${t('product.size')} *`} options={p.sizes} value={size} onChange={setSize} />
          </div>
        )}
        {p.colors?.length > 0 && (
          <Variant label={t('product.color')} options={p.colors} value={color} onChange={setColor} />
        )}

        {p.description && (
          <div className="mt-4">
            <h2 className="text-section text-ink">{t('product.description')}</h2>
            <p className="mt-1 whitespace-pre-wrap text-body text-muted">{p.description}</p>
          </div>
        )}

        {/* Champs spécifiques du pivot (surface, année, kilométrage…) —
            affichés seulement si la fiche en a. */}
        {p.attributes && Object.keys(p.attributes).length > 0 && (
          <div className="mt-4 space-y-1 rounded-card border border-hairline p-3">
            {Object.entries(p.attributes).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-body">
                <span className="text-muted">{t(`productAttrs.${k}`, { defaultValue: k })}</span>
                <span className="text-right font-medium text-ink">{String(v)}</span>
              </div>
            ))}
          </div>
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
        ) : cartLine ? (
          // Already in the cart → a stepper reflecting the real cart quantity,
          // capped at available stock. No confusing transient "added" label.
          <div className="flex flex-1 items-center justify-between rounded-[10px] border-[1.5px] border-teal px-2">
            <button
              onClick={() => (cartLine.qty <= 1 ? remove(cartLine.key) : setQty(cartLine.key, cartLine.qty - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full text-teal transition active:scale-90 active:bg-teal/10"
              aria-label={cartLine.qty <= 1 ? t('cart.remove') : t('common.decrease')}
            >
              {cartLine.qty <= 1 ? <IconTrash size={20} /> : <IconMinus size={20} />}
            </button>
            <span className="text-body font-semibold text-ink">{t('product.inCart', { count: cartLine.qty })}</span>
            <button
              onClick={() => setQty(cartLine.key, cartLine.qty + 1)}
              disabled={cartLine.qty >= (p.stock ?? Infinity)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-teal transition active:scale-90 active:bg-teal/10 disabled:opacity-30"
              aria-label={t('common.increase')}
            >
              <IconPlus size={20} />
            </button>
          </div>
        ) : (
          <Button disabled={outOfStock} onClick={addToCart}>
            {outOfStock ? t('product.outOfStock') : t('product.addToCart')}
          </Button>
        )}
      </div>

      <MirrorModal open={mirrorOpen} onClose={() => setMirrorOpen(false)} product={p} />
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
