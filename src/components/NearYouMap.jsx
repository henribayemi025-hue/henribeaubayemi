import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { IconStarFilled } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { storageUrl } from '../lib/supabase';

// Branded teal map-pin as a divIcon — avoids Leaflet's broken default-icon
// asset paths under Vite and keeps us on the "Lagune & Encre" palette.
const pinIcon = L.divIcon({
  className: 'finjaro-pin',
  html:
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="#0F4C4C" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.7.4.4 1 .4 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8z" ' +
    'stroke="#FFFFFF" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const userIcon = L.divIcon({
  className: 'finjaro-pin-me',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#B8935F;border:3px solid #fff;box-shadow:0 0 0 2px #B8935F"></div>',
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
          <Marker key={x.id} position={[x.lat, x.lng]} icon={pinIcon}>
            <Popup>
              <button onClick={() => onSelect(x)} className="flex items-center gap-2 text-left">
                {x.avatar_url && (
                  <SmartImage src={storageUrl('shops', x.avatar_url)} alt={x.name} className="h-10 w-10" rounded="rounded-full" />
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
