import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import {
  IconStarFilled, IconMapPin, IconX, IconCurrentLocation, IconMessage, IconRoute,
  IconPlus, IconMinus, IconBuildingSkyscraper,
} from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { shopGradient } from '../lib/shopColor';
import { isServiceCategory } from '../lib/categories';

// La carte des Services.
//
// Trois retours de Beau (10/09) ont fixé le cahier des charges: « comme
// Google Maps », « les icônes doivent être propres, pas un truc qu'on va
// penser vibe-codé », et sa capture d'un écran NOIR avec des bulles
// empilées les unes sur les autres.
//
// Ce que ça impose ici:
//  - un fond qui s'affiche TOUJOURS: le fond vectoriel (OpenFreeMap, 3D)
//    d'abord, et si ses tuiles ne viennent pas — réseau lent, filtre,
//    panne — bascule automatique sur un fond image classique (Esri), sans
//    rien demander à personne;
//  - des bulles qui se REGROUPENT: dix boutiques dans le même quartier
//    font un rond « 10 » qu'on tape pour zoomer, au lieu d'une pile
//    illisible;
//  - des contrôles d'une seule famille: blancs, ombre légère, icônes
//    noires, l'état actif en noir — comme Google Maps. Rien de terracotta
//    sur la carte, sauf le bouton principal de la fiche;
//  - la position en direct (point bleu), Plan / Satellite, itinéraire.
const STYLE_VECTORIEL = 'https://tiles.openfreemap.org/styles/liberty';

function styleImage(tuiles, attribution) {
  return {
    version: 8,
    sources: {
      fond: { type: 'raster', tiles: [tuiles], tileSize: 256, maxzoom: 19, attribution },
    },
    layers: [{ id: 'fond', type: 'raster', source: 'fond' }],
  };
}
const STYLE_PLAN_IMAGE = styleImage(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  'Esri, HERE, Garmin, OpenStreetMap contributors'
);
const STYLE_SATELLITE = styleImage(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'Esri, Maxar, Earthstar Geographics, GIS User Community'
);

const AVATAR = 44;
const DELAI_SECOURS_MS = 5000;

// « Itinéraire »: on confie le guidage à l'application de cartes du
// téléphone — Plans sur iPhone, Google Maps ailleurs. C'est là que le
// trafic et le guidage vocal existent déjà.
function lienItineraire(x) {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const nom = encodeURIComponent(x.name || '');
  return ios
    ? `https://maps.apple.com/?daddr=${x.lat},${x.lng}&q=${nom}`
    : `https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}`;
}

// Une boutique: sa photo (ou son initiale) dans un rond, posé sur une
// petite pointe — une vraie épingle de carte, ancrée en bas, pas un rond
// flottant. Beau (10/09): « les icônes doivent être propres ».
function elementBoutique(x) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'finjaro-shop-pin';
  el.setAttribute('aria-label', x.name || '');
  const g = shopGradient(x.id || x.name);
  const initial = (x.name || '?').trim().charAt(0).toUpperCase();
  const src = x.avatar_url ? storageThumbUrl('shops', x.avatar_url) : null;
  el.style.cssText = `position:relative;width:${AVATAR}px;height:${AVATAR + 8}px;padding:0;border:0;background:none;cursor:pointer;
    filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))`;
  // L'initiale est toujours là, sous la photo: si l'image ne charge pas,
  // elle se retire et l'initiale reste.
  const visuel = initial + (src
    ? `<img src="${src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:9999px" onerror="this.remove()" />`
    : '');
  el.innerHTML =
    `<span style="position:absolute;left:50%;bottom:0;width:12px;height:12px;margin-left:-6px;background:#fff;transform:translateY(-4px) rotate(45deg);border-radius:2px"></span>` +
    `<span style="position:absolute;inset:0 0 8px 0;border-radius:9999px;border:2.5px solid #fff;overflow:hidden;display:flex;align-items:center;justify-content:center;
      background-image:linear-gradient(135deg, ${g.from}, ${g.to});font:700 16px 'Fraunces', Georgia, serif;color:#fff">${visuel}</span>`;
  return el;
}

