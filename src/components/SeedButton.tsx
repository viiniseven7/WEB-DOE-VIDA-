import { useState } from 'react';
import { Button } from './ui/button';
import { Database } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f9f63502`;

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao criar usuários de teste');
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeed}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Database className="w-4 h-4" />
      {isLoading ? 'Criando...' : 'Criar Usuários de Teste'}
    </Button>
  );
}
