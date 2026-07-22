import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './Spinner';

// Route guard for buyer pages that need a session (checkout, profile, inbox…).
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  return children;
}
