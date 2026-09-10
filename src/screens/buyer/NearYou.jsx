import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBuildingStore, IconCurrentLocation, IconList, IconMap2, IconTool, IconSearch, IconX, IconMapPin, IconChevronDown, IconChevronRight, IconSparkles } from '@tabler/icons-react';
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
import { isServiceCategory, SERVICE_CATEGORIES, categoryQueryIds } from '../../lib/categories';
import { TradePicker } from '../../components/TradePicker';
import { tradeEmoji, normalizeText } from '../../lib/trades';

// Leaflet is heavy — only pull it in when the user opens the map view.
const NearYouMap = lazy(() => import('../../components/NearYouMap'));


const normalize = normalizeText;

function TradeTile({ emoji, label, count = 0, active = false, muted = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-[4.6rem] shrink-0 flex-col items-center gap-1 rounded-card px-1 py-1.5 text-center transition active:scale-95 ${
        active ? 'bg-teal/10' : ''
      }`}
    >
      <span
        className={`relative flex h-12 w-12 items-center justify-center rounded-full text-[22px] shadow-sm ${
          active ? 'bg-teal text-white' : muted ? 'bg-white text-teal ring-1 ring-hairline' : 'bg-base'
        }`}
      >
        {emoji}
        {count > 0 && !active && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </span>
      <span className={`line-clamp-2 text-[11px] font-semibold leading-tight ${active ? 'text-teal' : muted ? 'text-teal' : 'text-ink'}`}>
        {label}
      </span>
    </button>
  );
}

export default function NearYou() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { country, setCountry, currency } = useSettings();
  const { requireLogin, openFinou } = useUI();
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
  const [pickerOpen, setPickerOpen] = useState(false);
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

  // Beau: « Autour de moi » devrait être activé PAR DÉFAUT à l'arrivée sur
  // l'écran, pas un clic de plus. Silencieux si refusé — un toast d'erreur
  // pour une action que la personne n'a pas elle-même déclenchée serait
  // déroutant. Le navigateur se souvient déjà d'un refus définitif et ne
  // réaffiche pas son invite à chaque visite dans ce cas.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getPosition();
      if (!cancelled && pos) {
        setUserPos(pos);
        setRadius('all');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « Autour de moi », vérifié contre le vrai catalogue (28/08): 35 boutiques
  // camerounaises dont 11 seulement ont un GPS. L'ancien tri gardait les
  // fiches à moins de radiusKm, SUPPRIMAIT les boutiques du pays qui ont un
  // GPS mais sont plus loin, et laissait les fiches sans GPS — y compris
  // l'Allemagne et le Canada — remonter en tête, dans l'ordre des abonnés.
  // Constaté par Beau, au Cameroun: « ça ne m'a pas proposé les choses au
  // Cameroun ». Son propre pays disparaissait, l'étranger restait.
  //
  // Un second correctif (09/09) a fini le travail: la dernière catégorie
  // encore écartée (étranger + GPS + hors rayon) partait du principe que
  // `country` (le pays deviné/réglé de la personne) est fiable. Or CLAUDE.md
  // le dit noir sur blanc — cette détection se trompe facilement — et
  // Beau en a fait la preuve en testant: son `country` valait « Inde »
  // (mauvaise détection), ce qui faisait passer TOUTES les boutiques
  // camerounaises pour « étrangères » et purement et simplement disparaître
  // 18 fiches ayant un GPS dès qu'il activait « Autour de moi » — la liste
  // passait de 50 à 34 boutiques sans qu'il ait rien demandé de tel.
  // Plus aucune catégorie n'est donc écartée: le tri seul fait le travail,
  // une détection erronée dégrade au pire l'ordre, jamais le nombre de
  // boutiques visibles.
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

  // Ancien filtre retiré (voir le commentaire ci-dessus): plus aucune fiche
  // n'est masquée par "Autour de moi", quel que soit le pays deviné.
  function withinRadius(items) {
    return items;
  }

  // UN seul aller-retour: `services_page` (migration 0111) renvoie les
  // boutiques (colonnes utiles seulement), leurs 3 photos de vitrine, le
  // prix d'appel, le nombre d'avis et les annonces avec le nom de leur
  // auteure. Avant: cinq requêtes en trois vagues successives — mesuré à
  // 11 s de médiane, 20 s en 3G (événement perf_page_load). Sur un réseau
  // lent, chaque vague coûte une latence entière; en une seule, la page
  // n'en paie qu'une.
  //
  // cacheKey: rendu instantané au retour arrière (stale-while-revalidate,
  // voir useAsync) — Beau: « dès que je sors d'une conversation, ça
  // recharge ». La liste s'affiche depuis la mémoire puis se rafraîchit
  // en tâche de fond.
  const { data, loading, error, retry } = useAsync(async () => {
    const pays = radius === 'country' && country ? country : null;
    const { data: page, error: rpcError } = await supabase.rpc('services_page', { p_country: pays });
    if (rpcError) throw rpcError;
    return {
      shops: page?.shops || [],
      listings: page?.listings || [],
      listingsError: null,
      portfolios: page?.portfolios || {},
      reviewCounts: page?.review_counts || {},
      minPrices: page?.min_prices || {},
      // Ce qui est CACHÉ par le filtre pays. Depuis la France, l'annuaire
      // n'affichait qu'un seul prestataire alors qu'il y en a sept ailleurs —
      // et « Élargir la recherche » ne disait pas ce qu'on manquait, donc
      // personne ne cliquait. On l'annonce avec un vrai chiffre.
      providersElsewhere: page?.providers_elsewhere || 0,
    };
  }, [country, radius], { cacheKey: `services:${radius === 'country' && country ? country : 'all'}`, ttlMs: 5 * 60 * 1000 });

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

  // Beau: « il y a déjà 45 boutiques, autour de moi devrait TOUTES les
  // montrer ». Avant, cet onglet ne gardait que les PRESTATAIRES (une
  // boutique de vêtements ne s'y affichait jamais), ce qui vidait la carte
  // et la liste d'un coup — comparé à un concurrent qui montre tout le monde,
  // Finjaro paraissait avoir moins de boutiques qu'il n'en a réellement.
  // Toute boutique active compte désormais; le filtre par métier (chips
  // ci-dessous) reste utile pour qui cherche spécifiquement un service — il
  // laisse alors naturellement de côté les boutiques dont aucune catégorie
  // ne correspond, sans qu'il faille les exclure par avance.
  // Beau, en testant: « je tape "heg", ça doit déjà connaître ou proposer, je
  // tape "Stuttgart" ça cherche, je tape "France" ça devient déjà [pertinent]
  // » — le champ ne filtrait QUE la liste de puces métier ci-dessous
  // (`visibleTrades`), jamais les boutiques elles-mêmes: taper un nom de
  // boutique, une ville ou un pays ne faisait donc RIEN sur la liste. Il
  // fait maintenant les deux à la fois — même champ, une recherche vraiment
  // large plutôt qu'un simple filtre de puces.
  const filteredShops = (data?.shops || []).filter((s) => {
    if (serviceCat) {
      const wanted = categoryQueryIds(serviceCat);
      if (!(s.categories ?? []).some((c) => wanted.includes(c))) return false;
    }
    const q = normalize(tradeQuery);
    if (!q) return true;
    const haystacks = [
      s.name,
      s.city,
      countryLabel(s.country, i18n.language),
      ...(s.categories ?? []).map((c) => t(`categories.${c}`)),
    ];
    return haystacks.some((h) => normalize(h).includes(q));
  });

  const shownShops = withinRadius(byDistance(filteredShops));

  // Beau, en testant l'annuaire élargi à TOUTES les boutiques: certaines
  // photos restaient bloquées en chargement, visibles sur certaines fiches
  // et pas d'autres. Avec 12 prestataires ça ne se voyait jamais — avec 40 à
  // 50 boutiques, chacune avec sa bannière + son logo + jusqu'à 3 photos de
  // catalogue, ça fait d'un coup des centaines d'images à charger en même
  // temps. On révèle donc les fiches par paquets plutôt que tout d'un bloc:
  // moins de photos se disputent la connexion à l'instant T, et le tableau
  // de bord réel de la personne (pas juste 12) reste entièrement accessible
  // via « Voir plus ».
  const SHOPS_PAGE = 12;
  const [visibleShopCount, setVisibleShopCount] = useState(SHOPS_PAGE);
  useEffect(() => {
    setVisibleShopCount(SHOPS_PAGE);
  }, [tab, serviceCat, userPos, radius, country]);
  const pagedShops = shownShops.slice(0, visibleShopCount);

  // Métiers affichés = ceux qui correspondent à la recherche.
  // Combien de boutiques par métier, sur la liste chargée. Sert au sélecteur
  // (les métiers où il y a du monde passent devant) et à la rangée de tuiles.
  const tradeCounts = useMemo(() => {
    const counts = {};
    const shops = data?.shops || [];
    for (const c of SERVICE_CATEGORIES) {
      const wanted = categoryQueryIds(c.id);
      counts[c.id] = shops.filter((s) => (s.categories ?? []).some((k) => wanted.includes(k))).length;
    }
    return counts;
  }, [data]);

  // La rangée de tuiles: le métier choisi d'abord, puis ceux où il y a des
  // prestataires, puis les autres — coupée court, la fenêtre fait le reste.
  const tradeTiles = useMemo(() => {
    const ordered = [...SERVICE_CATEGORIES].sort(
      (a, b) =>
        (a.id === 'autre_service') - (b.id === 'autre_service')
        || (tradeCounts[b.id] || 0) - (tradeCounts[a.id] || 0)
        || t(`categories.${a.id}`).localeCompare(t(`categories.${b.id}`), 'fr')
    );
    const head = serviceCat ? ordered.filter((c) => c.id === serviceCat) : [];
    return [...head, ...ordered.filter((c) => c.id !== serviceCat)].slice(0, 10);
  }, [tradeCounts, serviceCat, t]);

  function demanderAFinia() {
    const metier = serviceCat ? t(`categories.${serviceCat}`) : null;
    openFinou(metier ? t('nearYou.finiaSeedTrade', { trade: metier }) : t('nearYou.finiaSeed'));
  }

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
        {/* Une seule barre de commande: chercher, choisir un métier, régler
            la zone, basculer annuaire/carte. Avant: trois encadrés empilés,
            une rangée de puces qui débordait, aucun vrai sélecteur — Beau:
            « les services là sont tellement laids, il n'y a même pas de
            dropdown pour choisir ». */}
        <section className="mx-4 mt-3 rounded-card border border-hairline bg-white p-3 shadow-sm lg:mt-4 lg:p-4">
          <div className="mb-3 hidden items-end justify-between gap-4 lg:flex">
            <div>
              <span className="inline-block rounded-pill bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {t('nearYou.nearYouBadge')}
              </span>
              <h1 className="mt-2 text-title text-ink">{t('nearYou.directoryTitle')}</h1>
              <p className="mt-1 text-caption text-muted">{t('nearYou.directorySubtitle')}</p>
            </div>
          </div>

          {/* Recherche large (nom, ville, pays, métier) + bouton métier. */}
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={tradeQuery}
                onChange={(e) => setTradeQuery(e.target.value)}
                placeholder={t('nearYou.searchAll')}
                className="input h-11 w-full pl-9 pr-9 text-[16px]"
                aria-label={t('nearYou.searchAll')}
              />
              {tradeQuery && (
                <button
                  onClick={() => setTradeQuery('')}
                  aria-label={t('common.close')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted"
                >
                  <IconX size={15} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-haspopup="dialog"
              className={`flex h-11 shrink-0 items-center gap-1.5 rounded-input border px-3 text-caption font-semibold transition active:scale-95 ${
                serviceCat ? 'border-teal bg-teal text-white' : 'border-hairline bg-base text-ink'
              }`}
            >
              <span className="text-[17px] leading-none">{serviceCat ? tradeEmoji(serviceCat) : '🧭'}</span>
              <span className="max-w-[5.5rem] truncate sm:max-w-[12rem]">
                {serviceCat ? t(`categories.${serviceCat}`) : <><span className="sm:hidden">{t('nearYou.tradeShort')}</span><span className="hidden sm:inline">{t('nearYou.allTrades')}</span></>}
              </span>
              <IconChevronDown size={15} className="shrink-0" />
            </button>
          </div>

          {/* Tuiles de métiers: emoji dans une pastille crème, libellé
              dessous, comme les raccourcis de Google Maps. La dernière tuile
              ouvre la fenêtre complète. */}
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            <TradeTile
              emoji="🧭"
              label={t('nearYou.allTradesShort')}
              active={!serviceCat}
              onClick={() => setServiceCat(null)}
            />
            {tradeTiles.map((c) => (
              <TradeTile
                key={c.id}
                emoji={tradeEmoji(c.id)}
                label={t(`categories.${c.id}`)}
                count={tradeCounts[c.id] || 0}
                active={serviceCat === c.id}
                onClick={() => pickTrade(c.id)}
              />
            ))}
            <TradeTile
              emoji="＋"
              label={t('nearYou.moreTrades', { count: SERVICE_CATEGORIES.length })}
              onClick={() => setPickerOpen(true)}
              muted
            />
          </div>

          {/* Zone + vue. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={country || ''}
              onChange={(e) => { setUserPos(null); setCountry(e.target.value); }}
              disabled={!!userPos}
              className="input h-10 min-w-[8.5rem] flex-1 bg-white disabled:opacity-50"
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
                {radius === 'country'
                  ? (data?.providersElsewhere > 0
                      ? t('nearYou.broadenCount', { count: data.providersElsewhere })
                      : t('nearYou.broaden'))
                  : t('nearYou.onlyCountry', { country: countryLabel(country, i18n.language) })}
              </button>
            )}
            <div className="ml-auto flex shrink-0 rounded-pill bg-base p-1">
              {[['list', IconList, t('nearYou.directoryTab')], ['map', IconMap2, t('nearYou.mapTab')]].map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-caption font-semibold transition ${
                    view === v ? 'bg-teal text-white shadow-sm' : 'text-muted'
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          {userPos && (
            <label className="mt-3 flex items-center gap-3 text-caption text-muted">
              <span className="whitespace-nowrap">{t('nearYou.radiusLabel')} <b className="text-ink">{radiusKm} km</b></span>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-hairline accent-[#C25E38]"
                aria-label={t('nearYou.radiusLabel')}
              />
            </label>
          )}
        </section>

        {/* Finia: pour qui ne sait pas quel métier chercher. Elle pose les
            questions, elle propose des boutiques — c'est SON travail, pas
            celui d'un formulaire. */}
        <button
          type="button"
          onClick={demanderAFinia}
          className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-card border border-brass/40 bg-gradient-to-r from-[#FFF6E5] to-white p-3 text-left shadow-sm transition active:scale-[0.99] lg:w-auto"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass">
            <IconSparkles size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-semibold text-ink">{t('nearYou.finiaTitle')}</span>
            <span className="block text-caption text-muted">{t('nearYou.finiaSubtitle')}</span>
          </span>
          <IconChevronRight size={18} className="shrink-0 text-muted" />
        </button>

        <TradePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          trades={SERVICE_CATEGORIES}
          value={serviceCat}
          onChange={setServiceCat}
          counts={tradeCounts}
        />

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
          <div className="mt-3 lg:px-4">
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
            <div className="p-4 pb-24">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pagedShops.map((s) => (
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
              {/* Révéler par paquets plutôt que tout charger d'un coup — voir
                  le commentaire au-dessus de `pagedShops`. */}
              {shownShops.length > visibleShopCount && (
                <div className="mt-4 flex justify-center">
                  <Button variant="secondary" onClick={() => setVisibleShopCount((n) => n + SHOPS_PAGE)}>
                    {t('nearYou.seeMoreShops', { count: shownShops.length - visibleShopCount })}
                  </Button>
                </div>
              )}
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
      {!listEmpty && view !== 'map' && (
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
