import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarUI } from '../ui/calendar';
import {
  Droplet,
  Calendar,
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
  Edit,
  AlertCircle,
  Stethoscope,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tiposSanguineos = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const extractApiObject = (payload: any, keys: string[] = []) => {
  const candidates = [
    ...keys.map((key) => payload?.[key]),
    ...keys.map((key) => payload?.data?.[key]),
    payload?.data,
    payload,
  ];

  return candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || {};
};

const getStatus = (agendamento: any) => String(agendamento?.status_agendamento || agendamento?.status || '').toUpperCase();

const getDateKey = (value: any) => {
  const raw = String(value || '');
  const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return brMatch ? `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}` : '';
};

const getAppointmentDonor = (agendamento: any) =>
  agendamento?.doador || agendamento?.user || agendamento?.usuario || agendamento?.donor || null;

const getAppointmentUserId = (agendamento: any) =>
  agendamento?.user_id || agendamento?.doador_id || getAppointmentDonor(agendamento)?.id;

const getHemocentroId = (source: any) =>
  source?.hemocentro_id || source?.hemocentro?.id || source?.hemocenterId;

const emptyStaffStats = {
  agendamentos_hoje: 0,
  confirmados_hoje: 0,
  doacoes_mes: 0,
  estoque_critico: [] as string[],
  agendamentos_semana: {} as Record<string, number>,
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function StaffDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  // ── Estado: dados da API
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [doadores, setDoadores] = useState<any[]>([]);
  const [stats, setStats] = useState(emptyStaffStats);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Estado: API de Estoque
  const [stock, setStock] = useState<any[]>([]);

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

  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');

  // ─── Guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role_id !== 2 && !user.roles?.includes('funcionario')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [agendRes, usersRes, stockRes, statsRes] = await Promise.all([
        api.get('/agendamentos'),
        api.get('/users'),
        api.get('/estoque'),
        api.get('/estatisticas/funcionario'),
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

      // Mapeia estoque da API
      const stockData = Array.isArray(stockRes.data) ? stockRes.data : stockRes.data.data ?? [];
      setStock(stockData.map((s: any) => ({
        id: s.id,
        type: s.tipo_sangue,
        current: Number(s.quantidade),
        min: Number(s.quantidade_minima || 0),
        max: 100 // Valor padrão se não vier da API
      })));
      setStats({ ...emptyStaffStats, ...statsRes.data });
    } catch (err: any) {
      console.error('Erro ao carregar:', err.response?.data);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user || (user.role_id !== 2 && !user.roles?.includes('funcionario'))) return null;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const hemocentroNome = user.hemocentro?.nome || user.hemocentroName || `Hemocentro #${user.hemocentro_id}`;

  const formatDataHora = (agendamento: any) => {
    const campo = agendamento.data_hora_doacao || agendamento.data;
    if (!campo) return { data: '-', hora: '-' };
    try {
      const d = parseISO(campo.includes('T') ? campo : campo.replace(' ', 'T'));
      return {
        data: format(d, "dd/MM/yyyy", { locale: ptBR }),
        hora: format(d, 'HH:mm'),
      };
    } catch { return { data: campo, hora: '-' }; }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      AGE: { label: 'Agendado',   color: 'bg-blue-100 text-blue-600'   },
      CON: { label: 'Confirmado', color: 'bg-green-100 text-green-600' },
      CAN: { label: 'Cancelado',  color: 'bg-red-100 text-red-600'     },
      FIN: { label: 'Finalizado', color: 'bg-gray-100 text-gray-600'   },
      DOA: { label: 'Doação realizada', color: 'bg-green-600 text-white' },
      E:   { label: 'Reagendado', color: 'bg-yellow-100 text-yellow-600'},
    };
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  const isDoacaoRealizada = (agendamento: any) => {
    const status = getStatus(agendamento);
    return status === 'FIN' || status === 'DOA' || status === 'REALIZADA' || !!agendamento.doacao_id || !!agendamento.doacao || !!agendamento.doacao_realizada;
  };

  const getAgendaCardClass = (agendamento: any) => {
    const status = getStatus(agendamento);
    if (isDoacaoRealizada(agendamento)) return 'bg-green-50 border-green-500 ring-1 ring-green-100';
    if (status === 'CAN') return 'bg-gray-50 border-gray-200';
    return 'bg-white border-gray-200 hover:border-blue-300 shadow-sm';
  };

  const canReabrirAgendamento = (agendamento: any) => {
    if (getStatus(agendamento) !== 'CAN') return false;
    const dataKey = getDateKey(agendamento.data_hora_doacao || agendamento.data);
    if (!dataKey) return true;
    return new Date(`${dataKey}T23:59:59`).getTime() >= Date.now();
  };

  // Filtragem por data e busca
  const filteredAgendamentos = agendamentos.filter((a: any) => {
    const dataCampo = a.data_hora_doacao || a.data;
    if (!dataCampo) return false;
    const aptDate = parseISO(dataCampo.includes('T') ? dataCampo : dataCampo.replace(' ', 'T'));
    const matchesDate = isSameDay(aptDate, selectedDate);
    const doador = getAppointmentDonor(a);
    const matchesSearch = (doador?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (doador?.tipo_sang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (doador?.cpf || '').includes(searchTerm.replace(/\D/g, ''));
    return matchesDate && matchesSearch;
  }).sort((a, b) => {
    const dA = new Date(a.data_hora_doacao || a.data).getTime();
    const dB = new Date(b.data_hora_doacao || b.data).getTime();
    return dA - dB;
  });

  const agendamentosHoje = agendamentos.filter((a: any) => {
    const dataCampo = a.data_hora_doacao || a.data;
    if (!dataCampo) return false;
    const data = dataCampo.split('T')[0].split(' ')[0];
    return data === format(new Date(), 'yyyy-MM-dd');
  });

  const concluidos = stats.confirmados_hoje;
  const pendentes = Math.max(stats.agendamentos_hoje - stats.confirmados_hoje, 0);

  // ─── Handlers: Agendamentos ───────────────────────────────────────────────

  const handleConfirmar = async (agend: any) => {
    try {
      await api.post(`/auth/agendamentos/${agend.id}/confirmar`);
      toast.success('Check-in realizado!');
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
      await api.post(`/auth/agendamentos/${selectedAgendamento.id}/cancelar`, { motivo_cancelamento: cancelMotivo });
      toast.success('Agendamento cancelado!');
      setCancelDialogOpen(false);
      setSelectedAgendamento(null);
      fetchData();
    } catch { toast.error('Erro ao cancelar agendamento'); }
  };

  const handleReabrirAgendamento = async (agend: any) => {
    try {
      await api.post(`/auth/agendamentos/${agend.id}/reabrir`);
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === agend.id ? { ...item, status: 'AGE', status_agendamento: 'AGE' } : item
        )
      );
      toast.success('Agendamento reaberto!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao reabrir agendamento.');
    }
  };

  const handleAbrirTriagem = (agend: any) => {
    setSelectedAgendamento(agend);
    setTriagemData({ apto: true, motivo_inaptidao: '', observacoes: '', ml_coletados: '450' });
    setTriagemDialogOpen(true);
  };

  const handleRegistrarTriagem = async () => {
    if (!selectedAgendamento) return;
    try {
      const doador = getAppointmentDonor(selectedAgendamento);
      const agendamentoId = selectedAgendamento.id;
      const userId = getAppointmentUserId(selectedAgendamento);
      const hemocentroId = getHemocentroId(selectedAgendamento) || getHemocentroId(user);

      const triagemRes = await api.post('/auth/triagens', {
        agendamento_id: agendamentoId,
        user_id:       userId,
        hemocentro_id: hemocentroId,
        data_triagem:  new Date().toISOString().split('T')[0],
        apto:          triagemData.apto,
        motivo_inaptidao: !triagemData.apto ? triagemData.motivo_inaptidao : null,
        observacoes:   triagemData.observacoes || null,
      });

      if (triagemData.apto) {
        const triagem = extractApiObject(triagemRes.data, ['triagem']);
        const triagemId = triagem.id || triagem.triagem_id;

        if (!triagemId) {
          throw new Error('A API não retornou o ID da triagem criada.');
        }

        await api.post('/auth/doacoes', {
          agendamento_id: agendamentoId,
          triagem_id: triagemId,
          user_id: userId,
          hemocentro_id: hemocentroId,
          data_hora_doacao: new Date().toISOString().replace('T', ' ').split('.')[0],
          tipo_sangue: doador?.tipo_sang || 'O+',
          quantidade: Number(triagemData.ml_coletados),
          data_validade_sangue: format(new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        });
      }

      await api.post(`/auth/agendamentos/${selectedAgendamento.id}/confirmar`);

      toast.success(triagemData.apto ? 'Doação registrada com sucesso!' : 'Triagem registrada — doador inapto');
      setTriagemDialogOpen(false);
      setSelectedAgendamento(null);
      setAgendamentos((prev) =>
        prev.map((agendamento) =>
          agendamento.id === selectedAgendamento.id
            ? { ...agendamento, status: 'FIN', status_agendamento: 'FIN', doacao_realizada: triagemData.apto }
            : agendamento
        )
      );
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

  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Digite uma quantidade válida');
      return;
    }
    const amount = parseInt(stockAmount);
    const valueToSend = stockAction === 'add' ? amount : -amount;

    try {
      await api.post('/auth/estoque', {
        hemocentro_id: user.hemocentro_id,
        tipo_sangue: selectedBloodType,
        quantidade: valueToSend,
      });

      toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} — ${selectedBloodType}`);
      setUpdateStockDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar estoque: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  const handleLogoutClick = () => { logout(); navigate('/'); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Funcionário</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
            </Button>
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-600">{hemocentroNome}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogoutClick} className="gap-2">
              <LogOut className="h-4 w-4" /><span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name?.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">{hemocentroNome} — Gerencie as doações e o estoque</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3"><CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.agendamentos_hoje}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-blue-600" /><span>Do seu hemocentro</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3"><CardDescription>Concluídos (Hoje)</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : concluidos}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-green-600" /><span>{concluidos * 450}ml coletados</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3"><CardDescription>Pendentes (Hoje)</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : pendentes}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4 text-orange-600" /><span>Aguardando atendimento</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3"><CardDescription>Doações do Mês</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.doacoes_mes}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4 text-purple-600" /><span>Registradas no hemocentro</span></div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="donors">Doadores</TabsTrigger>
          </TabsList>

          {/* ── Agenda ── */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Agenda de Doações</CardTitle>
                    <CardDescription>{filteredAgendamentos.length} agendamentos listados</CardDescription>
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
                    <Input placeholder="Buscar doador..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando agendamentos...</div>
                ) : filteredAgendamentos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum agendamento encontrado para este dia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAgendamentos.map((agend: any) => {
                      const { hora } = formatDataHora(agend);
                      const statusAgend = getStatus(agend);
                      const doador = getAppointmentDonor(agend);
                      const doacaoRealizada = isDoacaoRealizada(agend);
                      const statusInfo = doacaoRealizada
                        ? { label: 'Doação realizada', color: 'bg-green-600 text-white' }
                        : getStatusLabel(statusAgend);
                      const ativo = !doacaoRealizada && ['AGE', 'CON'].includes(statusAgend);
                      const podeReabrir = canReabrirAgendamento(agend);
                      return (
                        <div key={agend.id} className={`p-4 border rounded-lg transition-all ${getAgendaCardClass(agend)}`}>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`${doacaoRealizada ? 'bg-white border-2 border-green-600' : 'bg-blue-600 text-white'} p-3 rounded-lg shadow-lg text-center min-w-[60px]`}>
                                <p className={`text-lg font-bold ${doacaoRealizada ? 'text-green-700' : ''}`}>{hora}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-lg text-gray-900">{doador?.name || `Doador #${agend.user_id}`}</p>
                                  {doador?.tipo_sang && (
                                    <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">
                                      {doador.tipo_sang}
                                    </Badge>
                                  )}
                                  <Badge className={statusInfo.color + " border-none"}>{statusInfo.label}</Badge>
                                </div>
                                {doador?.telefone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />{doador.telefone}
                                  </p>
                                )}
                                {doacaoRealizada && (
                                  <p className="text-sm text-green-600 font-semibold mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Doação realizada
                                  </p>
                                )}
                                {statusAgend === 'CAN' && (
                                  <p className="text-sm text-gray-500 font-semibold mt-1 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Cancelada
                                  </p>
                                )}
                              </div>
                            </div>
                            {ativo && (
                              <div className="flex gap-2 flex-wrap">
                                {statusAgend === 'AGE' && (
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleConfirmar(agend)}>
                                    Check-in
                                  </Button>
                                )}
                                {statusAgend === 'CON' && (
                                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-2"
                                    onClick={() => handleAbrirTriagem(agend)}>
                                    <Stethoscope className="h-4 w-4" /> Triagem
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600"
                                  onClick={() => handleAbrirCancelar(agend)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {!ativo && podeReabrir && (
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="border-blue-600 text-blue-600" onClick={() => handleReabrirAgendamento(agend)}>
                                  <RotateCcw className="h-4 w-4 mr-1" />Reabrir
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
                    const critico = item.current < item.min;
                    return (
                      <div key={item.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div>
                            <div><p className="text-2xl font-bold">{item.type}</p><p className="text-sm text-gray-600">Tipo sanguíneo</p></div>
                          </div>
                          <Badge className={critico ? 'bg-red-100 text-red-600' : item.current < item.min * 1.5 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                            {critico ? 'Crítico' : item.current < item.min * 1.5 ? 'Baixo' : 'Normal'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estoque atual</span>
                            <span className="font-semibold">{item.current} bolsas</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${critico ? 'bg-red-600' : item.current < item.min * 1.5 ? 'bg-orange-500' : 'bg-green-600'}`}
                              style={{ width: `${Math.min((item.current / item.max) * 100, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {item.min}</span><span>Máx: {item.max}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenUpdateStock(item.type)}>
                            <Activity className="h-4 w-4 mr-2" />Atualizar Estoque
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                                    {donor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
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
          </TabsContent>
        </Tabs>
      </main>

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
          <DialogHeader>
            <DialogTitle>Triagem Médica e Coleta</DialogTitle>
            <DialogDescription>Doador: {selectedAgendamento?.user?.name}</DialogDescription>
          </DialogHeader>
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
              <Textarea placeholder="Observações da triagem..." value={triagemData.observacoes}
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
    </div>
  );
}
