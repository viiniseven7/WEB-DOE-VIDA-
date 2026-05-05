import { Calendar, FileCheck, Droplet, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function HowToDonate() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Calendar,
      title: "1. Agende sua Doação",
      description: "Escolha o posto mais próximo e selecione o melhor horário para você."
    },
    {
      icon: FileCheck,
      title: "2. Verifique Elegibilidade",
      description: "Confira se você atende aos requisitos básicos para doação de sangue."
    },
    {
      icon: Droplet,
      title: "3. Doe Sangue",
      description: "Compareça ao posto com documento de identidade. O processo leva cerca de 40 minutos."
    },
    {
      icon: Heart,
      title: "4. Salve Vidas",
      description: "Sua doação pode salvar até 4 vidas. Você pode doar novamente após 60 dias (homens) ou 90 dias (mulheres)."
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl text-gray-900 mb-4">Como Doar Sangue</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            O processo de doação é simples, rápido e seguro. Veja como funciona:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-red-200" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-red-50 rounded-2xl p-8">
          <h3 className="text-2xl text-gray-900 mb-4">Requisitos Básicos</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Ter entre 16 e 69 anos (menores de 18 com autorização)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Pesar no mínimo 50kg</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Estar bem de saúde</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Estar descansado (mínimo 6h de sono)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Estar alimentado (evitar alimentos gordurosos)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <p className="text-gray-700">Apresentar documento de identidade com foto</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Button 
              onClick={() => navigate('/teste-elegibilidade')}
              className="bg-red-600 hover:bg-red-700"
              size="lg"
            >
              Verificar se Posso Doar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}