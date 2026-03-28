import { Droplet, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-white">DoaVida</span>
            </div>
            <p className="text-sm">
              Conectando doadores a quem precisa. Juntos salvamos vidas através da doação de sangue.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">Como Doar</a></li>
              <li><a href="#locais" className="hover:text-red-500 transition-colors">Locais de Doação</a></li>
              <li><a href="#agendamento" className="hover:text-red-500 transition-colors">Agendar Doação</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Verificar Elegibilidade</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Campanhas</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Histórias de Sucesso</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Para Hospitais</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Seja Voluntário</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>(11) 3456-7890</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>contato@doavida.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Av. Paulista, 1500<br />São Paulo - SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          <p>&copy; 2025 DoaVida. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-red-500 transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-red-500 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-red-500 transition-colors">Acessibilidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
