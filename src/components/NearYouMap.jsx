import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { IconStarFilled } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { shopGradient } from '../lib/shopColor';

// Beau, en comparant à Snap Map: « on devrait voir les boutiques, un truc
// propre comme un Bitmoji ». La carte affichait un pion terracotta anonyme
// identique pour tout le monde — impossible de reconnaître une boutique sans
// taper sur chaque pion un par un. Chaque bulle porte maintenant la vraie
// photo de la boutique (même repli dégradé + initiale que ShopAvatar
// ailleurs dans l'app — jamais une couleur inventée hors charte), posée bien
// ronde sur sa position plutôt qu'au bout d'une goutte d'eau.
const AVATAR_SIZE = 46;
const shopIconCache = new Map();

function shopIcon(shop) {
  const key = `${shop.id}:${shop.avatar_url || ''}`;
  const cached = shopIconCache.get(key);
  if (cached) return cached;

  const g = shopGradient(shop.id || shop.name);
  const initial = (shop.name || '?').trim().charAt(0).toUpperCase();
  const src = shop.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null;

  const icon = L.divIcon({
    className: 'finjaro-shop-pin',
    html: `
      <div style="
        width:${AVATAR_SIZE}px;height:${AVATAR_SIZE}px;border-radius:9999px;
        background-image:linear-gradient(135deg, ${g.from}, ${g.to});
        border:3px solid #fff;box-shadow:0 2px 8px rgba(23,27,38,0.35);
        display:flex;align-items:center;justify-content:center;overflow:hidden;
        font:700 17px 'Fraunces', Georgia, serif;color:#fff;
      ">
        ${src ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px" onerror="this.remove()" />` : initial}
      </div>`,
    iconSize: [AVATAR_SIZE, AVATAR_SIZE],
    iconAnchor: [AVATAR_SIZE / 2, AVATAR_SIZE / 2],
    popupAnchor: [0, -AVATAR_SIZE / 2],
  });
  shopIconCache.set(key, icon);
  return icon;
}

// Repli pour les ANNONCES (near_you_listings): pas de boutique, pas de nom,
// pas de logo — juste la description d'une personne. La bulle-avatar n'a
// alors rien à montrer; le pion d'origine reste le bon repère ici.
const pinIcon = L.divIcon({
  className: 'finjaro-pin',
  html:
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="#C25E38" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.7.4.4 1 .4 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8z" ' +
    'stroke="#FFFFFF" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const userIcon = L.divIcon({
  className: 'finjaro-pin-me',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#E09F3E;border:3px solid #fff;box-shadow:0 0 0 2px #E09F3E"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Fit the viewport to all points (plus the user) whenever they change.
function FitBounds({ points }) {
  const map = useMap();
  useMemo(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(points).pad(0.2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export default function NearYouMap({ items, userPos, onSelect }) {
  const { t, i18n } = useTranslation();

  const geo = useMemo(
    () => items.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)),
    [items]
  );
  const points = useMemo(() => {
    const p = geo.map((x) => [x.lat, x.lng]);
    if (userPos) p.push([userPos.lat, userPos.lng]);
    return p;
  }, [geo, userPos]);

  const center = points[0] || [4.05, 9.7]; // fallback: Douala

  if (geo.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-8 text-center text-caption text-muted">
        {t('nearYou.noGeoPoints')}
      </div>
    );
  }

  return (
    <div className="h-[calc(var(--app-height,100vh)-13rem)] w-full">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full" style={{ background: '#F5F5F5' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
        {geo.map((x) => (
          <Marker key={x.id} position={[x.lat, x.lng]} icon={x.slug ? shopIcon(x) : pinIcon}>
            <Popup>
              <button onClick={() => onSelect(x)} className="flex items-center gap-2 text-left">
                {x.avatar_url && (
                  <SmartImage src={storageThumbUrl('shops', x.avatar_url)} fallbackSrc={storageUrl('shops', x.avatar_url)} alt={x.name} className="h-10 w-10" rounded="rounded-full" />
                )}
                <span>
                  <span className="block text-body font-semibold text-ink">{x.name || x.description?.slice(0, 30)}</span>
                  {x.rating != null && (
                    <span className="flex items-center gap-0.5 text-caption text-muted">
                      <IconStarFilled size={11} className="text-brass" />
                      {Number(x.rating || 0).toFixed(1)}
                      {x._km != null && ` · ${x._km} km`}
                    </span>
                  )}
                  <span className="mt-0.5 block text-caption font-semibold text-teal">{t('nearYou.viewOnMap')}</span>
                </span>
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
