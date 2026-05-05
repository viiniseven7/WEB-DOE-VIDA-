<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
=======
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
<<<<<<< HEAD
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarUI } from '../ui/calendar';
import { 
  Droplet, 
  Calendar as CalendarIcon,
  Users,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Activity,
  Plus,
  Minus,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:8000/api';
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import {
  Droplet, Calendar, Users, LogOut, Bell, CheckCircle2, XCircle,
  Clock, Search, Activity, Plus, Minus, Phone, Mail, Edit, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Mocks (sem API equivalente) ─────────────────────────────────────────────
const bloodStockMock = [
  { type: 'A+', current: 45, min: 30, max: 100 },
  { type: 'A-', current: 12, min: 20, max: 60  },
  { type: 'B+', current: 28, min: 25, max: 80  },
  { type: 'B-', current: 8,  min: 15, max: 50  },
  { type: 'AB+', current: 15, min: 15, max: 40 },
  { type: 'AB-', current: 5,  min: 10, max: 30 },
  { type: 'O+', current: 62, min: 40, max: 120 },
  { type: 'O-', current: 18, min: 25, max: 70  },
];
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

const tiposSanguineos = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

// ─── Componente ───────────────────────────────────────────────────────────────
export function StaffDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
<<<<<<< HEAD
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stock, setStock] = useState(bloodStock);
  
  // Modais de Fluxo
  const [triagemDialogOpen, setTriagemDialogOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Estados dos Formulários
  const [triagemData, setTriagemData] = useState({ apto: 'true', observacoes: '' });
  const [donationData, setDonationData] = useState({ quantidade: '450', data_validade: format(new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') });

  // Outros modais
=======

  // ── Estado: dados da API
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [doadores, setDoadores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Estado: mock local
  const [stock, setStock] = useState(bloodStockMock);

  // ── Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodTypeFilter, setDonorBloodTypeFilter] = useState('');
  const [donorResult, setDonorResult] = useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // ── Dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  const [triagemDialogOpen, setTriagemDialogOpen] = useState(false);
  const [triagemData, setTriagemData] = useState({
    apto: true,
    motivo_inaptidao: '',
    observacoes: '',
    ml_coletados: '450',
  });

  const [editDonorDialogOpen, setEditDonorDialogOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [editDonorData, setEditDonorData] = useState({
    tipo_sang: '',
    telefone: '',
    status: '1',
    tempo_restricao: '',
  });

>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
<<<<<<< HEAD
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodType, setDonorBloodType] = useState('');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data || data);
      }
    } catch (error) {
      toast.error('Erro ao carregar agenda');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'staff') {
      fetchAppointments();
    } else if (user) {
      navigate('/login');
    }
  }, [user]);

  if (!user || user.role !== 'staff') return null;
=======

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!user) { navigate('/login'); return null; }
  if (user.role_id !== 2) { navigate('/login'); return null; }
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [agendRes, usersRes] = await Promise.all([
        api.get('/agendamentos'),
        api.get('/users'),
      ]);

      const agends = Array.isArray(agendRes.data)
        ? agendRes.data : agendRes.data.data ?? [];

      // Filtra agendamentos do hemocentro do funcionário
      const agendsFiltrados = agends.filter(
        (a: any) => Number(a.hemocentro_id) === Number(user.hemocentro_id)
      );
      setAgendamentos(agendsFiltrados);

      const users = Array.isArray(usersRes.data)
        ? usersRes.data : usersRes.data.data ?? [];

      // Apenas doadores (role_id = 1)
      setDoadores(users.filter((u: any) => u.role_id === 1));
    } catch (err: any) {
      console.error('Erro ao carregar:', err.response?.data);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user.hemocentro_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const hemocentroNome = user.hemocentro?.nome || `Hemocentro #${user.hemocentro_id}`;

  const formatDataHora = (agendamento: any) => {
    const campo = agendamento.data_hora_doacao || agendamento.data;
    if (!campo) return { data: '-', hora: '-' };
    try {
      const d = new Date(campo);
      return {
        data: format(d, "dd/MM/yyyy", { locale: ptBR }),
        hora: format(d, 'HH:mm'),
      };
    } catch { return { data: campo, hora: '-' }; }
  };

<<<<<<< HEAD
  // --- LOGICA DE FILTRO E ORDENAÇÃO ---
  const filteredAndSortedAppointments = appointments
    .filter(apt => {
      const aptDate = parseISO(apt.data_hora_doacao);
      const matchesDate = isSameDay(aptDate, selectedDate);
      const matchesSearch = (apt.doador?.name || apt.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (apt.doador?.tipo_sang || apt.user?.tipo_sang || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    })
    .sort((a, b) => new Date(a.data_hora_doacao).getTime() - new Date(b.data_hora_doacao).getTime());

  // --- FUNÇÕES DE INTEGRAÇÃO ---
  const handleConfirmPresence = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/agendamentos/${appointmentId}/confirmar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        toast.success('Check-in realizado!');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro no check-in');
    }
  };

  const handleRegisterTriagem = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/triagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify({
          agendamento_id: selectedAppointment.id,
          user_id: selectedAppointment.user_id,
          hemocentro_id: user.hemocenterId,
          data_triagem: format(new Date(), 'yyyy-MM-dd'),
          apto: triagemData.apto === 'true',
          observacoes: triagemData.observacoes
        })
      });
      if (response.ok) {
        toast.success('Triagem salva!');
        setTriagemDialogOpen(false);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro ao salvar triagem');
    }
  };

  const handleRegisterDonation = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/doacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify({
          agendamento_id: selectedAppointment.id,
          triagem_id: selectedAppointment.triagem?.id,
          user_id: selectedAppointment.user_id,
          hemocentro_id: user.hemocenterId,
          data_hora_doacao: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          tipo_sangue: selectedAppointment.doador?.tipo_sang || selectedAppointment.user?.tipo_sang,
          quantidade: parseInt(donationData.quantidade),
          data_validade_sangue: donationData.data_validade
        })
      });
      if (response.ok) {
        toast.success('Doação registrada!');
        setDonationDialogOpen(false);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro ao registrar coleta');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Deseja cancelar?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_URL}/auth/agendamentos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      toast.success('Cancelado');
      fetchAppointments();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };
