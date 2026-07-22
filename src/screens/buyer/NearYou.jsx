import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBuildingStore, IconMapPinOff, IconStarFilled } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useUI } from '../../hooks/useUI';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';
import { PublishListingModal } from './PublishListingModal';
import { countryLabel, COUNTRIES } from '../../lib/countries';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';

export default function NearYou() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { country, setCountry } = useSettings();
  const { requireLogin } = useUI();
  const [tab, setTab] = useState('shops');
  const [publishOpen, setPublishOpen] = useState(false);
  const [radius, setRadius] = useState('country');

  const { data, loading, error, retry } = useAsync(async () => {
    const shopsQuery = supabase.from('shops').select('*').eq('status', 'active').order('followers_count', { ascending: false }).limit(40);
    if (radius === 'country' && country) shopsQuery.eq('country', country);
    // Explicit FK join (near_you_listings.user_id -> profiles) so PostgREST can
    // resolve the poster's name. The FK is added in migration 0007.
    const [shopsRes, listingsRes] = await Promise.all([
      shopsQuery,
      supabase
        .from('near_you_listings')
        .select('*, profiles!near_you_listings_profile_fk(name)')
        .order('created_at', { ascending: false })
        .limit(40),
    ]);
    if (shopsRes.error) throw shopsRes.error;
    // Surface (don't silently swallow) a listings error, but keep Boutiques usable.
    if (listingsRes.error) console.error('[NearYou] listings query failed:', listingsRes.error.message);
    return {
      shops: shopsRes.data || [],
      listings: listingsRes.data || [],
      listingsError: listingsRes.error ? listingsRes.error.message : null,
    };
  }, [country, radius]);

  async function openListingChat(listing) {
    if (!user) return requireLogin();
    // Buyer-to-buyer chat is Parking Lot; contact routes through the poster's
    // shop when they have one, otherwise there's no chat entry point.
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', listing.user_id).maybeSingle();
    if (!shop) return;
    try {
      const convId = await getOrCreateConversation(user.id, shop.id);
      navigate(`/chat/${convId}`);
    } catch {
      /* own listing/shop — nothing to open */
    }
  }

  return (
    <div className="pb-20">
      <AppHeader title={t('nav.nearYou')} />
      <div className="flex items-center gap-2 px-4 pt-3">
        <select
          value={country || ''}
          onChange={(e) => setCountry(e.target.value)}
          className="input h-9 w-auto flex-1 py-1 text-caption"
          aria-label={t('nearYou.overrideLocation')}
        >
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}
        </select>
        {tab === 'shops' && (
          <button onClick={() => setRadius((r) => (r === 'country' ? 'all' : 'country'))} className="chip text-teal">
            {radius === 'country' ? t('nearYou.broaden') : countryLabel(country, i18n.language)}
          </button>
        )}
      </div>

      <div className="mt-3 flex border-b border-hairline">
        {['shops', 'listings'].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`flex-1 border-b-2 py-2 text-body ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}>
            {t(`nearYou.${tb}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : tab === 'shops' ? (
        data.shops.length === 0 ? (
          <EmptyState icon={IconMapPinOff} title={t('nearYou.noShops')} action={<Button variant="secondary" onClick={() => setRadius('all')}>{t('nearYou.broaden')}</Button>} />
        ) : (
          <ul className="divide-y divide-hairline">
            {data.shops.map((s) => (
              <li key={s.id}>
                <button onClick={() => navigate(`/boutique/${s.slug}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <SmartImage src={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} alt={s.name} className="h-12 w-12" rounded="rounded-full" />
                  <div className="flex-1">
                    <p className="flex items-center gap-1 text-body font-semibold text-ink">{s.name} {s.is_verified && <VerifiedBadge size={14} />}</p>
                    <p className="flex items-center gap-1 text-caption text-muted"><IconStarFilled size={12} className="text-brass" />{Number(s.rating || 0).toFixed(1)} · {[s.city, countryLabel(s.country, i18n.language)].filter(Boolean).join(', ')}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : data.listingsError ? (
        <ErrorState onRetry={retry} />
      ) : data.listings.length === 0 ? (
        <EmptyState icon={IconBuildingStore} title={t('nearYou.noListings')} />
      ) : (
        <ul className="space-y-3 p-4">
          {data.listings.map((l) => (
            <li key={l.id} className="card">
              <div className="flex items-center justify-between">
                <span className={`chip ${l.type === 'cherche' ? 'chip-active' : 'text-brass border-brass'}`}>
                  {t(l.type === 'cherche' ? 'nearYou.iLookFor' : 'nearYou.iOffer')}
                </span>
                <span className="text-caption text-muted">{timeAgo(l.created_at, i18n.language)}</span>
              </div>
              {l.photo_url && <SmartImage src={storageUrl('listings', l.photo_url)} alt="" className="mt-2 h-40 w-full rounded-input" />}
              <p className="mt-2 text-body text-ink">{l.description}</p>
              <p className="mt-1 text-caption text-muted">{l.profiles?.name || t('profile.guest')} · {[l.city, countryLabel(l.country, i18n.language)].filter(Boolean).join(', ')}</p>
              <button onClick={() => openListingChat(l)} className="mt-2 text-caption font-semibold text-teal">{t('nearYou.openChat')}</button>
            </li>
          ))}
        </ul>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-app justify-end px-4">
        <button
          onClick={() => (user ? setPublishOpen(true) : requireLogin())}
          className="pointer-events-auto flex h-12 items-center gap-1 rounded-pill bg-teal px-4 text-white shadow-lg"
        >
          <IconPlus size={20} /> <span className="text-caption font-semibold">{t('nearYou.publishListing')}</span>
        </button>
      </div>

      <PublishListingModal open={publishOpen} onClose={() => setPublishOpen(false)} onDone={retry} />
    </div>
  );
}
