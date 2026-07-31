import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBuildingStore, IconMapPinOff, IconStarFilled, IconCurrentLocation, IconList, IconMap2, IconTool, IconSearch, IconX } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';
import { PublishListingModal } from './PublishListingModal';
import { countryLabel, COUNTRIES } from '../../lib/countries';
import { getOrCreateConversation } from '../../lib/chat';
import { timeAgo } from '../../lib/format';
import { formatPrice } from '../../lib/currency';
import { getPosition, distanceKm } from '../../lib/geo';
import { isServiceCategory, isServiceShop, SERVICE_CATEGORIES, categoryQueryIds } from '../../lib/categories';

// Leaflet is heavy — only pull it in when the user opens the map view.
const NearYouMap = lazy(() => import('../../components/NearYouMap'));

// Un pictogramme par métier rend la liste lisible d'un coup d'œil (le
// prototype le faisait). Purement décoratif: un métier sans emoji s'affiche
// simplement sans, jamais de case vide.
const TRADE_EMOJI = {
  beaute_domicile: '💇',
  menage: '🧹',
  btp_bricolage: '🧱',
  informatique_digital: '💻',
  electricite_plomberie: '⚡',
  livraison_demenagement: '🚚',
  traiteur_chef: '🍳',
  location_immobiliere: '🏠',
  location_vehicules: '🚗',
  cours: '📚',
  evenementiel_service: '🎉',
  autre_service: '🛠️',
};

