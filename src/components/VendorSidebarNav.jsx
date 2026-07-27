import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconLayoutDashboard, IconLayoutDashboardFilled,
  IconBox, IconShoppingBag, IconShoppingBagCheck,
  IconBuildingStore, IconBuildingStore as IconStoreOn,
} from '@tabler/icons-react';

const items = [
  { to: '/vendor', key: 'dashboard', end: true, out: IconLayoutDashboard, on: IconLayoutDashboardFilled },
  { to: '/vendor/products', key: 'products', out: IconBox, on: IconBox },
  { to: '/vendor/orders', key: 'orders', out: IconShoppingBag, on: IconShoppingBagCheck },
  { to: '/vendor/shop', key: 'shop', out: IconBuildingStore, on: IconStoreOn },
];

// Desktop-only left sidebar for the vendor space, mirroring BuyerSidebarNav —
// same rationale: the mobile bottom tab bar doesn't read as "a real website"
// on a wide screen. Hidden below `lg`; VendorNav's bottom bar is the mobile
// equivalent (hidden at `lg` and up).
export function VendorSidebarNav() {
  const { t } = useTranslation();
  return (
    <nav className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-white px-3 py-6 lg:flex">
      <Link to="/vendor" className="mb-8 px-3 text-title font-semibold text-teal">
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
