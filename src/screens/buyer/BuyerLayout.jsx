import { Outlet } from 'react-router-dom';
import { BuyerNav } from '../../components/BuyerNav';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';

// Fixed app-shell (TikTok-style): header + bottom nav stay put, only <main>
// scrolls. 100dvh keeps the shell stable when the mobile URL bar / keyboard
// appears. On desktop the shell is a centered 480px white column on light grey.
export function BuyerLayout() {
  const { profile } = useAuth();
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="md:bg-[#F5F5F5]">
      <div className="relative mx-auto flex h-[100dvh] max-w-app flex-col overflow-hidden bg-white">
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
