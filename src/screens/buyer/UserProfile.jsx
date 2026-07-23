import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag, IconHeart, IconSettings, IconHelpCircle, IconLogout,
  IconBuildingStore, IconChevronRight, IconClockHour4, IconSwitchHorizontal,
  IconUserCircle, IconRosetteDiscountCheckFilled, IconCalendarHeart,
} from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { useUI } from '../../hooks/useUI';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/states';

export default function UserProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { requireLogin } = useUI();
  const { status } = useVendorStatus();

  // Real counts for the stats grid — best-effort, never blocks the page.
  const { data: stats } = useAsync(async () => {
    if (!user) return { orders: 0, favorites: 0 };
    const [ordersRes, favRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
      supabase.from('shop_follows').select('follower_id', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]);
    return { orders: ordersRes.count || 0, favorites: favRes.count || 0 };
  }, [user]);

  if (!user) {
    return (
      <div>
        <AppHeader title={t('profile.title')} />
        <EmptyState
          icon={IconUserCircle}
          title={t('profile.guest')}
          hint={t('profile.guestPrompt')}
          action={<Button onClick={requireLogin}>{t('auth.login')}</Button>}
        />
      </div>
    );
  }

  const memberSince = new Date(profile?.created_at || user?.created_at || Date.now()).getFullYear();
  const isVendor = status === 'approved';

  // Messages now lives in the bottom nav (FIX 6), so it's not repeated here.
  const rows = [
    { icon: IconShoppingBag, label: t('profile.myOrders'), to: '/profile/orders' },
    { icon: IconHeart, label: t('profile.myFavorites'), to: '/profile/favorites' },
    { icon: IconSettings, label: t('profile.settings'), to: '/profile/settings' },
    { icon: IconHelpCircle, label: t('profile.help'), to: '/profile/help' },
  ];

  return (
    <div className="pb-6">
      <AppHeader title={t('profile.title')} />

      {/* Cover banner (brand gradient) + avatar overlay, Instagram/LinkedIn style. */}
      <div className="relative mb-12">
        <div className="h-28 w-full bg-gradient-to-br from-teal to-teal-hover" aria-hidden="true">
          <div className="h-full w-full bg-gradient-to-tr from-transparent via-transparent to-brass/40" />
        </div>
        <div className="absolute -bottom-10 left-4 flex items-end gap-3">
          <div className="rounded-full ring-4 ring-base">
            <SmartImage
              src={profile?.avatar_url ? storageUrl('shops', profile.avatar_url) : null}
              alt={profile?.name}
              className="h-20 w-20"
              rounded="rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-1.5">
          <p className="text-title text-ink">{profile?.name || t('profile.guest')}</p>
          {isVendor && <IconRosetteDiscountCheckFilled size={20} className="text-teal" aria-label={t('profile.vendorBadge')} />}
        </div>
        <Link to="/profile/edit" className="text-caption font-semibold text-teal">{t('profile.editProfile')}</Link>
      </div>

      {/* Stats grid — real data, tappable cards route to the matching page. */}
      <div className="mt-4 grid grid-cols-3 gap-3 px-4">
        <StatTile to="/profile/orders" value={stats?.orders} label={t('profile.statOrders')} icon={IconShoppingBag} />
        <StatTile to="/profile/favorites" value={stats?.favorites} label={t('profile.statFavorites')} icon={IconHeart} />
        <StatTile value={memberSince} label={t('profile.statMember')} icon={IconCalendarHeart} />
      </div>

      <ul className="mt-6">
        {rows.map((r) => (
          <li key={r.label}>
            <Link to={r.to} className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 text-body text-ink">
              <r.icon size={22} className="text-muted" />
              <span className="flex-1">{r.label}</span>
              <IconChevronRight size={18} className="text-hairline" />
            </Link>
          </li>
        ))}

        {/* Devenir vendeur — state-dependent row. */}
        <li>
          {isVendor ? (
            <button onClick={() => navigate('/switch/to-vendor')} className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3.5 text-left text-body text-teal">
              <IconSwitchHorizontal size={22} />
              <span className="flex-1 font-semibold">{t('profile.switchToVendor')}</span>
              <IconChevronRight size={18} className="text-hairline" />
            </button>
          ) : status === 'pending' ? (
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 text-body text-muted">
              <IconClockHour4 size={22} />
              <span className="flex-1">{t('profile.vendorPending')}</span>
            </div>
          ) : (
            <Link to="/become-vendor" className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 text-body text-ink">
              <IconBuildingStore size={22} className="text-muted" />
              <span className="flex-1">{t('profile.becomeVendor')}</span>
              <IconChevronRight size={18} className="text-hairline" />
            </Link>
          )}
        </li>

        <li>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-body text-danger"
          >
            <IconLogout size={22} />
            <span>{t('profile.logout')}</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

function StatTile({ to, value, label, icon: Icon }) {
  const inner = (
    <div className="flex flex-col items-center rounded-card border border-hairline bg-base px-2 py-3 text-center">
      <Icon size={18} className="mb-1 text-brass" />
      <span className="text-section text-ink">{value ?? '—'}</span>
      <span className="mt-0.5 text-caption text-muted">{label}</span>
    </div>
  );
  return to ? (
    <Link to={to} className="transition active:scale-95">{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}
