import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHome, IconHomeFilled,
  IconPlayerPlay, IconPlayerPlayFilled,
  IconMapPin, IconMapPinFilled,
  IconMessage, IconMessageFilled,
  IconUser, IconUserFilled,
  IconSparkles,
} from '@tabler/icons-react';
import { useUI } from '../hooks/useUI';

const items = [
  { to: '/', key: 'home', end: true, out: IconHome, on: IconHomeFilled },
  { to: '/fin', key: 'fin', out: IconPlayerPlay, on: IconPlayerPlayFilled },
  { to: '/near-you', key: 'nearYou', out: IconMapPin, on: IconMapPinFilled },
  { to: '/inbox', key: 'messages', out: IconMessage, on: IconMessageFilled },
  { to: '/profile', key: 'profile', out: IconUser, on: IconUserFilled },
];

export function BuyerNav() {
  const { t } = useTranslation();
  const { openFinou } = useUI();
  const { pathname } = useLocation();
  // Near You has its own floating "+ Publier" action — hide Finou there so the
  // two FABs never overlap (FIX 5).
  const showFinou = pathname !== '/near-you';

  return (
    <>
      {showFinou && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-end px-4">
          <button
            onClick={openFinou}
            aria-label={t('finou.title')}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-transform duration-150 hover:bg-teal-hover active:scale-95"
          >
            <IconSparkles size={26} />
          </button>
        </div>
      )}
      <nav className="flex items-stretch border-t border-hairline bg-white">
        {items.map((it) => (
          <NavLink key={it.key} to={it.to} end={it.end} className="flex flex-1 flex-col items-center gap-0.5 py-2">
            {({ isActive }) => {
              const Icon = isActive ? it.on : it.out;
              return (
                <>
                  <Icon size={23} className={isActive ? 'text-teal' : 'text-muted'} />
                  <span className={`text-[11px] ${isActive ? 'font-semibold text-teal' : 'text-muted'}`}>
                    {t(`nav.${it.key}`)}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
