import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag, IconHeart, IconSettings, IconHelpCircle, IconLogout,
  IconBuildingStore, IconChevronRight, IconClockHour4, IconSwitchHorizontal, IconUserCircle,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { useUI } from '../../hooks/useUI';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/states';
import { storageUrl } from '../../lib/supabase';

export default function UserProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { requireLogin } = useUI();
  const { status } = useVendorStatus();

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
      <div className="flex items-center gap-3 p-4">
        <SmartImage src={profile?.avatar_url ? storageUrl('shops', profile.avatar_url) : null} alt={profile?.name} className="h-16 w-16" rounded="rounded-full" />
        <div className="flex-1">
          <p className="text-title text-ink">{profile?.name || t('profile.guest')}</p>
          <Link to="/profile/edit" className="text-caption font-semibold text-teal">{t('profile.editProfile')}</Link>
        </div>
      </div>

      <ul className="mt-2">
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
          {status === 'approved' ? (
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
