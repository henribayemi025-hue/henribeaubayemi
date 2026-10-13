import { Link, useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Generic screen header with optional back button, title, and right slot.
export function AppHeader({ title, back = false, right = null, logo = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-white px-4">
      {back && (
        // Zone tactile de 44 px (mesurée à 32 px le 13/10) autour du même rond :
        // les marges négatives gardent le titre à sa place.
        <button onClick={() => navigate(-1)} aria-label={t('common.back')} className="group -ml-3.5 -mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center text-ink">
          <span className="rounded-full p-1 group-hover:bg-hairline"><IconChevronLeft size={24} /></span>
        </button>
      )}
      {logo ? (
        <Link to="/" className="flex items-center gap-1">
          <span className="text-title font-semibold text-teal">Finjaro</span>
        </Link>
      ) : (
        <h1 className="line-clamp-1 flex-1 text-section text-ink">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-1">{right}</div>
    </header>
  );
}