// Accents/casse ignorés pour la recherche de métier ("electricite" trouve
// "Électricité"): sinon taper sans accent ne renvoie rien.
function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function NearYou() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { country, setCountry, currency } = useSettings();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [tab, setTab] = useState('shops');
  const [kindFilter, setKindFilter] = useState('all'); // 'all' | 'service' | 'article' — listings tab only
  // 'all' | 'propose' | 'cherche' — sépare l'offre de la demande.
  const [typeFilter, setTypeFilter] = useState('all');
  // Annuaire des métiers: filtre par catégorie de service (têtes du pivot,
  // enfants hérités inclus via categoryQueryIds). null = tout.
  const [serviceCat, setServiceCat] = useState(null);
  const [tradeQuery, setTradeQuery] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [publishOpen, setPublishOpen] = useState(false);
  const [radius, setRadius] = useState('country');
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);

  async function locateMe() {
    if (userPos) {
      setUserPos(null);
      return;
    }
    setLocating(true);
    const pos = await getPosition();
    setLocating(false);
    if (pos) {
      setUserPos(pos);
      setRadius('all'); // "around me" spans countries, sorted by real distance
    } else {
      toast.error(t('nearYou.locationDenied'));
    }
  }

  // Attach real distance + sort nearest-first when a position is known.
  function byDistance(items) {
    if (!userPos) return items;
    return items
      .map((x) => ({ ...x, _km: distanceKm(userPos, { lat: x.lat, lng: x.lng }) }))
      .sort((a, b) => {
        if (a._km == null && b._km == null) return 0;
        if (a._km == null) return 1;
        if (b._km == null) return -1;
        return a._km - b._km;
      });
  }

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

  const filteredListings = (data?.listings || []).filter((l) => {
    if (serviceCat && !categoryQueryIds(serviceCat).includes(l.category)) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (kindFilter === 'all') return true;
    return kindFilter === 'service' ? isServiceCategory(l.category) : !isServiceCategory(l.category);
  });

  // L'onglet Services ne liste que les PRESTATAIRES. Avant, il affichait
  // toutes les boutiques actives — une boutique de vêtements se retrouvait
  // dans l'annuaire des services, et le filtre par métier ne l'affectait
  // même pas. Une boutique est prestataire dès qu'elle a un métier de
  // service dans ses catégories.
  const filteredShops = (data?.shops || []).filter((s) => {
    if (!isServiceShop(s)) return false;
    if (!serviceCat) return true;
    const wanted = categoryQueryIds(serviceCat);
    return (s.categories ?? []).some((c) => wanted.includes(c));
  });

  // Métiers affichés = ceux qui correspondent à la recherche.
  const visibleTrades = SERVICE_CATEGORIES.filter(
    (c) => !tradeQuery.trim() || normalize(t(`categories.${c.id}`)).includes(normalize(tradeQuery))
  );

  // Choisir un métier filtre l'onglet où on se trouve (prestataires OU
  // annonces) — il ne bascule plus d'office sur "Annonces", ce qui donnait
  // l'impression que le filtre ignorait les boutiques.
  function pickTrade(id) {
    setServiceCat((cur) => (cur === id ? null : id));
  }

  function publish() {
    if (user) setPublishOpen(true);
    else requireLogin();
  }

  // Vrai quand l'onglet courant n'a rien à lister: pilote l'affichage du
  // bouton flottant, qui se posait sinon par-dessus les boutons de l'écran
  // vide. La carte a son propre rendu, elle n'est jamais concernée.
  const listEmpty =
    !loading &&
    !error &&
    view !== 'map' &&
    (tab === 'shops' ? filteredShops.length === 0 : filteredListings.length === 0);

  return (
    <div className="pb-20">
      <AppHeader title={t('nav.services')} />

      {/* Bloc de filtres unifié (repris de la structure du prototype): tout ce
          qui filtre vit DANS un même encadré, au lieu d'être éparpillé sur
          trois rangées où "Élargir la recherche" débordait de l'écran. */}
      <div className="mx-4 mt-3 space-y-3 rounded-card border border-hairline bg-[#FAF6F0] p-3">
        {/* Recherche par métier — c'est ce qui manquait: avec 12 métiers, les
            faire défiler à l'aveugle n'est pas utilisable. */}
        <div className="relative">
          <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={tradeQuery}
            onChange={(e) => setTradeQuery(e.target.value)}
            placeholder={t('nearYou.searchTrade')}
            className="input h-10 w-full pl-9 pr-9 text-[16px]"
            aria-label={t('nearYou.searchTrade')}
          />
          {tradeQuery && (
            <button
              onClick={() => setTradeQuery('')}
              aria-label={t('common.close')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted"
            >
              <IconX size={15} />
            </button>
          )}
        </div>

        {/* Métiers: une seule ligne qui défile, libellés JAMAIS coupés
            (whitespace-nowrap + shrink-0) — c'était le "BTP, Architecture &
            Bri…" tronqué en plein milieu. Un fondu à droite signale qu'il
            reste des métiers à faire défiler, au lieu de donner
            l'impression que la dernière pastille est cassée. */}
        <div className="relative">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            <button
              onClick={() => setServiceCat(null)}
              className={`chip shrink-0 whitespace-nowrap ${!serviceCat ? 'chip-active' : 'bg-white text-ink'}`}
            >
              {t('nearYou.allTrades')}
            </button>
            {visibleTrades.map((c) => (
              <button
                key={c.id}
                onClick={() => pickTrade(c.id)}
                className={`chip shrink-0 whitespace-nowrap ${serviceCat === c.id ? 'chip-active' : 'bg-white text-ink'}`}
              >
                {TRADE_EMOJI[c.id] ? `${TRADE_EMOJI[c.id]} ` : ''}{t(`categories.${c.id}`)}
              </button>
            ))}
            {visibleTrades.length === 0 && (
              <span className="py-1.5 text-caption text-muted">{t('nearYou.noTradeMatch')}</span>
            )}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAF6F0] to-transparent" />
        </div>

        {/* Zone. Le sélecteur de pays occupe SA PROPRE ligne: coincé entre
            "Autour de moi" et "Élargir la recherche", il était écrasé à un
            seul caractère ("F ⌄" au lieu de "France") — illisible. */}
        <select
          value={country || ''}
          onChange={(e) => { setUserPos(null); setCountry(e.target.value); }}
          disabled={!!userPos}
          className="input w-full disabled:opacity-50"
          aria-label={t('nearYou.overrideLocation')}
        >
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={locateMe}
            className={`chip shrink-0 whitespace-nowrap ${userPos ? 'chip-active' : 'border-teal bg-white text-teal'}`}
            aria-pressed={!!userPos}
          >
            <IconCurrentLocation size={14} className={locating ? 'animate-spin' : ''} />
            {t('nearYou.aroundMe')}
          </button>
          {tab === 'shops' && !userPos && (
            <button
              onClick={() => setRadius((r) => (r === 'country' ? 'all' : 'country'))}
              className="chip shrink-0 whitespace-nowrap bg-white text-teal"
            >
              {radius === 'country' ? t('nearYou.broaden') : countryLabel(country, i18n.language)}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex border-b border-hairline">
        {['shops', 'listings'].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`flex-1 border-b-2 py-2 text-body ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}>
            {t(`nearYou.${tb}`)}
          </button>
        ))}
      </div>

      {/* List / Map segmented control (Airbnb/Vinted style). */}
      <div className="flex items-center justify-center px-4 pt-3">
        <div className="inline-flex rounded-pill border border-hairline p-0.5">
          {[['list', IconList, t('nearYou.viewList')], ['map', IconMap2, t('nearYou.viewMap')]].map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-caption font-semibold transition ${view === v ? 'bg-teal text-white' : 'text-muted'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'listings' && (
        <div className="space-y-2 px-4 pt-3">
          {/* Qui DEMANDE vs qui PROPOSE. L'info existait sur chaque annonce
              (pastille "Je cherche"/"Je propose") mais rien ne permettait de
              n'afficher que l'un ou que l'autre — impossible de répondre à
              "qui cherche un plombier ?" ou "qui en propose un ?". */}
          <div className="inline-flex w-full rounded-pill border border-hairline p-0.5">
            {[
              ['all', t('nearYou.demandAll')],
              ['propose', t('nearYou.iOffer')],
              ['cherche', t('nearYou.iLookFor')],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTypeFilter(k)}
                aria-pressed={typeFilter === k}
                className={`flex-1 rounded-pill px-3 py-1.5 text-caption font-semibold transition ${
                  typeFilter === k ? 'bg-teal text-white' : 'text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[['all', t('nearYou.filterAll')], ['service', t('nearYou.filterServices')], ['article', t('nearYou.filterArticles')]].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`chip shrink-0 ${kindFilter === k ? 'chip-active' : 'text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : view === 'map' ? (
        <div className="mt-3">
          <Suspense fallback={<div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}>
            <NearYouMap
              items={byDistance(tab === 'shops' ? filteredShops : filteredListings)}
              userPos={userPos}
              onSelect={(x) => (tab === 'shops' ? navigate(`/boutique/${x.slug}`) : openListingChat(x))}
            />
          </Suspense>
        </div>
      ) : tab === 'shops' ? (
        filteredShops.length === 0 ? (
          // L'annuaire est jeune: dire POURQUOI c'est vide et proposer de
          // s'inscrire vaut mieux qu'un "aucun résultat" sec.
          <EmptyState
            icon={IconTool}
            title={serviceCat ? t('nearYou.noProviderInTrade', { trade: t(`categories.${serviceCat}`) }) : t('nearYou.noProviders')}
            action={
              <div className="flex flex-col items-center gap-2">
                {serviceCat && (
                  <Button variant="secondary" onClick={() => setServiceCat(null)}>{t('nearYou.allTrades')}</Button>
                )}
                {/* ?kind=services: le formulaire s'ouvre déjà réglé sur
                    "Services" et parle de prestataire, pas de boutique —
                    sinon on atterrit sur "Devenir vendeur" et on croit
                    s'être trompé de bouton. */}
                <Button onClick={() => navigate('/become-vendor?kind=services')}>{t('nearYou.becomeProvider')}</Button>
                <Button variant="secondary" onClick={publish}>{t('nearYou.publishListing')}</Button>
              </div>
            }
          />
        ) : (
          <ul className="divide-y divide-hairline pb-24">
            {byDistance(filteredShops).map((s) => (
              <li key={s.id}>
                <button onClick={() => navigate(`/boutique/${s.slug}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <ShopAvatar src={s.avatar_url ? storageThumbUrl('shops', s.avatar_url) : null} fallbackSrc={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} name={s.name} seed={s.id} className="h-12 w-12" />
                  <div className="flex-1">
                    <p className="flex items-center gap-1 text-body font-semibold text-ink">{s.name} {s.is_verified && <VerifiedBadge size={14} />}</p>
                    <p className="flex items-center gap-1 text-caption text-muted"><IconStarFilled size={12} className="text-brass" />{Number(s.rating || 0).toFixed(1)} · {[s.city, countryLabel(s.country, i18n.language)].filter(Boolean).join(', ')}</p>
                  </div>
                  {s._km != null && <span className="shrink-0 text-caption font-semibold text-teal">{s._km} km</span>}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : data.listingsError ? (
        <ErrorState onRetry={retry} />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={IconBuildingStore}
          title={t('nearYou.noListings')}
          action={<Button onClick={publish}>{t('nearYou.publishListing')}</Button>}
        />
      ) : (
        <ul className="space-y-3 p-4 pb-24">
          {byDistance(filteredListings).map((l) => (
            <li key={l.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${l.type === 'cherche' ? 'chip-active' : 'text-brass border-brass'}`}>
                    {t(l.type === 'cherche' ? 'nearYou.iLookFor' : 'nearYou.iOffer')}
                  </span>
                  {isServiceCategory(l.category) && (
                    <span className="chip flex items-center gap-1 border-hairline text-muted">
                      <IconTool size={12} /> {t('nearYou.kind.service')}
                    </span>
                  )}
                </div>
                <span className="text-caption text-muted">
                  {l._km != null && <span className="mr-1 font-semibold text-teal">{l._km} km ·</span>}
                  {timeAgo(l.created_at, i18n.language)}
                </span>
              </div>
              {l.category && <p className="mt-1.5 text-caption font-semibold text-muted">{t(`categories.${l.category}`)}</p>}
              {/* Le tarif se lit AVANT la description: c'est la première chose
                  qu'on cherche sur une annonce de service. Sans prix saisi on
                  écrit "Prix sur demande" — jamais "0", qui laisserait croire
                  que la prestation est gratuite. */}
              <p className="mt-1 text-body font-semibold text-ink">
                {l.price_fcfa != null
                  ? `${formatPrice(l.price_fcfa, currency, i18n.language)}${l.price_unit ? ` / ${t(`nearYou.priceUnit.${l.price_unit}`)}` : ''}`
                  : <span className="text-caption font-normal text-muted">{t('nearYou.priceOnRequest')}</span>}
              </p>
              {l.photo_url && <SmartImage src={storageUrl('listings', l.photo_url)} alt="" className="mt-2 h-40 w-full rounded-input" />}
              <p className="mt-2 text-body text-ink">{l.description}</p>
              <p className="mt-1 text-caption text-muted">{l.profiles?.name || t('profile.guest')} · {[l.city, countryLabel(l.country, i18n.language)].filter(Boolean).join(', ')}</p>
              <button onClick={() => openListingChat(l)} className="mt-2 text-caption font-semibold text-teal">{t('nearYou.openChat')}</button>
            </li>
          ))}
        </ul>
      )}

      {/* Le bouton flottant disparaît quand la liste est vide: l'écran vide
          affiche déjà ses propres boutons, et le flottant se posait PAR-DESSUS
          "Proposer mes services" — sur iPhone les deux se chevauchaient et on
          ne pouvait plus lire ni cliquer celui du dessous. */}
      {!listEmpty && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-app justify-end px-4">
          <button
            onClick={publish}
            className="pointer-events-auto flex h-12 items-center gap-1 rounded-pill bg-teal px-4 text-white shadow-lg"
          >
            <IconPlus size={20} /> <span className="text-caption font-semibold">{t('nearYou.publishListing')}</span>
          </button>
        </div>
      )}

      <PublishListingModal open={publishOpen} onClose={() => setPublishOpen(false)} onDone={retry} />
    </div>
  );
}
