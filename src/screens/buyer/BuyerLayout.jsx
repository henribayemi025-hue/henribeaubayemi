import { Outlet } from 'react-router-dom';
import { BuyerNav } from '../../components/BuyerNav';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';
import { useViewportHeight } from '../../hooks/useViewportHeight';

// Fixed app-shell (TikTok-style): header + bottom nav stay put, only <main>
// scrolls. The height tracks the visible viewport (--app-height) so the
// keyboard can't push the shell around. Desktop = centered 480px white column.
export function BuyerLayout() {
  const { profile } = useAuth();
  useViewportHeight();
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="md:bg-[#F5F5F5]">
      <div
        className="relative mx-auto flex max-w-app flex-col overflow-hidden bg-white"
        style={{ height: 'var(--app-height, 100dvh)' }}
      >
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>
        <BuyerNav />
        <FinouChou />
        <LoginPrompt />
      </div>
    </div>
  );
}
