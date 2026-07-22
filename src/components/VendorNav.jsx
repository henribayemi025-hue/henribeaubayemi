import { NavLink } from 'react-router-dom';
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

export function VendorNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-stretch border-t border-hairline bg-white">
      {items.map((it) => (
        <NavLink key={it.key} to={it.to} end={it.end} className="flex flex-1 flex-col items-center gap-0.5 py-2">
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
  );
}
