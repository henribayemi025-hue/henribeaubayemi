import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../lib/categories';
import { featuredCategoryOrder } from '../lib/region';
import { useSettings } from '../hooks/useSettings';

// Dégradés stables par id (même recette que ShopAvatar): une nouvelle
// catégorie sans photo affiche une tuile colorée avec son initiale plutôt
// qu'un cadre d'image cassée.
const GRADIENTS = [
  'from-[#C25E38] to-[#8C3D22]',
  'from-[#2F6D62] to-[#1C4A42]',
  'from-[#8C6A3D] to-[#5C4426]',
  'from-[#4A5568] to-[#2D3748]',
  'from-[#7C5295] to-[#553C6B]',
];
function gradientFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

// Bandeau horizontal des têtes de catégories du pivot, ordonnées selon la
// zone (Afrique / diaspora) via la détection de pays déjà utilisée pour les
// devises — même liste partout, seule la priorité d'affichage change.
export function CategoryStrip() {
  const { t } = useTranslation();
  const { country } = useSettings();

  const order = featuredCategoryOrder(country);
  const sorted = [...CATEGORIES].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
      {sorted.map((c) => (
        <Link
          key={c.id}
          to={`/category/${c.id}`}
          className="flex w-20 shrink-0 flex-col items-center transition-transform duration-150 active:scale-95"
          aria-label={t(`categories.${c.id}`)}
        >
          <div className="h-20 w-20 overflow-hidden rounded-card border border-hairline">
            {c.banner ? (
              <img
                src={c.banner}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(c.id)} text-title font-semibold text-white`}
              >
                {t(`categories.${c.id}`).charAt(0)}
              </div>
            )}
          </div>
          <span className="mt-1 line-clamp-1 text-caption text-ink">{t(`categories.${c.id}`)}</span>
        </Link>
      ))}
    </div>
  );
}
