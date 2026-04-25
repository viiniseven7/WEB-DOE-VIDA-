import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Droplet, 
  Calendar as CalendarIcon, 
  Award, 
  Clock, 
  MapPin, 
  Heart,
  LogOut,
  User,
  Mail,
  Phone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DonorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar agendamentos reais da API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/agendamentos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Conforme DOC-API, retorna AGE ou CON
          setAppointments(data.data || data);
        }
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        toast.error("Não foi possível carregar seu histórico.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchAppointments();
  }, [user]);

  // Se não for doador, expulsa (segurança extra)
  if (!user || user.role !== 'donor') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Sessão encerrada');
  };

  // Separa o próximo agendamento do histórico
  const upcoming = appointments.find(a => a.status_agendamento === 'AGE');
  const history = appointments.filter(a => a.status_agendamento === 'CON');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header do Dashboard */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-red-600 cursor-pointer" onClick={() => navigate('/')}>
            <Droplet className="fill-current" /> DoaVida
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {upcoming && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">Doador {user.bloodType ? `• ${user.bloodType}` : ''}</p>
              </div>
              <Avatar className="w-10 h-10 border-2 border-red-100">
                <AvatarFallback className="bg-red-600 text-white uppercase">{user.name.substring(0,2)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Boas vindas e Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-red-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Heart className="w-48 h-48 -mr-10 -mb-10" />
            </div>
            <CardContent className="p-8 relative z-10">
              <h2 className="text-3xl font-bold mb-2">Olá, {user.name.split(' ')[0]}!</h2>
              <p className="text-red-100 text-lg mb-6">Sua última doação salvou até 4 vidas. Obrigado por ser um herói!</p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => navigate('/cadastro-doacao')} className="bg-white text-red-600 hover:bg-red-50 font-bold px-6">
                  <Droplet className="w-4 h-4 mr-2" /> Agendar Nova Doação
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <Award className="w-4 h-4 mr-2" /> Meus Certificados
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipo Sanguíneo</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-lg px-3">{user.bloodType || '?'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Doações</span>
                  <span className="font-bold text-xl">{user.donationCount || 0}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400 mb-1">Próxima doação disponível em:</p>
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Já disponível!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agendamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="bg-white border mb-4">
                <TabsTrigger value="proximos" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Próxima Doação</TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Histórico Completo</TabsTrigger>
              </TabsList>

              <TabsContent value="proximos">
                {isLoading ? (
                  <Card className="p-8 text-center animate-pulse"><p>Carregando agendamentos...</p></Card>
                ) : upcoming ? (
                  <Card className="border-l-4 border-l-red-600 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <CalendarIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">
                              {format(new Date(upcoming.data_hora_doacao), "dd 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <p className="text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(upcoming.data_hora_doacao), "HH:mm")}</p>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-red-600" /> {upcoming.hemocentro?.nome || 'Hemocentro Selecionado'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 md:flex-none">Reagendar</Button>
                          <Button variant="destructive" className="flex-1 md:flex-none">Cancelar</Button>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>Lembre-se de levar um documento original com foto e estar bem alimentado.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-12 text-center border-dashed border-2">
                    <p className="text-gray-500 mb-4">Você não possui agendamentos ativos.</p>
                    <Button onClick={() => navigate('/cadastro-doacao')} className="bg-red-600">Agendar agora</Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="historico">
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {history.length > 0 ? history.map((h) => (
                        <div key={h.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold">
                              {format(new Date(h.data_hora_doacao), "dd/MM")}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{h.hemocentro?.nome || 'Hemocentro'}</p>
                              <p className="text-xs text-gray-500 uppercase font-medium">{h.ml_coletados ? `${h.ml_coletados}ml` : 'Doação Concluída'}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-none">Concluída</Badge>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-500">Nenhuma doação realizada ainda.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="shadow-md border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Dicas Pré-Doação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">1</div>
                  <p className="text-sm">Beba bastante água nas 24h que antecedem a doação.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center text-orange-400">2</div>
                  <p className="text-sm">Evite alimentos gordurosos 3h antes de doar.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400">3</div>
                  <p className="text-sm">Durma pelo menos 6h na noite anterior.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Meu Perfil</CardTitle>
                <Button variant="ghost" size="icon" className="text-red-600"><Edit className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" /> {user.phone || 'Telefone não cadastrado'}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" /> CPF: ***.***.{user.cpf?.slice(-2) || '00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}