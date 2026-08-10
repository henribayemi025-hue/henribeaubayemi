import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconShoppingCart, IconMoodSmile, IconTool, IconChevronRight } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { CategoryStrip } from '../../components/CategoryStrip';
import { NotificationBell } from '../../components/NotificationBell';
import { HomeHeroCarousel } from '../../components/HomeHeroCarousel';
import { ProductCard } from '../../components/ProductCard';
import { ShopCard } from '../../components/ShopCard';
import { ProductGridSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Spinner } from '../../components/Spinner';
import { homeCache, loadHome, fetchProductPage } from '../../lib/homeCache';

export default function Home() {
  const { t } = useTranslation();
  const { count } = useCart();
  const { user } = useAuth();
  const { country } = useSettings();
  const [data, setData] = useState(homeCache);
  const [loading, setLoading] = useState(!homeCache);
  const [error, setError] = useState(false);

  // Pages suivantes du fil. `cursor` vit dans une ref: le lecteur
  // d'intersection ne doit pas être recréé à chaque page chargée, sinon il se
  // redéclenche tout seul et enchaîne les requêtes.
  const [extra, setExtra] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef(null);
  const doneRef = useRef(false);
  const busyRef = useRef(false);
  const sentinelRef = useRef(null);

  async function load() {
    if (!homeCache) setLoading(true);
    setError(false);
    try {
      const result = await loadHome(country);
      setData(result);
      setExtra([]);
      cursorRef.current = result.cursor;
      doneRef.current = !!result.done;
    } catch {
      if (!homeCache) setError(true); // no stale data to fall back to
    } finally {
      setLoading(false);
    }
  }

  // Rechargé quand le pays change: à la connexion, le profil peut annoncer un
  // autre pays que celui deviné avant qu'on sache qui était là.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || doneRef.current || !cursorRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchProductPage(country, cursorRef.current);
      cursorRef.current = page.cursor;
      doneRef.current = page.done;
      // Garde-fou: un article publié pendant le défilement décale les pages et
      // pourrait renvoyer une ligne déjà affichée.
      setExtra((prev) => {
        const seen = new Set([...(data?.products || []), ...prev].map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
    } catch {
      doneRef.current = true; // on arrête d'insister plutôt que de boucler
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [country, data]);

  // On charge la page suivante AVANT d'arriver en bas (marge d'un écran), pour
  // que le fil paraisse continu au lieu de s'arrêter puis repartir.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || error) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, loading, error]);

  return (
    <div>
      {/* En-tête à deux niveaux (façon Amazon/Jumia): la ligne du bas est une
          VRAIE barre de recherche tappable, pas juste une icône loupe — c'est
          la première chose que quelqu'un cherche à faire à l'ouverture de
          l'app, autant lui donner toute la largeur plutôt qu'une cible de
          24 px dans un coin. */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-white">
        <div className="flex h-12 items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-title font-semibold text-teal">Finjaro</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            {/* Le SEUL canal de notification qui atteint tous les comptes:
                un push exige une permission, un e-mail suppose d'en avoir un
                — faux pour un compte créé par téléphone. Invisible pour les
                invités, qui n'ont rien à y voir. */}
            {user && <NotificationBell />}
            <Link to="/cart" aria-label={t('cart.title')} className="relative text-ink">
              <IconShoppingCart size={23} />
              {count > 0 && (
                <span key={count} className="animate-like-pop absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <Link
          to="/search"
          className="mx-4 mb-3 flex h-10 items-center gap-2 rounded-pill border border-hairline bg-base px-3.5 text-muted transition-colors active:bg-hairline/40"
        >
          <IconSearch size={17} className="shrink-0" />
          <span className="truncate text-body">{t('common.searchPlaceholder')}</span>
        </Link>
      </header>

      {/* On desktop the sidebar layout leaves this column very wide (no cap),
          which made the category icons and cards look tiny against all the
          empty space. Cap the body at a normal reading width on lg+ while
          leaving the sticky header full-bleed. */}
      <div className="lg:mx-auto lg:max-w-6xl">
        <div className="p-4 pb-0">
          <HomeHeroCarousel products={data?.products} />
        </div>

        <div className="pt-3">
          <CategoryStrip />
        </div>

        {/* Pivot: séparation lisible acheter un PRODUIT (bandeau catégories
            ci-dessus) vs réserver un SERVICE (cette bande -> onglet Services).
            Volontairement fine et sur UNE ligne de texte: la version en gros
            pavé de trois lignes écrasait le reste de l'accueil. */}
        <section className="mt-4 px-4">
          {/* Teinte laiton CONSERVÉE. J'avais commencé par la retirer au nom
              d'« une seule couleur d'accent » — c'était mon goût, pas celui de
              Finjaro. Beau: « c'est ça qui fait son style, les gens ont bien
              aimé le style vintage ». Le crème, la terracotta et le laiton
              SONT l'identité; les enlever rendrait l'app correcte et
              anonyme. Ce qu'on corrige, ce sont les défauts, pas le style. */}
          <Link
            to="/services"
            className="flex items-center gap-3 rounded-card border border-brass/25 bg-brass/8 px-3.5 py-3 shadow-sm transition-transform duration-150 active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brass shadow-sm">
              <IconTool size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-ink">{t('home.servicesTitle')}</span>
              <span className="block truncate text-caption text-muted">{t('home.servicesSubtitle')}</span>
            </span>
            <IconChevronRight size={18} className="shrink-0 text-brass" />
          </Link>
        </section>

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
              <section className="mt-5">
                {/* Titres de section: MÊME taille que « Catégories »
                    (text-section) — Beau garde cette taille-là, donc les trois
                    s'alignent dessus au lieu d'être chacun différent. Ce qui
                    saute, ce sont les icônes teintées: chacune ajoutait une
                    couleur de plus à un écran qui en comptait déjà cinq. */}
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
                  {[...data.products, ...extra].map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              {/* Sentinelle du défilement infini + fin de catalogue. */}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              )}
              {!loadingMore && doneRef.current && data.products.length > 0 && (
                <p className="py-6 text-center text-caption text-muted">{t('home.endOfFeed')}</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
