import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import { IconStarFilled, IconMapPin, IconX, IconCurrentLocation, IconBuildingSkyscraper, IconMessage } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { shopGradient } from '../lib/shopColor';
import { isServiceCategory } from '../lib/categories';
import { tradeEmoji } from '../lib/trades';

// La carte des Services, refaite.
//
// Beau (10/09): « la map là est une map laide, normalement notre map devait
// être comme Google Maps, même en 3D, on voit même les maisons, comme Snap
// Map ». L'ancienne carte affichait des tuiles OpenStreetMap brutes (images
// fixes, tout gris-beige, aucune inclinaison possible).
//
// Celle-ci est VECTORIELLE (MapLibre GL): les rues, les noms et les bâtiments
// sont dessinés par le téléphone, on peut l'incliner, la tourner, et les
// bâtiments se lèvent en 3D à partir du niveau de zoom d'un quartier. Le
// fond vient d'OpenFreeMap (style « Liberty »): des données OpenStreetMap
// servies gratuitement, sans clé ni quota — rien à payer, rien à
// configurer, aucune clé à faire fuiter.
//
// Chaque boutique est une bulle avec sa vraie photo (même repli dégradé +
// initiale que ShopAvatar), posée bien ronde sur sa position. On tape
// dessus, une fiche monte du bas de la carte — pas une info-bulle
// minuscule à viser du pouce.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const AVATAR_SIZE = 46;

