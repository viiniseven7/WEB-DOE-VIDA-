import { MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useState } from "react";

export function DonationLocations() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const locations = [
    {
      id: 1,
      name: "Hemepar - Centro de Hematologia e Hemoterapia do Paraná",
      address: "Tv. João Prosdócimo, 145 - Alto da Glória, Curitiba - PR",
      hours: "Seg a Sex: 7h30 às 18h | Sáb: 8h às 12h",
      distance: "2.1 km",
      lat: -25.4195,
      lng: -49.2646,
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3603.3!2d-49.2646!3d-25.4195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dce442e10b1c89%3A0x8c5e3b3c7c5e3b3c!2sTv.%20Jo%C3%A3o%20Prosd%C3%B3cimo%2C%20145%20-%20Alto%20da%20Gl%C3%B3ria%2C%20Curitiba%20-%20PR!5e0!3m2!1spt-BR!2sbr!4v1234567890123"
    },
    {
      id: 2,
      name: "Hospital Erasto Gaertner - Banco de Sangue",
      address: "R. Dr. Ovande do Amaral, 201 - Jardim das Américas, Curitiba - PR",
      hours: "Seg a Sex: 7h às 17h | Sáb: 7h às 12h",
      distance: "4.3 km",
      lat: -25.4521,
      lng: -49.2893,
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3603.8!2d-49.2893!3d-25.4521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dce3e6c7c5e3b3%3A0x8c5e3b3c7c5e3b3c!2sR.%20Dr.%20Ovande%20do%20Amaral%2C%20201%20-%20Jardim%20das%20Am%C3%A9ricas%2C%20Curitiba%20-%20PR!5e0!3m2!1spt-BR!2sbr!4v1234567890124"
    },
    {
      id: 3,
      name: "Hospital de Clínicas - UFPR",
      address: "R. Gen. Carneiro, 181 - Alto da Glória, Curitiba - PR",
      hours: "Seg a Sex: 7h às 18h",
      distance: "2.8 km",
      lat: -25.4284,
      lng: -49.2641,
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3603.5!2d-49.2641!3d-25.4284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dce442e10b1c89%3A0x8c5e3b3c7c5e3b3c!2sR.%20Gen.%20Carneiro%2C%20181%20-%20Alto%20da%20Gl%C3%B3ria%2C%20Curitiba%20-%20PR!5e0!3m2!1spt-BR!2sbr!4v1234567890125"
    },
    {
      id: 4,
      name: "Hospital do Trabalhador - Banco de Sangue",
      address: "Av. República Argentina, 4406 - Novo Mundo, Curitiba - PR",
      hours: "Seg a Sex: 8h às 17h",
      distance: "6.5 km",
      lat: -25.3892,
      lng: -49.2156,
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.9!2d-49.2156!3d-25.3892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dce4c5e3b3c7c5%3A0x8c5e3b3c7c5e3b3c!2sAv.%20Rep%C3%BAblica%20Argentina%2C%204406%20-%20Novo%20Mundo%2C%20Curitiba%20-%20PR!5e0!3m2!1spt-BR!2sbr!4v1234567890126"
    }
  ];

  const handleViewMap = (locationId: number) => {
    setSelectedLocation(locationId);
  };

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
              <Card key={location.id} className={selectedLocation === location.id ? "ring-2 ring-red-500" : ""}>
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
                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => navigate('/teste-elegibilidade')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Agendar Aqui
                    </Button>
                    <Button 
                      variant={selectedLocation === location.id ? "default" : "outline"}
                      className={selectedLocation === location.id ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"}
                      onClick={() => handleViewMap(location.id)}
                    >
                      Ver no Mapa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            {selectedLocation ? (
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
                <div className="bg-red-600 text-white p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {locations.find(loc => loc.id === selectedLocation)?.name}
                  </h3>
                  <p className="text-sm text-red-50 mt-1">
                    {locations.find(loc => loc.id === selectedLocation)?.address}
                  </p>
                </div>
                <iframe
                  src={locations.find(loc => loc.id === selectedLocation)?.mapUrl}
                  width="100%"
                  height="500"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa - ${locations.find(loc => loc.id === selectedLocation)?.name}`}
                />
                <div className="p-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedLocation(null)}
                  >
                    Fechar Mapa
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl text-gray-900 mb-4">Visualize no Mapa</h3>
                  <p className="text-gray-600 mb-6">
                    Clique em <strong>"Ver no Mapa"</strong> em qualquer local para visualizar a localização exata e obter direções.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-gray-700">
                      💡 <strong>Dica:</strong> Use o mapa para encontrar o caminho mais fácil até o hemocentro
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}