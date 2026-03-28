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
    // Wait for auth to load before redirecting
    if (isLoading) return;

    // Redirect logic based on authentication and role
    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    const isLoginRoute = location.pathname === '/login';
    const isSignupRoute = location.pathname === '/signup';
    const isForgotPasswordRoute = location.pathname === '/forgot-password';
    const isResetPasswordRoute = location.pathname === '/reset-password';
    const isHomePage = location.pathname === '/';

    // Allow access to forgot password and reset password pages without authentication
    if (isForgotPasswordRoute || isResetPasswordRoute) {
      return;
    }

    // If user is authenticated and on login/signup page, redirect to appropriate dashboard
    if (isAuthenticated && user && (isLoginRoute || isSignupRoute)) {
      const dashboardRoutes = {
        donor: '/dashboard/donor',
        staff: '/dashboard/staff',
        director: '/dashboard/director',
        admin: '/dashboard/admin',
      };
      navigate(dashboardRoutes[user.role], { replace: true });
      return;
    }

    // If user just logged in from home page, redirect to dashboard
    if (isAuthenticated && user && isHomePage && sessionStorage.getItem('justLoggedIn')) {
      sessionStorage.removeItem('justLoggedIn');
      const dashboardRoutes = {
        donor: '/dashboard/donor',
        staff: '/dashboard/staff',
        director: '/dashboard/director',
        admin: '/dashboard/admin',
      };
      navigate(dashboardRoutes[user.role], { replace: true });
      return;
    }

    // If user is trying to access a dashboard without being authenticated
    if (!isAuthenticated && isDashboardRoute) {
      navigate('/login', { replace: true });
      return;
    }

    // If user is authenticated but trying to access wrong dashboard
    if (isAuthenticated && user && isDashboardRoute) {
      const correctDashboard = `/dashboard/${user.role}`;
      if (location.pathname !== correctDashboard) {
        navigate(correctDashboard, { replace: true });
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate, isLoading]);

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