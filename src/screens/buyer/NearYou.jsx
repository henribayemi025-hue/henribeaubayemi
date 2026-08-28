import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBuildingStore, IconCurrentLocation, IconList, IconMap2, IconTool, IconSearch, IconX, IconFilter, IconMapPin } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { ProviderCard } from '../../components/ProviderCard';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';
import { PublishListingModal } from './PublishListingModal';
import { TrocEvalModal } from '../../components/TrocEvalModal';
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
  patisserie_service: '🎂',
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
  const [trocOpen, setTrocOpen] = useState(false);
  // TOUS les pays par défaut, pas seulement le sien. Finjaro existe pour
  // relier des prestataires camerounais à leurs clientes — y compris celles
  // installées en France. Le filtre pays par défaut faisait exactement
  // l'inverse: depuis la France, l'annuaire affichait UN prestataire sur huit
  // et paraissait vide (« je t'avais demandé d'ajouter Tidal, tu ne l'as pas
  // fait » — ils y étaient depuis toujours, cachés par ce réglage).
  // Le sélecteur de pays reste là pour se restreindre volontairement.
  const [radius, setRadius] = useState('all');
  const [userPos, setUserPos] = useState(null);
  // Rayon en km, utilisé UNIQUEMENT quand une position réelle est connue —
  // sans position, un rayon en km ne veut rien dire (on filtre par pays).
  const [radiusKm, setRadiusKm] = useState(10);
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

  // « Autour de moi », vérifié contre le vrai catalogue (28/08): 35 boutiques
  // camerounaises dont 11 seulement ont un GPS. L'ancien tri gardait les
  // fiches à moins de radiusKm, SUPPRIMAIT les boutiques du pays qui ont un
  // GPS mais sont plus loin, et laissait les fiches sans GPS — y compris
  // l'Allemagne et le Canada — remonter en tête, dans l'ordre des abonnés.
  // Constaté par Beau, au Cameroun: « ça ne m'a pas proposé les choses au
  // Cameroun ». Son propre pays disparaissait, l'étranger restait.
  //
  // Ordre désormais: 1) ce qui est vraiment autour (GPS ≤ rayon), du plus
  // proche au plus loin; 2) TON pays sans GPS (l'immense majorité des
  // fiches); 3) ton pays plus loin que le rayon — jamais supprimé; 4) le
  // reste du monde sans GPS (ne jamais vider l'annuaire de qui n'a pas
  // renseigné son GPS); 5) le reste du monde au-delà du rayon, seul cas
  // encore écarté — comme avant.
  function rangAutourDeMoi(x) {
    if (x._km != null && x._km <= radiusKm) return 0;
    if (x.country === country) return x._km != null ? 2 : 1;
    return x._km != null ? 4 : 3;
  }

  function byDistance(items) {
    if (!userPos) return items;
    return items
      .map((x) => ({ ...x, _km: distanceKm(userPos, { lat: x.lat, lng: x.lng }) }))
      .sort((a, b) => {
        const ra = rangAutourDeMoi(a);
        const rb = rangAutourDeMoi(b);
        if (ra !== rb) return ra - rb;
        if (a._km != null && b._km != null) return a._km - b._km;
        return 0;
      });
  }

  function withinRadius(items) {
    if (!userPos) return items;
    return items.filter((x) => rangAutourDeMoi(x) < 4);
  }

  const { data, loading, error, retry } = useAsync(async () => {
    const shopsQuery = supabase.from('shops').select('*').eq('status', 'active').order('followers_count', { ascending: false }).limit(40);
    if (radius === 'country' && country) shopsQuery.eq('country', country);
    // Ce qui est CACHÉ par le filtre pays. Depuis la France, l'annuaire
    // n'affichait qu'un seul prestataire alors qu'il y en a sept ailleurs —
    // et « Élargir la recherche » ne disait pas ce qu'on manquait, donc
    // personne ne cliquait. On compte les prestataires des autres pays pour
    // l'annoncer avec un vrai chiffre.
    const elsewhereQuery = radius === 'country' && country
      ? supabase.from('shops').select('categories').eq('status', 'active').neq('country', country).limit(200)
      : Promise.resolve({ data: null, error: null });
    // Explicit FK join (near_you_listings.user_id -> profiles) so PostgREST can
    // resolve the poster's name. The FK is added in migration 0007.
    const [shopsRes, listingsRes, elsewhereRes] = await Promise.all([
      shopsQuery,
      supabase
        .from('near_you_listings')
        .select('*, profiles!near_you_listings_profile_fk(name)')
        .order('created_at', { ascending: false })
        .limit(40),
      elsewhereQuery,
    ]);
    if (shopsRes.error) throw shopsRes.error;
    // Surface (don't silently swallow) a listings error, but keep Boutiques usable.
    if (listingsRes.error) console.error('[NearYou] listings query failed:', listingsRes.error.message);
    const shops = shopsRes.data || [];
    const providersElsewhere = (elsewhereRes.data || []).filter(isServiceShop).length;

    // Vitrine des cartes prestataire: photos du catalogue, nombre d'avis et
    // prix d'appel. Deux requêtes groupées pour TOUTES les fiches — jamais
    // une requête par carte.
    const providerIds = shops.filter(isServiceShop).map((s) => s.id);
    const portfolios = {};
    const reviewCounts = {};
    const minPrices = {};
    if (providerIds.length > 0) {
      const [prodRes, revRes] = await Promise.all([
        supabase.from('products').select('shop_id, price_fcfa, images').eq('is_active', true).in('shop_id', providerIds),
        supabase.from('reviews').select('shop_id').in('shop_id', providerIds),
      ]);
      for (const p of prodRes.data || []) {
        const shots = (portfolios[p.shop_id] ||= []);
        if (p.images?.[0] && shots.length < 3) shots.push(p.images[0]);
        if (p.price_fcfa != null && p.price_fcfa > 0 && (minPrices[p.shop_id] == null || p.price_fcfa < minPrices[p.shop_id])) {
          minPrices[p.shop_id] = p.price_fcfa;
        }
      }
      for (const r of revRes.data || []) reviewCounts[r.shop_id] = (reviewCounts[r.shop_id] || 0) + 1;
    }

    return {
      shops,
      listings: listingsRes.data || [],
      listingsError: listingsRes.error ? listingsRes.error.message : null,
      portfolios,
      reviewCounts,
      minPrices,
      providersElsewhere,
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

  // « Réserver » ouvre la conversation avec le prestataire: c'est le seul
  // canal de réservation réel aujourd'hui (pas d'agenda en ligne) — un bouton
  // qui ouvrirait un faux calendrier serait pire que pas de bouton.
  async function bookProvider(shop) {
    if (!user) return requireLogin();
    try {
      const convId = await getOrCreateConversation(user.id, shop.id);
      navigate(`/chat/${convId}`);
    } catch (e) {
      if (e.code === 'own_shop') toast.info(t('chat.ownShop'));
      else toast.error(e.message);
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

  const shownShops = withinRadius(byDistance(filteredShops));

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
    (tab === 'shops' ? shownShops.length === 0 : filteredListings.length === 0);

  return (
    <div className="pb-20">
      <AppHeader title={t('nav.services')} />

      <div className="lg:mx-auto lg:max-w-6xl">
        {/* Bandeau d'entrée: dit en une ligne CE QU'EST cet onglet (annuaire
            de prestataires + carte), et porte le sélecteur Annuaire/Carte —
            avant, ce choix était une petite bascule perdue au milieu des
            filtres. */}
        <section className="mx-4 mt-2 overflow-hidden rounded-card border border-hairline bg-white shadow-sm lg:mt-3">
          <div className="flex flex-col gap-3 p-2 lg:flex-row lg:items-center lg:justify-between lg:p-4">
            {/* Titre + accroche réservés au GRAND écran: sur téléphone, ce
                bloc poussait les prestataires hors de l'écran (Beau: « ça
                prend un peu trop de place »), alors que l'en-tête dit déjà
                « Services ». Seul le sélecteur Annuaire/Carte reste. */}
            <div className="hidden min-w-0 lg:block">
              <span className="inline-block rounded-pill bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {t('nearYou.nearYouBadge')}
              </span>
              <h1 className="mt-2 text-title text-ink">{t('nearYou.directoryTitle')}</h1>
              <p className="mt-1 text-caption text-muted">{t('nearYou.directorySubtitle')}</p>
            </div>
            <div className="flex shrink-0 rounded-card bg-base p-1">
              {[['list', IconList, t('nearYou.directoryTab')], ['map', IconMap2, t('nearYou.mapTab')]].map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-input px-3 py-2 text-caption font-semibold transition ${
                    view === v ? 'bg-teal text-white shadow-sm' : 'text-muted'
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Bloc de filtres unifié: tout ce qui filtre vit DANS un même
            encadré, au lieu d'être éparpillé sur trois rangées. */}
        <div className="mx-4 mt-2 space-y-2.5 rounded-card border border-hairline bg-base p-3 lg:mt-3 lg:space-y-3">
          {/* En-tête « Filtrer par métier » masqué sur téléphone: le champ de
              recherche dit déjà « Chercher un métier… », la ligne ne faisait
              que consommer de la hauteur. La rangée reste affichée dès qu'il
              y a un rayon à régler. */}
          <div className={`${userPos ? 'flex' : 'hidden lg:flex'} flex-wrap items-center justify-between gap-2`}>
            <span className="hidden items-center gap-1.5 text-caption font-semibold text-ink lg:flex">
              <IconFilter size={15} className="text-teal" /> {t('nearYou.filterByTrade')}
            </span>
            {/* Rayon en km: seulement quand une position réelle est connue. */}
            {userPos && (
              <label className="flex items-center gap-2 text-caption text-muted">
                <span className="whitespace-nowrap">{t('nearYou.radiusLabel')} <b className="text-ink">{radiusKm} km</b></span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-hairline accent-[#C25E38]"
                  aria-label={t('nearYou.radiusLabel')}
                />
              </label>
            )}
          </div>

          {/* Recherche par métier — c'est ce qui manquait: avec 12 métiers, les
              faire défiler à l'aveugle n'est pas utilisable. */}
          <div className="relative">
            <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={tradeQuery}
              onChange={(e) => setTradeQuery(e.target.value)}
              placeholder={t('nearYou.searchTrade')}
              className="input h-10 w-full bg-white pl-9 pr-9 text-[16px]"
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
              (whitespace-nowrap + shrink-0). Un fondu à droite signale qu'il
              reste des métiers à faire défiler. */}
          <div className="relative">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
              <button
                onClick={() => setServiceCat(null)}
                className={`chip shrink-0 whitespace-nowrap ${!serviceCat ? 'chip-active' : 'bg-white text-ink'}`}
              >
                {t('nearYou.allTradesCount', { count: SERVICE_CATEGORIES.length })}
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
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-base to-transparent" />
          </div>

          {/* Zone. Le sélecteur de pays occupe SA PROPRE ligne: coincé entre
              deux boutons, il était écrasé à un seul caractère ("F ⌄" au lieu
              de "France") — illisible. */}
          {/* Pays + « Autour de moi » + « Élargir » sur UNE seule rangée: en
              trois rangées empilées, la zone de filtres à elle seule
              repoussait le premier prestataire hors de l'écran. */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={country || ''}
              onChange={(e) => { setUserPos(null); setCountry(e.target.value); }}
              disabled={!!userPos}
              className="input h-10 min-w-[9rem] flex-1 bg-white disabled:opacity-50"
              aria-label={t('nearYou.overrideLocation')}
            >
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}
            </select>
            <button
              onClick={locateMe}
              className={`chip h-10 shrink-0 whitespace-nowrap ${userPos ? 'chip-active' : 'border-teal bg-white text-teal'}`}
              aria-pressed={!!userPos}
            >
              <IconCurrentLocation size={14} className={locating ? 'animate-spin' : ''} />
              {t('nearYou.aroundMe')}
            </button>
            {tab === 'shops' && !userPos && (
              <button
                onClick={() => setRadius((r) => (r === 'country' ? 'all' : 'country'))}
                className="chip h-10 shrink-0 whitespace-nowrap bg-white text-teal"
              >
                {/* Le chiffre est le vrai décompte des prestataires des autres
                    pays: « Élargir la recherche » tout seul ne donnait aucune
                    raison de cliquer, et l'annuaire semblait vide alors qu'il
                    ne l'était pas. */}
                {/* En mode « tous les pays », le bouton affichait juste
                    « France » — juste sous un sélecteur qui affichait déjà
                    « France ». On ne pouvait pas deviner que c'était l'action
                    « me limiter à ce pays ». Le libellé le dit maintenant. */}
                {radius === 'country'
                  ? (data?.providersElsewhere > 0
                      ? t('nearYou.broadenCount', { count: data.providersElsewhere })
                      : t('nearYou.broaden'))
                  : t('nearYou.onlyCountry', { country: countryLabel(country, i18n.language) })}
              </button>
            )}
          </div>
        </div>

        {/* Onglets + filtres d'annonces COLLÉS sous l'en-tête pendant le
            défilement: sans ça, changer « Je propose / Je cherche » ou de
            catégorie obligeait à remonter toute la liste (demande de Beau).
            `top-14` = la hauteur de l'AppHeader, lui aussi collant — sinon
            les deux se superposeraient. z-20 pour passer SOUS l'en-tête
            (z-30) et au-dessus du contenu. */}
        <div className="sticky top-14 z-20 mt-2 bg-white">
          <div className="flex border-b border-hairline">
            {['shops', 'listings'].map((tb) => (
              <button key={tb} onClick={() => setTab(tb)} className={`flex-1 border-b-2 py-2 text-body ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}>
                {t(`nearYou.${tb}`)}
                {tb === 'shops' && shownShops.length > 0 && <span className="ml-1 text-caption">({shownShops.length})</span>}
              </button>
            ))}
          </div>

        {tab === 'listings' && (
          <div className="space-y-2 border-b border-hairline px-4 py-2.5">
            {/* Qui DEMANDE vs qui PROPOSE. */}
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
              {/* Évaluateur de troc — vit dans les annonces, là où les gens
                  échangent déjà. Compte requis (l'appel IA coûte). */}
              <button
                onClick={() => (user ? setTrocOpen(true) : requireLogin())}
                className="chip shrink-0 border-brass text-brass"
              >
                ⚖️ {t('troc.title')}
              </button>
            </div>
          </div>
        )}
        </div>

        {loading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
        ) : error ? (
          <ErrorState onRetry={retry} />
        ) : view === 'map' ? (
          <div className="mt-3">
            <Suspense fallback={<div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}>
              <NearYouMap
                items={tab === 'shops' ? shownShops : byDistance(filteredListings)}
                userPos={userPos}
                onSelect={(x) => (tab === 'shops' ? navigate(`/boutique/${x.slug}`) : openListingChat(x))}
              />
            </Suspense>
          </div>
        ) : tab === 'shops' ? (
          shownShops.length === 0 ? (
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
                      "Services" et parle de prestataire, pas de boutique. */}
                  <Button onClick={() => navigate('/become-vendor?kind=services')}>{t('nearYou.becomeProvider')}</Button>
                  <Button variant="secondary" onClick={publish}>{t('nearYou.publishListing')}</Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4 p-4 pb-24 sm:grid-cols-2 xl:grid-cols-3">
              {shownShops.map((s) => (
                <ProviderCard
                  key={s.id}
                  shop={s}
                  portfolio={data.portfolios[s.id] || []}
                  reviewCount={data.reviewCounts[s.id] || 0}
                  fromPriceFcfa={data.minPrices[s.id] ?? null}
                  km={s._km ?? null}
                  onBook={bookProvider}
                />
              ))}
            </div>
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
          <ul className="grid gap-3 p-4 pb-24 sm:grid-cols-2">
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
                <p className="mt-1 flex items-center gap-1 text-caption text-muted">
                  <IconMapPin size={12} /> {l.profiles?.name || t('profile.guest')} · {[l.city, countryLabel(l.country, i18n.language)].filter(Boolean).join(', ')}
                </p>
                <button onClick={() => openListingChat(l)} className="mt-2 text-caption font-semibold text-teal">{t('nearYou.openChat')}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Le bouton flottant disparaît quand la liste est vide: l'écran vide
          affiche déjà ses propres boutons, et le flottant se posait PAR-DESSUS
          "Proposer mes services". Remonté au-dessus de la barre d'onglets
          flottante: à bottom-20 il se posait dessus et chevauchait la
          première fiche prestataire. */}
      {!listEmpty && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[104px] z-40 mx-auto flex max-w-app justify-end px-4 lg:bottom-6 lg:max-w-6xl">
          <button
            onClick={publish}
            className="pointer-events-auto flex h-12 items-center gap-1 rounded-pill bg-teal px-4 text-white shadow-lg"
          >
            <IconPlus size={20} /> <span className="text-caption font-semibold">{t('nearYou.publishListing')}</span>
          </button>
        </div>
      )}

      <PublishListingModal open={publishOpen} onClose={() => setPublishOpen(false)} onDone={retry} />
      <TrocEvalModal open={trocOpen} onClose={() => setTrocOpen(false)} />
    </div>
  );
}
