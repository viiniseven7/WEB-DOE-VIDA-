import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2 mb-8">A página que você está procurando não existe.</p>
        <Button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700">
          <Home className="mr-2 h-4 w-4" />
          Voltar para Home
        </Button>
      </div>
    </div>
  );
}
