import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { VendorNav } from '../../components/VendorNav';
import { VendorSidebarNav } from '../../components/VendorSidebarNav';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { FinouChou } from '../../components/FinouChou';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { useUI } from '../../hooks/useUI';
import { Spinner } from '../../components/Spinner';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Vendor space is only reachable by approved vendors (owns a shop).
// Same fixed, keyboard-aware app-shell as the buyer side (see BuyerLayout).
export function VendorLayout() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { loading, shop } = useVendorStatus();
  const { pathname } = useLocation();
  const { openFinou } = useUI();
  useViewportHeight();
  // A message thread is a focused screen (send button already there) — hide
  // the Finou FAB there, same rule as the buyer side's chat threads.
  const showFinou = !pathname.startsWith('/vendor/messages/');

  if (profile?.is_suspended) return <SuspendedNotice />;
  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!shop) return <Navigate to="/profile" replace />;

  return (
    <div className="lg:flex lg:h-dvh lg:bg-[#FAF6F0]">
      <VendorSidebarNav />
      <div
        className="fixed left-0 right-0 top-0 mx-auto flex w-full max-w-app flex-col overflow-hidden bg-white lg:relative lg:mx-0 lg:h-dvh lg:min-w-0 lg:max-w-none lg:flex-1"
        style={{
          height: 'var(--app-height, 100dvh)',
          // L'appli mobile dessine SOUS la barre d'état et le trou de la
          // caméra: index.html demande « viewport-fit=cover », et depuis
          // Android 15 le système impose ce plein écran. Aucune règle ne
          // réservait la place — d'où le titre collé à la caméra constaté
          // par Beau. Sur le web le navigateur pose sa propre barre
          // par-dessus, ce qui masquait complètement le problème.
          // env(...) vaut 0 partout où il n'y a pas d'encoche, donc cette
          // marge ne coûte rien sur un écran ordinaire.
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'var(--kb, 0px)',
        }}
      >
        {/* Marge basse tant que la barre d'onglets flottante est là (elle
            survole le contenu) — masquée dans un fil de discussion, qui gère
            sa propre hauteur. Même règle que VendorNav. */}
        <main
          className={`flex-1 overflow-y-auto overscroll-contain ${
            pathname.startsWith('/vendor/messages/') ? '' : TAB_BAR_SPACE
          }`}
        >
          <ErrorBoundary key={pathname}>
            <Outlet context={{ shop }} />
          </ErrorBoundary>
        </main>
        {showFinou && (
          // Positions relative to the fixed shell above (not <main>'s scroll),
          // same pattern as the buyer side's BuyerNav FAB — viewport-pinned
          // regardless of scroll position, sitting just above the tab bar.
          <div className="pointer-events-none absolute inset-x-0 bottom-[104px] z-40 flex justify-end px-4 lg:bottom-6 lg:px-6">
            <button
              onClick={openFinou}
              aria-label={t('finou.title')}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-transform duration-150 hover:bg-teal-hover active:scale-95"
            >
              <IconSparkles size={26} />
            </button>
          </div>
        )}
        <VendorNav />
        <LoginPrompt />
        <FinouChou />
      </div>
    </div>
  );
}
