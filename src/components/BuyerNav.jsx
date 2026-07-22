import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHome, IconHomeFilled,
  IconPlayerPlay, IconPlayerPlayFilled,
  IconMapPin, IconMapPinFilled,
  IconUser, IconUserFilled,
  IconSparkles,
} from '@tabler/icons-react';
import { useUI } from '../hooks/useUI';

const items = [
  { to: '/', key: 'home', end: true, out: IconHome, on: IconHomeFilled },
  { to: '/fin', key: 'fin', out: IconPlayerPlay, on: IconPlayerPlayFilled },
  { to: '/near-you', key: 'nearYou', out: IconMapPin, on: IconMapPinFilled },
  { to: '/profile', key: 'profile', out: IconUser, on: IconUserFilled },
];

export function BuyerNav() {
  const { t } = useTranslation();
  const { openFinou } = useUI();
  return (
    <>
      <button
        onClick={openFinou}
        aria-label={t('finou.title')}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-transform duration-150 active:scale-95 hover:bg-teal-hover"
      >
        <IconSparkles size={26} />
      </button>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-stretch border-t border-hairline bg-white">
        {items.map((it) => (
          <NavLink
            key={it.key}
            to={it.to}
            end={it.end}
            className="flex flex-1 flex-col items-center gap-0.5 py-2"
          >
            {({ isActive }) => {
              const Icon = isActive ? it.on : it.out;
              return (
                <>
                  <Icon size={24} className={isActive ? 'text-teal' : 'text-muted'} />
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
