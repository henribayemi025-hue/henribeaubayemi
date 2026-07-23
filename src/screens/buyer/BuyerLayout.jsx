import { Outlet, useLocation } from 'react-router-dom';
import { BuyerNav } from '../../components/BuyerNav';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import CartDrawer from '../../components/CartDrawer';
import { useAuth } from '../../hooks/useAuth';
import { useViewportHeight } from '../../hooks/useViewportHeight';

// Fixed app-shell (TikTok-style): header + bottom nav stay put, only <main>
// scrolls. The height tracks the visible viewport (--app-height) so the
// keyboard can't push the shell around. Desktop = centered 480px white column.
export function BuyerLayout() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  useViewportHeight();
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="md:bg-[#F5F5F5]">
      <div
        className="fixed inset-0 mx-auto flex w-full max-w-app flex-col overflow-hidden bg-white"
        style={{ paddingBottom: 'var(--kb, 0px)' }}
      >
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
