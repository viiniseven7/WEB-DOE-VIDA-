import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Phone,
  History as HistoryIcon,
  XCircle,
  Save
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function extractAppointments(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.agendamentos)) return payload.agendamentos;
  if (Array.isArray(payload?.historico)) return payload.historico;
  return [];
}

const getStatus = (item: any) => String(item?.status_agendamento || item?.status || '').toUpperCase();

const isCompletedAppointment = (item: any) =>
  ['FIN', 'DOA', 'REALIZADA', 'CONCLUIDO', 'CONCLUÍDO', 'FINALIZADO'].includes(getStatus(item)) ||
  !!item?.doacao_id ||
  !!item?.doacao;

const isActiveAppointment = (item: any) =>
  ['AGE', 'CON', 'PENDENTE', 'CONFIRMADO'].includes(getStatus(item));

export function DonorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
  const [hemocentros, setHemocentros] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Modais
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLocation, setRescheduleLocation] = useState('');

  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    telefone: '',
    numero: '',
    tipo_sang: '',
    sexo: ''
  });

  const [certificatesDialogOpen, setCertificatesDialogOpen] = useState(false);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);

  const handleOpenCertificates = async () => {
    setCertificatesDialogOpen(true);
    setIsLoadingCertificates(true);
    try {
      const res = await api.get('/certificados');
      const list = extractAppointments(res.data); // Usa o fallback se a estrutura variar
      setCertificates(list);
    } catch (err) {
      toast.error('Erro ao carregar certificados.');
    } finally {
      setIsLoadingCertificates(false);
    }
  };

  const handleDownloadCertificate = (id: string) => {
    toast.info("Gerando certificado...");
    api.get(`/certificados/${id}/pdf`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `certificado-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => toast.error('Erro ao baixar certificado.'));
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [agendRes, historyRes, hemocentrosRes, donRes] = await Promise.all([
        api.get('/agendamentos'),
        api.get('/agendamentos/historico'),
        api.get('/hemocentros'),
        api.get('/doacoes')
      ]);

      setAppointments(extractAppointments(agendRes.data));
      setAppointmentHistory(extractAppointments(historyRes.data));
      setHemocentros(extractAppointments(hemocentrosRes.data));
      setDonations(extractAppointments(donRes.data));
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err.response?.data);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Erro ao carregar dados do painel');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, logout, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        telefone: user.telefone || user.phone || '',
        numero: user.numero || '',
        tipo_sang: user.tipo_sang || '',
        sexo: user.sexo || ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sessão encerrada');
  };

  const handleScheduleClick = () => {
    if (isRestricted) {
      toast.warning(`Você está inelegível temporariamente. Nova doação disponível em ${format(parseISO(user.tempo_restricao!), 'dd/MM/yyyy')}.`);
      return;
    }
    navigate('/cadastro-doacao');
  };

  const upcomingAppointment = appointments.find(isActiveAppointment);

  const history = appointmentHistory.filter(isCompletedAppointment);

  const daysUntilNextDonation = (() => {
    if (!user?.tempo_restricao) return 0;
    try {
      const restricao = parseISO(user.tempo_restricao);
      const diff = Math.ceil((restricao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch { return 0; }
  })();

  const isRestricted = daysUntilNextDonation > 0;

  const formatDataHora = (agendamento: any) => {
    const campo = agendamento.data_hora_doacao || agendamento.data;
    if (!campo) return { data: '-', hora: '-' };
    try {
      const d = parseISO(campo.includes('T') ? campo : campo.replace(' ', 'T'));
      return {
        data: format(d, "dd 'de' MMMM", { locale: ptBR }),
        hora: format(d, 'HH:mm'),
      };
    } catch {
      return { data: campo, hora: agendamento.horario || '-' };
    }
  };

  const handleCancelAppointment = async () => {
    if (!upcomingAppointment) return;
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await api.post(`/auth/agendamentos/${upcomingAppointment.id}/cancelar`);
      toast.success('Agendamento cancelado!');
      fetchData();
    } catch {
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleLocation) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      const dataHora = `${rescheduleDate} ${rescheduleTime}:00`;
      await api.post(`/auth/agendamentos/${upcomingAppointment.id}/cancelar`);
      await api.post('/auth/agendamentos', {
        hemocentro_id: Number(rescheduleLocation),
        data_hora_doacao: dataHora,
      });

      toast.success('Reagendado com sucesso!');
      setRescheduleDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao reagendar: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  const handleEditProfileConfirm = async () => {
    try {
      const payload = {
        ...profileData,
        telefone: profileData.telefone.replace(/\D/g, '')
      };
      await api.put(`/users/${user.id}`, payload);
      toast.success('Perfil atualizado!');
      setEditProfileDialogOpen(false);
      // O ideal seria atualizar o contexto ou forçar um refresh
      window.location.reload();
    } catch (err: any) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 uppercase">Doador {user.tipo_sang ? `• ${user.tipo_sang}` : ''}</p>
              </div>
              <Avatar className="border-2 border-red-100">
                <AvatarFallback className="bg-red-600 text-white">
                  {user.name?.substring(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-red-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Heart className="w-48 h-48 -mr-10 -mb-10" />
            </div>
            <CardContent className="p-8 relative z-10">
              <h2 className="text-3xl font-bold mb-2">Olá, {user.name?.split(' ')[0]}! 👋</h2>
              <p className="text-red-100 text-lg mb-6">
                {isRestricted 
                  ? `Sua próxima doação estará disponível em ${format(parseISO(user.tempo_restricao!), 'dd/MM/yyyy')}.`
                  : "Você está apto para salvar vidas hoje! Sua doação pode salvar até 4 vidas."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleScheduleClick}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold px-6"
                >
                  <Droplet className="w-4 h-4 mr-2" /> Agendar Doação
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCertificates}
                  className="border-white bg-transparent text-white hover:bg-white hover:text-red-600"
                >
                  <Award className="w-4 h-4 mr-2" /> Meus Certificados
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Resumo do Doador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tipo Sanguíneo</span>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-lg px-3">{user.tipo_sang || '?'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Doações Realizadas</span>
                <span className="font-bold text-xl">{donations.length}</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-400 mb-1">Próxima doação disponível em:</p>
                <p className={`font-semibold flex items-center gap-1 ${!isRestricted ? 'text-green-600' : 'text-amber-600'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {!isRestricted ? 'Já disponível!' : `${daysUntilNextDonation} dias`}
                </p>
              </div>
              {isRestricted && (
                <div className="pt-2 border-t text-xs text-orange-600 flex gap-1 items-center">
                  <AlertCircle className="w-3 h-3" /> Em período de carência
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="bg-white border mb-4">
                <TabsTrigger value="proximos" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Próxima Doação</TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Histórico</TabsTrigger>
                <TabsTrigger value="doacoes" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Minhas Coletas</TabsTrigger>
              </TabsList>

              <TabsContent value="proximos">
                {isLoading ? (
                  <Card className="p-8 text-center animate-pulse"><p>Carregando...</p></Card>
                ) : upcomingAppointment ? (
                  <Card className="border-l-4 border-l-red-600 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-50 rounded-xl text-red-600"><CalendarIcon className="w-8 h-8" /></div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">
                              {formatDataHora(upcomingAppointment).data}
                            </h3>
                            <p className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {formatDataHora(upcomingAppointment).hora}
                            </p>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-red-600" />
                              {upcomingAppointment.hemocentro?.nome || 'Hemocentro Selecionado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setRescheduleDialogOpen(true)}>Reagendar</Button>
                          <Button variant="destructive" onClick={handleCancelAppointment}>Cancelar</Button>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>Lembre-se de levar um documento original com foto e estar bem alimentado.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-12 text-center border-dashed border-2 bg-white">
                    <p className="text-gray-500 mb-4">Você não possui agendamentos ativos.</p>
                    <Button onClick={handleScheduleClick} className="bg-red-600">Agendar agora</Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="historico">
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {history.length > 0 ? (
                        history.map((h) => (
                          <div key={h.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold text-xs">
                                <HistoryIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{h.hemocentro?.nome || 'Agendamento'}</p>
                                <p className="text-xs text-gray-500 uppercase font-medium">
                                  {formatDataHora(h).data} às {formatDataHora(h).hora}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-none">Concluído</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">Nenhum histórico encontrado.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="doacoes">
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {donations.length > 0 ? (
                        donations.map((d) => (
                          <div key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                                <Droplet className="w-6 h-6 fill-current" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{d.hemocentro?.nome || 'Doação realizada'}</p>
                                <p className="text-sm text-gray-500">{format(parseISO(d.data_hora_doacao), "dd/MM/yyyy")}</p>
                                <p className="text-xs font-bold text-red-600">{d.quantidade}ml coletados</p>
                              </div>
                            </div>
                            <Badge className="bg-green-600 text-white">Sucesso</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-gray-500">
                          <Droplet className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                          <p>Nenhuma bolsa de sangue coletada ainda.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Dicas Pré-Doação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-300 shrink-0">1</div>
                  <p className="text-gray-100">Beba bastante água nas 24h anteriores.</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center text-orange-300 shrink-0">2</div>
                  <p className="text-gray-100">Evite alimentos gordurosos 3h antes da doação.</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-300 shrink-0">3</div>
                  <p className="text-gray-100">Durma pelo menos 6h na noite anterior.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Meu Perfil</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditProfileDialogOpen(true)} className="text-red-600">
                  <Edit className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /> {user.email}</div>
                <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-gray-400" /> {user.telefone || 'Não informado'}</div>
                <div className="flex items-center gap-3 text-sm"><UserIcon className="w-4 h-4 text-gray-400" /> CPF: {user.cpf || 'Não informado'}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog Reagendar */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Doação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nova Data</Label>
              <Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label>Horário</Label>
              <select className="w-full border rounded-md p-2" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)}>
                <option value="">Selecione</option>
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Hemocentro</Label>
              <select className="w-full border rounded-md p-2" value={rescheduleLocation} onChange={e => setRescheduleLocation(e.target.value)}>
                <option value="">Selecione</option>
                {hemocentros.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRescheduleConfirm} className="bg-red-600 hover:bg-red-700 text-white">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Perfil */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Atualize suas informações cadastrais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input placeholder="(XX) XXXXX-XXXX" value={profileData.telefone} onChange={e => setProfileData({...profileData, telefone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Sanguíneo</Label>
                <Select value={profileData.tipo_sang} onValueChange={v => setProfileData({...profileData, tipo_sang: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={profileData.sexo} onValueChange={v => setProfileData({...profileData, sexo: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditProfileConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Meus Certificados */}
      <Dialog open={certificatesDialogOpen} onOpenChange={setCertificatesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Meus Certificados</DialogTitle>
            <DialogDescription>
              Baixe os certificados das suas doações concluídas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {isLoadingCertificates ? (
              <div className="text-center py-4 text-gray-500">Carregando certificados...</div>
            ) : certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {cert.hemocentro?.nome || cert.nome_hemocentro || 'Doação'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cert.data_hora_doacao ? format(parseISO(cert.data_hora_doacao), "dd/MM/yyyy") : cert.data_doacao}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadCertificate(cert.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Baixar PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                <p>Nenhum certificado disponível.</p>
                <p className="text-xs mt-1">Realize uma doação para gerar certificados.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificatesDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
