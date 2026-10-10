
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/** Gate routes by auth/role. Usage: <Route element={<ProtectedRoute admin />}> … */
export default function ProtectedRoute({ admin = false }) {
  const { user, booting } = useAuth();
  const loc = useLocation();
  if (booting) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
