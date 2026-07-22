import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconChevronLeft, IconStarFilled } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { SmartImage } from '../../components/SmartImage';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { ProductCard } from '../../components/ProductCard';
import { Skeleton, ErrorState } from '../../components/states';
import { CATEGORIES } from '../../lib/categories';
import { track } from '../../lib/track';

export default function Search() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState({ loading: false, error: false, data: null });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(
    async (term) => {
      setState({ loading: true, error: false, data: null });
      try {
        const lower = term.toLowerCase();
        const cats = CATEGORIES.filter((c) => t(`categories.${c.id}`).toLowerCase().includes(lower));
        const [shopsRes, prodRes, followsRes] = await Promise.all([
          supabase.from('shops').select('id,slug,name,avatar_url,is_verified,rating').eq('status', 'active').ilike('name', `%${term}%`).limit(10),
          supabase.from('products').select('id,name,price_fcfa,images,category,stock,shop_id,shops(name)').eq('is_active', true).ilike('name', `%${term}%`).limit(12),
          user
            ? supabase.from('shop_follows').select('shops(id,slug,name,avatar_url,is_verified,rating)').eq('follower_id', user.id)
            : Promise.resolve({ data: [] }),
        ]);
        if (shopsRes.error || prodRes.error) throw shopsRes.error || prodRes.error;
        const followed = (followsRes.data || [])
          .map((r) => r.shops)
          .filter((s) => s && s.name.toLowerCase().includes(lower));
        const products = (prodRes.data || []).map((p) => ({ ...p, shop_name: p.shops?.name }));
        setState({ loading: false, error: false, data: { cats, shops: shopsRes.data || [], products, followed } });
        track('search', null, { q: term });
      } catch {
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
            className="w-full bg-transparent py-2.5 text-body text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </header>

      <div className="p-4">
        {!q.trim() ? (
          <p className="py-10 text-center text-caption text-muted">{t('search.hint')}</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => runSearch(q.trim())} />
        ) : isEmptyResult ? (
          <p className="py-10 text-center text-body text-muted">{t('search.noResults', { q: q.trim() })}</p>
        ) : (
          <div className="space-y-6">
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
                <div className="grid grid-cols-2 gap-3">
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
            <SmartImage src={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} alt={s.name} className="h-10 w-10" rounded="rounded-full" />
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
