import { Outlet, Navigate } from 'react-router-dom';
import { VendorNav } from '../../components/VendorNav';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { Spinner } from '../../components/Spinner';

// Vendor space is only reachable by approved vendors (owns a shop).
// Same fixed app-shell as the buyer side (see BuyerLayout).
export function VendorLayout() {
  const { profile } = useAuth();
  const { loading, shop } = useVendorStatus();

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
      <div className="relative mx-auto flex h-[100dvh] max-w-app flex-col overflow-hidden bg-white">
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet context={{ shop }} />
        </main>
        <VendorNav />
        <LoginPrompt />
      </div>
    </div>
  );
}
