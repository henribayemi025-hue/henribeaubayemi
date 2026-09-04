import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconChevronLeft, IconStarFilled, IconBuildingStore, IconArrowRight } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton, ErrorState } from '../../components/states';
import { CATEGORIES } from '../../lib/categories';
import { track } from '../../lib/track';
import { nameMatches } from '../../lib/searchNorm';
import { DemandeFinia } from '../../components/DemandeFinia';

// Quelqu'un qui tape « devenir vendeur », « ma boutique » ou « vendre »
// dans la BARRE DE RECHERCHE DE PRODUITS est deja dans l'app: il cherche
// le bouton « Devenir vendeur », il ne cherche pas un article a acheter.
// Meme expression que le rapport hebdo (voir migration 0066).
const VEUT_VENDRE = /(vendre|vendeur|vendeuse|devenir|ma boutique|ouvrir.*boutique|inscri|compte)/i;
function veutVendre(q) { return VEUT_VENDRE.test(q); }

export default function Search() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState({ loading: false, error: false, data: null });

  useEffect(() => {
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, []);

  const runSearch = useCallback(
    async (term) => {
      // Cancel any in-flight search so a slow response can't overwrite a newer one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setState({ loading: true, error: false, data: null });
      try {
        const lower = term.toLowerCase();
        const cats = CATEGORIES.filter((c) => t(`categories.${c.id}`).toLowerCase().includes(lower));
        const [shopsRes, prodRes, followsRes] = await Promise.all([
          // PAS de ilike ici: il exige les accents exacts (« decoration » ne
          // trouvait pas « Décoration évents », vérifié en base) et bute sur
          // les apostrophes (« kems » vs « Kem'S »). Les boutiques actives se
          // comptent en dizaines de lignes légères: on les rapatrie et on
          // compare en repliant accents et apostrophes des deux côtés.
          supabase.from('shops').select('id,slug,name,avatar_url,is_verified,rating').eq('status', 'active').limit(300).abortSignal(signal),
          supabase.from('products').select('id,name,price_fcfa,compare_at_price_fcfa,images,video_url,price_on_request,category,stock,shop_id,shops(name)').eq('is_active', true).ilike('name', `%${term}%`).limit(12).abortSignal(signal),
          user
            ? supabase.from('shop_follows').select('shops(id,slug,name,avatar_url,is_verified,rating)').eq('follower_id', user.id).abortSignal(signal)
            : Promise.resolve({ data: [] }),
        ]);
        if (signal.aborted) return; // a newer search superseded this one
        if (shopsRes.error || prodRes.error) throw shopsRes.error || prodRes.error;
        const followed = (followsRes.data || [])
          .map((r) => r.shops)
          .filter((s) => s && s.name.toLowerCase().includes(lower));
        const products = (prodRes.data || []).map((p) => ({ ...p, shop_name: p.shops?.name }));
        const shops = (shopsRes.data || []).filter((sh) => nameMatches(sh.name, term)).slice(0, 10);
        setState({ loading: false, error: false, data: { cats, shops, products, followed } });
        // `n` = nombre de résultats. Sans lui, on sait ce que les gens
        // cherchent mais pas ce qu'ils n'ont pas trouvé — or c'est exactement
        // ça qui dit quelles vendeuses il faut aller recruter.
        track('search', null, { q: term, n: products.length + shops.length });
      } catch (err) {
        if (signal.aborted || err?.name === 'AbortError') return; // stale, ignore
        setState({ loading: false, error: true, data: null });
      }
    },
    [t, user]
  );

  // Debounced search (~300ms) to avoid spamming Supabase.
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setState({ loading: false, error: false, data: null });
      return undefined;
    }
    const id = setTimeout(() => runSearch(term), 300);
    return () => clearTimeout(id);
  }, [q, runSearch]);

  const { loading, error, data } = state;
  const isEmptyResult =
    data && data.cats.length === 0 && data.shops.length === 0 && data.products.length === 0 && data.followed.length === 0;

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-3">
        <button onClick={() => navigate(-1)} aria-label={t('common.back')} className="rounded-full p-1 text-ink hover:bg-hairline">
          <IconChevronLeft size={24} />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-input border border-hairline px-3">
          <IconSearch size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </header>

      <div className="p-4">
        {!q.trim() ? (
          <p className="py-10 text-center text-caption text-muted">{t('search.hint')}</p>
        ) : loading || !data ? (
          // `!data` covers the ~300ms window between typing and the debounced
          // search actually starting (state.data is still its initial `null`
          // there) — without this the render below would crash on `data.cats`.
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => runSearch(q.trim())} />
        ) : isEmptyResult ? (
          <div className="space-y-4 py-6">
            {veutVendre(q) && <DevenirVendeurCard />}
            <p className="text-center text-body text-muted">{t('search.noResults', { q: q.trim() })}</p>
            {/* Une recherche vide n'est pas une impasse: c'est une demande
                qu'on peut encore servir. Sauf quand la personne cherche a
                VENDRE (pas un article) — dans ce cas la carte au-dessus
                suffit et le formulaire d'achat serait hors sujet. */}
            {!veutVendre(q) && <DemandeFinia recherche={q.trim()} source="recherche" />}
          </div>
        ) : (
          <div className="space-y-6">
            {veutVendre(q) && <DevenirVendeurCard />}
            {data.cats.length > 0 && (
              <Section title={t('categories.title')}>
                <div className="flex flex-wrap gap-2">
                  {data.cats.map((c) => (
                    <Link key={c.id} to={`/category/${c.id}`} className="chip text-ink">{t(`categories.${c.id}`)}</Link>
                  ))}
                </div>
              </Section>
            )}

            {data.followed.length > 0 && (
              <Section title={t('search.followed')}>
                <ShopRows shops={data.followed} />
              </Section>
            )}

            {data.shops.length > 0 && (
              <Section title={t('nearYou.shops')}>
                <ShopRows shops={data.shops} />
              </Section>
            )}

            {data.products.length > 0 && (
              <Section title={t('search.items')}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-section text-ink">{title}</h2>
      {children}
    </section>
  );
}

function ShopRows({ shops }) {
  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline">
      {shops.map((s) => (
        <li key={s.id}>
          <Link to={`/boutique/${s.slug}`} className="flex items-center gap-3 px-3 py-2.5">
            <ShopAvatar src={s.avatar_url ? storageThumbUrl('shops', s.avatar_url) : null} fallbackSrc={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} name={s.name} seed={s.id} className="h-10 w-10" />
            <span className="flex flex-1 items-center gap-1 text-body font-semibold text-ink">
              {s.name}
              {s.is_verified && <VerifiedBadge size={14} />}
            </span>
            <span className="flex items-center gap-0.5 text-caption text-muted">
              <IconStarFilled size={12} className="text-brass" />
              {Number(s.rating || 0).toFixed(1)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Carte affichee quand quelqu'un tape « devenir vendeur », « ma boutique »,
// « vendre »... dans la recherche. Le rapport hebdo a montre que ces gens
// sont deja dans l'app: ce n'est pas une demande d'article a servir, c'est un
// bouton a rendre visible. Un clic = ils atterrissent directement sur le
// formulaire « Devenir vendeur ». Sans ca, ils repartent, et Finjaro perd
// des vendeuses qui etaient venues d'elles-memes.
function DevenirVendeurCard() {
  const { t } = useTranslation();
  return (
    <Link
      to="/become-vendor"
      onClick={() => track('search_devenir_vendeur_click')}
      className="flex items-center gap-3 rounded-card border border-teal/30 bg-teal-light/40 p-4 text-left transition active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white">
        <IconBuildingStore size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">{t('search.becomeVendorCta')}</span>
        <span className="mt-0.5 block text-caption text-muted">{t('search.becomeVendorHint')}</span>
      </span>
      <IconArrowRight size={20} className="shrink-0 text-teal" />
    </Link>
  );
}
