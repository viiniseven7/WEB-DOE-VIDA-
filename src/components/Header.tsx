import { Button } from "./ui/button";
import { Droplet, Menu, X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
    }
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    if (!user?.roles?.length) {
      navigate('/');
      return;
    }

    const dashboardRoutes: Record<string, string> = {
      doador: '/dashboard/doador',
      funcionario: '/dashboard/funcionario',
      diretor: '/dashboard/diretor',
      admin: '/dashboard/admin',
    };

    const role = user.roles[0]?.toLowerCase().trim();
    const targetRoute = dashboardRoutes[role] || '/';

    console.log("ROLE:", role);
    console.log("ROUTE:", targetRoute);

    navigate(targetRoute);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DoaVida</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              Início
            </button>
            <button onClick={() => scrollToSection('locais')} className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              Locais
            </button>
            <button onClick={() => { navigate('/teste-elegibilidade'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              Doar Sangue
            </button>
            <a href="#" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              FAQ
            </a>
            
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4 border-l pl-8 ml-2">
                <Button 
                  onClick={handleDashboardClick}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Meu Painel
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 gap-2"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-l pl-8 ml-2">
                <Button 
                  onClick={handleLoginClick}
                  variant="ghost"
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
                <Button onClick={() => navigate('/cadastro-doacao')} className="bg-red-600 hover:bg-red-700 gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <nav className="flex flex-col gap-2">
              <button onClick={() => { navigate('/'); setIsMenuOpen(false); }} className="px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                Início
              </button>
              <button onClick={() => scrollToSection('locais')} className="px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                Locais
              </button>
              <button onClick={() => { navigate('/teste-elegibilidade'); setIsMenuOpen(false); }} className="px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                Doar Sangue
              </button>
              <a href="#" className="px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                FAQ
              </a>
              
              <div className="mt-4 pt-4 border-t border-gray-100 px-4 flex flex-col gap-3">
                {isAuthenticated && user ? (
                  <>
                    <Button 
                      onClick={handleDashboardClick}
                      className="bg-red-600 hover:bg-red-700 w-full"
                    >
                      Meu Painel
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      className="w-full gap-2"
                    >
                      <LogIn className="w-4 h-4 rotate-180" />
                      Sair
                    </Button>
                  </>
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
                      onClick={() => { navigate('/cadastro-doacao'); setIsMenuOpen(false); }}
                      className="bg-red-600 hover:bg-red-700 gap-2 w-full"
                    >
                      <UserPlus className="w-4 h-4" />
                      Cadastrar
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}