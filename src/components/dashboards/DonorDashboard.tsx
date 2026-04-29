import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Droplet, 
  Calendar as CalendarIcon, 
  LogOut, 
  User as UserIcon,
  Heart,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Edit,
  Mail,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const bloodCenters = [
  { label: "Hemocentro Central", value: "1" },
  { label: "Unidade Móvel A", value: "2" },
];

export function DonorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLocation, setRescheduleLocation] = useState('');

  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    numero: user?.numero || ''
  });

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [dashboardRes, agendamentosRes] = await Promise.all([
          api.get("/me/dashboard"),
          api.get("/me/agendamentos")
        ]);

        setDashboard(dashboardRes.data);
        setAppointments(agendamentosRes.data);
        setHistory(
          agendamentosRes.data.filter((a: any) => a.status === "concluido")
        );

      } catch (error: any) {
        console.error(error);

        if (error.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  const upcomingAppointment = appointments.find((a: any) => a.status === "pendente" || a.status === "confirmado");

  const daysUntilNextDonation = user?.lastDonation
    ? Math.ceil((new Date(user.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000 - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleReschedule = () => setRescheduleDialogOpen(true);
  const handleEditProfile = () => setEditProfileDialogOpen(true);



  const handleConfirmAppointment = async () => {
    if (!upcomingAppointment) return;
    try {
      await api.put(`/agendamentos/${upcomingAppointment.id}`, { status: "confirmado" });
      toast.success("Doação confirmada!");
      // Atualizar a lista
      const res = await api.get("/me/agendamentos");
      setAppointments(res.data);
    } catch {
      toast.error("Erro ao confirmar");
    }
  };
const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
};
  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleLocation) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await api.put(`/agendamentos/${upcomingAppointment.id}`, {
        data: rescheduleDate,
        horario: rescheduleTime,
        hemocentro_id: rescheduleLocation
      });
      toast.success("Reagendado!");
      setRescheduleDialogOpen(false);
      // Atualizar a lista
      const res = await api.get("/me/agendamentos");
      setAppointments(res.data);
    } catch {
      toast.error("Erro ao reagendar");
    }
  };

  const handleCertificates = () => {
    toast.info("Funcionalidade de certificados em breve!");
  };

  const handleCancelAppointment = async () => {
    if (!upcomingAppointment) return;
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    
    try {
      await api.delete(`/agendamentos/${upcomingAppointment.id}`);
      toast.success("Agendamento cancelado!");
      const res = await api.get("/me/agendamentos");
      setAppointments(res.data);
    } catch {
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const handleEditProfileConfirm = async () => {
    try {
      const cleanData = {
        ...profileData,
        telefone: profileData.telefone.replace(/\D/g, "")
      };
      await api.put(`/users/${user.id}`, cleanData);
      toast.success("Perfil atualizado!");
      setEditProfileDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + JSON.stringify(error.response?.data));
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg"><Droplet className="h-6 w-6 text-white" /></div>
            <h1 className="text-xl font-bold">DoaVida</h1>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-red-100 text-red-600">{user?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
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
              <h2 className="text-3xl font-bold mb-2">Olá, {user.name?.split(' ')[0]}!</h2>
              <p className="text-red-100 text-lg mb-6">Sua última doação salvou até 4 vidas. Obrigado por ser um herói!</p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => navigate('/cadastro-doacao')} className="bg-white text-red-600 hover:bg-red-50 font-bold px-6">
                  <Droplet className="w-4 h-4 mr-2" /> Agendar Nova Doação
                </Button>
                <Button variant="outline" onClick={handleCertificates} className="border-white text-white hover:bg-white/10">
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
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-lg px-3">{user.bloodType || user.tipo_sang || '?'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Doações</span>
                  <span className="font-bold text-xl">{user.donationCount || 0}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400 mb-1">Próxima doação disponível em:</p>
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {daysUntilNextDonation <= 0 ? 'Já disponível!' : `${daysUntilNextDonation} dias`}
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
                ) : upcomingAppointment ? (
                  <Card className="border-l-4 border-l-red-600 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <CalendarIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">
                              {format(new Date(upcomingAppointment.data || upcomingAppointment.data_hora_doacao), "dd 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <p className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {upcomingAppointment.horario || format(new Date(upcomingAppointment.data_hora_doacao), "HH:mm")}
                            </p>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-red-600" /> {upcomingAppointment.hemocentro?.nome || 'Hemocentro Selecionado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleReschedule} className="flex-1 md:flex-none">Reagendar</Button>
                          <Button variant="destructive" onClick={handleCancelAppointment} className="flex-1 md:flex-none">Cancelar</Button>
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
                              {format(new Date(h.data || h.data_hora_doacao), "dd/MM")}
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
                <Button variant="ghost" size="icon" onClick={handleEditProfile} className="text-red-600"><Edit className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" /> {user.phone || user.telefone || 'Telefone não cadastrado'}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" /> CPF: ***.***.{user.cpf?.slice(-2) || '00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Doação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data</Label>
              <Input
                type="date"
                onChange={e => setRescheduleDate(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={rescheduleTime}
                onChange={e => setRescheduleTime(e.target.value)}
              >
                <option value="">Selecione</option>
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Hemocentro</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={rescheduleLocation}
                onChange={e => setRescheduleLocation(e.target.value)}
              >
                <option value="">Selecione</option>
                {bloodCenters.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRescheduleConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={profileData.telefone} onChange={e => setProfileData({ ...profileData, telefone: e.target.value })} /></div>
            <div><Label>Número</Label><Input value={profileData.numero} onChange={e => setProfileData({ ...profileData, numero: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditProfileConfirm}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