// Un groupe: petit disque terracotta, chiffre blanc, liseré blanc. Discret
// — le grand rond blanc à halo prenait toute la place (capture de Beau).
function elementGroupe(n) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'finjaro-cluster';
  const taille = n < 10 ? 30 : n < 100 ? 36 : 42;
  el.style.cssText = `width:${taille}px;height:${taille}px;border-radius:9999px;padding:0;border:2px solid #fff;cursor:pointer;
    background:#C25E38;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;font:700 13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
  el.textContent = String(n);
  return el;
}

function elementAnnonce() {
  const el = document.createElement('button');
  el.type = 'button';
  el.style.cssText = 'padding:0;border:0;background:none;cursor:pointer';
  el.innerHTML =
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="#171B26" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.7.4.4 1 .4 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8z" ' +
    'stroke="#FFFFFF" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg>';
  return el;
}

// Ma position: le point bleu que tout le monde connaît, avec son halo.
function elementMoi() {
  const el = document.createElement('div');
  // Jamais cliquable: posé APRÈS les bulles, son halo passait au-dessus
  // d'un groupe voisin et avalait le tap (constaté en test: un groupe
  // sous le point bleu ne répondait plus).
  el.style.pointerEvents = 'none';
  el.innerHTML =
    '<div style="position:relative;width:20px;height:20px">' +
    '<div style="position:absolute;inset:-14px;border-radius:9999px;background:rgba(26,115,232,.18);animation:finjaro-pulse 2s ease-out infinite"></div>' +
    '<div style="position:absolute;inset:0;border-radius:9999px;background:#1A73E8;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>' +
    '</div>';
  return el;
}

// Bâtiments en relief sur le fond vectoriel (Liberty en dessine déjà; on
// s'assure qu'ils sont là).
function poserBatiments3D(map) {
  try {
    if (map.getLayer('building-3d') || !map.getSource('openmaptiles')) return;
    const labelLayer = (map.getStyle().layers || []).find((l) => l.type === 'symbol' && l.layout?.['text-field']);
    map.addLayer(
      {
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#E6DED2',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        },
      },
      labelLayer?.id
    );
  } catch {
    /* le fond reste utilisable sans relief */
  }
}

function BoutonCarte({ onClick, label, active = false, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center transition active:scale-95 ${
        active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-base'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function NearYouMap({ items, userPos, onSelect }) {
  const { t } = useTranslation();
  const boite = useRef(null);
  const carte = useRef(null);
  const marqueurs = useRef(new Map()); // clé → Marker (bulles et groupes)
  const marqueurMoi = useRef(null);
  const donnees = useRef([]);
  const [selection, setSelection] = useState(null);
  const [relief, setRelief] = useState(true);
  const [mode, setMode] = useState('plan'); // 'plan' | 'satellite'
  const [fondSecours, setFondSecours] = useState(false);
  const [positionLive, setPositionLive] = useState(null);
  const [sansWebgl, setSansWebgl] = useState(false);
  const cadre = useRef(null);
  const [hauteur, setHauteur] = useState(null);

  // La carte prend EXACTEMENT la place qui reste sous les filtres, moins la
  // barre de navigation. Avec une hauteur fixe, elle débordait sous la
  // barre du bas et les bulles qui s'y trouvaient ne répondaient plus au
  // doigt (constaté en test: un groupe posé sous la barre, injoignable).
  useEffect(() => {
    function mesurer() {
      if (!cadre.current) return;
      if (window.matchMedia('(min-width: 1024px)').matches) { setHauteur(null); return; }
      const top = cadre.current.getBoundingClientRect().top + window.scrollY;
      const barre = 88; // barre de navigation + marge
      setHauteur(Math.max(300, Math.round(window.innerHeight - top - barre)));
    }
    mesurer();
    window.addEventListener('resize', mesurer);
    return () => window.removeEventListener('resize', mesurer);
  }, []);
  useEffect(() => { carte.current?.resize(); }, [hauteur]);

  const geo = useMemo(
    () => items.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)),
    [items]
  );

  // ---- Les bulles et les groupes suivent la carte -----------------------
  // Regroupement fait ICI, en pixels d'écran, à chaque mouvement: deux
  // boutiques à moins de 48 px l'une de l'autre forment un groupe. Aucune
  // dépendance au fond de carte — les bulles s'affichent même si le fond
  // met du temps ou ne vient jamais (la capture noire de Beau).
  function rafraichirMarqueurs(map) {
    // De près (zoom ≥ 16, l'échelle d'un quartier), plus aucun groupe: on
    // veut voir chaque boutique. Deux boutiques à la même adresse sont
    // alors écartées de quelques pixels pour rester toutes deux tapables.
    const zoomProche = map.getZoom() >= 16;
    const RAYON = zoomProche ? 1 : 48;
    const groupes = [];
    for (const x of donnees.current) {
      const pt = map.project([x.lng, x.lat]);
      const g = groupes.find((grp) => Math.hypot(grp.px - pt.x, grp.py - pt.y) < RAYON);
      if (g) {
        g.membres.push(x);
        g.px = (g.px * (g.membres.length - 1) + pt.x) / g.membres.length;
        g.py = (g.py * (g.membres.length - 1) + pt.y) / g.membres.length;
      } else {
        groupes.push({ px: pt.x, py: pt.y, membres: [x] });
      }
    }
    const vus = new Set();
    // Même adresse, vue de près: on éclate le groupe en éventail.
    const eclates = [];
    for (const g of groupes) {
      if (zoomProche && g.membres.length > 1) {
        g.membres.forEach((m, i) => {
          const a = (2 * Math.PI * i) / g.membres.length - Math.PI / 2;
          eclates.push({ membres: [m], decalage: [Math.round(Math.cos(a) * 26), Math.round(Math.sin(a) * 26)] });
        });
      } else {
        eclates.push(g);
      }
    }
    for (const g of eclates) {
      const seul = g.membres.length === 1;
      const decalage = g.decalage || [0, 0];
      const cle = seul
        ? `b:${g.membres[0].id}:${decalage.join(',')}`
        : `g:${g.membres.map((m) => m.id).sort().join('|')}`;
      vus.add(cle);
      if (marqueurs.current.has(cle)) continue;
      let el;
      let lngLat;
      if (seul) {
        const x = g.membres[0];
        lngLat = [x.lng, x.lat];
        el = x.slug ? elementBoutique(x) : elementAnnonce();
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          setSelection(x);
          map.easeTo({ center: lngLat, duration: 400 });
        });
      } else {
        const c = map.unproject([g.px, g.py]);
        lngLat = [c.lng, c.lat];
        el = elementGroupe(g.membres.length);
        // Taper un groupe = se rapprocher de deux crans et demi, centré sur
        // lui. Pas de « fitBounds »: avec la carte inclinée, il ne bougeait
        // pas d'un pixel (constaté en test). Le regroupement se recalcule à
        // chaque mouvement, donc le groupe se défait tout seul en zoomant.
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          // Au moins jusqu'au zoom 16: c'est là que les groupes se défont
          // pour de bon, même à la même adresse.
          map.easeTo({ center: lngLat, zoom: Math.min(Math.max(map.getZoom() + 3, 16), 18), duration: 500 });
        });
      }
      const m = new maplibregl.Marker({ element: el, anchor: seul ? 'bottom' : 'center', offset: decalage })
        .setLngLat(lngLat)
        .addTo(map);
      marqueurs.current.set(cle, m);
    }
    for (const [cle, m] of marqueurs.current) {
      if (!vus.has(cle)) { m.remove(); marqueurs.current.delete(cle); }
    }
  }

  // ---- Création, une seule fois ----------------------------------------
  useEffect(() => {
    if (!boite.current || carte.current) return undefined;
    let map;
    try {
      map = new maplibregl.Map({
        container: boite.current,
        style: STYLE_VECTORIEL,
        center: [9.7, 4.05],
        zoom: 11,
        pitch: 45,
        attributionControl: false,
        cooperativeGestures: false,
      });
      // Le « i » des crédits en bas à gauche: à droite, il se collait sous
      // le bouton de position et la bulle Finia.
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    } catch {
      setSansWebgl(true);
      return undefined;
    }
    carte.current = map;
    // Exposé pour les tests navigateur (lecture du zoom), rien d'autre.
    if (typeof window !== 'undefined') window.__finjaroMap = map;

    let charge = false;
    map.on('style.load', () => poserBatiments3D(map));
    map.once('load', () => { charge = true; });

    // Fond de secours: si le fond vectoriel n'est pas là au bout de huit
    // secondes, ou s'il renvoie des erreurs, on passe au fond image sans
    // rien demander. Une carte noire n'est pas une option.
    const minuterie = setTimeout(() => {
      if (!charge || !map.isStyleLoaded()) setFondSecours(true);
    }, DELAI_SECOURS_MS);
    map.on('error', (e) => {
      const msg = String(e?.error?.message || '');
      const source = e?.sourceId || '';
      if (source === 'openmaptiles' || /style|Failed to fetch|NetworkError/i.test(msg)) setFondSecours(true);
    });

    map.on('click', () => setSelection(null));
    map.on('move', () => rafraichirMarqueurs(map));
    map.on('moveend', () => rafraichirMarqueurs(map));

    let watchId = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setPositionLive({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      );
    }
    return () => {
      clearTimeout(minuterie);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      marqueurs.current.forEach((m) => m.remove());
      marqueurs.current.clear();
      map.remove();
      carte.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Données -----------------------------------------------------------
  useEffect(() => {
    const map = carte.current;
    if (!map) return;
    donnees.current = geo;
    marqueurs.current.forEach((m) => m.remove());
    marqueurs.current.clear();

    // Cadrage: sur MA position si on la connaît (c'est « autour de moi »
    // qu'on regarde), sinon sur l'ensemble des boutiques.
    const moi = positionLive || userPos;
    if (moi) {
      map.jumpTo({ center: [moi.lng, moi.lat], zoom: 12 });
    } else if (geo.length === 1) {
      map.jumpTo({ center: [geo[0].lng, geo[0].lat], zoom: 14 });
    } else if (geo.length > 1) {
      const b = geo.reduce(
        (acc, x) => acc.extend([x.lng, x.lat]),
        new maplibregl.LngLatBounds([geo[0].lng, geo[0].lat], [geo[0].lng, geo[0].lat])
      );
      map.fitBounds(b, { padding: { top: 70, bottom: 150, left: 50, right: 50 }, maxZoom: 14, duration: 0 });
    }
    rafraichirMarqueurs(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, userPos]);

  // ---- Fond de carte -----------------------------------------------------
  useEffect(() => {
    const map = carte.current;
    if (!map) return;
    let style;
    if (mode === 'satellite') style = STYLE_SATELLITE;
    else style = fondSecours ? STYLE_PLAN_IMAGE : STYLE_VECTORIEL;
    map.setStyle(style);
    const vectoriel = mode === 'plan' && !fondSecours;
    map.easeTo({ pitch: vectoriel && relief ? 45 : 0, duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fondSecours]);

  // ---- Ma position -------------------------------------------------------
  useEffect(() => {
    const map = carte.current;
    if (!map) return;
    const moi = positionLive || userPos;
    if (!moi) { marqueurMoi.current?.remove(); marqueurMoi.current = null; return; }
    if (!marqueurMoi.current) {
      marqueurMoi.current = new maplibregl.Marker({ element: elementMoi(), anchor: 'center' })
        .setLngLat([moi.lng, moi.lat])
        .addTo(map);
    } else {
      marqueurMoi.current.setLngLat([moi.lng, moi.lat]);
    }
  }, [positionLive, userPos]);

  function basculerRelief() {
    const map = carte.current;
    if (!map) return;
    const suivant = !relief;
    setRelief(suivant);
    map.easeTo({ pitch: suivant ? 45 : 0, duration: 500 });
  }
  function recentrerSurMoi() {
    const map = carte.current;
    const moi = positionLive || userPos;
    if (!map || !moi) return;
    map.flyTo({ center: [moi.lng, moi.lat], zoom: 15, duration: 700 });
  }
  const zoomer = (d) => carte.current?.easeTo({ zoom: carte.current.getZoom() + d, duration: 250 });

  if (sansWebgl) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-8 text-center text-caption text-muted">
        {t('nearYou.mapUnsupported')}
      </div>
    );
  }
  if (geo.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-8 text-center text-caption text-muted">
        {t('nearYou.noGeoPoints')}
      </div>
    );
  }

  const vectoriel = mode === 'plan' && !fondSecours;
  const trade = selection ? (selection.categories ?? []).find(isServiceCategory) : null;
  const moiConnu = !!(positionLive || userPos);

  return (
    <div
      ref={cadre}
      style={hauteur ? { height: `${hauteur}px` } : undefined}
      className="relative w-full overflow-hidden bg-[#E9E5DE] lg:h-[70vh] lg:rounded-card"
    >
      <div ref={boite} className="h-full w-full" />

      {/* Plan / Satellite — en haut à gauche, un seul commutateur. */}
      <div className="absolute left-3 top-3 inline-flex overflow-hidden rounded-input bg-white shadow-md">
        {[['plan', t('nearYou.mode.plan')], ['satellite', t('nearYou.mode.satellite')]].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMode(k)}
            aria-pressed={mode === k}
            className={`h-10 px-3.5 text-caption font-semibold transition ${mode === k ? 'bg-ink text-white' : 'text-ink hover:bg-base'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zoom et relief — colonne de droite, même style. */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-input shadow-md">
          <BoutonCarte onClick={() => zoomer(1)} label={t('nearYou.zoomIn')}><IconPlus size={18} /></BoutonCarte>
          <div className="h-px bg-hairline" />
          <BoutonCarte onClick={() => zoomer(-1)} label={t('nearYou.zoomOut')}><IconMinus size={18} /></BoutonCarte>
        </div>
        {vectoriel && (
          <BoutonCarte onClick={basculerRelief} label={t('nearYou.map3d')} active={relief} className="rounded-input shadow-md">
            <IconBuildingSkyscraper size={18} />
          </BoutonCarte>
        )}
        {/* Ma position — dans la même colonne, comme Apple Plans. En bas à
            droite, il se battait avec la bulle Finia et les crédits. */}
        {moiConnu && (
          <BoutonCarte onClick={recentrerSurMoi} label={t('nearYou.myPosition')} className="rounded-input shadow-md !text-[#1A73E8]">
            <IconCurrentLocation size={18} />
          </BoutonCarte>
        )}
      </div>

      {/* La fiche, quand on tape une bulle. */}
      {selection && (
        // z-10: au-dessus des contrôles MapLibre (attribution comprise).
        // right-16 sur téléphone: la colonne de droite reste libre pour la
        // bulle Finia, qui flotte par-dessus toutes les pages.
        <div className="absolute bottom-3 left-3 right-16 z-10 animate-slide-up rounded-card bg-white p-3 shadow-xl lg:left-auto lg:right-3 lg:w-80">
          <button
            type="button"
            onClick={() => setSelection(null)}
            aria-label={t('common.close')}
            className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-base"
          >
            <IconX size={18} />
          </button>
          <div className="flex items-center gap-3 pr-6">
            {selection.slug && selection.avatar_url ? (
              <SmartImage
                src={storageThumbUrl('shops', selection.avatar_url)}
                fallbackSrc={storageUrl('shops', selection.avatar_url)}
                alt=""
                className="h-12 w-12 shrink-0"
                rounded="rounded-full"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-base text-ink">
                {selection.slug
                  ? <span className="text-title font-semibold">{(selection.name || '?').trim().charAt(0).toUpperCase()}</span>
                  : <IconMapPin size={22} />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-ink">{selection.name || selection.description?.slice(0, 40)}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
                {trade && <span>{t(`categories.${trade}`)}</span>}
                {selection.rating > 0 && (
                  <span className="flex items-center gap-0.5"><IconStarFilled size={11} className="text-brass" /> {Number(selection.rating).toFixed(1)}</span>
                )}
                {selection._km != null && <span>{selection._km} km</span>}
              </p>
              {(selection.city || selection.neighborhood) && (
                <p className="truncate text-caption text-muted">{[selection.neighborhood, selection.city].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href={lienItineraire(selection)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-input border border-hairline bg-white text-body font-semibold text-ink transition active:scale-[0.98]"
            >
              <IconRoute size={18} /> {t('nearYou.directions')}
            </a>
            <button
              type="button"
              onClick={() => onSelect(selection)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-input bg-teal text-body font-semibold text-white transition active:scale-[0.98]"
            >
              {selection.slug ? t('nearYou.openShop') : <><IconMessage size={18} /> {t('nearYou.openChat')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
