import { Outlet, Navigate } from 'react-router-dom';
import { VendorNav } from '../../components/VendorNav';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { Spinner } from '../../components/Spinner';

// Vendor space is only reachable by approved vendors (owns a shop).
export function VendorLayout() {
  const { profile } = useAuth();
  const { loading, shop } = useVendorStatus();

  if (profile?.is_suspended) return <SuspendedNotice />;
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!shop) return <Navigate to="/profile" replace />;

  return (
    <div className="mx-auto min-h-screen max-w-app bg-white pb-16">
      <Outlet context={{ shop }} />
      <VendorNav />
      <LoginPrompt />
    </div>
  );
}
