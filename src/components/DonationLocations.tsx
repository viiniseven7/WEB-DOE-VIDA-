import { MapPin, Clock, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";

export function DonationLocations() {
  const navigate = useNavigate();

  const locations = [
    {
      id: 1,
      name: "Hemocentro Central",
      address: "Av. Paulista, 1500 - Bela Vista, São Paulo - SP",
      phone: "(11) 3456-7890",
      hours: "Seg a Sáb: 7h às 18h | Dom: 8h às 12h",
      distance: "2.5 km"
    },
    {
      id: 2,
      name: "Banco de Sangue Norte",
      address: "Rua das Flores, 234 - Santana, São Paulo - SP",
      phone: "(11) 3456-7891",
      hours: "Seg a Sex: 7h às 17h | Sáb: 8h às 12h",
      distance: "5.8 km"
    },
    {
      id: 3,
      name: "Centro de Doação Sul",
      address: "Av. Santo Amaro, 890 - Brooklin, São Paulo - SP",
      phone: "(11) 3456-7892",
      hours: "Seg a Sex: 8h às 18h | Sáb: 8h às 14h",
      distance: "7.2 km"
    },
    {
      id: 4,
      name: "Hemocentro Leste",
      address: "Rua Vergueiro, 567 - Ipiranga, São Paulo - SP",
      phone: "(11) 3456-7893",
      hours: "Seg a Sex: 7h às 16h",
      distance: "9.1 km"
    }
  ];

  return (
    <div id="locais" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl text-gray-900 mb-4">Locais de Doação</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre o posto de coleta mais próximo de você
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{location.name}</CardTitle>
                    <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      {location.distance}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{location.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>{location.hours}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>{location.phone}</span>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => navigate('/teste-elegibilidade')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Agendar Aqui
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Ver no Mapa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758691463333-c79215e8bc3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwY2xpbmljJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxOTgyMjcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Interior de clínica médica"
                className="w-full h-[600px] object-cover"
              />
            </div>
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-xl text-gray-900 mb-4">Não encontrou um posto próximo?</h3>
                <p className="text-gray-600 mb-4">
                  Entre em contato conosco e descobra outras opções de doação na sua região.
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Falar com Atendimento
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}