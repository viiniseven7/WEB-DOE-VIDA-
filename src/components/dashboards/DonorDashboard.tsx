<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
=======
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
<<<<<<< HEAD
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  Droplet, 
  Calendar as CalendarIcon, 
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
  Edit,
  History,
  XCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:8000/api';
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

export function DonorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
<<<<<<< HEAD
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [fullHistory, setFullHistory] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para Edição de Perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    telefone: '',
    tipo_sang: '',
    sexo: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    try {
      const [resApt, resHist, resDon] = await Promise.all([
        fetch(`${API_URL}/agendamentos`, { headers }),
        fetch(`${API_URL}/agendamentos/historico`, { headers }),
        fetch(`${API_URL}/doacoes`, { headers })
      ]);

      if (resApt.ok) setAppointments((await resApt.json()).data || []);
      if (resHist.ok) setFullHistory((await resHist.json()).data || []);
      if (resDon.ok) setDonations((await resDon.json()).data || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      setEditData({
        name: user.name || '',
        email: user.email || '',
        telefone: user.telefone || '',
        tipo_sang: user.tipo_sang || '',
        sexo: user.sexo || ''
=======

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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
      });
    }
  }, [user]);

<<<<<<< HEAD
  if (!user || user.role !== 'donor') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Sessão encerrada');
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/agendamentos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });

      if (response.ok) {
        toast.success('Agendamento cancelado com sucesso');
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao cancelar agendamento');
      }
    } catch (error) {
      toast.error('Erro de conexão ao cancelar');
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso! Recarregando...');
        setIsEditModalOpen(false);
        // Recarrega a página para atualizar o AuthContext com os novos dados do servidor
        window.location.reload(); 
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro de conexão ao atualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  const upcoming = appointments.find(a => a.status_agendamento === 'AGE');
  const isRestricted = user?.tempo_restricao && isAfter(parseISO(user.tempo_restricao), new Date());
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                <p className="text-xs text-gray-500 capitalize">Doador {user.tipo_sang ? `• ${user.tipo_sang}` : ''}</p>
              </div>
              <Avatar className="w-10 h-10 border-2 border-red-100">
                <AvatarFallback className="bg-red-600 text-white uppercase">{user.name.substring(0,2)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                <LogOut className="w-5 h-5" />
              </Button>
=======
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Droplet className="h-6 w-6 text-white" />
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
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
<<<<<<< HEAD
=======

        {/* Boas-vindas */}
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-red-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Heart className="w-48 h-48 -mr-10 -mb-10" />
            </div>
            <CardContent className="p-8 relative z-10">
<<<<<<< HEAD
              <h2 className="text-3xl font-bold mb-2">Olá, {user.name.split(' ')[0]}!</h2>
              <p className="text-red-100 text-lg mb-6">
                {isRestricted 
                  ? `Você poderá realizar uma nova doação em ${format(parseISO(user.tempo_restricao!), 'dd/MM/yyyy')}.`
                  : "Você está apto para salvar vidas hoje!"}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate('/agendar')} 
                  disabled={isRestricted}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold px-6"
                >
                  <Droplet className="w-4 h-4 mr-2" /> Agendar Doação
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="pb-2">
<<<<<<< HEAD
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Resumo do Doador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tipo Sanguíneo</span>
                <Badge className="bg-red-100 text-red-700 text-lg px-3">{user.tipo_sang || '?'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Doações Realizadas</span>
                <span className="font-bold text-xl">{donations.length}</span>
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
              </div>
              {isRestricted && (
                <div className="pt-2 border-t text-xs text-orange-600 flex gap-1 items-center">
                  <AlertCircle className="w-3 h-3" /> Em período de carência
                </div>
              )}
            </CardContent>
          </Card>
        </div>

<<<<<<< HEAD
=======
        {/* Conteúdo principal */}
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="bg-white border mb-4">
<<<<<<< HEAD
                <TabsTrigger value="proximos">Próximo Agendamento</TabsTrigger>
                <TabsTrigger value="historico">Minhas Intenções</TabsTrigger>
                <TabsTrigger value="doacoes">Minhas Doações</TabsTrigger>
              </TabsList>

              <TabsContent value="proximos">
                {isLoading ? (
                  <div className="p-8 text-center">Carregando...</div>
                ) : upcoming ? (
                  <Card className="border-l-4 border-l-red-600 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <CalendarIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">
<<<<<<< HEAD
                              {format(new Date(upcoming.data_hora_doacao), "dd 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <p className="text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(upcoming.data_hora_doacao), "HH:mm")}</p>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-red-600" /> {upcoming.hemocentro?.nome}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCancelAppointment(upcoming.id)}
                          className="text-gray-400 hover:text-red-600 gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Cancelar
                        </Button>
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                      </div>
                    </CardContent>
                  </Card>
                ) : (
<<<<<<< HEAD
                  <Card className="p-12 text-center border-dashed border-2 bg-white">
                    <p className="text-gray-500 mb-4">Você não tem agendamentos pendentes.</p>
                    <Button onClick={() => navigate('/agendar')} disabled={isRestricted} className="bg-red-600">Agendar Agora</Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="historico">
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {fullHistory.length > 0 ? fullHistory.map((h) => (
                        <div key={h.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <History className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-semibold text-gray-900">{h.hemocentro?.nome}</p>
                              <p className="text-xs text-gray-500">{format(new Date(h.data_hora_doacao), "dd/MM/yyyy HH:mm")}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            h.status_agendamento === 'CON' ? "text-green-600 border-green-200" :
                            h.status_agendamento === 'CAN' ? "text-red-600 border-red-200" : "text-gray-600"
                          }>
                            {h.status_agendamento}
                          </Badge>
                        </div>
                      )) : (
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
                      {donations.length > 0 ? donations.map((d) => (
                        <div key={d.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold">
                              <Droplet className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{d.hemocentro?.nome || 'Doação realizada'}</p>
                              <p className="text-sm text-gray-500">{format(new Date(d.data_hora_doacao), "dd/MM/yyyy")}</p>
                              <p className="text-xs font-bold text-red-600">{d.quantidade}ml coletados</p>
                            </div>
                          </div>
                          <Badge className="bg-green-600">Sucesso</Badge>
                        </div>
                      )) : (
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
            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Dados de Contato</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-600"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /> {user.email}</div>
                <div className="flex items-center gap-3 text-sm"><Phone className="h-4 h-4 text-gray-400" /> {user.telefone || 'Não informado'}</div>
                <div className="flex items-center gap-3 text-sm"><User className="w-4 h-4 text-gray-400" /> CPF: {user.cpf}</div>
              </CardContent>
            </Card>
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
          </div>
        </div>
      </main>

<<<<<<< HEAD
      {/* Modal de Edição de Perfil */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Atualize suas informações cadastrais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                value={editData.name} 
                onChange={(e) => setEditData({...editData, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={editData.email} 
                  onChange={(e) => setEditData({...editData, email: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  placeholder="(XX) XXXXX-XXXX"
                  value={editData.telefone} 
                  onChange={(e) => setEditData({...editData, telefone: e.target.value})} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Sanguíneo</Label>
                <Select value={editData.tipo_sang} onValueChange={(v) => setEditData({...editData, tipo_sang: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={editData.sexo} onValueChange={(v) => setEditData({...editData, sexo: v})}>
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
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
=======
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
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
