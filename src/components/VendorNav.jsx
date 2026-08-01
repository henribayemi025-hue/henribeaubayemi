import { useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard, IconLayoutDashboardFilled,
  IconBox, IconShoppingBag, IconShoppingBagCheck,
  IconBuildingStore, IconBuildingStore as IconStoreOn,
} from '@tabler/icons-react';
import { TabBar } from './TabBar';

const items = [
  { to: '/vendor', key: 'dashboard', end: true, out: IconLayoutDashboard, on: IconLayoutDashboardFilled },
  { to: '/vendor/products', key: 'products', out: IconBox, on: IconBox },
  { to: '/vendor/orders', key: 'orders', out: IconShoppingBag, on: IconShoppingBagCheck },
  { to: '/vendor/shop', key: 'shop', out: IconBuildingStore, on: IconStoreOn },
];

export function VendorNav() {
  const { pathname } = useLocation();
  // Hide the tab bar inside a message thread so the input sits on the keyboard.
  if (pathname.startsWith('/vendor/messages/')) return null;
  return <TabBar items={items} />;
}
