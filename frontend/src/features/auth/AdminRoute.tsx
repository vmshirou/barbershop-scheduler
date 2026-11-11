import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

export function AdminRoute() {
  const { user } = useAuth();
  if (user?.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}