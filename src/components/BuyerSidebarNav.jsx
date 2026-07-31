import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHome, IconHomeFilled,
  IconPlayerPlay, IconPlayerPlayFilled,
  IconMapPin, IconMapPinFilled,
  IconMessage, IconMessageFilled,
  IconUser, IconUserFilled,
} from '@tabler/icons-react';

const items = [
  { to: '/', key: 'home', end: true, out: IconHome, on: IconHomeFilled },
  { to: '/fin', key: 'fin', out: IconPlayerPlay, on: IconPlayerPlayFilled },
  { to: '/services', key: 'services', out: IconMapPin, on: IconMapPinFilled },
  { to: '/inbox', key: 'messages', out: IconMessage, on: IconMessageFilled },
  { to: '/profile', key: 'profile', out: IconUser, on: IconUserFilled },
];

// Desktop-only left sidebar (Instagram-web style): the mobile bottom tab bar
// doesn't read as "a real website" on a wide screen — same nav items, laid
// out as a persistent vertical rail instead. Hidden below `lg`; BuyerNav's
// bottom bar is the mobile equivalent (hidden at `lg` and up), so exactly
// one of the two is ever visible.
export function BuyerSidebarNav() {
  const { t } = useTranslation();
  return (
    <nav className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-white px-3 py-6 lg:flex">
      <Link to="/" className="mb-8 px-3 text-title font-semibold text-teal">
        Finjaro
      </Link>
      {items.map((it) => (
        <NavLink
          key={it.key}
          to={it.to}
          end={it.end}
          className="mb-1 flex items-center gap-3 rounded-input px-3 py-2.5 transition hover:bg-teal-light"
        >
          {({ isActive }) => {
            const Icon = isActive ? it.on : it.out;
            return (
              <>
                <Icon size={22} className={isActive ? 'text-teal' : 'text-ink'} />
                <span className={`text-body ${isActive ? 'font-semibold text-teal' : 'text-ink'}`}>
                  {t(`nav.${it.key}`)}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
