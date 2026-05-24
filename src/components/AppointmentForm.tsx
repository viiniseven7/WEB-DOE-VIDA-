import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import api from "../services/api";

export function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hemocentros, setHemocentros] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    hemocentro_id: "",
    time: "08:00"
  });

  useEffect(() => {
    const fetchHemocentros = async () => {
      try {
        const response = await api.get('/hemocentros');
        const data = response.data;
        setHemocentros(data.data || data);
      } catch (err) {
        console.error("Erro ao carregar hemocentros:", err);
      }
    };
    fetchHemocentros();
  }, []);

  // Fonte da Verdade: Verifica restrição via campo do Back-end de forma segura
  const checkEligibility = () => {
    if (!user || !user.tempo_restricao) return { eligible: true };

    try {
      const restrictionDate = parseISO(user.tempo_restricao);
      const today = new Date();

      if (isAfter(restrictionDate, today)) {
        return {
          eligible: false,
          nextDate: restrictionDate
        };
      }
    } catch (e) {
      return { eligible: true };
    }

    return { eligible: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado para agendar.");
      navigate('/login');
      return;
    }

    if (!date || !formData.hemocentro_id) {
      toast.error("Selecione o local e a data.");
      return;
    }

    const eligibility = checkEligibility();
    if (!eligibility.eligible) {
      toast.error(`Período de carência ativo.`);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        hemocentro_id: Number(formData.hemocentro_id),
        data_hora_doacao: `${format(date, 'yyyy-MM-dd')} ${formData.time}:00`
      };

      await api.post('/auth/agendamentos', payload);
      setIsSubmitted(true);
      toast.success("Agendamento realizado!");
    } catch (error: any) {
      if (error.response?.status === 403 && (error.response?.data?.code === 'REQUIRES_ELIGIBILITY' || error.response?.data?.error === 'REQUIRES_ELIGIBILITY' || error.response?.data?.message?.includes('elegibilidade'))) {
        toast.error("Você precisa realizar o teste de elegibilidade antes de agendar.");
        navigate('/teste-elegibilidade');
        return;
      }
      toast.error(error.response?.data?.message || "Falha no agendamento.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50 max-w-2xl mx-auto">
        <CardContent className="p-12 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
          <h3 className="text-2xl font-bold">Agendamento Realizado!</h3>
          <Button onClick={() => navigate('/dashboard/donor')} className="bg-green-600">Ver no Painel</Button>
        </CardContent>
      </Card>
    );
  }

  const eligibility = checkEligibility();

  return (
    <div id="agendamento" className="scroll-mt-20">
      {!eligibility.eligible && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-bold">Carência Ativa</p>
            <p className="text-sm">Próxima doação disponível em: {format(eligibility.nextDate!, 'dd/MM/yyyy')}</p>
          </div>
        </div>
      )}

      <Card className={`max-w-2xl mx-auto ${!eligibility.eligible ? "opacity-60 pointer-events-none" : "shadow-lg"}`}>
        <CardHeader>
          <CardTitle>Agende sua Doação</CardTitle>
          <CardDescription>Escolha o hemocentro e horário.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Local</Label>
              <Select value={formData.hemocentro_id} onValueChange={(v) => setFormData({...formData, hemocentro_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o Hemocentro" /></SelectTrigger>
                <SelectContent>
                  {hemocentros.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Escolha a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={formData.time} onValueChange={(v) => setFormData({...formData, time: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["08:00", "09:00", "10:00", "11:00", "14:00", "15:00"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !eligibility.eligible} className="w-full bg-red-600 hover:bg-red-700">
              {isLoading ? "Processando..." : "Confirmar Agendamento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
