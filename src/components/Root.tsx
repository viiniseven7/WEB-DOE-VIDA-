import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from './ui/sonner';

export function Root() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
  if (isLoading) return;

  const path = location.pathname;

  // 🔐 bloquear dashboard sem login
  if (path.startsWith('/dashboard') && !isAuthenticated) {
    navigate('/login');
    return;
  }

  // 🔥 REDIRECIONAR SEMPRE APÓS LOGIN
  if (isAuthenticated && user) {
    const role = user.roles?.[0];

    if (!path.startsWith('/dashboard')) {
      if (role === 'doador') navigate('/dashboard/doador');
      else if (role === 'funcionario') navigate('/dashboard/funcionario');
      else if (role === 'diretor') navigate('/dashboard/diretor');
      else if (role === 'admin') navigate('/dashboard/admin');
    }
  }

}, [isAuthenticated, user, isLoading, location.pathname]);

  if (isLoading) return <p>Carregando...</p>;

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}