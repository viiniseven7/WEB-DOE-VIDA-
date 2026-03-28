import { Button } from "./ui/button";
import { Droplet } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";

export function Hero() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative bg-gradient-to-br from-red-50 to-red-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full">
              <Droplet className="w-4 h-4" />
              <span>Salve Vidas Hoje</span>
            </div>
            <h1 className="text-5xl lg:text-6xl text-gray-900">
              Uma Doação,<br />Muitas Vidas Salvas
            </h1>
            <p className="text-xl text-gray-700">
              Doe sangue e seja um herói para quem precisa. Cada doação pode salvar até 4 vidas. 
              Encontre o posto mais próximo e agende sua doação agora mesmo.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/teste-elegibilidade')}
                size="lg" 
                className="bg-red-600 hover:bg-red-700"
              >
                Quero Doar Sangue
              </Button>
              <Button 
                onClick={() => scrollToSection('locais')}
                size="lg" 
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Encontrar Posto
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-red-200">
              <div>
                <div className="text-3xl text-red-600">1M+</div>
                <div className="text-sm text-gray-600">Doadores Ativos</div>
              </div>
              <div>
                <div className="text-3xl text-red-600">4M+</div>
                <div className="text-sm text-gray-600">Vidas Salvas</div>
              </div>
              <div>
                <div className="text-3xl text-red-600">150+</div>
                <div className="text-sm text-gray-600">Postos de Coleta</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1697192156499-d85cfe1452c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9vZCUyMGRvbmF0aW9uJTIwbWVkaWNhbHxlbnwxfHx8fDE3NjE5NjQ3NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Doação de sangue"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900">2.500+</div>
                  <div className="text-sm text-gray-600">Doações este mês</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}