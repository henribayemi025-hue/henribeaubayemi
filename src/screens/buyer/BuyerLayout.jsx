import { Outlet } from 'react-router-dom';
import { BuyerNav } from '../../components/BuyerNav';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import { useAuth } from '../../hooks/useAuth';

export function BuyerLayout() {
  const { profile } = useAuth();
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="mx-auto min-h-screen max-w-app bg-white pb-16">
      <Outlet />
      <BuyerNav />
      <FinouChou />
      <LoginPrompt />
    </div>
  );
}
