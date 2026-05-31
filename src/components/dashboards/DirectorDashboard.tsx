import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { buildDashboardNotifications } from '../../services/dashboard-notifications';
import {
  Droplet, Calendar, Users, LogOut, Bell, TrendingUp, Activity,
  UserCheck, BarChart3, Download, UserPlus, Plus, Minus,
  FileText, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ─── Mocks (sem API equivalente) ─────────────────────────────────────────────

const monthlyDonations = [
  { month: 'Jan', donations: 245 },
  { month: 'Fev', donations: 289 },
  { month: 'Mar', donations: 267 },
  { month: 'Abr', donations: 312 },
  { month: 'Mai', donations: 298 },
  { month: 'Jun', donations: 325 },
];

const bloodTypeDistribution = [
  { name: 'O+', value: 35, color: '#DC2626' },
  { name: 'A+', value: 28, color: '#EA580C' },
  { name: 'B+', value: 18, color: '#CA8A04' },
  { name: 'AB+', value: 8, color: '#16A34A' },
  { name: 'O-', value: 5, color: '#2563EB' },
  { name: 'A-', value: 3, color: '#7C3AED' },
  { name: 'B-', value: 2, color: '#DB2777' },
  { name: 'AB-', value: 1, color: '#0891B2' },
];

const emptyDirectorStats = {
  agendamentos_hoje: 0,
  confirmados_hoje: 0,
  doacoes_mes: 0,
  estoque_critico: [] as string[],
  agendamentos_semana: {} as Record<string, number>,
  doacoes_por_mes: [] as Array<{ mes: string; total: number }>,
  doacoes_por_tipo: {} as Record<string, number>,
  total_doadores_ativos: 0,
};

const roleLabels: Record<number, string> = {
  1: 'Doador', 2: 'Funcionário', 3: 'Diretor', 4: 'Admin',
};

const roleNames: Record<string, string> = {
  '1': 'doador',
  '2': 'funcionario',
  '3': 'diretor',
  '4': 'admin',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function DirectorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  // ── Estado: dados da API
  const [hemocentros, setHemocentros] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [agendamentosHoje, setAgendamentosHoje] = useState<any[]>([]);
  const [doacoes, setDoacoes] = useState<any[]>([]);
  const [stats, setStats] = useState(emptyDirectorStats);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // ── Estado: API de Estoque
  const [stock, setStock] = useState<any[]>([]);

  // ── Dialogs
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteStaffDialogOpen, setDeleteStaffDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  // ── Formulário novo funcionário
  const [newStaff, setNewStaff] = useState({
    name: '', email: '', cpf: '', password: '', role_id: '2',
  });

  // ── Estoque
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');

  // ── Relatório
  const [reportType, setReportType] = useState('');
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // ─── Guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role_id !== 3 && !user.roles?.includes('diretor')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [hemocentrosRes, usersRes, agendRes, doacoesRes, stockRes, statsRes] = await Promise.all([
        api.get('/hemocentros'),
        api.get('/users'),
        api.get('/agendamentos'),
        api.get('/doacoes'),
        api.get('/estoque'),
        api.get('/estatisticas/diretor'),
      ]);

      setHemocentros(Array.isArray(hemocentrosRes.data) ? hemocentrosRes.data : hemocentrosRes.data.data ?? []);

      const todosUsers = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.data ?? [];

      // Filtra por mesmo hemocentro e papéis de staff/diretor
      const staff = todosUsers.filter(
        (u: any) =>
          Number(u.hemocentro_id) === Number(user.hemocentro_id) &&
          ([2, 3].includes(Number(u.role_id)) || (u.role_id === null && u.hemocentro_id !== null))
      );
      setStaffList(staff);

      const hoje = new Date().toISOString().split('T')[0];
      const agends = Array.isArray(agendRes.data)
        ? agendRes.data
        : agendRes.data.data ?? [];

      const agendHoje = agends.filter((a: any) => {
        const dataAgend = (a.data_hora_doacao || a.data)?.split('T')[0].split(' ')[0];
        return dataAgend === hoje && Number(a.hemocentro_id) === Number(user.hemocentro_id);
      });

      setAgendamentosHoje(agendHoje);

      const doacoesData = Array.isArray(doacoesRes.data)
        ? doacoesRes.data
        : doacoesRes.data.data ?? [];
      setDoacoes(doacoesData.filter((doacao: any) => Number(doacao.hemocentro_id) === Number(user.hemocentro_id)));

      // Mapeia estoque da API
      const stockDataRaw = Array.isArray(stockRes.data) ? stockRes.data : stockRes.data.data ?? [];
      const myStock = stockDataRaw.filter((s: any) => Number(s.hemocentro_id) === Number(user.hemocentro_id));
      setStock(myStock.map((s: any) => ({
        id: s.id,
        type: s.tipo_sangue,
        current: Number(s.quantidade),
        min: Number(s.quantidade_minima || 0),
        max: 150
      })));
      setStats({ ...emptyDirectorStats, ...statsRes.data });

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err.response?.data);
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user || (user.role_id !== 3 && !user.roles?.includes('diretor'))) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLogoutClick = () => { logout(); navigate('/'); toast.success('Logout realizado'); };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.cpf || !newStaff.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user.hemocentro_id) {
      toast.error('Erro: diretor não está vinculado a um hemocentro');
      return;
    }

    try {
      const payload = {
        name: newStaff.name,
        email: newStaff.email,
        cpf: newStaff.cpf.replace(/\D/g, ''),
        password: newStaff.password,
        role_id: Number(newStaff.role_id),
        role: roleNames[newStaff.role_id],
        hemocentro_id: Number(user.hemocentro_id),
      };

      await api.post('/auth/users', payload);
      toast.success(`Funcionário ${newStaff.name} criado com sucesso!`);
      setAddStaffDialogOpen(false);
      setNewStaff({ name: '', email: '', cpf: '', password: '', role_id: '2' });
      await fetchData();
    } catch (err: any) {
      const erros = err.response?.data?.errors;
      if (erros) {
        toast.error(Object.values(erros).flat().join('\n'));
      } else {
        toast.error(err.response?.data?.message || 'Erro ao criar funcionário');
      }
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await api.delete(`/users/${staffToDelete.id}`);
      toast.success('Funcionário removido!');
      setDeleteStaffDialogOpen(false);
      setStaffToDelete(null);
      fetchData();
    } catch {
      toast.error('Erro ao remover funcionário');
    }
  };

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


  const handleExportReport = async () => {
    if (!reportType) { toast.error('Selecione um tipo de relatório'); return; }

    const endpoints: Record<string, string> = {
      doacoes:      '/relatorios/doacoes/pdf',
      estoque:      '/relatorios/estoque/pdf',
      doadores:     '/relatorios/doadores/pdf',
      agendamentos: '/relatorios/agendamentos/pdf',
      triagens:     '/relatorios/triagens/pdf',
    };

    const nomes: Record<string, string> = {
      doacoes:      'doacoes',
      estoque:      'estoque',
      doadores:     'doadores',
      agendamentos: 'agendamentos',
      triagens:     'triagens',
    };

    const endpoint = endpoints[reportType];
    if (!endpoint) { toast.error('Tipo não disponível'); return; }

    setIsDownloadingReport(true);
    toast.info('Gerando relatório PDF...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${nomes[reportType]}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório gerado com sucesso!');
      setExportDialogOpen(false);
      setReportType('');
    } catch {
      toast.error('Erro ao gerar relatório. Verifique se o servidor está rodando.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // ─── Computados ───────────────────────────────────────────────────────────
  const hemocentroNomeResolvido =
    user.hemocentro?.nome ||
    user.hemocentroName ||
    hemocentros.find((hemocentro: any) => Number(hemocentro.id) === Number(user.hemocentro_id))?.nome ||
    '';
  const hemocentroNome = hemocentroNomeResolvido
    ? `Hemocentro ${hemocentroNomeResolvido}`
    : 'Hemocentro vinculado';
  const notifications = useMemo(() => buildDashboardNotifications({
    hemocentroId: Number(user?.hemocentro_id),
    doacoes,
    agendamentos: agendamentosHoje,
    users: staffList,
    hemocentros,
  }), [user?.hemocentro_id, doacoes, agendamentosHoje, staffList, hemocentros]);
  const notificationsKey = notifications.map((notification) => `${notification.id}:${notification.timeLabel}`).join('|');

  useEffect(() => {
    setHasUnreadNotifications(notifications.length > 0);
  }, [notificationsKey]);
  const agendConcluidos = agendamentosHoje.filter(
    (a: any) => ['FIN', 'concluido', 'Finalizado'].includes(a.status || a.status_agendamento)
  ).length;
  const staffOnline = staffList.filter((s: any) => s.status === 1 || s.status === 'ativo').length;
  const monthlyStats = stats.doacoes_por_mes.length
    ? stats.doacoes_por_mes.map(item => ({ month: item.mes, donations: item.total }))
    : monthlyDonations;
  const bloodTypeStats = Object.keys(stats.doacoes_por_tipo || {}).length
    ? Object.entries(stats.doacoes_por_tipo).map(([name, value]) => ({
        name,
        value: Number(value),
        color: bloodTypeDistribution.find(d => d.name === name)?.color || '#DC2626',
      }))
    : bloodTypeDistribution;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Diretor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Popover
              open={notificationsOpen}
              onOpenChange={(open) => {
                setNotificationsOpen(open);
                if (open) {
                  setHasUnreadNotifications(false);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-purple-600 text-white rounded-full text-[10px] flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Atualizações do hemocentro</p>
                  <p className="text-xs text-gray-500">{hemocentroNome}</p>
                </div>
                <div className="divide-y">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      Nenhuma atualização recente disponível.
                    </div>
                  ) : notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.description}</p>
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{notification.timeLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Avatar>
              <AvatarFallback className="bg-purple-100 text-purple-600">
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600">{hemocentroNome} — Gerenciamento completo</p>
          </div>
          <Button onClick={() => setExportDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4" />Exportar Relatório
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Doações Este Mês</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.doacoes_mes}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" /><span>+8% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Equipe no Hemocentro</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : staffList.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{staffList.length} cadastrados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.agendamentos_hoje}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>{agendConcluidos} concluídos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardDescription>Estoque Crítico</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {stats.estoque_critico.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Droplet className="h-4 w-4" />
                <span>tipos abaixo do mínimo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="staff">Funcionários</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* ── Visão Geral ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Doações</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" /><YAxis />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="donations" stroke="#9333EA" strokeWidth={2} name="Doações" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo Sanguíneo</CardTitle>
                  <CardDescription>Doações do mês atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bloodTypeStats}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {bloodTypeStats.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: string) => [`${value} bolsas`, name]}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3"><CardDescription>Taxa de Comparecimento</CardDescription><CardTitle className="text-3xl">87%</CardTitle></CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-green-600" style={{ width: '87%' }} /></div>
                  <p className="text-sm text-gray-600 mt-2">218 de 250 agendamentos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardDescription>Média Diária</CardDescription><CardTitle className="text-3xl">15.2</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-600">doações por dia útil</p><p className="text-sm text-green-600 mt-1">↑ 12% vs mês anterior</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardDescription>Satisfação</CardDescription><CardTitle className="text-3xl">4.8</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-600">de 5.0 estrelas</p><p className="text-sm text-gray-600 mt-1">baseado em 156 avaliações</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Funcionários ── */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Equipe do Hemocentro</CardTitle>
                    <CardDescription>Funcionários e Diretores vinculados a {hemocentroNome}</CardDescription>
                  </div>
                  <Button onClick={() => setAddStaffDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="h-4 w-4" />Adicionar Funcionário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando equipe...</div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum funcionário cadastrado neste hemocentro.</div>
                ) : (
                  <div className="space-y-3">
                    {staffList.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] h-5">{roleLabels[s.role_id] || 'Funcionário'}</Badge>
                              <p className="text-xs text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={(s.status === 1 || s.status === 'ativo') ? 'bg-green-100 text-green-600 border-none' : 'bg-gray-100 text-gray-600 border-none'}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${(s.status === 1 || s.status === 'ativo') ? 'bg-green-600' : 'bg-gray-400'}`} />
                            {(s.status === 1 || s.status === 'ativo') ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setStaffToDelete(s); setDeleteStaffDialogOpen(true); }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
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
                <CardDescription>Status atual por tipo sanguíneo no {hemocentroNome}</CardDescription>
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

          {/* ── Relatórios ── */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>Gere relatórios detalhados do hemocentro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: BarChart3, title: 'Doações',       desc: 'Coletas, volume, tipos',     value: 'doacoes' },
                    { icon: Droplet,   title: 'Estoque',        desc: 'Níveis e alertas',           value: 'estoque' },
                    { icon: Users,     title: 'Doadores',       desc: 'Cadastros e perfil',         value: 'doadores' },
                    { icon: Calendar,  title: 'Agendamentos',   desc: 'Status e taxa de conclusão', value: 'agendamentos' },
                    { icon: UserCheck, title: 'Triagens',       desc: 'Aptidão e motivos',          value: 'triagens' },
                  ].map(({ icon: Icon, title, desc, value }) => (
                    <Button
                      key={value}
                      variant="outline"
                      className="h-auto p-4 flex items-center justify-start gap-4 text-left hover:border-purple-300 hover:bg-purple-50 transition-all"
                      onClick={() => { setReportType(value); setExportDialogOpen(true); }}
                    >
                      <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ DIALOGS ═══════════════════════════════════════════════════════════ */}

      {/* Adicionar Funcionário */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>O funcionário será vinculado a {hemocentroNome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome Completo *</Label>
              <Input placeholder="Nome completo" value={newStaff.name}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>Email *</Label>
              <Input type="email" placeholder="email@exemplo.com" value={newStaff.email}
                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CPF *</Label>
                <Input placeholder="000.000.000-00" maxLength={11} value={newStaff.cpf}
                  onChange={e => setNewStaff({ ...newStaff, cpf: e.target.value.replace(/\D/g, '') })} />
              </div>
              <div className="space-y-2"><Label>Senha Provisória *</Label>
                <Input type="password" placeholder="Mín. 6 caracteres" minLength={6} value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Select value={newStaff.role_id} onValueChange={v => setNewStaff({ ...newStaff, role_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Funcionário</SelectItem>
                  <SelectItem value="3">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStaffDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStaff} className="bg-purple-600 hover:bg-purple-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar Remoção */}
      <Dialog open={deleteStaffDialogOpen} onOpenChange={setDeleteStaffDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remover Funcionário</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          {staffToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{staffToDelete.name}</p>
              <p className="text-sm text-gray-600">{staffToDelete.email}</p>
              <Badge variant="outline" className="mt-2">{roleLabels[staffToDelete.role_id]}</Badge>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStaffDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700 text-white">Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atualizar Estoque */}
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque — {selectedBloodType}</DialogTitle>
            <DialogDescription>Adicione ou remova bolsas do estoque</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={v => setStockAction(v as 'add' | 'remove')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-600" />Adicionar</div></SelectItem>
                  <SelectItem value="remove"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-red-600" />Remover</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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
            <Button onClick={handleUpdateStock} className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}>
              {stockAction === 'add' ? <><Plus className="h-4 w-4 mr-2" />Adicionar</> : <><Minus className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exportar Relatório */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório PDF</DialogTitle>
            <DialogDescription>Selecione o relatório desejado. O arquivo será baixado automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { value: 'doacoes',      label: 'Doações',       desc: 'Coletas, volume, tipos',         color: 'border-red-200 hover:border-red-400' },
              { value: 'estoque',      label: 'Estoque',        desc: 'Níveis e alertas',               color: 'border-blue-200 hover:border-blue-400' },
              { value: 'doadores',     label: 'Doadores',       desc: 'Cadastros e perfil',             color: 'border-green-200 hover:border-green-400' },
              { value: 'agendamentos', label: 'Agendamentos',   desc: 'Status e taxa de conclusão',     color: 'border-purple-200 hover:border-purple-400' },
              { value: 'triagens',     label: 'Triagens',       desc: 'Aptidão e motivos',              color: 'border-violet-200 hover:border-violet-400' },
            ].map(({ value, label, desc, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setReportType(value)}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${color} ${reportType === value ? 'bg-gray-50 border-opacity-100' : 'border-gray-100'}`}
              >
                <div className="font-medium text-sm text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExportDialogOpen(false); setReportType(''); }}>Cancelar</Button>
            <Button
              onClick={handleExportReport}
              disabled={!reportType || isDownloadingReport}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingReport ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
