import { Outlet, Navigate } from 'react-router-dom';
import { VendorNav } from '../../components/VendorNav';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { Spinner } from '../../components/Spinner';
import { useViewportHeight } from '../../hooks/useViewportHeight';

// Vendor space is only reachable by approved vendors (owns a shop).
// Same fixed, keyboard-aware app-shell as the buyer side (see BuyerLayout).
export function VendorLayout() {
  const { profile } = useAuth();
  const { loading, shop } = useVendorStatus();
  useViewportHeight();

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
    <div className="md:bg-[#F5F5F5]">
      <div
        className="fixed inset-0 mx-auto flex w-full max-w-app flex-col overflow-hidden bg-white"
        style={{ paddingBottom: 'var(--kb, 0px)' }}
      >
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet context={{ shop }} />
        </main>
        <VendorNav />
        <LoginPrompt />
      </div>
    </div>
  );
}
