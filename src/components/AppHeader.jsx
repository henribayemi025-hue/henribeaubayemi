import { Link, useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';

// Generic screen header with optional back button, title, and right slot.
export function AppHeader({ title, back = false, right = null, logo = false }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-white px-4">
      {back && (
        <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-full p-1 text-ink hover:bg-hairline">
          <IconChevronLeft size={24} />
        </button>
      )}
      {logo ? (
        <Link to="/" className="flex items-center gap-1">
          <span className="text-title font-semibold text-teal">Finjaro</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
        </Link>
      ) : (
        <h1 className="line-clamp-1 flex-1 text-section text-ink">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-1">{right}</div>
    </header>
  );
}
