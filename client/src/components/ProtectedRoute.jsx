import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Uso: <ProtectedRoute /> exige login; <ProtectedRoute perfis={['admin']} /> exige perfil.
export default function ProtectedRoute({ perfis }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(user.perfil)) return <Navigate to="/" replace />;
  return <Outlet />;
}
