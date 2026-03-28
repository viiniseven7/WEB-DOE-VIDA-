import { Header } from "./Header";
import { Hero } from "./Hero";
import { HowToDonate } from "./HowToDonate";
import { DonationLocations } from "./DonationLocations";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { Droplet, ClipboardCheck, Calendar } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        
        {/* Seção Call-to-Action para Doação */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl text-gray-900 mb-4">Pronto para Doar Sangue?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Siga nosso processo simples e rápido para realizar sua doação de sangue
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-8 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Teste de Elegibilidade</h3>
                <p className="text-gray-600 mb-4">
                  Responda perguntas rápidas para verificar se você pode doar hoje
                </p>
              </div>

              <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Cadastro e Agendamento</h3>
                <p className="text-gray-600 mb-4">
                  Preencha seus dados e escolha local, data e horário
                </p>
              </div>

              <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Doe e Salve Vidas</h3>
                <p className="text-gray-600 mb-4">
                  Compareça no dia agendado e ajude a salvar até 4 vidas
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => navigate('/teste-elegibilidade')}
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-lg px-12 py-6"
              >
                Iniciar Teste de Elegibilidade
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Leva apenas 2-3 minutos para completar
              </p>
            </div>
          </div>
        </section>

        <HowToDonate />
        <DonationLocations />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}