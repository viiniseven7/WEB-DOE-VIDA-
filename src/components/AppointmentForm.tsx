import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "../services/api";



export function AppointmentForm() {
  const [date, setDate] = useState<Date>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefone: "",
    tipo_sang: "",
    hemocentro_id: "",
    time: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log("CLIQUEI NO BOTÃO 🔥"); // 👈 adiciona isso

  try {
      if (!date) {
        console.error("Selecione uma data");
        return;
      }

      const response = await api.post("/users", {
        name: formData.name,
        email: formData.email,
        telefone: formData.telefone,
        tipo_sang: formData.tipo_sang,
        data: format(date, "yyyy-MM-dd"),
        horario: formData.time,
        hemocentro_id: Number(formData.hemocentro_id),
      });

      console.log(response.data);
      setIsSubmitted(true);

    } catch (error: any) {
      console.error(error.response?.data || error);
    }
  };

  if (isSubmitted) {
    return (
      <div id="agendamento" className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl text-gray-900">Agendamento Confirmado!</h3>
              <p className="text-xl text-gray-600">
                Enviamos uma confirmação para seu e-mail com todos os detalhes da sua doação.
              </p>
              <p className="text-gray-600">
                Lembre-se de levar um documento de identidade com foto no dia da doação.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div id="agendamento" className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-4">Agende sua Doação</h2>
          <p className="text-xl text-gray-600">
            Preencha o formulário abaixo para agendar sua doação de sangue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Doador</CardTitle>
            <CardDescription>
              Todos os campos são obrigatórios
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo Sanguíneo</Label>
                  <Select
                    value={formData.tipo_sang}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_sang: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      {/* mantém os outros */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Local de Doação</Label>
                  <Select
                    value={formData.hemocentro_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, hemocentro_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Hemepar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data da Doação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Horário Preferencial</Label>
                  <Select
                    value={formData.time}
                    onValueChange={(value) =>
                      setFormData({ ...formData, time: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">08:00</SelectItem>
                      <SelectItem value="09:00">09:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Confirmar Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}