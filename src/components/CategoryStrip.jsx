import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
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

function CategoryTile({ id, banner, label }) {
  return (
    <Link
      to={`/category/${id}`}
      className="flex w-[4.75rem] shrink-0 flex-col items-center transition-transform duration-150 active:scale-95"
    >
      <div className="h-[4.75rem] w-[4.75rem] overflow-hidden rounded-card border border-hairline">
        {banner ? (
          <img
            src={banner}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(id)} text-title font-semibold text-white`}
          >
            {label.charAt(0)}
          </div>
        )}
      </div>
      {/* Deux lignes autorisées + libellé court: "Immobilier…" et "Seconde…"
          étaient coupés au milieu d'un mot sur une seule ligne de 80 px. */}
      <span className="mt-1 line-clamp-2 text-center text-[11px] leading-tight text-ink">{label}</span>
    </Link>
  );
}

// Bandeau des têtes de catégories du pivot, ordonnées selon la zone
// (Afrique / diaspora) via la détection de pays déjà utilisée pour les
// devises — même liste partout, seule la priorité d'affichage change.
// Le bouton "Tout voir" déplie une grille: le défilement horizontal seul ne
// laissait pas deviner qu'il restait des catégories à droite.
export function CategoryStrip() {
  const { t } = useTranslation();
  const { country } = useSettings();
  const [expanded, setExpanded] = useState(false);

  // Libellé court pour la tuile (fallback sur le nom complet).
  const label = (id) => t(`categoriesShort.${id}`, { defaultValue: t(`categories.${id}`) });

  const order = featuredCategoryOrder(country);
  const sorted = [...CATEGORIES].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div>
      <div className="flex items-center justify-between px-4 pb-1">
        <h2 className="text-section text-ink">{t('categories.title')}</h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-0.5 text-caption font-semibold text-teal"
          aria-expanded={expanded}
        >
          {expanded ? t('common.seeLess') : t('common.seeAll')}
          {expanded ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
        </button>
      </div>

      {expanded ? (
        <div className="grid grid-cols-4 justify-items-center gap-y-3 px-4 pb-1 sm:grid-cols-6 lg:grid-cols-8">
          {sorted.map((c) => (
            <CategoryTile key={c.id} id={c.id} banner={c.banner} label={label(c.id)} />
          ))}
        </div>
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {sorted.map((c) => (
            <CategoryTile key={c.id} id={c.id} banner={c.banner} label={label(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
