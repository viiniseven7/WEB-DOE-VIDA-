import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from './ui/sonner';
import { Droplet } from 'lucide-react';

export function Root() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    const isLoginRoute = location.pathname === '/login';
    const isForgotPasswordRoute = location.pathname === '/forgot-password';
    const isResetPasswordRoute = location.pathname === '/reset-password';
    const isEligibilityTestRoute = location.pathname === '/teste-elegibilidade';
    const isCadastroRoute = location.pathname === '/cadastro-doacao';

    // If not authenticated and trying to access dashboard, redirect to login
    if (isDashboardRoute && !isAuthenticated) {
      navigate('/login');
    }

    // If user is authenticated and on login page, redirect to appropriate dashboard
    if (isAuthenticated && user && isLoginRoute) {
      const dashboardRoutes = {
        donor: '/dashboard/donor',
        staff: '/dashboard/staff',
        director: '/dashboard/director',
        admin: '/dashboard/admin',
      };
      navigate(dashboardRoutes[user.role]);
    }
  }, [location, isAuthenticated, user, navigate]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 animate-pulse">
            <Droplet className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}