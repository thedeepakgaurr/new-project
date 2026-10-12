import { useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from './Brand.jsx';

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <LogoMark className="size-10 animate-pulse" />
    </div>
  );
}

// Signed-in only; remembers where the user was headed so login can return there
export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

// Login/register: users already signed in on arrival go straight to the app.
// Decided once, so signing in on this page doesn't race the page's own redirect.
export function GuestRoute({ children }) {
  const { token, loading } = useAuth();
  const signedInOnArrival = useRef(null);
  if (loading) return <FullPageLoader />;
  if (signedInOnArrival.current === null) signedInOnArrival.current = !!token;
  if (signedInOnArrival.current) return <Navigate to="/dashboard" replace />;
  return children;
}