function bulleBoutique(x) {
  const el = document.createElement('div');
  el.className = 'finjaro-shop-pin';
  el.style.cssText = 'cursor:pointer;transition:transform .15s';
  const g = shopGradient(x.id || x.name);
  const initial = (x.name || '?').trim().charAt(0).toUpperCase();
  const src = x.avatar_url ? storageThumbUrl('shops', x.avatar_url) : null;
  el.innerHTML = `
    <div style="
      width:${AVATAR_SIZE}px;height:${AVATAR_SIZE}px;border-radius:9999px;
      background-image:linear-gradient(135deg, ${g.from}, ${g.to});
      border:3px solid #fff;box-shadow:0 2px 10px rgba(23,27,38,0.35);
      display:flex;align-items:center;justify-content:center;overflow:hidden;
      font:700 17px 'Fraunces', Georgia, serif;color:#fff;
    ">
      ${src ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px" onerror="this.remove()" />` : initial}
    </div>`;
  return el;
}

// Une ANNONCE (near_you_listings) n'a ni logo ni nom: un pion terracotta
// simple reste le bon repère.
function bulleAnnonce() {
  const el = document.createElement('div');
  el.style.cssText = 'cursor:pointer';
  el.innerHTML =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="#C25E38" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.7.4.4 1 .4 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8z" ' +
    'stroke="#FFFFFF" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg>';
  return el;
}

function bulleMoi() {
  const el = document.createElement('div');
  el.innerHTML =
    '<div style="width:18px;height:18px;border-radius:9999px;background:#E09F3E;border:3px solid #fff;box-shadow:0 0 0 3px rgba(224,159,62,.35)"></div>';
  return el;
}

// Les bâtiments en relief. Le style Liberty en dessine déjà à partir du
// zoom 14; si un jour le style change et ne le fait plus, on pose la couche
// nous-mêmes depuis les données OpenMapTiles.
function poserBatiments3D(map) {
  try {
    if (map.getLayer('building-3d')) return;
    if (!map.getSource('openmaptiles')) return;
    const labelLayer = (map.getStyle().layers || []).find((l) => l.type === 'symbol' && l.layout?.['text-field']);
    map.addLayer(
      {
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#EADFD0',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        },
      },
      labelLayer?.id
    );
  } catch {
    /* le fond de carte reste utilisable sans relief */
  }
}

export default function NearYouMap({ items, userPos, onSelect }) {
  const { t } = useTranslation();
  const boite = useRef(null);
  const carte = useRef(null);
  const marqueurs = useRef([]);
  const marqueurMoi = useRef(null);
  const [selection, setSelection] = useState(null);
  const [relief, setRelief] = useState(true);
  const [fondIndisponible, setFondIndisponible] = useState(false);
  const [sansWebgl, setSansWebgl] = useState(false);

  const geo = useMemo(
    () => items.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)),
    [items]
  );

  // Création UNE fois. Le style, l'inclinaison et les contrôles ne bougent
  // plus ensuite; seuls les marqueurs suivent la liste.
  useEffect(() => {
    if (!boite.current || carte.current) return undefined;
    // Sans WebGL (très vieux téléphone, navigateur bridé), le constructeur
    // lève une erreur: on l'attrape et on renvoie vers la liste.
    let map;
    try {
      map = new maplibregl.Map({
        container: boite.current,
        style: STYLE_URL,
        center: [9.7, 4.05],
        zoom: 11,
        pitch: 50,
        bearing: -12,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      });
    } catch {
      setSansWebgl(true);
      return undefined;
    }
    carte.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true }), 'top-right');
    map.on('load', () => poserBatiments3D(map));
    // Un fond qui ne charge pas (hors ligne, réseau filtré) ne doit pas
    // faire disparaître les boutiques: les bulles restent posées, on prévient.
    map.on('error', (e) => {
      const msg = String(e?.error?.message || '');
      if (/style|tiles|fetch|network|Failed/i.test(msg)) setFondIndisponible(true);
    });
    map.on('click', () => setSelection(null));
    return () => {
      marqueurs.current.forEach((m) => m.remove());
      marqueurs.current = [];
      map.remove();
      carte.current = null;
    };
  }, []);

  // Les bulles suivent la liste filtrée.
  useEffect(() => {
    const map = carte.current;
    if (!map) return;
    marqueurs.current.forEach((m) => m.remove());
    marqueurs.current = geo.map((x) => {
      const el = x.slug ? bulleBoutique(x) : bulleAnnonce();
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelection(x);
        map.easeTo({ center: [x.lng, x.lat], duration: 500 });
      });
      return new maplibregl.Marker({ element: el, anchor: x.slug ? 'center' : 'bottom' })
        .setLngLat([x.lng, x.lat])
        .addTo(map);
    });

    if (marqueurMoi.current) { marqueurMoi.current.remove(); marqueurMoi.current = null; }
    if (userPos) {
      marqueurMoi.current = new maplibregl.Marker({ element: bulleMoi(), anchor: 'center' })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map);
    }

    const pts = geo.map((x) => [x.lng, x.lat]);
    if (userPos) pts.push([userPos.lng, userPos.lat]);
    if (pts.length === 1) {
      map.jumpTo({ center: pts[0], zoom: 14 });
    } else if (pts.length > 1) {
      const b = pts.reduce((acc, p) => acc.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(b, { padding: { top: 60, bottom: 140, left: 40, right: 40 }, maxZoom: 15, duration: 0 });
    }
  }, [geo, userPos]);

  function basculerRelief() {
    const map = carte.current;
    if (!map) return;
    const suivant = !relief;
    setRelief(suivant);
    map.easeTo({ pitch: suivant ? 50 : 0, bearing: suivant ? -12 : 0, duration: 600 });
  }

  function recentrerSurMoi() {
    const map = carte.current;
    if (!map || !userPos) return;
    map.flyTo({ center: [userPos.lng, userPos.lat], zoom: 15, duration: 800 });
  }

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

  const trade = selection ? (selection.categories ?? []).find(isServiceCategory) : null;

  return (
    <div className="relative h-[calc(var(--app-height,100vh)-12.5rem)] w-full overflow-hidden rounded-t-card bg-base lg:h-[70vh] lg:rounded-card">
      <div ref={boite} className="h-full w-full" />

      {/* Boutons maison, à gauche: relief et retour sur ma position. */}
      <div className="absolute left-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={basculerRelief}
          aria-pressed={relief}
          className={`flex h-10 items-center gap-1.5 rounded-pill px-3 text-caption font-semibold shadow-md transition ${
            relief ? 'bg-teal text-white' : 'bg-white text-ink'
          }`}
        >
          <IconBuildingSkyscraper size={16} /> {t('nearYou.map3d')}
        </button>
        {userPos && (
          <button
            type="button"
            onClick={recentrerSurMoi}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brass shadow-md"
            aria-label={t('nearYou.myPosition')}
          >
            <IconCurrentLocation size={18} />
          </button>
        )}
      </div>

      {fondIndisponible && (
        <div className="pointer-events-none absolute inset-x-3 top-16 rounded-card bg-white/95 px-3 py-2 text-center text-caption text-muted shadow">
          {t('nearYou.mapStyleFailed')}
        </div>
      )}

      {/* La fiche qui monte du bas quand on tape une bulle. */}
      {selection && (
        // right-16 sur téléphone: la colonne de droite reste libre pour la
        // bulle Finia, qui flotte par-dessus toutes les pages.
        <div className="absolute bottom-3 left-3 right-16 animate-slide-up rounded-card border border-hairline bg-white p-3 shadow-xl lg:left-auto lg:right-3 lg:w-80">
          <button
            type="button"
            onClick={() => setSelection(null)}
            aria-label={t('common.close')}
            className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-base"
          >
            <IconX size={18} />
          </button>
          <div className="flex items-center gap-3 pr-6">
            {selection.slug ? (
              selection.avatar_url ? (
                <SmartImage
                  src={storageThumbUrl('shops', selection.avatar_url)}
                  fallbackSrc={storageUrl('shops', selection.avatar_url)}
                  alt=""
                  className="h-12 w-12 shrink-0"
                  rounded="rounded-full"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-base text-[22px]">
                  {tradeEmoji(trade)}
                </span>
              )
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-base text-[22px]">
                {tradeEmoji(selection.category)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-ink">
                {selection.name || selection.description?.slice(0, 40)}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
                {trade && <span>{t(`categories.${trade}`)}</span>}
                {selection.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <IconStarFilled size={11} className="text-brass" /> {Number(selection.rating).toFixed(1)}
                  </span>
                )}
                {selection._km != null && (
                  <span className="flex items-center gap-0.5">
                    <IconMapPin size={11} className="text-teal" /> {selection._km} km
                  </span>
                )}
              </p>
              {(selection.city || selection.neighborhood) && (
                <p className="truncate text-caption text-muted">
                  {[selection.neighborhood, selection.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(selection)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-input bg-teal text-body font-semibold text-white transition active:scale-[0.98]"
          >
            {selection.slug ? t('nearYou.openShop') : <><IconMessage size={18} /> {t('nearYou.openChat')}</>}
          </button>
        </div>
      )}
    </div>
  );
}
