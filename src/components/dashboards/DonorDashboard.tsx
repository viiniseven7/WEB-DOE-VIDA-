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
import { Droplet, Calendar as CalendarIcon, LogOut, User as UserIcon } from 'lucide-react';

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const bloodCenters = [
  { label: "Hemocentro Central", value: "1" },
  { label: "Unidade Móvel A", value: "2" },
];

export function DonorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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

  // ✅ navigate() dentro do useEffect
  useEffect(() => {
    if (!user || !user?.roles?.includes("doador")) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ✅ Retorna null enquanto redireciona, sem chamar navigate() no render
  if (!user || !user?.roles?.includes("doador")) {
    return null;
  }

  const loadData = async () => {
    try {
      const res = await api.get("/me/agendamentos");
      setAppointments(res.data);
      setHistory(res.data.filter((a: any) => a.status === "concluido"));
    } catch (error) {
      console.error("Erro ao carregar dados");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcomingAppointment = appointments.find((a: any) => a.status === "pendente");

  const daysUntilNextDonation = user?.lastDonation
    ? Math.ceil((new Date(user.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000 - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleReschedule = () => setRescheduleDialogOpen(true);
  const handleEditProfile = () => setEditProfileDialogOpen(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logout realizado');
  };

  const handleConfirmAppointment = async () => {
    if (!upcomingAppointment) return;
    try {
      await api.put(`/agendamentos/${upcomingAppointment.id}`, { status: "confirmado" });
      toast.success("Doação confirmada!");
      loadData();
    } catch {
      toast.error("Erro ao confirmar");
    }
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
      loadData();
    } catch {
      toast.error("Erro ao reagendar");
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
              <AvatarFallback className="bg-red-100 text-red-600">{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader><CardDescription>Total Doações</CardDescription><CardTitle>{user.donationCount || 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Tipo Sanguíneo</CardDescription><CardTitle>{user.tipo_sang || 'N/A'}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Vidas Salvas</CardDescription><CardTitle>{(user.donationCount || 0) * 4}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Dias para Doar</CardDescription><CardTitle>{daysUntilNextDonation < 0 ? 0 : daysUntilNextDonation}</CardTitle></CardHeader></Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            {upcomingAppointment ? (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-red-600" /> Próxima Doação
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {new Date(upcomingAppointment.data).toLocaleDateString()} às {upcomingAppointment.horario}
                    </p>
                    <p className="text-sm text-gray-600">{upcomingAppointment.hemocentro?.nome || "Hemocentro Local"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConfirmAppointment} className="bg-green-600">Confirmar</Button>
                    <Button onClick={handleReschedule} variant="outline">Reagendar</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 mb-4">Nenhum agendamento pendente.</p>
                  <Button
                    className="bg-red-600 w-full"
                    onClick={async () => {
                      if (!selectedDate) { toast.error("Escolha uma data"); return; }
                      try {
                        await api.post("/agendamentos", { data: selectedDate, horario: "09:00", hemocentro_id: 1 });
                        toast.success("Agendado!");
                        loadData();
                      } catch {
                        toast.error("Erro ao agendar");
                      }
                    }}
                  >
                    Nova Doação
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-gray-500">Nenhuma doação concluída ainda.</p>
                ) : (
                  history.map((donation: any) => (
                    <div key={donation.id} className="p-4 border-b flex justify-between">
                      <span>{new Date(donation.data).toLocaleDateString()}</span>
                      <Badge variant="outline">{donation.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>CPF</Label><p className="font-medium">{user.cpf}</p></div>
                  <div><Label>Telefone</Label><p className="font-medium">{user.telefone}</p></div>
                  <div><Label>Tipo Sanguíneo</Label><p className="font-medium">{user.tipo_sang}</p></div>
                  <div><Label>Endereço</Label><p className="font-medium">{user.rua}, {user.numero}</p></div>
                </div>
                <Button onClick={handleEditProfile} variant="outline" className="gap-2">
                  <UserIcon className="h-4 w-4" /> Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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