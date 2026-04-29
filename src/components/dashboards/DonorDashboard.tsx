import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Droplet, Calendar as CalendarIcon, LogOut, User as UserIcon,
  Heart, Award, CheckCircle2, Clock, MapPin, AlertCircle, Edit, Mail, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

export function DonorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [hemocentros, setHemocentros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLocation, setRescheduleLocation] = useState('');

  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '', email: '', telefone: '', numero: ''
  });

  // ── Busca agendamentos ──────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/agendamentos');
      const data = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      setAppointments(data);
    } catch (err: any) {
      console.error('Erro ao buscar agendamentos:', err.response?.data);
    }
  }, []);

  // ── Sincroniza profileData com user do context ──────────────────────────────
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        telefone: user.telefone || '',
        numero: user.numero || '',
      });
    }
  }, [user]);

  // ── Fetch inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [agendamentosRes, hemocentrosRes] = await Promise.all([
          api.get('/agendamentos'),
          api.get('/hemocentros'),
        ]);
        setAppointments(
          Array.isArray(agendamentosRes.data)
            ? agendamentosRes.data
            : agendamentosRes.data.data ?? []
        );
        setHemocentros(
          Array.isArray(hemocentrosRes.data)
            ? hemocentrosRes.data
            : hemocentrosRes.data.data ?? []
        );
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err.response?.data);
        toast.error('Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []); // sem navigate no array — evita loop

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login'); };

  // Agendamento ativo = status AGE ou CON (ou pendente/confirmado se a API usar strings)
  const upcomingAppointment = appointments.find(
    (a: any) => ['AGE', 'CON', 'pendente', 'confirmado'].includes(a.status)
  );

  // Histórico = finalizados
  const history = appointments.filter(
    (a: any) => ['FIN', 'concluido'].includes(a.status)
  );

  // Dias até próxima doação usando tempo_restricao da API
  const daysUntilNextDonation = (() => {
    if (!user?.tempo_restricao) return 0;
    const restricao = new Date(user.tempo_restricao);
    const diff = Math.ceil((restricao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  const formatDataHora = (agendamento: any) => {
    const campo = agendamento.data_hora_doacao || agendamento.data;
    if (!campo) return { data: '-', hora: '-' };
    try {
      const d = new Date(campo);
      return {
        data: format(d, "dd 'de' MMMM", { locale: ptBR }),
        hora: format(d, 'HH:mm'),
      };
    } catch {
      return { data: campo, hora: agendamento.horario || '-' };
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCancelAppointment = async () => {
    if (!upcomingAppointment) return;
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await api.put(`/auth/agendamentos/${upcomingAppointment.id}`, { status: 'CAN' });
      toast.success('Agendamento cancelado!');
      await fetchAppointments();
    } catch {
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleReschedule = () => {
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleLocation('');
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleLocation) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      // Marca o atual como reagendado
      await api.put(`/auth/agendamentos/${upcomingAppointment.id}`, { status: 'E' });

      // Cria novo agendamento — rota correta: /auth/agendamentos
      const dataHora = `${rescheduleDate} ${rescheduleTime}:00`;
      await api.post('/auth/agendamentos', {
        hemocentro_id: Number(rescheduleLocation),
        data_hora_doacao: dataHora,
      });

      toast.success('Reagendado com sucesso!');
      setRescheduleDialogOpen(false);
      await fetchAppointments();
    } catch (err: any) {
      toast.error('Erro ao reagendar: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  const handleEditProfileConfirm = async () => {
    try {
      const cleanData: any = {};
      if (profileData.name)     cleanData.name     = profileData.name;
      if (profileData.email)    cleanData.email    = profileData.email;
      if (profileData.telefone) cleanData.telefone = profileData.telefone.replace(/\D/g, '');
      if (profileData.numero)   cleanData.numero   = profileData.numero;

      await api.put(`/users/${user.id}`, cleanData);
      toast.success('Perfil atualizado!');
      setEditProfileDialogOpen(false);
    } catch (err: any) {
      toast.error('Erro: ' + (err.response?.data?.message || 'Verifique os dados'));
    }
  };

  const handleCertificates = () => toast.info('Funcionalidade em breve!');

  if (!user) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">DoaVida</h1>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-red-100 text-red-600">
                {user?.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">

        {/* Boas-vindas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-red-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Heart className="w-48 h-48 -mr-10 -mb-10" />
            </div>
            <CardContent className="p-8 relative z-10">
              <h2 className="text-3xl font-bold mb-2">
                Olá, {user.name?.split(' ')[0]}!
              </h2>
              <p className="text-red-100 text-lg mb-6">
                Sua doação pode salvar até 4 vidas. Obrigado por ser um herói!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate('/cadastro-doacao')}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold px-6"
                >
                  <Droplet className="w-4 h-4 mr-2" /> Agendar Nova Doação
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCertificates}
                  className="border-white text-white hover:bg-white/10"
                >
                  <Award className="w-4 h-4 mr-2" /> Meus Certificados
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipo Sanguíneo</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-lg px-3">
                    {user.tipo_sang || '?'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Doações</span>
                  <span className="font-bold text-xl">{history.length}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400 mb-1">Próxima doação disponível em:</p>
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {daysUntilNextDonation <= 0 ? 'Já disponível!' : `${daysUntilNextDonation} dias`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="bg-white border mb-4">
                <TabsTrigger value="proximos" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                  Próxima Doação
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                  Histórico Completo
                </TabsTrigger>
              </TabsList>

              {/* Próxima doação */}
              <TabsContent value="proximos">
                {isLoading ? (
                  <Card className="p-8 text-center animate-pulse">
                    <p>Carregando agendamentos...</p>
                  </Card>
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
                              {formatDataHora(upcomingAppointment).data}
                            </h3>
                            <p className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDataHora(upcomingAppointment).hora}
                            </p>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-red-600" />
                              {upcomingAppointment.hemocentro?.nome || 'Hemocentro Selecionado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleReschedule}>
                            Reagendar
                          </Button>
                          <Button variant="destructive" onClick={handleCancelAppointment}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>Lembre-se de levar um documento com foto e estar bem alimentado.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-12 text-center border-dashed border-2">
                    <p className="text-gray-500 mb-4">Você não possui agendamentos ativos.</p>
                    <Button
                      onClick={() => navigate('/cadastro-doacao')}
                      className="bg-red-600"
                    >
                      Agendar agora
                    </Button>
                  </Card>
                )}
              </TabsContent>

              {/* Histórico */}
              <TabsContent value="historico">
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {isLoading ? (
                        <div className="p-8 text-center animate-pulse">Carregando...</div>
                      ) : history.length > 0 ? (
                        history.map((h) => {
                          const { data } = formatDataHora(h);
                          return (
                            <div
                              key={h.id}
                              className="p-4 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold text-xs">
                                  {data}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {h.hemocentro?.nome || 'Hemocentro'}
                                  </p>
                                  <p className="text-xs text-gray-500 uppercase font-medium">
                                    {h.ml_coletados ? `${h.ml_coletados}ml` : 'Doação Concluída'}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-700 border-none">
                                Concluída
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          Nenhuma doação realizada ainda.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-md border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Dicas Pré-Doação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">1</div>
                  <p className="text-sm">Beba bastante água nas 24h anteriores.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center text-orange-400">2</div>
                  <p className="text-sm">Evite alimentos gordurosos 3h antes.</p>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditProfileDialogOpen(true)}
                  className="text-red-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {user.telefone || 'Telefone não cadastrado'}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  CPF: ***.***.{user.cpf?.slice(-2) || '00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog — Reagendar */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Doação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
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
                {hemocentros.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRescheduleConfirm} className="bg-red-600 hover:bg-red-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Editar Perfil */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone (só números)</Label>
              <Input
                value={profileData.telefone}
                onChange={e => setProfileData({ ...profileData, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label>Número</Label>
              <Input
                value={profileData.numero}
                onChange={e => setProfileData({ ...profileData, numero: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProfileConfirm} className="bg-red-600 hover:bg-red-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}