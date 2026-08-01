import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBanner } from '../../components/AnnouncementBanner';
import { BuyerNav } from '../../components/BuyerNav';
import { BuyerSidebarNav } from '../../components/BuyerSidebarNav';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import CartDrawer from '../../components/CartDrawer';
import { useAuth } from '../../hooks/useAuth';
import { useViewportHeight } from '../../hooks/useViewportHeight';

// Mobile (unchanged): fixed full-bleed app-shell (TikTok-style), header +
// bottom nav stay put, only <main> scrolls; --app-height keeps the keyboard
// from pushing the shell around.
// Desktop (lg+): a real website layout instead of the mobile shell just
// centered on grey — a persistent left sidebar (BuyerSidebarNav) + the
// content column filling the rest of the width, not capped at 480px.
export function BuyerLayout() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  useViewportHeight();
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="lg:flex lg:h-dvh lg:bg-[#FAF6F0]">
      <BuyerSidebarNav />
      <div
        className="fixed left-0 right-0 top-0 mx-auto flex w-full max-w-app flex-col overflow-hidden bg-white lg:relative lg:mx-0 lg:h-dvh lg:min-w-0 lg:max-w-none lg:flex-1"
        style={{ height: 'var(--app-height, 100dvh)', paddingBottom: 'var(--kb, 0px)' }}
      >
        {/* Hors du <main> qui défile: le bandeau reste en haut de la coque,
            visible sur tous les onglets (Accueil, Fin, Services…) comme la
            bande orange du prototype. Il ne rend rien s'il n'y a aucune
            annonce active — pas de bande vide. Masqué sur le plein écran
            vidéo, où toute barre casse l'immersion. */}
        {!pathname.startsWith('/fin') && <AnnouncementBanner />}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BuyerNav />
        <FinouChou />
        <LoginPrompt />
        <CartDrawer />
      </div>
    </div>
  );
}
