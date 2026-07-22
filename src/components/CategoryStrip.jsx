import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../lib/categories';

// Horizontal scroll of the 14 static category banners.
export function CategoryStrip() {
  const { t } = useTranslation();
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to={`/category/${c.id}`}
          className="flex w-20 shrink-0 flex-col items-center"
          aria-label={t(`categories.${c.id}`)}
        >
          <div className="h-20 w-20 overflow-hidden rounded-card border border-hairline">
            <img
              src={c.banner}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="mt-1 line-clamp-1 text-caption text-ink">{t(`categories.${c.id}`)}</span>
        </Link>
      ))}
    </div>
  );
}
