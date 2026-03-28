import { useNavigate } from 'react-router';
import { Button } from "./ui/button";
import { Droplet, Menu, X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    if (!user) return;
    
    const dashboardRoutes = {
      donor: '/dashboard/donor',
      staff: '/dashboard/staff',
      director: '/dashboard/director',
      admin: '/dashboard/admin',
    };
    
    navigate(dashboardRoutes[user.role]);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">DoaVida</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-red-600 transition-colors">
              Início
            </button>
            <button onClick={() => scrollToSection('locais')} className="text-gray-700 hover:text-red-600 transition-colors">
              Locais
            </button>
            <button onClick={() => { navigate('/teste-elegibilidade'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-red-600 transition-colors">
              Doar Sangue
            </button>
            <a href="#" className="text-gray-700 hover:text-red-600 transition-colors">
              FAQ
            </a>
            {isAuthenticated && user ? (
              <Button 
                onClick={handleDashboardClick}
                className="bg-red-600 hover:bg-red-700"
              >
                Meu Painel
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleLoginClick}
                  variant="outline"
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
                <Button 
                  onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                  className="bg-red-600 hover:bg-red-700 gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </Button>
              </>
            )}
          </nav>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <button onClick={() => { navigate('/'); setIsMenuOpen(false); }} className="text-left text-gray-700 hover:text-red-600 transition-colors">
                Início
              </button>
              <button onClick={() => scrollToSection('locais')} className="text-left text-gray-700 hover:text-red-600 transition-colors">
                Locais
              </button>
              <button onClick={() => { navigate('/teste-elegibilidade'); setIsMenuOpen(false); }} className="text-left text-gray-700 hover:text-red-600 transition-colors">
                Doar Sangue
              </button>
              <a href="#" className="text-gray-700 hover:text-red-600 transition-colors">
                FAQ
              </a>
              {isAuthenticated && user ? (
                <Button 
                  onClick={handleDashboardClick}
                  className="bg-red-600 hover:bg-red-700 w-full"
                >
                  Meu Painel
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleLoginClick}
                    variant="outline"
                    className="gap-2 w-full"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </Button>
                  <Button 
                    onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                    className="bg-red-600 hover:bg-red-700 gap-2 w-full"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}