=======
  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      AGE: { label: 'Agendado',   color: 'bg-blue-100 text-blue-600'   },
      CON: { label: 'Confirmado', color: 'bg-green-100 text-green-600' },
      CAN: { label: 'Cancelado',  color: 'bg-red-100 text-red-600'     },
      FIN: { label: 'Finalizado', color: 'bg-gray-100 text-gray-600'   },
      E:   { label: 'Reagendado', color: 'bg-yellow-100 text-yellow-600'},
    };
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  // Agendamentos de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter((a: any) => {
    const data = a.data_hora_doacao?.split(' ')[0] || a.data?.split('T')[0];
    return data === hoje;
  });
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b

  const concluidos = agendamentosHoje.filter((a: any) => a.status === 'FIN').length;
  const pendentes  = agendamentosHoje.filter((a: any) => ['AGE','CON'].includes(a.status)).length;

<<<<<<< HEAD
=======
  const filteredAgendamentos = agendamentosHoje.filter((a: any) =>
    a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.tipo_sang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Handlers: Agendamentos ───────────────────────────────────────────────

  const handleConfirmar = async (agend: any) => {
    try {
      await api.put(`/auth/agendamentos/${agend.id}`, { status: 'CON' });
      toast.success('Agendamento confirmado!');
      fetchData();
    } catch { toast.error('Erro ao confirmar agendamento'); }
  };

  const handleAbrirCancelar = (agend: any) => {
    setSelectedAgendamento(agend);
    setCancelMotivo('');
    setCancelDialogOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!cancelMotivo) { toast.error('Selecione o motivo do cancelamento'); return; }
    try {
      await api.put(`/auth/agendamentos/${selectedAgendamento.id}`, {
        status: 'CAN',
        motivo_cancelamento: cancelMotivo,
      });
      toast.success('Agendamento cancelado!');
      setCancelDialogOpen(false);
      setSelectedAgendamento(null);
      fetchData();
    } catch { toast.error('Erro ao cancelar agendamento'); }
  };

  const handleAbrirTriagem = (agend: any) => {
    setSelectedAgendamento(agend);
    setTriagemData({ apto: true, motivo_inaptidao: '', observacoes: '', ml_coletados: '450' });
    setTriagemDialogOpen(true);
  };

  const handleRegistrarTriagem = async () => {
    if (!selectedAgendamento) return;
    try {
      // Cria triagem
      await api.post('/auth/triagens', {
        user_id:       selectedAgendamento.user_id,
        funcionario_id: user.id,
        hemocentro_id: user.hemocentro_id,
        data_triagem:  new Date().toISOString().split('T')[0],
        apto:          triagemData.apto,
        motivo_inaptidao: !triagemData.apto ? triagemData.motivo_inaptidao : null,
        observacoes:   triagemData.observacoes || null,
      });

      // Finaliza agendamento
      await api.put(`/auth/agendamentos/${selectedAgendamento.id}`, {
        status: 'FIN',
      });

      toast.success(triagemData.apto ? 'Doação registrada com sucesso!' : 'Triagem registrada — doador inapto');
      setTriagemDialogOpen(false);
      setSelectedAgendamento(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao registrar triagem: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  // ─── Handlers: Doadores ───────────────────────────────────────────────────

  const handleSearchDonor = () => {
    if (!donorSearchTerm.trim() && !donorBloodTypeFilter) {
      toast.error('Digite um nome, CPF ou selecione um tipo sanguíneo');
      return;
    }
    setSearchPerformed(true);
    const results = doadores.filter((d: any) => {
      const matchNome = donorSearchTerm
        ? d.name?.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
          d.cpf?.includes(donorSearchTerm.replace(/\D/g, ''))
        : true;
      const matchTipo = donorBloodTypeFilter
        ? d.tipo_sang === donorBloodTypeFilter
        : true;
      return matchNome && matchTipo;
    });
    setDonorResult(results);
    if (results.length === 0) toast.error('Nenhum doador encontrado');
    else toast.success(`${results.length} doador(es) encontrado(s)`);
  };

  const handleAbrirEditDonor = (donor: any) => {
    setSelectedDonor(donor);
    setEditDonorData({
      tipo_sang:       donor.tipo_sang || '',
      telefone:        donor.telefone  || '',
      status:          String(donor.status ?? 1),
      tempo_restricao: '',
    });
    setEditDonorDialogOpen(true);
  };

  const handleSalvarDonor = async () => {
    if (!selectedDonor) return;
    try {
      const payload: any = {
        tipo_sang: editDonorData.tipo_sang || undefined,
        telefone:  editDonorData.telefone.replace(/\D/g, '') || undefined,
        status:    Number(editDonorData.status),
      };
      if (editDonorData.tempo_restricao) {
        payload.tempo_restricao = editDonorData.tempo_restricao;
      }
      await api.put(`/users/${selectedDonor.id}`, payload);
      toast.success('Doador atualizado com sucesso!');
      setEditDonorDialogOpen(false);
      setSelectedDonor(null);
      fetchData();
      // Atualiza resultado da busca
      setDonorResult(prev =>
        prev.map(d => d.id === selectedDonor.id ? { ...d, ...payload } : d)
      );
    } catch (err: any) {
      toast.error('Erro ao atualizar doador: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  // ─── Handlers: Estoque ────────────────────────────────────────────────────

>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = () => {
<<<<<<< HEAD
    const amount = parseInt(stockAmount);
    setStock(prev => prev.map(item => item.type === selectedBloodType ? { ...item, current: stockAction === 'add' ? Math.min(item.current + amount, item.max) : Math.max(item.current - amount, 0) } : item));
    toast.success('Estoque atualizado');
    setUpdateStockDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}><Droplet className="h-6 w-6 text-white" /></div>
            <div><h1 className="text-xl font-bold text-gray-900">DoaVida</h1><p className="text-xs text-gray-600">Painel do Funcionário</p></div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /><span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span></Button>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback className="bg-blue-100 text-blue-600">{user.name[0]}</AvatarFallback></Avatar>
              <div className="hidden md:block"><p className="text-sm font-semibold text-gray-900">{user.name}</p><p className="text-xs text-gray-600">{user.hemocentroName}</p></div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> Sair</Button>
=======
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Digite uma quantidade válida');
      return;
    }
    const amount = parseInt(stockAmount);
    setStock(prev => prev.map(item => {
      if (item.type !== selectedBloodType) return item;
      const newCurrent = stockAction === 'add'
        ? Math.min(item.current + amount, item.max)
        : Math.max(item.current - amount, 0);
      return { ...item, current: newCurrent };
    }));
    toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} — ${selectedBloodType}`);
    setUpdateStockDialogOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Droplet className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Funcionário</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-600">{hemocentroNome}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /><span className="hidden md:inline">Sair</span>
            </Button>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
<<<<<<< HEAD
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">{user.hemocentroName} - Gerencie as doações e o estoque de sangue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600"><CardHeader className="pb-3"><CardDescription>Doações Hoje</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-green-600"><CardHeader className="pb-3"><CardDescription>Concluídas (Hoje)</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => !!a.doacao && isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-orange-600"><CardHeader className="pb-3"><CardDescription>Pendentes (Hoje)</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => !a.doacao && a.status_agendamento !== 'CAN' && isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-purple-600"><CardHeader className="pb-3"><CardDescription>Total Sistema</CardDescription><CardTitle className="text-3xl">{appointments.length}</CardTitle></CardHeader></Card>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
=======
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">{hemocentroNome} — Gerencie as doações e o estoque</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3"><CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : agendamentosHoje.length}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-blue-600" /><span>Do seu hemocentro</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3"><CardDescription>Concluídos</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : concluidos}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-green-600" /><span>{concluidos * 450}ml coletados</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3"><CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : pendentes}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4 text-orange-600" /><span>Aguardando atendimento</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3"><CardDescription>Total de Doadores</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : doadores.length}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4 text-purple-600" /><span>Cadastrados no sistema</span></div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda do Dia</TabsTrigger>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="donors">Doadores</TabsTrigger>
          </TabsList>

<<<<<<< HEAD
=======
          {/* ── Agenda ── */}
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
<<<<<<< HEAD
                    <CardTitle>Agenda de Doações</CardTitle>
                    <CardDescription>{filteredAndSortedAppointments.length} agendamentos listados</CardDescription>
=======
                    <CardTitle>Agenda de Doações — Hoje</CardTitle>
                    <CardDescription>
                      {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                  </div>

                  {/* SELETOR DE DATA CENTRALIZADO */}
                  <div className="flex-1 flex justify-center">
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-3 shadow-sm">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="h-auto p-0 font-bold text-blue-700 hover:bg-transparent text-sm">
                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <CalendarUI mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
<<<<<<< HEAD
                    <Input placeholder="Buscar na lista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
=======
                    <Input placeholder="Buscar doador..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                  </div>
                </div>
              </CardHeader>
              <CardContent>
<<<<<<< HEAD
                <div className="space-y-3">
                  {isLoading ? <div className="text-center py-10 italic text-gray-400">Carregando agendamentos...</div> : filteredAndSortedAppointments.length > 0 ? filteredAndSortedAppointments.map((apt) => {
                    const isApto = apt.triagem && (apt.triagem.apto === true || apt.triagem.apto === 1 || apt.triagem.apto === '1' || apt.triagem.apto === 'true');
                    const hasTriagem = !!apt.triagem;
                    const hasDoacao = !!apt.doacao;
                    return (
                      <div key={apt.id} className={`p-4 border rounded-lg transition-all ${hasDoacao ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-lg shadow-lg"><p className="text-lg font-bold">{format(parseISO(apt.data_hora_doacao), "HH:mm")}</p></div>
                            <div>
                              <div className="flex items-center gap-2"><p className="font-bold text-lg text-gray-900">{apt.doador?.name || apt.user?.name}</p><Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">{apt.doador?.tipo_sang || apt.user?.tipo_sang || '?'}</Badge>{apt.status_agendamento === 'CON' && <Badge className="bg-blue-100 text-blue-700 border-none">Presente</Badge>}</div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {apt.doador?.telefone || apt.user?.telefone}</span>{hasTriagem && <span className={`flex items-center gap-1 font-medium ${isApto ? 'text-green-600' : 'text-red-600'}`}>{isApto ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}Triagem {isApto ? 'Apto' : 'Inapto'}</span>}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {apt.status_agendamento === 'AGE' && <Button onClick={() => handleConfirmPresence(apt.id)} size="sm" className="bg-blue-600 hover:bg-blue-700">Check-in</Button>}
                            {apt.status_agendamento === 'CON' && !hasTriagem && <Button onClick={() => { setSelectedAppointment(apt); setTriagemDialogOpen(true); }} size="sm" className="bg-orange-500 hover:bg-orange-600 gap-2"><Stethoscope className="h-4 w-4" /> Triagem</Button>}
                            {isApto && !hasDoacao && <Button onClick={() => { setSelectedAppointment(apt); setDonationDialogOpen(true); }} size="sm" className="bg-green-600 hover:bg-green-700 gap-2"><Droplet className="h-4 w-4" /> Coleta</Button>}
                            {hasDoacao && <Badge className="bg-green-100 text-green-700 py-2 px-3 border-none font-bold">✓ Concluído</Badge>}
                            {!hasDoacao && apt.status_agendamento !== 'CAN' && <Button onClick={() => handleCancelAppointment(apt.id)} size="sm" variant="ghost" className="text-gray-400 hover:text-red-600"><XCircle className="h-4 w-4" /></Button>}
                          </div>
=======
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando agendamentos...</div>
                ) : filteredAgendamentos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum agendamento para hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAgendamentos.map((agend: any) => {
                      const { hora } = formatDataHora(agend);
                      const statusInfo = getStatusLabel(agend.status);
                      const ativo = ['AGE', 'CON'].includes(agend.status);
                      return (
                        <div key={agend.id} className={`p-4 border rounded-lg ${agend.status === 'FIN' ? 'bg-green-50 border-green-200' : agend.status === 'CAN' ? 'bg-gray-50 border-gray-200' : 'bg-white'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-3 rounded-lg border-2 border-blue-600 text-center min-w-[60px]">
                                <p className="text-lg font-bold text-blue-600">{hora}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-lg">{agend.user?.name || `Doador #${agend.user_id}`}</p>
                                  {agend.user?.tipo_sang && (
                                    <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">
                                      {agend.user.tipo_sang}
                                    </Badge>
                                  )}
                                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                </div>
                                {agend.user?.telefone && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />{agend.user.telefone}
                                  </p>
                                )}
                                {agend.status === 'FIN' && (
                                  <p className="text-sm text-green-600 font-semibold mt-1">✓ Doação finalizada</p>
                                )}
                                {agend.status === 'CAN' && (
                                  <p className="text-sm text-gray-500 font-semibold mt-1">✗ Cancelada</p>
                                )}
                              </div>
                            </div>
                            {ativo && (
                              <div className="flex gap-2 flex-wrap">
                                {agend.status === 'AGE' && (
                                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleConfirmar(agend)}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />Confirmar
                                  </Button>
                                )}
                                <Button size="sm" className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAbrirTriagem(agend)}>
                                  <Activity className="h-4 w-4 mr-1" />Registrar Doação
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50"
                                  onClick={() => handleAbrirCancelar(agend)}>
                                  <XCircle className="h-4 w-4 mr-1" />Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Estoque ── */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Sangue</CardTitle>
                <CardDescription>Monitoramento por tipo sanguíneo — dados locais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {stock.map(item => {
                    const pct = Math.round((item.current / item.max) * 100);
                    const critico = item.current < item.min;
                    const baixo   = !critico && pct < 50;
                    return (
                      <div key={item.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div>
                            <div><p className="text-2xl font-bold">{item.type}</p><p className="text-sm text-gray-600">Tipo sanguíneo</p></div>
                          </div>
                          <Badge className={critico ? 'bg-red-100 text-red-600' : baixo ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                            {critico ? 'Crítico' : baixo ? 'Baixo' : 'Normal'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estoque atual</span>
                            <span className="font-semibold">{item.current} bolsas</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${critico ? 'bg-red-600' : baixo ? 'bg-orange-500' : 'bg-green-600'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {item.min}</span><span>Máx: {item.max}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenUpdateStock(item.type)}>
                            <Activity className="h-4 w-4 mr-2" />Atualizar Estoque
                          </Button>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed"><CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum agendamento para este dia.</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

<<<<<<< HEAD
          {/* ESTOQUE E DOADORES */}
          <TabsContent value="stock" className="space-y-6">
            <Card><CardHeader><CardTitle>Estoque de Sangue</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-4">{stock.map((s) => {
              const status = getStockStatus(s.current, s.min, s.max);
              return (
                <div key={s.type} className="p-4 border rounded-lg"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{s.type}</p></div></div><Badge className={status.bgColor + ' ' + status.textColor}>{status.label}</Badge></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(s.current/s.max)*100}%` }} /></div><Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleOpenUpdateStock(s.type)}>Atualizar Estoque</Button></div>
              );
            })}</div></CardContent></Card>
          </TabsContent>
          <TabsContent value="donors" className="space-y-6">
            <Card><CardHeader><CardTitle>Buscar Doador</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><Input placeholder="CPF ou Nome" /><Button className="bg-blue-600 hover:bg-blue-700"><Search className="h-4 w-4 mr-2" /> Buscar</Button></div></CardContent></Card>
=======
          {/* ── Doadores ── */}
          <TabsContent value="donors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Doador</CardTitle>
                <CardDescription>Busque doadores para visualizar e editar informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome ou CPF</Label>
                    <Input placeholder="Digite o nome ou CPF" value={donorSearchTerm}
                      onChange={e => setDonorSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchDonor()} />
                  </div>
                  <div>
                    <Label>Tipo Sanguíneo</Label>
                    <Select
                        value={donorBloodTypeFilter || 'todos'}
                        onValueChange={v => setDonorBloodTypeFilter(v === 'todos' ? '' : v)}
                        >
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                          {tiposSanguineos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSearchDonor}>
                    <Search className="h-4 w-4 mr-2" />Buscar
                  </Button>
                  {searchPerformed && (
                    <Button variant="outline" onClick={() => {
                      setDonorSearchTerm(''); setDonorBloodTypeFilter('');
                      setDonorResult([]); setSearchPerformed(false);
                    }}>
                      <XCircle className="h-4 w-4 mr-2" />Limpar
                    </Button>
                  )}
                </div>

                {searchPerformed && (
                  <div className="pt-2">
                    {donorResult.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-dashed border-2 rounded-lg">
                        <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum doador encontrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {donorResult.map((donor: any) => (
                          <div key={donor.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar>
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {donor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{donor.name}</p>
                                    {donor.tipo_sang && (
                                      <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">
                                        {donor.tipo_sang}
                                      </Badge>
                                    )}
                                    <Badge className={donor.status === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                                      {donor.status === 1 ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    {donor.email && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />{donor.email}
                                      </p>
                                    )}
                                    {donor.telefone && (
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" />{donor.telefone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleAbrirEditDonor(donor)}>
                                <Edit className="h-4 w-4 mr-1" />Editar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
          </TabsContent>
        </Tabs>
      </main>

<<<<<<< HEAD
      {/* MODAIS */}
      <Dialog open={triagemDialogOpen} onOpenChange={setTriagemDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Triagem Médica</DialogTitle><DialogDescription>Doador: {selectedAppointment?.doador?.name || selectedAppointment?.user?.name}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><div className="space-y-2"><Label>O doador está apto?</Label><Select value={triagemData.apto} onValueChange={(v) => setTriagemData({...triagemData, apto: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim, está apto</SelectItem><SelectItem value="false">Não, está inapto</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Observações</Label><Textarea value={triagemData.observacoes} onChange={(e) => setTriagemData({...triagemData, observacoes: e.target.value})} placeholder="Observações da triagem..." /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setTriagemDialogOpen(false)}>Cancelar</Button><Button onClick={handleRegisterTriagem} className="bg-blue-600 hover:bg-blue-700">Salvar Triagem</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Registrar Coleta</DialogTitle><DialogDescription>Doador: {selectedAppointment?.doador?.name || selectedAppointment?.user?.name}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Tipo Sangue</Label><Input value={selectedAppointment?.doador?.tipo_sang || selectedAppointment?.user?.tipo_sang} readOnly className="bg-gray-50 font-bold" /></div><div className="space-y-2"><Label>Quantidade (ml)</Label><Input type="number" value={donationData.quantidade} onChange={(e) => setDonationData({...donationData, quantidade: e.target.value})} /></div></div>
        <div className="space-y-2"><Label>Data de Validade</Label><Input type="date" value={donationData.data_validade} onChange={(e) => setDonationData({...donationData, data_validade: e.target.value})} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setDonationDialogOpen(false)}>Cancelar</Button><Button onClick={handleRegisterDonation} className="bg-green-600 hover:bg-green-700">Concluir Doação</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Atualizar Estoque</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4"><Select value={stockAction} onValueChange={(v) => setStockAction(v as 'add' | 'remove')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="add">Adicionar</SelectItem><SelectItem value="remove">Remover</SelectItem></SelectContent></Select><Input type="number" placeholder="Quantidade" value={stockAmount} onChange={(e) => setStockAmount(e.target.value)} /></div>
        <DialogFooter><Button onClick={handleUpdateStock} className="bg-blue-600">Confirmar</Button></DialogFooter></DialogContent></Dialog>
=======
      {/* ═══ DIALOGS ═══════════════════════════════════════════════════════════ */}

      {/* Cancelar Agendamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Cancelar Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAgendamento && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedAgendamento.user?.name}</p>
                <p className="text-gray-600">{formatDataHora(selectedAgendamento).hora}</p>
              </div>
            )}
            <div>
              <Label>Motivo do Cancelamento *</Label>
              <Select value={cancelMotivo} onValueChange={setCancelMotivo}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
                  <SelectItem value="inaptidao">Inaptidão clínica</SelectItem>
                  <SelectItem value="nao_elegivel">Não elegível</SelectItem>
                  <SelectItem value="solicitacao_doador">Solicitação do doador</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Voltar</Button>
            <Button onClick={handleConfirmarCancelamento} className="bg-red-600 hover:bg-red-700">
              <XCircle className="h-4 w-4 mr-2" />Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar Doação / Triagem */}
      <Dialog open={triagemDialogOpen} onOpenChange={setTriagemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Registrar Doação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAgendamento && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedAgendamento.user?.name}</p>
                <p className="text-gray-600">
                  Tipo: <strong>{selectedAgendamento.user?.tipo_sang || 'Não informado'}</strong>
                  {' '}• {formatDataHora(selectedAgendamento).hora}
                </p>
              </div>
            )}

            <div>
              <Label>Aptidão para Doação *</Label>
              <Select
                value={triagemData.apto ? 'true' : 'false'}
                onValueChange={v => setTriagemData({ ...triagemData, apto: v === 'true', motivo_inaptidao: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Apto — doação realizada</SelectItem>
                  <SelectItem value="false">❌ Inapto — doação não realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {triagemData.apto && (
              <div>
                <Label>Volume Coletado (ml)</Label>
                <Input type="number" min="100" max="600" value={triagemData.ml_coletados}
                  onChange={e => setTriagemData({ ...triagemData, ml_coletados: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Padrão: 450ml</p>
              </div>
            )}

            {!triagemData.apto && (
              <div>
                <Label>Motivo da Inaptidão *</Label>
                <Select value={triagemData.motivo_inaptidao}
                  onValueChange={v => setTriagemData({ ...triagemData, motivo_inaptidao: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pressao_arterial">Pressão arterial alterada</SelectItem>
                    <SelectItem value="hemoglobina_baixa">Hemoglobina baixa</SelectItem>
                    <SelectItem value="febre">Febre</SelectItem>
                    <SelectItem value="medicamento">Uso de medicamento</SelectItem>
                    <SelectItem value="tatuagem_recente">Tatuagem/piercing recente</SelectItem>
                    <SelectItem value="cirurgia_recente">Cirurgia recente</SelectItem>
                    <SelectItem value="doacao_recente">Doação recente (intervalo mínimo)</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Input placeholder="Observações adicionais (opcional)" value={triagemData.observacoes}
                onChange={e => setTriagemData({ ...triagemData, observacoes: e.target.value })} />
            </div>

            {!triagemData.apto && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>O agendamento será finalizado e o doador notificado sobre a inaptidão.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriagemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarTriagem}
              className={triagemData.apto ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {triagemData.apto ? 'Confirmar Doação' : 'Registrar Inaptidão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Doador */}
      <Dialog open={editDonorDialogOpen} onOpenChange={setEditDonorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Doador</DialogTitle></DialogHeader>
          {selectedDonor && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedDonor.name}</p>
                <p className="text-gray-600">{selectedDonor.email}</p>
              </div>
              <div>
                <Label>Tipo Sanguíneo</Label>
                <Select value={editDonorData.tipo_sang} onValueChange={v => setEditDonorData({ ...editDonorData, tipo_sang: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tiposSanguineos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={editDonorData.telefone}
                  onChange={e => setEditDonorData({ ...editDonorData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editDonorData.status} onValueChange={v => setEditDonorData({ ...editDonorData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ativo</SelectItem>
                    <SelectItem value="0">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Restrição até (data)</Label>
                <Input type="date" value={editDonorData.tempo_restricao}
                  onChange={e => setEditDonorData({ ...editDonorData, tempo_restricao: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} />
                <p className="text-xs text-gray-400 mt-1">Deixe em branco para não alterar</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDonorDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarDonor} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atualizar Estoque */}
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Atualizar Estoque — {selectedBloodType}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={v => setStockAction(v as 'add' | 'remove')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-600" />Adicionar</div></SelectItem>
                  <SelectItem value="remove"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-red-600" />Remover</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade (bolsas)</Label>
              <Input type="number" min="1" value={stockAmount} onChange={e => setStockAmount(e.target.value)} />
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              Estoque atual de <strong>{selectedBloodType}</strong>:{' '}
              <strong>{stock.find(s => s.type === selectedBloodType)?.current} bolsas</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStockDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStock}
              className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {stockAction === 'add' ? <><Plus className="h-4 w-4 mr-2" />Adicionar</> : <><Minus className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
    </div>
  );
}
